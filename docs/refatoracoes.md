
# Refatorações — Prato Cheio

*Trabalho 3 · uma seção por refatoração · o que importa é o motivo e a evidência*

> **Situação no projeto analisado:** as duas refatorações abaixo estão **planejadas, mas ainda não foram aplicadas** ao código do arquivo enviado. O ADR 0001 registra a migração como **proposta**, e a implementação atual continua utilizando SQLite. Por isso, as mudanças são descritas como previstas, sem apresentar resultados de testes ou de CI ainda não obtidos.

## Refatoração 1 — Migração de SQLite para PostgreSQL

- **Motivo:** conforme o [ADR 0001 — Migração de SQLite para PostgreSQL](adr/migração-sqlite-para-postgres.md), o SQLite foi adequado ao *walking skeleton* por não exigir infraestrutura adicional, mas apresenta limitações para a evolução do piloto: o módulo `node:sqlite` é experimental, o arquivo local não é compartilhado por múltiplas instâncias da aplicação e um teste com uma conexão síncrona não demonstra adequadamente a disputa real entre duas ONGs pela mesma doação. A decisão registrada foi adiar a migração até a Unidade 3, preservando o foco das etapas anteriores na validação da história H0, e utilizar PostgreSQL em contêiner com versão fixada (proposta: `postgres:16`) para padronizar desenvolvimento, testes e CI.

- **O que mudou:** **a implementação ainda não foi realizada**. As alterações necessárias, conforme o ADR e a estrutura atual do projeto, são:
  - **`src/db.js`:** substituir `node:sqlite` e `DATABASE_FILE` pelo driver `pg`, com pool de conexões configurado por `DATABASE_URL`; manter a interface `query(sql, valores)` retornando `{ rows }`; adaptar a criação do esquema, dos índices e o encerramento das conexões ao PostgreSQL.
  - **`src/repositorio.js`:** converter os parâmetros SQL de `?` para `$1`, `$2` etc.; substituir expressões específicas do SQLite, como `datetime('now')`, por equivalentes do PostgreSQL; preservar as atualizações condicionais que impedem aceite ou coleta duplicados; normalizar eventuais diferenças de tipo, especialmente a contagem `COUNT(*)`, para manter a resposta numérica esperada pela API.
  - **Configuração e infraestrutura:** adicionar a dependência `pg`, configurar um PostgreSQL isolado com versão fixada por Docker Compose e documentar as variáveis de conexão; adaptar o `vitest.config.js` e o CI para utilizarem um banco de testes separado. A proteção desse banco deve seguir também o ADR 0002 — Proteger o banco real contra os testes, impedindo que a limpeza usada nos testes alcance o banco do piloto.
  - **Dados e esquema:** adaptar a geração de IDs (`AUTOINCREMENT` para identidade), preservar os campos e índices existentes e revisar datas e ordenações. Segundo o ADR, o `dados.sqlite` inicialmente versionado não contém registros a migrar; após a substituição efetiva, esse arquivo deverá ser retirado do versionamento.

- **O que NÃO mudou:** **até o momento, o comportamento atual não foi alterado**. Durante a refatoração deverão ser preservados os contratos das rotas de `src/app.js`, as regras de negócio de `src/doacoes.js`, a reserva exclusiva da doação para uma ONG, a privacidade do endereço de retirada, o cancelamento, a confirmação de coleta e o relatório mensal de aceites. Os cenários de teste existentes deverão continuar válidos como critérios de paridade; apenas a configuração e, quando necessário, a preparação dos dados de teste precisarão ser adaptadas ao novo banco. O objetivo é trocar a tecnologia de persistência, não modificar as funcionalidades oferecidas aos usuários.

- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança:
  - testes depois da mudança:
  - link da execução do CI verde:

## Refatoração 2 — Centralização da validação de identificadores de doações

- **Cheiro de código atacado:** **duplicação de código e inconsistência de validação**. Em `src/doacoes.js`, as funções `aceitar`, `cancelar`, `consultarRetirada` e `confirmarColeta` convertem e validam o ID da doação separadamente. Três utilizam `Number.isInteger`, enquanto `confirmarColeta` usa `Number.isSafeInteger`, criando critérios diferentes para o mesmo identificador.

- **Qual dor concreta isso resolvia:** uma correção na regra de validação precisaria ser repetida em quatro pontos, com risco de esquecer algum deles. A divergência já presente permite que determinados valores numéricos sejam tratados de forma diferente conforme a operação, dificultando manutenção, revisão do código e previsibilidade das mensagens de erro.

- **O que mudou:** **a implementação ainda não foi realizada**. A refatoração proposta é extrair uma função privada e reutilizável em `src/doacoes.js` (por exemplo, `validarIdDoacao(id)`), responsável por converter o valor para número, verificar que seja um inteiro seguro e positivo e lançar a mensagem já utilizada, `doação inválida`, quando necessário. As quatro operações passariam a chamar essa função, eliminando os blocos repetidos. A alteração deve preservar as regras específicas de cada operação e não deslocar regras de negócio para `src/app.js`.

- **Evidência (testes verdes antes e depois):**
  - testes antes da mudança:
  - testes depois da mudança:
  - link da execução do CI verde:

---

## Limitações e o que ficou de fora

- **Execução e comprovação pendentes:** no material analisado, `src/db.js` ainda usa `node:sqlite`, `src/repositorio.js` contém SQL específico de SQLite, `vitest.config.js` configura um banco SQLite em memória e não há dependência `pg` no `package.json`. Portanto, não é possível declarar a migração concluída ou afirmar paridade entre os bancos sem executar as alterações e seus testes. A segunda refatoração também não foi aplicada.

- **Segurança dos dados de teste:** a proteção prevista pelo ADR 0002 deve ser implementada antes dos testes com PostgreSQL: banco de teste separado, configuração explícita, checagem antes da execução e bloqueio de `limparBanco()` fora do ambiente permitido. Foi mantida como requisito da migração, e não tratada como funcionalidade já entregue.

- **Escopo funcional preservado:** autenticação e autorização de perfis, coleta *offline*, paginação e melhorias maiores de infraestrutura não foram incluídas nestas duas refatorações. Esses temas exigem decisões e testes próprios, enquanto o foco aqui é reduzir o risco da troca de banco e eliminar uma duplicação localizada.

- **Validação futura:** após implementar as duas mudanças, executar a suíte de testes antes e depois, acrescentar um cenário de aceites concorrentes em conexões reais do PostgreSQL e registrar os resultados e o link da execução do CI nos campos de evidência acima.
