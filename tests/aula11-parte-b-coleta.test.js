/**
 * Aula 11 — Parte B: história "Voluntário confirma a coleta de uma doação".
 *
 * Testes NOVOS em relação à fatia existente em tests/novas-historias.test.js.
 * Cada cenário prepara o estado pela API (Dado), executa a ação pela API
 * (Quando) e verifica valores e estados resultantes (Então).
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { encerrar, limparBanco, migrar } from '../src/db.js';

const app = criarApp();

beforeEach(async () => {
  await migrar();
  await limparBanco();
});

afterAll(async () => {
  await encerrar();
});

async function publicar({ tipo = 'Legumes', doador = 'Mercado Central' } = {}) {

  // Consulta as categorias cadastradas no sistema.
  const categorias = await request(app)
    .get('/api/categorias');

  expect(categorias.status).toBe(200);

  // Obtém o ID da categoria Perecível.
  const categoria = categorias.body.find(
    item => item.nome === 'Perecível'
  );

  expect(categoria).toBeDefined();

  // Cadastra a doação utilizando o ID da categoria.
  const resposta = await request(app)
    .post('/api/doacoes')
    .send({
      tipo,
      categoriaId: categoria.id,
      quantidade: '10 caixas',
      validade: '2027-11-30',
      doador,
      enderecoRetirada: 'Rua da Coleta, 120'
    });

  if (resposta.status !== 201) {
    throw new Error(
      `Erro no cadastro: ${JSON.stringify(resposta.body)}`
    );
  }

  return resposta.body;
}
async function aceitar(id, ong = 'ONG Sementes') {
  const resposta = await request(app)
    .post(`/api/doacoes/${id}/aceitar`)
    .send({ ong });
  expect(resposta.status).toBe(200);
  return resposta.body;
}

function coletar(id, voluntario = 'Ana') {
  return request(app).post(`/api/doacoes/${id}/coletar`).send({ voluntario });
}

function minhas(doador = 'Mercado Central') {
  return request(app).get('/api/doacoes/minhas').query({ doador });
}

describe('Aula 11 — critérios de aceite da história de confirmação de coleta', () => {
  it('CA1: apresenta na fila somente doações aceitas pendentes de coleta, sem divulgar o endereço', async () => {
    // Dado: uma doação disponível, uma aceita e uma já coletada, cadastradas pela API.
    const disponivel = await publicar({ tipo: 'Pães' });
    const pendente = await publicar({ tipo: 'Legumes' });
    const jaColetada = await publicar({ tipo: 'Frutas' });
    await aceitar(pendente.id);
    await aceitar(jaColetada.id);
    expect((await coletar(jaColetada.id)).status).toBe(200);

    // Quando: o voluntário consulta as coletas pendentes pela API.
    const resposta = await request(app).get('/api/doacoes/pendentes-coleta');

    // Então: apenas a doação aceita e não coletada aparece; endereço não é exposto.
    expect(resposta.status).toBe(200);
    expect(resposta.body.map((doacao) => doacao.id)).toEqual([pendente.id]);
    expect(resposta.body[0]).toMatchObject({
      id: pendente.id,
      tipo: 'Legumes',
      status: 'aceita',
      ong: 'ONG Sementes'
    });
    expect(resposta.body[0].id).not.toBe(disponivel.id);
    expect(resposta.body[0].id).not.toBe(jaColetada.id);
    expect(resposta.body[0]).not.toHaveProperty('endereco_retirada');
    expect(JSON.stringify(resposta.body)).not.toContain('Rua da Coleta, 120');
  });

  it('CA2: ao confirmar a coleta registra o voluntário e preserva a ONG e o horário de aceite', async () => {
    // Dado: doação publicada e aceita por uma ONG via API.
    const publicada = await publicar();
    const aceita = await aceitar(publicada.id, 'ONG Sementes');
    expect(aceita.status).toBe('aceita');
    expect(aceita.aceita_em).toMatch(/^\d{4}-\d{2}-\d{2} /);

    // Quando: um voluntário confirma a coleta pela API.
    const resposta = await coletar(publicada.id, '  Ana Souza  ');

    // Então: o estado e o nome são persistidos, sem apagar o aceite original.
    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      id: publicada.id,
      status: 'coletada',
      ong: 'ONG Sementes',
      voluntario: 'Ana Souza',
      aceita_em: aceita.aceita_em
    });
    expect(resposta.body.coletada_em).toMatch(/^\d{4}-\d{2}-\d{2} /);
    expect(resposta.body).not.toHaveProperty('endereco_retirada');

    const historico = await minhas();
    expect(historico.status).toBe(200);
    expect(historico.body).toHaveLength(1);
    expect(historico.body[0]).toMatchObject({
      id: publicada.id,
      status: 'coletada',
      voluntario: 'Ana Souza',
      ong: 'ONG Sementes',
      aceita_em: aceita.aceita_em,
      coletada_em: resposta.body.coletada_em
    });
  });

  it('CA3: retira a doação coletada da fila, mas mantém sua situação no histórico do doador', async () => {
    // Dado: duas doações do mesmo doador foram publicadas e aceitas pela API.
    const primeira = await publicar({ tipo: 'Arroz' });
    const segunda = await publicar({ tipo: 'Feijão' });
    await aceitar(primeira.id);
    await aceitar(segunda.id);

    // Quando: um voluntário coleta somente a primeira doação.
    const confirmacao = await coletar(primeira.id, 'Carlos');
    expect(confirmacao.status).toBe(200);

    // Então: a primeira sai da fila; a segunda continua pendente; ambas ficam no histórico.
    const fila = await request(app).get('/api/doacoes/pendentes-coleta');
    expect(fila.status).toBe(200);
    expect(fila.body.map(({ id }) => id)).toEqual([segunda.id]);
    expect(fila.body[0].status).toBe('aceita');

    const historico = await minhas();
    expect(historico.status).toBe(200);
    const porId = new Map(historico.body.map((doacao) => [doacao.id, doacao]));
    expect(porId.size).toBe(2);
    expect(porId.get(primeira.id)).toMatchObject({ status: 'coletada', voluntario: 'Carlos' });
    expect(porId.get(segunda.id)).toMatchObject({ status: 'aceita', voluntario: null });
  });
});

describe('Aula 11 — casos limite e de erro da confirmação de coleta', () => {
  it('ER1: recusa coletar uma doação ainda disponível e não modifica seu estado', async () => {
    // Dado: uma doação está publicada, mas não foi aceita por nenhuma ONG.
    const publicada = await publicar();

    // Quando: o voluntário tenta confirmar a coleta indevidamente.
    const resposta = await coletar(publicada.id, 'Ana');

    // Então: a API recusa com uma mensagem e a doação continua disponível.
    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('somente doações aceitas podem ser coletadas');
    const disponiveis = await request(app).get('/api/doacoes');
    expect(disponiveis.status).toBe(200);
    expect(disponiveis.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: publicada.id, status: 'disponivel' })
    ]));
    const historico = await minhas();
    expect(historico.body[0]).toMatchObject({ id: publicada.id, status: 'disponivel', voluntario: null });
  });

  it('ER2: recusa confirmação com nome de voluntário em branco e mantém a coleta pendente', async () => {
    // Dado: uma ONG aceitou uma doação disponível.
    const publicada = await publicar();
    await aceitar(publicada.id);

    // Quando: a confirmação é enviada com o nome em branco.
    const resposta = await coletar(publicada.id, '   ');

    // Então: a mensagem identifica o campo e o registro não é modificado.
    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('voluntário é obrigatório');
    const fila = await request(app).get('/api/doacoes/pendentes-coleta');
    expect(fila.body.map(({ id }) => id)).toContain(publicada.id);
    const historico = await minhas();
    expect(historico.body[0]).toMatchObject({
      id: publicada.id,
      status: 'aceita',
      voluntario: null,
      coletada_em: null
    });
  });

  it('ER3: recusa uma segunda coleta e preserva o responsável e a data da primeira', async () => {
    // Dado: uma doação aceita já foi coletada por um voluntário.
    const publicada = await publicar();
    await aceitar(publicada.id);
    const primeira = await coletar(publicada.id, 'Ana');
    expect(primeira.status).toBe(200);

    // Quando: outro voluntário tenta registrar a mesma coleta novamente.
    const repetida = await coletar(publicada.id, 'Carlos');

    // Então: a API recusa e preserva o registro da primeira confirmação.
    expect(repetida.status).toBe(400);
    expect(repetida.body.erro).toBe('esta doação já foi coletada');
    const historico = await minhas();
    expect(historico.body[0]).toMatchObject({
      id: publicada.id,
      status: 'coletada',
      voluntario: 'Ana',
      coletada_em: primeira.body.coletada_em
    });
    const fila = await request(app).get('/api/doacoes/pendentes-coleta');
    expect(fila.body).toHaveLength(0);
  });

  it('ER4: recusa a coleta de uma doação inexistente com mensagem específica', async () => {
    // Dado: a base está vazia (limpeza feita no beforeEach).

    // Quando: um voluntário tenta coletar um identificador inexistente.
    const resposta = await coletar(999999, 'Ana');

    // Então: a API informa que a doação não existe e não cria pendências.
    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('doação não encontrada');
    const fila = await request(app).get('/api/doacoes/pendentes-coleta');
    expect(fila.status).toBe(200);
    expect(fila.body).toEqual([]);
  });
});
