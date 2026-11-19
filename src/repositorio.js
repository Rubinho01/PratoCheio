// Camada de acesso ao banco de dados (PostgreSQL: marcadores $1, $2, …)
import { query, AGORA_UTC } from './db.js';


const ID_MAXIMO = 2147483647;
const idPossivel = (id) => Number.isInteger(id) && id >= 1 && id <= ID_MAXIMO;

export async function listarCategorias() {

  const { rows } = await query(
    `
    SELECT id,
           nome
    FROM categorias
    ORDER BY nome ASC
    `
  );

  return rows;
}

export async function buscarCategoriaPorId(id) {

  if (!idPossivel(id)) return undefined;

  const { rows } = await query(
    `
    SELECT id,
           nome
    FROM categorias
    WHERE id = $1
    `,
    [id]
  );

  return rows[0];
}

// Insere uma nova doação
export async function inserir({
  tipo,
  categoriaId,
  quantidade,
  validade,
  doador = null,
  enderecoRetirada = null
}) {

  const { rows } = await query(
    `
    INSERT INTO doacoes (
      tipo,
      categoria_id,
      quantidade,
      validade,
      doador,
      endereco_retirada
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
    `,
    [
      tipo,
      categoriaId,
      quantidade,
      validade,
      doador,
      enderecoRetirada
    ]
  );

  // Relê com o JOIN para devolver também o nome da categoria.
  return buscarPorId(rows[0].id);
}

// Lista todas as doações de um doador (disponíveis e aceitas), da mais recente
// para a mais antiga
export async function listarPorDoador(doador) {

  const { rows } = await query(
    `
    SELECT d.*,
           c.nome AS categoria
    FROM doacoes d
    LEFT JOIN categorias c ON c.id = d.categoria_id
    WHERE d.doador = $1
    ORDER BY d.criada_em DESC,
             d.id DESC
    `,
    [doador]
  );

  return rows;
}

// Lista somente as doações disponíveis.
// Não inclui `endereco_retirada`: ele só é liberado à ONG depois do aceite.
export async function listarDisponiveis() {

  const { rows } = await query(
    `
    SELECT d.id,
           d.tipo,
           d.categoria_id,
           c.nome AS categoria,
           d.quantidade,
           d.validade,
           d.status,
           d.ong,
           d.criada_em,
           d.doador
    FROM doacoes d
    LEFT JOIN categorias c ON c.id = d.categoria_id
    WHERE d.status = 'disponivel'
    ORDER BY d.validade ASC,
             d.criada_em DESC,
             d.id DESC
    `
  );

  return rows;
}

// Busca uma doação pelo ID
export async function buscarPorId(id) {

  if (!idPossivel(id)) return undefined;

  const { rows } = await query(
    `
    SELECT d.*,
           c.nome AS categoria
    FROM doacoes d
    LEFT JOIN categorias c ON c.id = d.categoria_id
    WHERE d.id = $1
    `,
    [id]
  );

  return rows[0];
}

// Doador cancela uma doação, se ainda estiver disponível
export async function cancelar(id, doador) {

  if (!idPossivel(id)) return undefined;

  const { rows } = await query(
    `
    UPDATE doacoes
    SET status = 'cancelada'
    WHERE id = $1
      AND doador = $2
      AND status = 'disponivel'
    RETURNING *
    `,
    [
      id,
      doador
    ]
  );

  return rows[0];
}

// Aceita uma doação.
// A condição `status = 'disponivel'` no próprio UPDATE é o que garante a reserva
// exclusiva: com duas ONGs aceitando ao mesmo tempo, o PostgreSQL faz a segunda
// esperar a primeira terminar, reavalia a condição e não atualiza nada.
export async function aceitar(id, ong) {

  if (!idPossivel(id)) return undefined;

  const { rows } = await query(
    `
    UPDATE doacoes
    SET
      status = 'aceita',
      ong = $1,
      aceita_em = ${AGORA_UTC}
    WHERE id = $2
      AND status = 'disponivel'
    RETURNING *
    `,
    [
      ong,
      id
    ]
  );

  return rows[0];
}

// Voluntários visualizam as doações ainda aguardando coleta.
// Não expor endereco_retirada: na versão atual o endereço é liberado
// somente via consulta da ONG responsável depois do aceite.
export async function listarPendentesColeta() {
  const { rows } = await query(`
    SELECT id, tipo, quantidade, validade, status, ong, doador, criada_em, aceita_em
    FROM doacoes
    WHERE status = 'aceita'
    ORDER BY aceita_em ASC, id ASC
  `);
  return rows;
}

// A atualização condicional evita registrar a coleta duas vezes.
export async function coletar(id, voluntario) {
  if (!idPossivel(id)) return undefined;

  const { rows } = await query(`
    UPDATE doacoes
    SET status = 'coletada',
        voluntario = $1,
        coletada_em = ${AGORA_UTC}
    WHERE id = $2 AND status = 'aceita'
    RETURNING id, tipo, quantidade, validade, status, ong, doador,
              criada_em, aceita_em, voluntario, coletada_em
  `, [voluntario, id]);
  return rows[0];
}

// Contagem pelo instante de aceite, não pelo status atual: doações já
// coletadas continuam contando no mês em que foram aceitas.
// COUNT(*) no PostgreSQL é bigint e o driver o devolve como string ("3");
// o ::int mantém o número que o SQLite devolvia.
export async function contarAceitasNoPeriodo(inicio, fim) {
  const { rows } = await query(`
    SELECT COUNT(*)::int AS total
    FROM doacoes
    WHERE aceita_em >= $1 AND aceita_em < $2
      AND status IN ('aceita', 'coletada')
  `, [inicio, fim]);
  return rows[0].total;
}