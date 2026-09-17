// Camada de acesso ao banco de dados
import { query } from './db.js';

// Insere uma nova doação
export async function inserir({
  tipo,
  quantidade,
  validade
}) {

  const { rows } = await query(
    `
    INSERT INTO doacoes (
      tipo,
      quantidade,
      validade
    )
    VALUES (?, ?, ?)
    RETURNING *
    `,
    [
      tipo,
      quantidade,
      validade
    ]
  );

  return rows[0];
}

// Lista somente as doações disponíveis
export async function listarDisponiveis() {

  const { rows } = await query(
    `
    SELECT *
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

// Aceita uma doação
export async function aceitar(id, ong) {

  const { rows } = await query(
    `
    UPDATE doacoes
    SET
      status = 'aceita',
      ong = ?
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