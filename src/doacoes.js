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
  validade,
  doador,
  enderecoRetirada
} = {}) {

  // O doador é opcional, endereço de retirada não. Pois não faz sentido cadastrar uma doação sem informar onde ela será retirada.
  const nomeDoador = String(doador ?? '').trim() || null;

  return repo.inserir({
    tipo: textoObrigatorio(tipo, 'tipo'),
    quantidade: textoObrigatorio(quantidade, 'quantidade'),
    validade: validarData(validade),
    doador: nomeDoador,
    enderecoRetirada: textoObrigatorio(enderecoRetirada, 'endereço de retirada')
  });
}

// Doador vê a situação das próprias doações
export async function listarDoDoador(doador) {

  const nomeDoador = textoObrigatorio(doador, 'doador');

  return repo.listarPorDoador(nomeDoador);
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

  if (existente.status === 'cancelada') {
    throw new Error('esta doação foi cancelada pelo doador');
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

// Doador cancela uma doação, se ainda estiver disponível
export async function cancelar(id, doador) {

  const idNumerico = Number(id);

  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    throw new Error('doação inválida');
  }

  const nomeDoador = textoObrigatorio(doador, 'doador');

  const existente = await repo.buscarPorId(idNumerico);

  if (!existente) {
    throw new Error('doação não encontrada');
  }

  if (existente.doador !== nomeDoador) {
    throw new Error('esta doação não pertence a este doador');
  }

  if (existente.status === 'aceita') {
    throw new Error('não é possível cancelar uma doação já aceita');
  }

  if (existente.status === 'cancelada') {
    throw new Error('esta doação já foi cancelada');
  }

  const cancelada = await repo.cancelar(idNumerico, nomeDoador);

  if (!cancelada) {
    throw new Error('não é possível cancelar uma doação já aceita');
  }

  return cancelada;
}


// ONG consulta o endereço de retirada de uma doação.
// O endereço só é liberado depois do aceite e somente para a ONG que aceitou.
export async function consultarRetirada(id, ong) {

  const idNumerico = Number(id);

  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    throw new Error('doação inválida');
  }

  const nomeOng = textoObrigatorio(ong, 'ONG');

  const existente = await repo.buscarPorId(idNumerico);

  if (!existente) {
    throw new Error('doação não encontrada');
  }

  if (existente.status !== 'aceita') {
    throw new Error('o endereço de retirada só é liberado depois do aceite');
  }

  if (existente.ong !== nomeOng) {
    throw new Error('esta doação foi aceita por outra ONG');
  }

  return {
    id: existente.id,
    tipo: existente.tipo,
    quantidade: existente.quantidade,
    validade: existente.validade,
    ong: existente.ong,
    endereco_retirada: existente.endereco_retirada
  };
}