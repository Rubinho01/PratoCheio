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

Pronto: estrutura do projeto, interface básica, rota de saúde, **conexão com o banco e o schema** (`src/db.js`), CI configurado e um teste passando (prova que a aplicação sobe).

Falta (Trabalho 1 — walking skeleton): implementar `src/doacoes.js` (regras) e
`src/repositorio.js` (SQL) para que a história zero funcione ponta a ponta —
**um doador publica uma doação → uma ONG vê a doação → a ONG a aceita e ela sai da lista.**
Os critérios de aceite estão em `tests/doacoes.test.js` como `it.todo`: troque cada um
por um teste de verdade conforme implementa.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
