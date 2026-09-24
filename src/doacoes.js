// Regras de negócio da História Zero (H0)
import * as repo from './repositorio.js';

// Valida campos de texto obrigatórios
function textoObrigatorio(valor, nomeDoCampo) {
  const texto = String(valor ?? '').trim();

  if (!texto) {
    throw new Error(`${nomeDoCampo} é obrigatório`);
  }

  return texto;
}

// Valida a data de validade
function validarData(valor) {
  const validade = textoObrigatorio(valor, 'validade');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(validade)) {
    throw new Error('validade deve estar no formato AAAA-MM-DD');
  }

  return validade;
}

// H0 - Doador cadastra uma nova doação
export async function criarDoacao({
  tipo,
  quantidade,
  validade
} = {}) {

  return repo.inserir({
    tipo: textoObrigatorio(tipo, 'tipo'),
    quantidade: textoObrigatorio(quantidade, 'quantidade'),
    validade: validarData(validade)
  });
}

// H0 - ONG visualiza somente as doações disponíveis
export async function listarDisponiveis() {
  return repo.listarDisponiveis();
}

// H0 - ONG aceita uma doação
export async function aceitar(id, ong) {

  const idNumerico = Number(id);

  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    throw new Error('doação inválida');
  }

  const nomeOng = textoObrigatorio(ong, 'ONG');

  const existente = await repo.buscarPorId(idNumerico);

  if (!existente) {
    throw new Error('doação não encontrada');
  }

  if (existente.status !== 'disponivel') {
    throw new Error('esta doação já foi aceita');
  }

  const atualizada = await repo.aceitar(
    idNumerico,
    nomeOng
  );

  if (!atualizada) {
    throw new Error('esta doação já foi aceita');
  }

  return atualizada;
}