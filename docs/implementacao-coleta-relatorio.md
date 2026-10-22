# Incremento: confirmação de coleta e aceites mensais

## História 1 — Voluntário marca a doação como coletada

**Critérios de aceite**

- Dado que uma ONG aceitou uma doação, ela aparece na lista de coletas pendentes.
- O voluntário informa seu nome e confirma a coleta; a doação muda de `aceita` para `coletada`.
- O sistema registra `voluntario` e `coletada_em` sem perder `aceita_em` e a ONG que aceitou.
- Doações `disponivel`, `cancelada` ou já `coletada` não podem ser coletadas.
- Duas confirmações não podem sobrescrever o primeiro registro. O `UPDATE` condiciona a mudança ao status `aceita`.
- O endereço de retirada não é divulgado pela lista de coletas pendentes nem pela resposta da confirmação. A ONG responsável continua consultando o endereço via `GET /api/doacoes/:id/retirada?ong=...`.

**Dados:** `doacoes.status`, `doacoes.voluntario`, `doacoes.coletada_em`.

**API:** `GET /api/doacoes/pendentes-coleta` e `POST /api/doacoes/:id/coletar` com `{"voluntario":"Ana Silva"}`.

## História 2 — Marta consulta o total de doações aceitas no mês

**Critérios de aceite**

- O painel permite selecionar um mês (formato `AAAA-MM`).
- A contagem considera `aceita_em` dentro do mês escolhido, inclusive quando o status atual é `coletada`.
- Doações apenas publicadas ou canceladas antes do aceite não entram na contagem.
- A API valida o mês, aceita a ausência do parâmetro (mês atual em UTC) e retorna o total mesmo quando é zero.
- O cálculo considera o início do mês inclusive e o início do mês seguinte exclusive, com comportamento correto na virada de ano.

**API:** `GET /api/relatorios/aceites?mes=2026-10` → `{"mes":"2026-10","totalAceitas":N}`.

## Como verificar

```bash
npm install
npm run db:migrar
npm test
npm run test:smoke
npm run dev
```

No navegador, publique uma doação com endereço, aceite-a com o nome de uma ONG, confirme a coleta informando o voluntário e consulte o mês do aceite no relatório. A doação deve desaparecer das duas listas operacionais, mas permanecer contabilizada no relatório e no histórico do doador.

## Limites da versão

- Sem login ou autorização de perfis, seguindo o estágio atual do projeto.
- Registro da coleta no horário de confirmação no servidor, não o instante de uma coleta executada offline. Sincronização offline é um incremento futuro.
- Timestamps SQL em UTC. Para registros aceitos antes da migração, `aceita_em` é estimado a partir de `criada_em`, pois o banco antigo não armazenava o horário do aceite.
