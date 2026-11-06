import { URL_TESTE, validarBancoDeTeste } from './tests/banco-de-teste.js';

// Se o banco de teste não for seguro, nem a configuração carrega (ADR 0002).
validarBancoDeTeste(URL_TESTE);

export default {
  test: {
    // Os testes usam um banco separado, como na ADR002
    env: { NODE_ENV: 'test', DATABASE_URL: URL_TESTE },
    globalSetup: ['./tests/setup-global.js'],
    // Todos os arquivos de teste compartilham o mesmo banco PostgreSQL e cada um
    // apaga os dados no beforeEach: em paralelo, um apagaria os dados do outro.
    fileParallelism: false
  }
};
