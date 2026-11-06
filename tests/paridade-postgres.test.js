import { beforeEach, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import {
  migrar, limparBanco, encerrar, query, converterMarcadores
} from '../src/db.js';
import { validarBancoDeTeste } from './banco-de-teste.js';

const app = criarApp();
beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

const publicar = (extra = {}) =>
  request(app).post('/api/doacoes').send({
    tipo: 'Sopa', quantidade: '10 porções', validade: '2026-12-01',
    doador: 'Padaria do Zé', enderecoRetirada: 'Rua das Flores, 123', ...extra
  });

const aceitar = (id, ong = 'ONG Esperança') =>
  request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong });

const coletar = (id, voluntario = 'Ana Silva') =>
  request(app).post(`/api/doacoes/${id}/coletar`).send({ voluntario });

describe('contrato do query()', () => {
  it('devolve { rows } e aceita marcadores $1 e ?', async () => {
    const { body: criada } = await publicar();

    const comCifrao = await query('SELECT tipo FROM doacoes WHERE id = $1', [criada.id]);
    const comInterrogacao = await query('SELECT tipo FROM doacoes WHERE id = ?', [criada.id]);

    expect(comCifrao.rows).toEqual([{ tipo: 'Sopa' }]);
    expect(comInterrogacao.rows).toEqual([{ tipo: 'Sopa' }]);
  });

  it('informa quantas linhas foram alteradas', async () => {
    const { body: criada } = await publicar();
    const resultado = await query('UPDATE doacoes SET tipo = $1 WHERE id = $2', ['Caldo', criada.id]);
    expect(resultado.alteradas).toBe(1);
  });
});

describe('converterMarcadores()', () => {
  it('troca ? por $1, $2, … na ordem', () => {
    expect(converterMarcadores('a = ? AND b = ?')).toBe('a = $1 AND b = $2');
  });

  it('não mexe em ? dentro de literais e identificadores entre aspas', () => {
    expect(converterMarcadores("x = '?' AND y = ?")).toBe("x = '?' AND y = $1");
    expect(converterMarcadores("x = 'it''s ?' AND y = ?")).toBe("x = 'it''s ?' AND y = $1");
    expect(converterMarcadores('SELECT "col?" FROM t WHERE a = ?'))
      .toBe('SELECT "col?" FROM t WHERE a = $1');
  });

  it('deixa passar intacto o SQL que já usa $1, $2', () => {
    expect(converterMarcadores('SELECT 1 WHERE a = $1 AND b = $2'))
      .toBe('SELECT 1 WHERE a = $1 AND b = $2');
  });
});

describe('tipos e formatos iguais aos que o SQLite devolvia', () => {
  it('devolve o id como número, não como texto', async () => {
    const { body: criada } = await publicar();
    expect(typeof criada.id).toBe('number');
  });

  it('guarda as datas como texto AAAA-MM-DD HH:MM:SS em UTC', async () => {
    const { body: criada } = await publicar();
    const { body: aceita } = await aceitar(criada.id);
    const { body: coletada } = await coletar(criada.id);

    const emUtc = (texto) => Date.parse(`${texto.replace(' ', 'T')}Z`);
    for (const instante of [criada.criada_em, aceita.aceita_em, coletada.coletada_em]) {
      expect(typeof instante).toBe('string');
      expect(instante).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      // Se viesse em horário local (ex.: UTC-3) a diferença passaria de 1 minuto.
      expect(Math.abs(emUtc(instante) - Date.now())).toBeLessThan(60_000);
    }
  });

  it('devolve o total do relatório como número, não como texto', async () => {
    const resposta = await request(app).get('/api/relatorios/aceites');
    expect(typeof resposta.body.totalAceitas).toBe('number');
  });

  it('ordena a lista de disponíveis por validade e, nos empates, pela mais recente', async () => {
    await publicar({ tipo: 'Tarde', validade: '2026-12-20' });
    await publicar({ tipo: 'Cedo', validade: '2026-12-01' });
    await publicar({ tipo: 'Cedo 2', validade: '2026-12-01' });

    const { body: lista } = await request(app).get('/api/doacoes');

    expect(lista.map((d) => d.tipo)).toEqual(['Cedo 2', 'Cedo', 'Tarde']);
  });
});

