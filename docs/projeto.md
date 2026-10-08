# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto
| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|

## Tabela de trade-offs (uma decisão em detalhe)
| Critério | Alternativa A | Alternativa B |
|---|---|---|

## Diagramas
(contexto + dados ou componentes — em `docs/` ou como imagem)

## ADRs
Ver `docs/adr/`.

## Requisitos não-funcionais
| Requisito | Como afeta o design |
|---|---|
|RNF1 — Cadastro rápido. Quando o doador publica pelo celular em 3G/4G, o sistema grava a doação e responde 201. Sem tipo, quantidade ou validade, responde 400. Medido por média de até 60 s por cadastro, cronometrada com os 2 doadores do piloto.|Decisão: formulário de 3 campos, sem login. Custo: a Vigilância Sanitária perde lote, temperatura e origem. |
|Nada se perde ao reiniciar. Quando o servidor reinicia, o sistema mantém todas as doações já publicadas e aceitas. Medido por teste manual: publicar, reiniciar, listar e ver a doação.|Decisão: persistência em banco, nunca em memória. Custo: os testes usam banco em memória e não provam isso. |
|Lista rápida no volume do piloto. Quando a ONG consulta a lista com 30 doações disponíveis, o sistema responde em até 500 ms. Medido por teste que cria 200 doações e cronometra o GET /api/doacoes. Volume e metas são propostas, pois a Análise não tem medição. | Decisão: lista sem paginação e sem índice em status. Custo: se o volume crescer demais, será preciso paginar e indexar. Paga a ONG, com lista lenta, e quem refatorar depois. |

## Critérios de validação do projeto

## Uso de IA
