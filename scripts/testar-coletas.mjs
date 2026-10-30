/**
 * Experimento da Aula 11 — Parte B.
 *
 * Uso: npm ci && node scripts/experimento-inversao-aula11.mjs
 * Faça commit da versão funcional antes de rodar, conforme o enunciado.
 *
 * Executa a suíte Vitest completa: 1) original (verde), 2) regra invertida
 * (deve apresentar testes vermelhos), 3) original restaurada (verde).
 * A alteração é sempre revertida pelo bloco finally, mesmo após erro.
 * O registro é impresso no terminal para a descrição do PR.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const caminho = resolve(raiz, 'src/doacoes.js');
const original = readFileSync(caminho, 'utf8');
const antes = "if (existente.status !== 'aceita') {";
const depois = "if (existente.status === 'aceita') {";

function erro(mensagem) {
  console.error(`ERRO: ${mensagem}`);
  process.exit(1);
}

if (original.split(antes).length !== 2) {
  erro('Não foi possível identificar exatamente uma regra a inverter. Confira src/doacoes.js.');
}

// Um experimento com código ainda não commitado pode destruir trabalho local.
const git = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: raiz, encoding: 'utf8' });
if (git.status === 0 && git.stdout.trim() === 'true') {
  const estado = spawnSync('git', ['status', '--porcelain', '--', 'src/doacoes.js'], { cwd: raiz, encoding: 'utf8' });
  if (estado.status !== 0 || estado.stdout.trim()) {
    erro('O arquivo src/doacoes.js tem alterações não commitadas. Faça commit antes do experimento.');
  }
}

if (!existsSync(resolve(raiz, 'node_modules', 'vitest'))) {
  erro('Vitest não instalado. Rode npm ci primeiro.');
}

function rodar(titulo) {
  console.log(`\n${'='.repeat(18)} ${titulo} ${'='.repeat(18)}\n`);
  const resultado = spawnSync('npm', ['test'], { cwd: raiz, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024, shell: process.platform === 'win32' });
  const saida = (resultado.stdout || '') + (resultado.stderr || '');
  console.log(saida);
  return { codigo: resultado.status, saida };
}

console.log('Aula 11 — inversão de regra. Faça commit da versão funcional ANTES da execução.');
const base = rodar('SUÍTE ORIGINAL');
if (base.codigo !== 0) {
  erro('A suíte original não passou; resolva esses erros antes de inverter a regra.');
}

let invertido;
try {
  writeFileSync(caminho, original.replace(antes, depois));
  invertido = rodar('SUÍTE COM A REGRA INVERTIDA');
} finally {
  writeFileSync(caminho, original);
  console.log('\nInversão desfeita: sim — texto original restaurado em src/doacoes.js');
}

const restaurada = rodar('SUÍTE RESTAURADA');
const linhas = invertido.saida.split(/\r?\n/);
const falhas = linhas.filter((linha) => /^\s*(?:FAIL\s+|[✕×❯]\s+)/.test(linha));

console.log('\n================== REGISTRO PARA O PR ==================');
console.log('Regra invertida: src/doacoes.js — existente.status !== aceita trocado por === aceita');
console.log(`Resultado invertido: ${invertido.codigo === 0 ? 'nenhum teste vermelho (é necessário reforçar os testes)' : 'houve falhas (consulte os nomes e a contagem no relatório Vitest acima)'}`);
if (falhas.length) {
  console.log('Linhas indicativas de falha:');
  for (const linha of falhas) console.log(linha.trim());
}
console.log('Inversão desfeita: sim');
console.log(`Suíte restaurada: ${restaurada.codigo === 0 ? 'verde' : 'vermelha — corrigir antes do PR'}`);
console.log('=========================================================');

if (invertido.codigo === 0 || restaurada.codigo !== 0) process.exitCode = 1;
