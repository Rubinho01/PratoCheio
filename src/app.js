import express from 'express';
import * as doacoes from './doacoes.js';

export function criarApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));

  // Verificação de saúde: usada pelo CI para provar que a aplicação sobe.
  app.get('/api/saude', (req, res) => res.json({ ok: true }));

  app.get('/api/doacoes', async (req, res) => {
    try {
      res.json(await doacoes.listarDisponiveis());
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  });


  app.get('/api/doacoes/minhas', async (req, res) => {
    try {
      res.json(await doacoes.listarDoDoador(req.query.doador));
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  });

  app.get('/api/doacoes/pendentes-coleta', async (req, res) => {
    try {
      res.json(await doacoes.listarPendentesColeta());
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  });

  app.get('/api/relatorios/aceites', async (req, res) => {
    try {
      res.json(await doacoes.relatorioAceites(req.query.mes));
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  });

  app.get('/api/doacoes/:id/retirada', async (req, res) => {
    try {
      res.json(await doacoes.consultarRetirada(req.params.id, req.query.ong));
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  });

  app.post('/api/doacoes', async (req, res) => {
    try {
      res.status(201).json(await doacoes.criarDoacao(req.body));
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  });

  app.post('/api/doacoes/:id/aceitar', async (req, res) => {
    try {
      res.json(await doacoes.aceitar(req.params.id, req.body?.ong ?? 'ONG'));
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  });

  app.post('/api/doacoes/:id/coletar', async (req, res) => {
    try {
      res.json(await doacoes.confirmarColeta(req.params.id, req.body?.voluntario));
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  });

  app.post('/api/doacoes/:id/cancelar', async (req, res) => {
    try {
      res.json(await doacoes.cancelar(req.params.id, req.body?.doador));
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  });

  return app;
}