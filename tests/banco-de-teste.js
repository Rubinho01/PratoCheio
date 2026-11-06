
export const URL_PADRAO_TESTE =
  'postgres://pratocheio_test:pratocheio_test@localhost:5433/pratocheio_test';

export const URL_TESTE = process.env.TEST_DATABASE_URL || URL_PADRAO_TESTE;

/** Nome do banco dentro de uma URL de conexão ('' se a URL for inválida). */
export function nomeDoBanco(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
  } catch {
    return '';
  }
}

/** Só um banco cujo nome termina em `_test` pode receber os testes. Senão, lança erro. */
export function validarBancoDeTeste(url) {
  const nome = nomeDoBanco(url);
  if (!nome.endsWith('_test')) {
    throw new Error(
      `Os testes se recusam a rodar: o banco "${nome || url}" não termina em _test. ` +
      'Aponte TEST_DATABASE_URL para um banco de teste (veja .env.example).'
    );
  }
  return nome;
}
