import pg from 'pg';
import { URL_TESTE, validarBancoDeTeste } from './banco-de-teste.js';

export default async function setup() {
  validarBancoDeTeste(URL_TESTE);

  const cliente = new pg.Client({ connectionString: URL_TESTE });
  try {
    await cliente.connect();
  } catch (erro) {
    throw new Error(
      `Não consegui conectar no banco de teste (${erro.message}). ` +
      'Suba o PostgreSQL com: docker compose up -d --wait db'
    );
  }

  try {
    // Confere o banco REAL ao qual a conexão caiu, não só o nome escrito na URL.
    const { rows } = await cliente.query('SELECT current_database() AS nome');
    if (!rows[0].nome.endsWith('_test')) {
      throw new Error(
        `Os testes se recusam a rodar: conectou em "${rows[0].nome}", que não termina em _test.`
      );
    }
  } finally {
    await cliente.end().catch(() => {});
  }
}
