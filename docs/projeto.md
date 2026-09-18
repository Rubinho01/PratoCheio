# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto
| # | Decisão | Alternativas A | Alternativa B |  Requisito/risco da Análise que a motiva |
|---|---|---|---|---|
| # | Como tratar doações que ultrapassam a validade/janela de retirada? | Criar um job automático periódico que identifica doações expiradas e altera seu status para “expirada”. | Verificar a validade sempre que a lista de doações for consultada, ocultando ou marcando naquele momento as doações vencidas. | Risco: doação perecível expirar antes de ser aceita/coletada. Regra: alimento perecível possui janela curta e perde-se se não for coletado a tempo. |
| # | Como garantir que duas ONGs não aceitem a mesma doação ao mesmo tempo? | Fazer o aceite por operação/transação atômica no banco, atualizando a doação apenas se ela ainda estiver disponível. | Usar bloqueio pessimista no registro da doação durante o processo de aceite, impedindo outro aceite simultâneo. | Risco: duas ONGs tentarem aceitar a mesma doação simultaneamente. Regra: depois de aceita por uma ONG, a doação não fica disponível para outra. |
| # | Como registrar uma coleta quando a conexão do voluntário estiver instável? | Armazenar temporariamente a confirmação no navegador/celular e sincronizar automaticamente quando a conexão voltar. | Realizar a tentativa de envio imediatamente e, se falhar, manter a operação pendente com opção de reenviar, preservando o horário real da coleta. | Restrição: deve funcionar no navegador do celular com conexão instável. Requisito de qualidade: o horário registrado deve representar o evento real, e não apenas o momento da sincronização. |

## Tabela de trade-offs (uma decisão em detalhe)
| Critério | Alternativa A | Alternativa B |
|---|---|---|
| Evita aceite duplicado | Alta garantia, pois somente uma atualização consegue alterar uma doação ainda disponível. | Alta garantia, pois o registro fica bloqueado durante o aceite.|
| Complexidade de implementação | Baixa/Média | Média/Alta |
| Adequação ao piloto | Boa para equipe pequena e prazo curto. | Funciona, mas acrescenta complexidade desnecessária para o volume esperado no piloto. |
| Adequação ao piloto | Boa para equipe pequena e prazo curto. | Funciona, mas acrescenta complexidade desnecessária para o volume esperado no piloto. |
| Desempenho | Bom, pois a operação é curta e não mantém o registro bloqueado por muito tempo. | Pode causar espera entre requisições concorrentes enquanto o bloqueio estiver ativo. |
| Manutenção | Mais simples de entender e testar. | Exige maior cuidado com locks, timeout e transações. |
| Orçamento próximo de zero | Não exige infraestrutura adicional. | Também não exige infraestrutura adicional, mas possui maior custo de desenvolvimento e manutenção. |
| Teste automatizado | Pode ser validada simulando dois aceites simultâneos e verificando que apenas um é concluído. | Também pode ser testada, porém o cenário de concorrência e bloqueio tende a ser mais complexo. |

## Diagramas
(contexto + dados ou componentes — em `docs/` ou como imagem)

## ADRs
Ver `docs/adr/`.

## Requisitos não-funcionais
| Requisito | Como afeta o design |
|---|---|

## Critérios de validação do projeto

## Uso de IA
