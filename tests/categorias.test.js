/**
 * H7 — categoria obrigatória e validade obrigatória no cadastro da doação.
 * Cobre os critérios de aceite da H7 (e a parte de "campos obrigatórios" da H1)
 * em docs/analise.md. Roda no banco de testes (ADR 0002), como os demais.
 */
import { beforeEach, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

const DOACAO_VALIDA = {
  tipo: 'Sopa',
  quantidade: '10 porções',
  validade: '2027-11-30',
  enderecoRetirada: 'Rua das Flores, 123'
};

async function categorias() {
  const resposta = await request(app).get('/api/categorias');
  expect(resposta.status).toBe(200);
  return resposta.body;
}

const publicar = (corpo) => request(app).post('/api/doacoes').send(corpo);
const disponiveis = () => request(app).get('/api/doacoes');

describe('H7 — categorias de alimento', () => {
  it('H7-CA0: a migração oferece as categorias Perecível, Industrializado e Hortifrúti', async () => {
    const nomes = (await categorias()).map((c) => c.nome).sort();
    expect(nomes).toEqual(['Hortifrúti', 'Industrializado', 'Perecível']);
  });

  it('H7-CA1: recusa publicar sem categoria e não cria a doação', async () => {
    const resposta = await publicar({ ...DOACAO_VALIDA });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('categoria é obrigatória');
    expect((await disponiveis()).body).toHaveLength(0);
  });

  it('H7-CA1: recusa categoria inexistente ou inválida', async () => {
    for (const categoriaId of [999999, 'abc', '0', -1]) {
      const resposta = await publicar({ ...DOACAO_VALIDA, categoriaId });
      expect(resposta.status).toBe(400);
      expect(resposta.body.erro).toBe('categoria inválida');
    }
    expect((await disponiveis()).body).toHaveLength(0);
  });

  it('H7-CA2: recusa publicar sem validade e indica que ela é obrigatória', async () => {
    const [categoria] = await categorias();
    const { validade, ...semValidade } = DOACAO_VALIDA;

    const resposta = await publicar({ ...semValidade, categoriaId: categoria.id });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('validade é obrigatório');
    expect((await disponiveis()).body).toHaveLength(0);
  });

  it('H7-CA3: publica só com categoria, quantidade e validade (sem descrição longa) e devolve a categoria', async () => {
    const perecivel = (await categorias()).find((c) => c.nome === 'Perecível');

    const resposta = await publicar({ ...DOACAO_VALIDA, categoriaId: perecivel.id });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      status: 'disponivel',
      categoria_id: perecivel.id,
      categoria: 'Perecível'
    });

    const lista = await disponiveis();
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0]).toMatchObject({ categoria: 'Perecível' });
  });
});