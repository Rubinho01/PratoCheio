# ADR 0001 — Migração de SQLite para PostgreSQL (na Unidade 3)

- **Data:** 2026-10-08
- **Status:** proposto

## Contexto

Hoje o Prato Cheio guarda as doações em SQLite, usando o módulo embutido sqlite. Essa escolha atendeu bem ao walking skeleton: não há nada para instalar, com equipe pequena, prazo curto e orçamento próximo de zero.

**Por que migrar.**

- **Concorrência real.** O risco duas ONGs aceitam a mesma doação ao mesmo tempo depende de duas requisições disputando a mesma linha. 
- **Módulo experimental.** node:sqlite ainda imprime ExperimentalWarning e exige Node 22.13+ e um createRequire para o Vitest reconhecê-lo.
- **Banco como arquivo local.** O README já avisa que o SQLite falha com `disk I/O error` em pasta sincronizada (OneDrive, Drive, Dropbox) ou em disco de rede, e um arquivo local não serve a mais de uma instância da aplicação.

**Por que só na Unidade 3.**

- Nas Unidades 1 e 2 o esforço vai para validar a fatia H0 e a hipótese da Análise (o gargalo está no tempo de aceite ou na logística de coleta?). Subir e manter um servidor de banco antes disso gasta tempo e orçamento que a Análise reservou para outras coisas.
- O volume de doações do piloto é desconhecido até o momento.
- A troca é barata de adiar: query() devolve { rows } e o resto do código (doacoes.js, repositorio.js) fala só com ela. O dados.sqlite versionado tem 0 linhas, então não há dados a levar.
- A Unidade 2 é a hora de decidir, com ADR; a Unidade 3 é a hora de executar a refatoração com os testes provando que o comportamento se manteve.

## Alternativas consideradas

### Quanto ao banco e ao momento

1. **Ficar em SQLite (`node:sqlite`) até o fim.**
   - Prós: zero instalação; testes em memória, rápidos e isolados; nenhum custo de infraestrutura; já funciona.
   - Contras: o teste de concorrência do Risco 2 não prova nada devido a conexão única e síncrona; módulo experimental; falha em pastas sincronizadas.

2. **Migrar já, na Unidade 1 ou 2.**
   - Prós: evita refatorar depois; o Risco 2 seria testado de verdade desde cedo.
   - Contras: cada integrante precisaria de um PostgreSQL funcionando antes de validar a H0, e o ganho só aparece quando há concorrência real, que o piloto ainda não tem; consome prazo e orçamento da fatia mínima.

3. **Ficar em SQLite nas Unidades 1 e 2 e migrar para PostgreSQL na Unidade 3 (escolhida).**
   - Prós: mantém o walking skeleton simples; a troca fica contida em `src/db.js` e nos SQLs de `src/repositorio.js`; os testes existentes servem de rede de segurança; por ser feita depois da hipótese medida, já nasce com o volume real do piloto.
   - Contras: o retrabalho de reescrever SQL e schema existe;

### Quanto a como subir o PostgreSQL (desenvolvimento, testes e CI)

4. **Instalar o PostgreSQL na máquina de cada integrante.**
   - Prós: sem Docker, desempenho nativo do host.
   - Contras: versões diferentes em cada polo, dificultando o desenvolvimento sob compatibilidade; Maior dificuldade para implementar o CI.

5. **Contêiner (Docker Compose) com versão fixada, por exemplo `postgres:16` (escolhida).**
   - Prós: mesma versão para os cinco integrantes e para o CI; sobe e descarta com um comando; cada pessoa tem seu banco isolado, o que importa porque limparBanco() apaga a tabela inteira; o GitHub Actions oferece o serviço com a mesma imagem utilizada em desnvolvimento.
   - Contras: exige Docker instalado e funcionando em cada máquina; consome memória e disco; mais um pré-requisito.

6. **Serviço gerenciado gratuito (Neon, Supabase, Render).**
   - Prós: nada para instalar; já está acessível pela internet, o que ajuda no deploy do piloto.
   - Contras: um banco compartilhado entre cinco pessoas e os limites do plano gratuito (pausa por inatividade, expiração, partida a frio) variam e precisam ser conferidos nos termos vigentes antes de depender deles.

## Decisão

**Migrar para PostgreSQL na Unidade 3, subindo o banco em contêiner com versão fixada para desenvolvimento, testes e CI.** O acesso passa a ser por DATABASE_URL, com o driver pg para node e um pool de conexões, e a troca fica restrita a src/db.js e às consultas de src/repositorio.js.

Por que não as outras:

- **Não ficar em SQLite (1):** é a única opção que deixa o Risco 2 sem prova real e que descumpre a exigência da Unidade 3.
- **Não migrar já (2):** antecipa um custo sem benefício enquanto o piloto ainda valida a H0 e o volume é desconhecido.
- **Não instalar na máquina (4):** perde a reprodutibilidade entre cinco máquinas e o CI.
- **Não usar serviço gerenciado para testar (6):** O banco possui limitações ao plano gratuito, não pretendemos pagar por uma hospadagem de banco com orçamento quase nulo.


## Consequências

- **Positivas:**
  - Some o ExperimentalWarning  do node:sqlite.
  - Ambiente de desenvolvimento, de teste e de CI com a mesma versão e o mesmo dialeto do banco.
  - A mudança fica contida, como o db.js foi desenhado para permitir.
- **Negativas / o que abrimos mão:**
  - **`npm test` deixa de funcionar "só com Node".**  os testes passam a depender de um serviço externo e ficam mais lentos que em memória.
  - **Custo de reescrita.** Quem implementar a refatoração paga: trocar `?` por `$1, $2…`, `INTEGER PRIMARY KEY AUTOINCREMENT` por coluna identity e etc...
  - **O CI precisa ajustado.** Quem abrir a PR da migração paga o trabalho de escrever o workflow com `services: postgres`.
  - **Hospedagem do piloto.** Em produção passa a existir um servidor de banco para manter.
- **Riscos e o que fazer se der errado:**
  - *Diferença de comportamento entre os bancos* (tipos, ordenação de empates em `criada_em`, formato das datas): coberta pelos testes de paridade do critério abaixo. Se algum falhar, corrige-se no repositório de dados, sem alterar a regra de negócio.
  - *Migração não fecha no prazo da Unidade 3:* a PR só entra na `main` com CI verde e revisão de outro integrante, então a `main` continua em SQLite funcional até lá.
  - *Contêiner não sobe numa máquina:* o `DATABASE_URL` aceita qualquer PostgreSQL alcançável, então a pessoa pode usar uma instalação local como contorno, sem mudar o código.
  - *Dados existentes:* o `dados.sqlite` versionado tem 0 linhas, portanto não há migração de dados. Depois da troca, o arquivo deve sair do versionamento.

## Rastreabilidade

- **Risco da Análise:** "Duas ONGs tentam aceitar a mesma doação ao mesmo tempo (concorrência), violando a regra de reserva exclusiva do H0." A mitigação prevista (transação atômica no aceite e teste automatizado de dois aceites simultâneos) só tem valor probatório num banco com conexões concorrentes.
- **Requisito da Análise:** H0, reserva exclusiva para a ONG que aceitou, e o critério de aceite "deve ficar reservada para essa ONG e deixar de estar disponível para outras ONGs".
- **Restrições da Análise:** equipe pequena, prazo curto e orçamento próximo de zero (Decisão de análise), que justificam adiar a migração; e a incerteza sobre o volume real de doações, que justifica não dimensionar o banco antes do piloto.
- **Exigência da disciplina:** README, "banco relacional migrado para PostgreSQL na Unidade 3".