describe('id que não cabe na coluna age como "não existe", sem erro do banco', () => {
  for (const id of ['99999999999', '1e21']) {
    it(`id ${id}`, async () => {
      const respostas = await Promise.all([
        aceitar(id),
        coletar(id),
        request(app).post(`/api/doacoes/${id}/cancelar`).send({ doador: 'Padaria do Zé' }),
        request(app).get(`/api/doacoes/${id}/retirada`).query({ ong: 'ONG Esperança' })
      ]);

      for (const resposta of respostas) {
        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toMatch(/^doação (não encontrada|inválida)$/);
      }
    });
  }
});

describe('concorrência: duas requisições disputando a mesma doação', () => {
  it('com várias ONGs aceitando ao mesmo tempo, só uma leva a doação', async () => {
    const { body: criada } = await publicar();
    const ongs = ['ONG 1', 'ONG 2', 'ONG 3', 'ONG 4', 'ONG 5'];

    const respostas = await Promise.all(ongs.map((ong) => aceitar(criada.id, ong)));

    const vencedoras = respostas.filter((r) => r.status === 200);
    const recusadas = respostas.filter((r) => r.status === 400);
    expect(vencedoras).toHaveLength(1);
    expect(recusadas).toHaveLength(ongs.length - 1);

    const salva = await query('SELECT status, ong FROM doacoes WHERE id = $1', [criada.id]);
    expect(salva.rows[0].status).toBe('aceita');
    expect(salva.rows[0].ong).toBe(vencedoras[0].body.ong);
  });

  it('com vários voluntários coletando ao mesmo tempo, só um registra a coleta', async () => {
    const { body: criada } = await publicar();
    await aceitar(criada.id);
    const voluntarios = ['Ana', 'Bia', 'Caio', 'Davi', 'Eva'];

    const respostas = await Promise.all(voluntarios.map((v) => coletar(criada.id, v)));

    const vencedoras = respostas.filter((r) => r.status === 200);
    expect(vencedoras).toHaveLength(1);
    expect(respostas.filter((r) => r.status === 400)).toHaveLength(voluntarios.length - 1);

    const salva = await query('SELECT voluntario FROM doacoes WHERE id = $1', [criada.id]);
    expect(salva.rows[0].voluntario).toBe(vencedoras[0].body.voluntario);
  });
});

describe('trava do banco de teste (ADR 0002)', () => {
  it('os testes estão conectados a um banco cujo nome termina em _test', async () => {
    const { rows } = await query('SELECT current_database() AS nome');
    expect(rows[0].nome).toMatch(/_test$/);
  });

  it('limparBanco() recusa rodar fora de NODE_ENV=test e não apaga nada', async () => {
    await publicar();
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(limparBanco()).rejects.toThrow(/NODE_ENV=test/);
    } finally {
      process.env.NODE_ENV = original;
    }

    const { rows } = await query('SELECT COUNT(*)::int AS total FROM doacoes');
    expect(rows[0].total).toBe(1);
  });

  it('só aceita como banco de teste um nome terminado em _test', () => {
    expect(validarBancoDeTeste('postgres://u:p@localhost:5433/pratocheio_test'))
      .toBe('pratocheio_test');

    for (const url of [
      'postgres://u:p@localhost:5433/pratocheio',
      'postgres://u:p@localhost:5433/test',
      'postgres://u:p@localhost:5433/pratocheio_test_prod',
      'isto não é uma URL',
      ''
    ]) {
      expect(() => validarBancoDeTeste(url)).toThrow(/_test/);
    }
  });
});

describe('migração de um schema antigo', () => {
  // Fica por último porque recria a tabela. O finally devolve o schema ao normal
  // para não afetar nenhum outro teste que use o mesmo banco.
  it('acrescenta as colunas novas, preserva as doações e preenche aceita_em', async () => {
    try {
      await query('DROP TABLE doacoes');
      await query(`
        CREATE TABLE doacoes (
          id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          tipo TEXT NOT NULL,
          quantidade TEXT NOT NULL,
          validade TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'disponivel',
          ong TEXT,
          criada_em TEXT NOT NULL
        )
      `);
      await query(
        `INSERT INTO doacoes (tipo, quantidade, validade, status, ong, criada_em)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Pão', '10', '2026-09-20', 'aceita', 'ONG Antiga', '2026-09-10 12:00:00']
      );

      await migrar();
      await migrar(); // idempotente

      const { rows } = await query('SELECT * FROM doacoes');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        ong: 'ONG Antiga',
        status: 'aceita',
        aceita_em: '2026-09-10 12:00:00',
        doador: null,
        endereco_retirada: null,
        coletada_em: null,
        voluntario: null
      });
    } finally {
      await query('DROP TABLE IF EXISTS doacoes');
      await migrar();
    }
  });
});
