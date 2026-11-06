// Conexão com o banco: PostgreSQL (driver `pg`, com pool de conexões).
//
// Contrato com o resto do código (não mudou na migração do SQLite):
//   query(sql, valores) -> { rows, alteradas }
// Toda a diferença entre os bancos fica contida aqui e em src/repositorio.js;
// src/doacoes.js (regras de negócio) não sabe qual banco está por trás.
//
// A conexão vem de DATABASE_URL e NÃO existe banco padrão (ADR 0002): sem a
// variável, nada conecta. Isso impede subir ou testar contra o banco errado por
// esquecimento.
import pg from 'pg';

const { Pool } = pg;

// Instante atual em UTC, no mesmo formato de texto que o SQLite usava com
// datetime('now'): 'AAAA-MM-DD HH:MM:SS'. As datas continuam TEXT de propósito:
// src/doacoes.js compara intervalos como strings e a API devolve esse formato.
// O repositório importa esta constante para o formato ser um só em todo lugar.
export const AGORA_UTC =
  "to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')";

let pool;

function criarPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL não definida. Copie .env.example para .env e suba o banco ' +
      '(docker compose up -d --wait db).'
    );
  }
  const novo = new Pool({ connectionString: url });
  // Erro em conexão ociosa não pode derrubar o processo.
  novo.on('error', (erro) => console.error('erro no pool do banco:', erro.message));
  return novo;
}

/** Pool de conexões, criado sob demanda. */
export function conexao() {
  if (!pool) pool = criarPool();
  return pool;
}

/**
 * Converte marcadores `?` em `$1, $2, …`, ignorando o que está entre aspas
 * (literais 'texto' e identificadores "coluna"). Existe para que chamadas
 * escritas no estilo antigo (`WHERE id = ?`) continuem funcionando; o código
 * novo deve usar `$1, $2, …` direto, e SQL sem `?` passa intacto.
 */
export function converterMarcadores(sql) {
  if (!sql.includes('?')) return sql;
  let saida = '';
  let n = 0;
  let aspas = null;
  for (const c of sql) {
    if (aspas) {
      // '' dentro de literal fecha e reabre na hora: continua "entre aspas".
      if (c === aspas) aspas = null;
    } else if (c === "'" || c === '"') {
      aspas = c;
    } else if (c === '?') {
      saida += `$${++n}`;
      continue;
    }
    saida += c;
  }
  return saida;
}

/**
 * Executa uma consulta e devolve { rows }.
 * Use `$1, $2, …` como marcadores de parâmetro (evita injeção de SQL):
 *   query('SELECT * FROM doacoes WHERE id = $1', [id])
 * `alteradas` traz o número de linhas afetadas (INSERT/UPDATE/DELETE).
 */
export async function query(sql, valores = []) {
  const resultado = await conexao().query(converterMarcadores(sql), valores);
  return { rows: resultado.rows, alteradas: resultado.rowCount };
}

/**
 * Cria o schema, se ainda não existir. Rodado por `npm run db:migrar` e ao subir
 * o servidor. É idempotente e seguro com várias instâncias subindo juntas: roda
 * numa transação com trava consultiva, então só uma migra por vez.
 */
export async function migrar() {
  const cliente = await conexao().connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query("SELECT pg_advisory_xact_lock(hashtext('pratocheio:migrar'))");

    await cliente.query(`
      CREATE TABLE IF NOT EXISTS doacoes (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        tipo        TEXT NOT NULL,
        quantidade  TEXT NOT NULL,
        validade    TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'disponivel',
        ong         TEXT,
        criada_em   TEXT NOT NULL DEFAULT (${AGORA_UTC}),
        doador      TEXT,
        endereco_retirada TEXT,
        aceita_em   TEXT,
        coletada_em TEXT,
        voluntario  TEXT
      )
    `);

    // Migração incremental para bancos já existentes: ADD COLUMN preserva as doações.
    for (const coluna of [
      'doador', 'endereco_retirada', 'aceita_em', 'coletada_em', 'voluntario'
    ]) {
      await cliente.query(`ALTER TABLE doacoes ADD COLUMN IF NOT EXISTS ${coluna} TEXT`);
    }

    // Registros aceitos antes deste incremento não tinham horário do aceite.
    // Usa a criação apenas como estimativa, sem alterar o status ou a ONG.
    await cliente.query(`
      UPDATE doacoes
      SET aceita_em = criada_em
      WHERE status IN ('aceita', 'coletada') AND aceita_em IS NULL
    `);

    await cliente.query('CREATE INDEX IF NOT EXISTS idx_doacoes_doador ON doacoes (doador)');
    await cliente.query('CREATE INDEX IF NOT EXISTS idx_doacoes_status ON doacoes (status)');
    await cliente.query('CREATE INDEX IF NOT EXISTS idx_doacoes_aceita_em ON doacoes (aceita_em)');

    await cliente.query('COMMIT');
  } catch (erro) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw erro;
  } finally {
    cliente.release();
  }
}

/**
 * Apaga todos os dados. Usado pelos testes — e SÓ por eles (ADR 0002): recusa
 * rodar fora de NODE_ENV=test ou num banco cujo nome não termine em `_test`.
 * Na dúvida, não apaga nada.
 */
export async function limparBanco() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('limparBanco() só roda com NODE_ENV=test. Nada foi apagado.');
  }
  const { rows } = await conexao().query('SELECT current_database() AS nome');
  const nome = rows[0].nome;
  if (!nome.endsWith('_test')) {
    throw new Error(
      `limparBanco() recusou: o banco "${nome}" não termina em _test. Nada foi apagado.`
    );
  }
  await conexao().query('DELETE FROM doacoes');
}

export async function encerrar() {
  if (pool) {
    const atual = pool;
    pool = undefined;
    await atual.end();
  }
}
