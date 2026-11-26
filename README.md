# Prato Cheio — [Senninha Boys]

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Eduardo de Oliveira — @oduduz1
- Nicolas Eduardo — @nicolasdebian
- Rubem Krüger — @rubinho01
- Silvio de Avila — @avilasj
- Thomas Pruner — @ThomasPruner

## Como rodar

Requisitos: **Node.js 22.13 ou superior** e **Docker** — o PostgreSQL sobe em contêiner, com a versão fixada (ADR 0001).

```bash
npm install            # só na primeira vez
cp .env.example .env   # configuração local (o .env não vai para o Git)
npm run db:subir       # sobe o PostgreSQL 16 (cria o banco de desenvolvimento e o de testes)
npm run db:migrar      # cria o schema
npm start              # sobe em http://localhost:3000
npm test               # roda os testes (no banco de testes, nunca no de desenvolvimento)
npm run dev            # sobe recarregando a cada alteração
```

Para subir **banco e aplicação** em contêiner, sem Node na máquina: `docker compose up --build` (http://localhost:3000). `docker compose down` para; `docker compose down -v` para e apaga os dados.

> O PostgreSQL fica na porta **5433** do host (muda com `DB_PORT` no `.env`), para não colidir com um PostgreSQL instalado na máquina.
> Os bancos só são criados na primeira vez que o volume sobe; depois de mudar `docker/initdb/` ou as senhas, rode `docker compose down -v`.

**Sem Docker?** Qualquer PostgreSQL alcançável serve: aponte `DATABASE_URL` (desenvolvimento) e `TEST_DATABASE_URL` (testes) no `.env`. O código não tem banco padrão — sem `DATABASE_URL` ele não conecta.

## O banco: PostgreSQL

| Variável | Para quê | Valor local (docker compose) |
|---|---|---|
| `DATABASE_URL` | desenvolvimento / piloto | `postgres://pratocheio:pratocheio@localhost:5433/pratocheio` |
| `TEST_DATABASE_URL` | testes automatizados | `postgres://pratocheio_test:pratocheio_test@localhost:5433/pratocheio_test` |

- O acesso é por `DATABASE_URL`, com o driver `pg` e um pool de conexões. O `src/db.js` expõe `query()` devolvendo `{ rows }`, e a troca de banco ficou contida nele e no SQL de `src/repositorio.js` (marcadores `$1, $2, …`); as regras de negócio (`src/doacoes.js`) não mudaram.
- As datas continuam `TEXT` no formato `AAAA-MM-DD HH:MM:SS`, em UTC, como antes.
- **Os testes nunca tocam o banco real** (ADR 0002): usam um banco separado, com usuário próprio, cujo nome precisa terminar em `_test`. O Vitest cancela a suíte antes do primeiro teste se não for assim, e `limparBanco()` só apaga com `NODE_ENV=test` num banco `_test`.
- No CI (`.github/workflows/ci.yml`) os testes rodam sobre um serviço `postgres:16`, a mesma imagem do `docker-compose.yml`.

## Estrutura

```
src/server.js        entrypoint (npm start)
src/db.js            conexão (PostgreSQL) e schema do banco
src/app.js           rotas da API
src/doacoes.js       regras de negócio      <- implementar (U1)
src/repositorio.js   acesso ao banco (SQL)  <- implementar (U1)
public/index.html    interface (funciona no celular)
tests/               testes automatizados (rodam no PostgreSQL de testes)
docker-compose.yml   PostgreSQL 16 (+ aplicação) em contêiner
Dockerfile           imagem da aplicação
docker/initdb/       cria o banco e o usuário de testes na primeira subida
.env.example         modelo das variáveis de ambiente
docs/analise.md      documento de análise   (Trabalho 1)
docs/projeto.md      documento de projeto   (Trabalho 2)
docs/adr/            decisões arquiteturais (Trabalho 2)
docs/validacao.md    validação e testes     (Trabalho 3)
docs/refatoracoes.md refatorações feitas    (Trabalho 3)
docs/demo.md         roteiro da demo        (Trabalho 3)
docs/retrospectivas/ retrospectiva de cada iteração
.github/workflows/   pipeline de CI
```

## Como trabalhar (fluxo de Pull Request)

A partir da Unidade 2, **nada entra direto na `main`**:

```bash
git checkout -b historia/ong-aceita-doacao
# ... implementa, escreve o teste, roda npm test ...
git commit -m "ONG aceita uma doação e ela sai da lista"
git push -u origin historia/ong-aceita-doacao
```

Abra o Pull Request no GitHub, preencha o template, espere o **CI ficar verde** e
peça a revisão de **outro integrante**. Só então faça o merge.

## O que já está pronto e o que falta

Pronto: estrutura do projeto, interface básica, rota de saúde, banco SQLite, CI, H0 (publicação e aceite), visualização do doador, cancelamento antes do aceite, consulta de retirada, **confirmação da coleta por voluntários** e **relatório mensal de aceites**. Os testes de regressão da H0 estão em `tests/doacoes.test.js` e os testes dos incrementos em `tests/novas-historias.test.js`.

Pendente para versões futuras: autenticação e permissões, sincronização de coletas offline e migração da persistência para PostgreSQL, conforme o planejamento de arquitetura do grupo.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.

## Incrementos — coleta pelo voluntário e relatório da Marta

A stack permanece a mesma: **Node.js 22.13+, Express, SQLite (`node:sqlite`), HTML/CSS/JavaScript puro e Vitest/Supertest**.

### Fluxo de coleta

1. O doador cadastra a doação (incluindo `enderecoRetirada`).
2. Uma ONG aceita a doação e ela passa de `disponivel` para `aceita`; o sistema registra `aceita_em`.
3. O voluntário abre a seção **Confirmar coleta**, informa seu nome e clica em **Marcar coletada** numa doação aceita.
4. A doação muda para `coletada`, mantendo `aceita_em`, e registra `voluntario` e `coletada_em`. Ela deixa de aparecer entre as coletas pendentes.

Somente doações com status `aceita` podem ser coletadas. Uma segunda confirmação é recusada sem sobrescrever os dados da primeira. A consulta de endereço continua restrita ao fluxo já existente da ONG que aceitou, inclusive após a coleta. A listagem pública de pendentes e a resposta da confirmação de coleta não expõem o endereço.

### Relatório mensal da Marta

A seção **Relatório da Marta** permite escolher o mês em `AAAA-MM` e informa quantas doações **foram aceitas nesse mês**, incluindo as que já foram coletadas. O mês é calculado pela coluna `aceita_em`, **não** por `criada_em` nem pelo estado atual. Datas do relatório seguem **UTC**, conforme os timestamps registrados pelo SQLite.

### Endpoints adicionados

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/doacoes/pendentes-coleta` | Lista doações com status `aceita`, sem endereço de retirada. |
| `POST` | `/api/doacoes/:id/coletar` | JSON `{ "voluntario": "Ana Silva" }`; confirma uma coleta. |
| `GET` | `/api/relatorios/aceites?mes=2026-10` | Retorna `{ "mes": "2026-10", "totalAceitas": 2 }` (valor ilustrativo). Omitir `mes` consulta o mês atual em UTC. |

Os erros de validação e de transição de estado retornam HTTP 400, no mesmo padrão das rotas já existentes.

### Migração e testes

A migração (`npm run db:migrar`, também executada no `npm start`) adiciona as colunas `aceita_em`, `coletada_em` e `voluntario` aos bancos existentes **sem apagar doações**. Para doações que já estavam aceitas antes dessa alteração, como o instante real do aceite não era registrado, a migração usa `criada_em` como aproximação para `aceita_em`; portanto **relatórios históricos anteriores à implantação podem ser aproximados**. A execução repetida da migração é segura.

```bash
npm install
npm run db:migrar
npm test           # suíte Vitest + Supertest (depende de npm install)
npm run test:smoke # valida regras + migração em banco temporário, sem dependências externas
npm run dev        # acesse http://localhost:3000
```

**Importante sobre autorização:** o repositório original não possui autenticação nem perfis. Essas novas seções seguem essa limitação: o nome do voluntário é informado no formulário e o relatório não é restrito exclusivamente à Marta. Para uso real, será necessário implementar login, permissões e vínculo entre voluntário e ONG.
