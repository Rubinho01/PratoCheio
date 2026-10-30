# PR da Parte B — Testes da confirmação de coleta (Aula 11)

> **Cole o conteúdo abaixo na descrição do segundo Pull Request.** Este arquivo é um
> rascunho do texto, NÃO substitui o PR aberto e revisado no GitHub. Substitua o
> link e complete o resultado de `npm test` após executar o experimento na sua máquina.

## História testada

- História: **Como voluntário, quero confirmar a retirada de uma doação já aceita por uma ONG, para que a coordenação saiba que o alimento foi coletado e não fique pendente.**
- PR da fatia: **[COLE_AQUI_A_URL_REAL_DO_PR_DA_PARTE_A]**
- Critérios cobertos (cada item aponta para um novo `it` em `tests/aula11-parte-b-coleta.test.js`):
  - **CA1 — Fila de coleta:** `CA1: apresenta na fila somente doações aceitas pendentes de coleta, sem divulgar o endereço`
  - **CA2 — Confirmação:** `CA2: ao confirmar a coleta registra o voluntário e preserva a ONG e o horário de aceite`
  - **CA3 — Histórico:** `CA3: retira a doação coletada da fila, mas mantém sua situação no histórico do doador`
- Regras de limite/erro adicionais (não entram na contagem dos três critérios):
  - **ER1 — Doação não aceita:** `ER1: recusa coletar uma doação ainda disponível e não modifica seu estado`
  - **ER2 — Nome em branco:** `ER2: recusa confirmação com nome de voluntário em branco e mantém a coleta pendente`
  - **ER3 — Confirmação repetida:** `ER3: recusa uma segunda coleta e preserva o responsável e a data da primeira`
  - **ER4 — Identificador inexistente:** `ER4: recusa a coleta de uma doação inexistente com mensagem específica`

## Como verificar

1. Executar `npm ci` em um clone do repositório, com Node.js 22.13 ou superior.
2. Executar `npm test` e verificar a aprovação de todos os testes.
3. Localizar os **sete testes novos** da Parte B em `tests/aula11-parte-b-coleta.test.js`.
4. Conferir os comentários `Dado`, `Quando` e `Então`, a preparação dos dados pela API e os `expect` do corpo das respostas e do estado posterior.
5. Verificar a execução do GitHub Actions na aba **Checks** do PR.

## Inversão de regra

- Regra invertida: **somente uma doação com `status === 'aceita'` pode ser coletada**. No arquivo `src/doacoes.js`, na função `confirmarColeta`, a condição `if (existente.status !== 'aceita')` foi temporariamente invertida para `if (existente.status === 'aceita')`.
- Resultado: **4 testes vermelhos no diagnóstico complementar com Node (4 cenários)**: `CA2: coletar doação aceita registra voluntário`; `ER1: recusa coleta de doação não aceita`; `ER3: recusa segunda confirmação`; `CA3: doação coletada sai da fila`.
- **Atenção — etapa obrigatória ainda pendente:** esse diagnóstico não é a suíte `npm test` exigida pelo professor. A execução completa do Vitest ficou impedida neste ambiente por falta de acesso ao registro npm. Antes de entregar, rode a suíte completa uma vez com a regra invertida, **sem corrigir nada antes de contar os vermelhos**, e substitua a linha `Resultado` acima pelos nomes e números reais dos testes vermelhos produzidos por `npm test`.
- Inversão desfeita: **sim**, condição original restaurada em `src/doacoes.js`; confirmada visualmente e por diagnóstico local com 4/4 verificações passando.
- A inversão **não faz parte do código a ser integrado**. Depois de desfazer, execute `npm test` de novo e confirme o CI verde.

## Uso de IA

- **O que a IA gerou:** primeiro rascunho dos sete testes HTTP em `tests/aula11-parte-b-coleta.test.js`, a rastreabilidade dos critérios em `docs/analise.md`, a descrição sugerida deste PR e uma checagem complementar do experimento de inversão.
- **O que ficou:** os testes de CA1–CA3 e ER1–ER4, os critérios escritos em Dado/Quando/Então e os passos reproduzíveis de verificação, desde que conferidos pela equipe.
- **O que o grupo mudou e por quê:** **[PREENCHER após revisão: ajustes feitos no código/testes, com justificativas. Não declarar revisão sem tê-la realizado.]**
- **Verificação obrigatória:** rodar a suíte com Vitest, revisar todas as asserções, verificar se respeitam as regras do produto e registrar os resultados reais.

## Observações para o grupo

- O PR da Parte A e este PR da Parte B devem ser distintos e revisados por outra pessoa.
- Cada integrante precisa de ao menos um commit próprio na atividade, ou de participação via `Co-authored-by`.
- No prazo, a seção `## Definição de pronto` deve constar no `README.md` da `main`.
- A entrega individual no Teams exige: link do repositório, PR da fatia, PR dos testes e link de um commit próprio.
