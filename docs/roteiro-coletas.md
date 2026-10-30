# Roteiro para executar a inversão oficial da regra (Aula 11 — Parte B)

**O resultado anotado em `docs/PR-aula11-parte-b.md` é apenas um diagnóstico independente com Node.** Para cumprir o experimento oficial, é indispensável executar o `npm test` (Vitest) com a alteração temporária e contar os testes vermelhos.

1. Confirme que todos os testes passam com o código original: `npm test`.
2. Faça um commit com as alterações corretas no seu branch de Parte B.
3. Em `src/doacoes.js`, na função `confirmarColeta`, troque **temporariamente**:

   `if (existente.status !== 'aceita') {`

   por

   `if (existente.status === 'aceita') {`

4. Execute `npm test` com a regra invertida (ou rode o experimento completo pelo script `node scripts/experimento-inversao-aula11.mjs`, após fazer commit). **Antes de consertar qualquer coisa**, conte os testes vermelhos e copie seus nomes do relatório. Se nenhum falhar, fortaleça as asserções e repita o experimento.
5. Desfaça a inversão com `git restore src/doacoes.js` **somente se esse arquivo não tiver alterações suas ainda não commitadas**. Caso contrário, desfaça manualmente a comparação invertida.
6. Rode `npm test` novamente para comprovar que a suíte voltou a ficar verde.
7. Preencha, na descrição do PR no GitHub, o bloco **`## Inversão de regra`** com a regra alterada, **quantidade e nomes reais** dos testes vermelhos e `Inversão desfeita: sim`.
8. Garanta que o CI do PR está verde e peça a revisão de outro integrante.

A alteração temporária **não deve ser commitada** no PR. O registro da inversão deve ficar somente na descrição do PR.
