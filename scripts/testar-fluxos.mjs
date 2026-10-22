// Testes de integração das regras e persistência, sem dependências externas.
// Execute: npm run test:smoke
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');
const pasta = mkdtempSync(join(tmpdir(), 'pratocheio-test-'));
const arquivo = join(pasta, 'legado.sqlite');

// Simula o schema anterior, provando que a migração não apaga o histórico.
const legado = new DatabaseSync(arquivo);
legado.exec(`
  CREATE TABLE doacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    quantidade TEXT NOT NULL,
    validade TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'disponivel',
    ong TEXT,
    criada_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
  INSERT INTO doacoes (tipo, quantidade, validade, status, ong, criada_em)
  VALUES ('Pão', '10', '2026-09-20', 'aceita', 'ONG Antiga', '2026-09-10 12:00:00');
`);
legado.close();

process.env.DATABASE_FILE = arquivo;
const banco = await import('../src/db.js');
const doacoes = await import('../src/doacoes.js');

async function recusa(acao, mensagem) {
  await assert.rejects(acao, mensagem);
}

try {
  await banco.migrar();
  await banco.migrar(); // Deve ser idempotente.
  const legadoMigrado = await banco.query('SELECT * FROM doacoes WHERE id = 1');
  assert.equal(legadoMigrado.rows[0].ong, 'ONG Antiga');
  assert.equal(legadoMigrado.rows[0].aceita_em, '2026-09-10 12:00:00');
  assert.deepEqual(await doacoes.relatorioAceites('2026-09'), {
    mes: '2026-09', totalAceitas: 1
  });

  const publicada = await doacoes.criarDoacao({
    tipo: 'Frutas', quantidade: '20 caixas', validade: '2026-11-30',
    doador: 'Mercado Teste', enderecoRetirada: 'Rua Secreta, 10'
  });
  assert.equal(publicada.status, 'disponivel');
  await recusa(() => doacoes.confirmarColeta(publicada.id, 'Maria'), /somente doações aceitas/);
  await recusa(() => doacoes.confirmarColeta('não-é-id', 'Maria'), /doação inválida/);

  const disponiveis = await doacoes.listarDisponiveis();
  assert.ok(disponiveis.some((d) => d.id === publicada.id));
  assert.ok(!('endereco_retirada' in disponiveis[0]));

  const aceita = await doacoes.aceitar(publicada.id, 'ONG Teste');
  assert.equal(aceita.status, 'aceita');
  assert.match(aceita.aceita_em, /^\d{4}-\d{2}-\d{2} /);
  const mesDoAceite = aceita.aceita_em.slice(0, 7);
  const relatorioAntes = await doacoes.relatorioAceites(mesDoAceite);
  assert.ok(relatorioAntes.totalAceitas >= 1);
  const pendentes = await doacoes.listarPendentesColeta();
  assert.ok(pendentes.some((d) => d.id === publicada.id));
  assert.ok(pendentes.every((d) => !('endereco_retirada' in d)));

  const coletada = await doacoes.confirmarColeta(publicada.id, ' Maria ');
  assert.equal(coletada.status, 'coletada');
  assert.equal(coletada.voluntario, 'Maria');
  assert.ok(coletada.coletada_em);
  assert.equal(coletada.aceita_em, aceita.aceita_em);
  assert.equal((await doacoes.relatorioAceites(mesDoAceite)).totalAceitas, relatorioAntes.totalAceitas);
  assert.ok(!(await doacoes.listarPendentesColeta()).some((d) => d.id === publicada.id));
  await recusa(() => doacoes.confirmarColeta(publicada.id, 'Outra Pessoa'), /já foi coletada/);
  await recusa(() => doacoes.confirmarColeta(publicada.id, ''), /voluntário é obrigatório/);
  await recusa(() => doacoes.confirmarColeta(99999, 'Maria'), /não encontrada/);
  assert.equal((await doacoes.consultarRetirada(publicada.id, 'ONG Teste')).endereco_retirada,
    'Rua Secreta, 10');
  await recusa(() => doacoes.consultarRetirada(publicada.id, 'Outra ONG'), /outra ONG/);

  // Mês do aceite ≠ mês da criação, além das fronteiras de dezembro/janeiro.
  await banco.query('UPDATE doacoes SET criada_em = ?, aceita_em = ? WHERE id = ?',
    ['2026-10-10 08:00:00', '2026-12-31 23:59:59', publicada.id]);
  assert.equal((await doacoes.relatorioAceites('2026-10')).totalAceitas, 0);
  assert.equal((await doacoes.relatorioAceites('2026-12')).totalAceitas, 1);
  assert.equal((await doacoes.relatorioAceites('2027-01')).totalAceitas, 0);
  await recusa(() => doacoes.relatorioAceites('2026-13'), /formato/);
  await recusa(() => doacoes.relatorioAceites('texto'), /formato/);

  await banco.encerrar();
  await banco.migrar(); // Verifica persistência após reconexão.
  const recarregada = await banco.query('SELECT status, voluntario FROM doacoes WHERE id = ?', [publicada.id]);
  assert.equal(recarregada.rows[0].status, 'coletada');
  assert.equal(recarregada.rows[0].voluntario, 'Maria');
  assert.equal((await doacoes.relatorioAceites('2026-12')).totalAceitas, 1);
  console.log('OK — migração legada, publicação, aceite, coleta, histórico mensal, validações e persistência.');
} finally {
  await banco.encerrar();
  rmSync(pasta, { recursive: true, force: true });
}
