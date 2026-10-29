// Camada de acesso ao banco de dados
import { query } from './db.js';

// Insere uma nova doação
export async function inserir({
  tipo,
  quantidade,
  validade,
  doador = null,
  enderecoRetirada = null
}) {

  const { rows } = await query(
    `
    INSERT INTO doacoes (
      tipo,
      quantidade,
      validade,
      doador,
      endereco_retirada
    )
    VALUES (?, ?, ?, ?, ?)
    RETURNING *
    `,
    [
      tipo,
      quantidade,
      validade,
      doador,
      enderecoRetirada
    ]
  );

  return rows[0];
}

// Lista todas as doações de um doador (disponíveis e aceitas), da mais recente
// para a mais antiga
export async function listarPorDoador(doador) {

  const { rows } = await query(
    `
    SELECT *
    FROM doacoes
    WHERE doador = ?
    ORDER BY criada_em DESC,
             id DESC
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
    SELECT id,
           tipo,
           quantidade,
           validade,
           status,
           ong,
           criada_em,
           doador
    FROM doacoes
    WHERE status = 'disponivel'
    ORDER BY validade ASC,
             criada_em DESC,
             id DESC
    `
  );

  return rows;
}

// Busca uma doação pelo ID
export async function buscarPorId(id) {

  const { rows } = await query(
    `
    SELECT *
    FROM doacoes
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

// Doador cancela uma doação, se ainda estiver disponível
export async function cancelar(id, doador) {

  const { rows } = await query(
    `
    UPDATE doacoes
    SET status = 'cancelada'
    WHERE id = ?
      AND doador = ?
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

// Aceita uma doação
export async function aceitar(id, ong) {

  const { rows } = await query(
    `
    UPDATE doacoes
    SET
      status = 'aceita',
      ong = ?,
      aceita_em = datetime('now')
    WHERE id = ?
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
  const { rows } = await query(`
    UPDATE doacoes
    SET status = 'coletada',
        voluntario = ?,
        coletada_em = datetime('now')
    WHERE id = ? AND status = 'aceita'
    RETURNING id, tipo, quantidade, validade, status, ong, doador,
              criada_em, aceita_em, voluntario, coletada_em
  `, [voluntario, id]);
  return rows[0];
}

// Contagem pelo instante de aceite, não pelo status atual: doações já
// coletadas continuam contando no mês em que foram aceitas.
export async function contarAceitasNoPeriodo(inicio, fim) {
  const { rows } = await query(`
    SELECT COUNT(*) AS total
    FROM doacoes
    WHERE aceita_em >= ? AND aceita_em < ?
      AND status IN ('aceita', 'coletada')
  `, [inicio, fim]);
  return rows[0].total;
}
