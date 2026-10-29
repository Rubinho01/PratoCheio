// Conexão com o banco. Já vem pronto — não precisa mexer agora.
//
// UNIDADE 1: SQLite, embutido no Node (módulo `node:sqlite`) — nada para instalar.
// UNIDADE 3: este arquivo será refatorado para PostgreSQL. A interface abaixo
//            (`query` devolvendo `{ rows }`) foi desenhada para que a troca fique
//            contida aqui, sem espalhar mudança pelo resto do código.
// `node:sqlite` é módulo embutido do Node 22+. Carregado via createRequire porque
// algumas ferramentas (como o Vite/Vitest) ainda não o reconhecem como embutido.
import { createRequire } from 'node:module';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

const ARQUIVO = process.env.DATABASE_FILE || 'dados.sqlite';

let db;

export function conexao() {
  if (!db) db = new DatabaseSync(ARQUIVO);
  return db;
}

/**
 * Executa uma consulta e devolve { rows }.
 * Use `?` como marcador de parâmetro (evita injeção de SQL):
 *   query('SELECT * FROM doacoes WHERE id = ?', [id])
 */
export async function query(sql, valores = []) {
  const stmt = conexao().prepare(sql);
  const ehLeitura = /^\s*(select|with)/i.test(sql) || /returning/i.test(sql);
  if (ehLeitura) return { rows: stmt.all(...valores) };
  const info = stmt.run(...valores);
  return { rows: [], alteradas: info.changes };
}

const CATEGORIAS_INICIAIS = ['Perecível', 'Industrializado', 'Hortifrúti'];

export async function migrar() {
  conexao().exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      nome  TEXT NOT NULL UNIQUE
    )
  `);

  const inserirCategoria = conexao().prepare(
    'INSERT OR IGNORE INTO categorias (nome) VALUES (?)'
  );
  for (const nome of CATEGORIAS_INICIAIS) inserirCategoria.run(nome);

  conexao().exec(`
    CREATE TABLE IF NOT EXISTS doacoes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo        TEXT NOT NULL,
      quantidade  TEXT NOT NULL,
      validade    TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'disponivel',
      ong         TEXT,
      criada_em   TEXT NOT NULL DEFAULT (datetime('now')),
      doador      TEXT,
      endereco_retirada TEXT,
      aceita_em   TEXT,
      coletada_em TEXT,
      voluntario  TEXT,
      categoria_id INTEGER REFERENCES categorias (id)
    )
  `);

  const colunas = conexao().prepare('PRAGMA table_info(doacoes)').all();
  if (!colunas.some((coluna) => coluna.name === 'doador')) {
    conexao().exec('ALTER TABLE doacoes ADD COLUMN doador TEXT');
  }
  if (!colunas.some((coluna) => coluna.name === 'endereco_retirada')) {
    conexao().exec('ALTER TABLE doacoes ADD COLUMN endereco_retirada TEXT');
  }
  if (!colunas.some((coluna) => coluna.name === 'categoria_id')) {
    conexao().exec(
      'ALTER TABLE doacoes ADD COLUMN categoria_id INTEGER REFERENCES categorias (id)'
    );
  }

  // Migração incremental para bancos já existentes: ALTER TABLE preserva as doações.
  for (const coluna of ['aceita_em', 'coletada_em', 'voluntario']) {
    if (!colunas.some((existente) => existente.name === coluna)) {
      conexao().exec(`ALTER TABLE doacoes ADD COLUMN ${coluna} TEXT`);
    }
  }

  // Registros aceitos antes deste incremento não tinham horário do aceite.
  // Usa a criação apenas como estimativa, sem alterar o status ou a ONG.
  conexao().exec(`
    UPDATE doacoes
    SET aceita_em = criada_em
    WHERE status IN ('aceita', 'coletada') AND aceita_em IS NULL
  `);

  conexao().exec(
    'CREATE INDEX IF NOT EXISTS idx_doacoes_doador ON doacoes (doador)'
  );
  conexao().exec(
    'CREATE INDEX IF NOT EXISTS idx_doacoes_status ON doacoes (status)'
  );
  conexao().exec(
    'CREATE INDEX IF NOT EXISTS idx_doacoes_aceita_em ON doacoes (aceita_em)'
  );
  conexao().exec(
    'CREATE INDEX IF NOT EXISTS idx_doacoes_categoria ON doacoes (categoria_id)'
  );
}

/** Apaga todos os dados. Usado pelos testes. */
export async function limparBanco() {
  conexao().exec('DELETE FROM doacoes');
}

export async function encerrar() {
  if (db) { db.close(); db = undefined; }
}