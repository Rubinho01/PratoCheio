import { beforeEach, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';


beforeEach(async () => {await migrar(); await limparBanco();});

afterAll(async () => {await encerrar(); });

const app = criarApp();

// Este teste já passa e não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// Backlog de testes do walking skeleton.
// Cada `it.todo` é um critério de aceite ainda não implementado — o CI não
// falha por causa deles. À medida que o grupo implementa, troque `it.todo`
// por um `it` de verdade (veja o exemplo comentado no fim do arquivo).
//
// Os testes abaixo usam o banco — que na Unidade 1 é SQLite em memória:
// nada a instalar, nada a subir.
// ---------------------------------------------------------------------------

describe('publicar e listar doações', () => {
    it('mostra a doação publicada na lista de disponíveis', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-10-01' });
 
    const res = await request(app).get('/api/doacoes');
    console.log(res)
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });
  
  it('recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções' }); // falta validade
 
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeTruthy();
 
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });
});

describe('aceitar uma doação', () => {
  it('marca a doação como aceita pela ONG', async () => {
    const criada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });
 
    const res = await request(app)
      .post(`/api/doacoes/${criada.body.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });
 
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG Esperança');
  });

  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const criada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });
 
    await request(app)
      .post(`/api/doacoes/${criada.body.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });
 
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });
 
  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const criada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });
 
    await request(app)
      .post(`/api/doacoes/${criada.body.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });
 
    const res = await request(app)
      .post(`/api/doacoes/${criada.body.id}/aceitar`)
      .send({ ong: 'Outra ONG' });
 
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeTruthy();
  });
});

describe('doador vê a situação das próprias doações', () => {
  const publicar = (doador, extra = {}) =>
    request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Sopa',
        quantidade: '10 porções',
        validade: '2026-08-01',
        doador,
        ...extra
      });

  const minhas = (doador) =>
    request(app).get('/api/doacoes/minhas').query({ doador });

  it('mostra a doação ainda não aceita como disponível, sem ONG', async () => {
    await publicar('Padaria do Zé');

    const res = await minhas('Padaria do Zé');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
    expect(res.body[0].status).toBe('disponivel');
    expect(res.body[0].ong).toBeNull();
  });

  it('mostra juntas as doações disponíveis e as aceitas do mesmo doador', async () => {
    const aceita = await publicar('Padaria do Zé', { tipo: 'Pão' });
    await publicar('Padaria do Zé', { tipo: 'Bolo' });

    await request(app)
      .post(`/api/doacoes/${aceita.body.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    const res = await minhas('Padaria do Zé');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const porTipo = Object.fromEntries(res.body.map((d) => [d.tipo, d]));
    expect(porTipo['Pão'].status).toBe('aceita');
    expect(porTipo['Pão'].ong).toBe('ONG Esperança');
    expect(porTipo['Bolo'].status).toBe('disponivel');
    expect(porTipo['Bolo'].ong).toBeNull();
  });

  it('não mostra doações de outros doadores', async () => {
    await publicar('Padaria do Zé', { tipo: 'Pão' });
    await publicar('Restaurante Sabor', { tipo: 'Arroz' });

    const res = await minhas('Padaria do Zé');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Pão');
  });

  it('não mostra doações publicadas sem doador identificado', async () => {
    await publicar(undefined, { tipo: 'Anônima' });

    const res = await minhas('Padaria do Zé');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

/* Exemplo de como transformar um critério de aceite em teste.
   Descomente o beforeEach/afterAll quando começar a usar o banco.

beforeEach(async () => {await migrar(); await limparBanco();});

afterAll(async () => {await encerrar(); });

  Dado que um doador publicou uma doação
  Quando uma ONG consulta as doações disponíveis
  Então a doação aparece na lista

  it('mostra a doação publicada na lista de disponíveis', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });
*/