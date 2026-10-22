import { beforeEach, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar, query } from '../src/db.js';

const app = criarApp();
beforeEach(async () => { await migrar(); await limparBanco(); });
afterAll(async () => { await encerrar(); });

async function publicarAceitar(ong = 'ONG Esperança') {
  const publicada = await request(app).post('/api/doacoes').send({
    tipo: 'Legumes', quantidade: '15 caixas', validade: '2026-11-30',
    doador: 'Mercado Bairro', enderecoRetirada: 'Rua Central, 80'
  });
  expect(publicada.status).toBe(201);
  const aceita = await request(app)
    .post(`/api/doacoes/${publicada.body.id}/aceitar`).send({ ong });
  expect(aceita.status).toBe(200);
  return aceita.body;
}

const confirmar = (id, voluntario = 'Ana Silva') =>
  request(app).post(`/api/doacoes/${id}/coletar`).send({ voluntario });

const relatorio = (mes) => request(app).get('/api/relatorios/aceites').query({ mes });

describe('voluntário marca a doação como coletada', () => {
  it('lista somente as aceitas e não expõe o endereço de retirada', async () => {
    const aceita = await publicarAceitar();
    await request(app).post('/api/doacoes').send({
      tipo: 'Arroz', quantidade: '2 sacos', validade: '2026-11-30',
      enderecoRetirada: 'Endereço confidencial'
    });

    const pendentes = await request(app).get('/api/doacoes/pendentes-coleta');
    expect(pendentes.status).toBe(200);
    expect(pendentes.body).toHaveLength(1);
    expect(pendentes.body[0].id).toBe(aceita.id);
    expect(pendentes.body[0].ong).toBe('ONG Esperança');
    expect(JSON.stringify(pendentes.body)).not.toContain('Rua Central, 80');
  });

  it('registra o responsável, o momento da coleta e muda o status', async () => {
    const aceita = await publicarAceitar();
    expect(aceita.aceita_em).toMatch(/^\d{4}-\d{2}-\d{2} /);
    const resultado = await confirmar(aceita.id, ' Ana Silva ');
    expect(resultado.status).toBe(200);
    expect(resultado.body.status).toBe('coletada');
    expect(resultado.body.voluntario).toBe('Ana Silva');
    expect(resultado.body.coletada_em).toMatch(/^\d{4}-\d{2}-\d{2} /);
    expect(resultado.body.aceita_em).toBe(aceita.aceita_em);
    expect(resultado.body).not.toHaveProperty('endereco_retirada');

    const pendentes = await request(app).get('/api/doacoes/pendentes-coleta');
    expect(pendentes.body).toHaveLength(0);
    const disponiveis = await request(app).get('/api/doacoes');
    expect(disponiveis.body).toHaveLength(0);
    const doador = await request(app).get('/api/doacoes/minhas')
      .query({ doador: 'Mercado Bairro' });
    expect(doador.body[0].status).toBe('coletada');
  });

  it('não permite coletar uma doação disponível', async () => {
    const criada = await request(app).post('/api/doacoes').send({
      tipo: 'Frutas', quantidade: '2 caixas', validade: '2026-11-30',
      enderecoRetirada: 'Rua A, 12'
    });
    const resultado = await confirmar(criada.body.id);
    expect(resultado.status).toBe(400);
    expect(resultado.body.erro).toMatch(/somente doações aceitas/i);
  });

  it('não permite coletar duas vezes, nem trocar o voluntário', async () => {
    const aceita = await publicarAceitar();
    expect((await confirmar(aceita.id)).status).toBe(200);
    const repetida = await confirmar(aceita.id, 'Outro Voluntário');
    expect(repetida.status).toBe(400);
    const salva = await query('SELECT voluntario FROM doacoes WHERE id = ?', [aceita.id]);
    expect(salva.rows[0].voluntario).toBe('Ana Silva');
  });

  it('recusa voluntário vazio, ID inválido e doação inexistente', async () => {
    const aceita = await publicarAceitar();
    expect((await confirmar(aceita.id, '   ')).status).toBe(400);
    expect((await confirmar('abc')).status).toBe(400);
    expect((await confirmar(999999)).status).toBe(400);
    expect((await request(app).get('/api/doacoes/pendentes-coleta')).body).toHaveLength(1);
  });

  it('mantém a consulta de retirada acessível à ONG responsável após a coleta', async () => {
    const aceita = await publicarAceitar();
    await confirmar(aceita.id);
    const consulta = await request(app).get(`/api/doacoes/${aceita.id}/retirada`)
      .query({ ong: 'ONG Esperança' });
    expect(consulta.status).toBe(200);
    expect(consulta.body.endereco_retirada).toBe('Rua Central, 80');
    const outraOng = await request(app).get(`/api/doacoes/${aceita.id}/retirada`)
      .query({ ong: 'Outra ONG' });
    expect(outraOng.status).toBe(400);
  });
});

describe('Marta vê quantas doações foram aceitas no mês', () => {
  it('conta pelo mês do aceite, inclusive as que já foram coletadas', async () => {
    const primeira = await publicarAceitar();
    const segunda = await publicarAceitar();
    await confirmar(primeira.id);
    await query('UPDATE doacoes SET aceita_em = ? WHERE id = ?', ['2026-09-30 23:59:59', primeira.id]);
    await query('UPDATE doacoes SET aceita_em = ? WHERE id = ?', ['2026-10-01 00:00:00', segunda.id]);
    expect((await relatorio('2026-09')).body).toEqual({ mes: '2026-09', totalAceitas: 1 });
    expect((await relatorio('2026-10')).body).toEqual({ mes: '2026-10', totalAceitas: 1 });
    expect((await relatorio('2026-11')).body).toEqual({ mes: '2026-11', totalAceitas: 0 });
  });

  it('não conta disponível ou cancelada e usa aceite, não criação', async () => {
    const aceita = await publicarAceitar();
    await query('UPDATE doacoes SET criada_em = ?, aceita_em = ? WHERE id = ?',
      ['2026-08-20 10:00:00', '2026-10-02 10:00:00', aceita.id]);
    const pendente = await request(app).post('/api/doacoes').send({
      tipo: 'Pães', quantidade: '10', validade: '2026-11-30',
      enderecoRetirada: 'Rua B, 10', doador: 'Padaria'
    });
    const cancelada = await request(app)
      .post(`/api/doacoes/${pendente.body.id}/cancelar`).send({ doador: 'Padaria' });
    expect(cancelada.status).toBe(200);
    expect((await relatorio('2026-08')).body.totalAceitas).toBe(0);
    expect((await relatorio('2026-10')).body.totalAceitas).toBe(1);
  });

  it('entende a virada de ano e valida o mês', async () => {
    const aceita = await publicarAceitar();
    await query('UPDATE doacoes SET aceita_em = ? WHERE id = ?', ['2026-12-31 23:59:59', aceita.id]);
    expect((await relatorio('2026-12')).body.totalAceitas).toBe(1);
    expect((await relatorio('2027-01')).body.totalAceitas).toBe(0);
    for (const mes of ['2026-13', '2026-00', '10-2026', '2026-1', 'texto']) {
      const resposta = await relatorio(mes);
      expect(resposta.status).toBe(400);
      expect(resposta.body.erro).toBeTruthy();
    }
  });

  it('usa o mês atual quando omitido', async () => {
    const resposta = await request(app).get('/api/relatorios/aceites');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      mes: new Date().toISOString().slice(0, 7), totalAceitas: 0
    });
  });

  it('a migração é segura ao ser executada várias vezes', async () => {
    const aceita = await publicarAceitar();
    await migrar();
    await migrar();
    const salva = await query('SELECT aceita_em, ong FROM doacoes WHERE id = ?', [aceita.id]);
    expect(salva.rows[0].aceita_em).toBe(aceita.aceita_em);
    expect(salva.rows[0].ong).toBe('ONG Esperança');
  });
});
