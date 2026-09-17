# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Problema central

Restaurantes, padarias e mercados descartam diariamente comida boa por falta de um canal rápido para repassá-la, enquanto ONGs e cozinhas comunitárias ficam sem alimento suficiente para atender quem precisa. Não existe hoje um jeito simples de avisar quem tem sobra para quem pode buscar — a comunicação depende de contato informal, o que faz o alimento vencer antes de chegar a alguém. O problema não é "falta um app de cadastro de doações": é que a informação sobre comida disponível não chega a tempo a quem poderia aproveitá-la, e o desperdício acontece justamente nessa janela entre "sobrou comida" e "alguém foi buscar".

## Incertezas

- Não sabemos o volume real de doações que o piloto vai gerar por dia — não há nenhuma medição histórica, só a percepção de Marta.
- Não sabemos se o gargalo real está no aviso (doador demora para publicar / ONG demora para ver) ou na coleta (ONG vê a tempo, mas não tem voluntário disponível para buscar). São problemas diferentes e pedem soluções diferentes.
- Não sabemos quantos campos de cadastro um doador aceita preencher antes de desistir no meio do processo.
- Não sabemos o nível mínimo de rastreabilidade que a vigilância sanitária vai de fato exigir para autorizar o piloto — o caso menciona a exigência, mas não o detalhe.
- Não sabemos se a conexão instável dos voluntários entregadores (celular, na rua) vai inviabilizar alguma parte do fluxo pensado.

## Stakeholders
| Stakeholder | Interesse | Influência | O que espera | Prioridade |
|---|---|---|---|---|
|Marta|Alto|Alta|Entrega do Projeto funcional|Alta|
|Ong's|Alto|Alta|Ter fácil acesso aos anúncios de alimentos|Alta|
|Voluntários Entregadores|Alto|Baixa|Acessar os endereços das Ong's/Doadores|Baixa|
|Doadores|Alto|Alta|Receber os entregadores ao informar sobras|Alta|
|Vigilância Sanitária|Baixo|Alta|Atender às normas de cadastro dos itens|Alta|
|Donatário|Alto|Baixa|Receber os alimentos ou refeições das ONG's|Baixa|

## Objetivos de impacto
1. Reduzir o tempo dos avisos de alimentos.
Métrica: Tempo médio em que os avisos são encaminhados para ONGs mais próximas.
Linha base: Não há medida exata descrita, será monitorada posterior ao inicio dos envios.
Direção:Fazer com que os avisos cheguem o mais rápido possível às ONGs.  
 
2.Reduzir a quantidade de comida boa que é descartada;
Métrica: Média da quantidade em KG de comida boa que é descartada diáriamente
Linha base: Não há um número em registro atualmente, será monitorado e registrado esse número após o inicio das coletas.
Direção: Chegar a 0 o número de KG de comidas descartadas
 
3.Aumentar o número de refeições que chegam a quem precisa.
Métrica: Média da quantidade de pessoas que são alimentadas diariamente
Linha base: Não há um numero registrado, será monitorada e registrado após o inicio das coletas
Direção: Alcançar maior número de pessoas alimentadas pelo projeto Prato cheio

## Regras de negócio
1- Cancelamento ou Desistência da Coleta - Praticada
O sistema  deve devolver o item para lista de doações disponíeis quando a ONG cancelar a busca antes da data limite de coleta, para outra ONG consegui resgatar.
Verificado via fluxo de cancelar coleta

2- Alerta de expiração de coleta - Derivada
O sistema deve alertar e proibir reservas de coletas que tiveram o horário limite de coleta extrapolado, para evitar entregas de produtos estragados ou de estabelecimentos que não estão mais disponíveis para receber os entregadores.
Verificado via teste automatizado

3- Gestão de raio demográfico - Derivada
O sistema deve apresentar incialmente uma nova doação à ongs  que possui distância geográfica de até 5Km em relação ao doador, para garantir a vantagem logística informada pelo  stakeholder.  
Verificado via teste automatizado

## Conflitos de Prioridade
Doador:
“Eu quero publicar uma doação rapidamente, sem precisar preencher muitos campos ou perder tempo cadastrando cada alimento.”
 
Vigilância Sanitária:
“Eu preciso que toda doação tenha informações mínimas registradas para que seja possível identificar o alimento, sua quantidade e sua validade.”
 
O eixo do trade-off é a quantidade de informações exigidas no cadastro da doação.
 
Quanto mais campos e informações forem solicitados, maior será a rastreabilidade, porém também será maior o tempo e o esforço exigidos do doador. Por outro lado, quanto mais simples for o cadastro, menor será a burocracia, mas poderá haver perda de informações importantes para a segurança e o controle dos alimentos.
 
O doador perde:
A possibilidade de publicar uma doação sem fornecer nenhuma informação ou de realizar um cadastro completamente livre de etapas obrigatórias. Ele precisará informar, no mínimo, o tipo do alimento, a quantidade e a validade ou janela de retirada.
 
A Vigilância Sanitária perde:
Um registro mais completo e detalhado, com informações adicionais como lote, condições de armazenamento, temperatura, origem específica do produto e responsável pelo preparo. No piloto, serão mantidos somente os dados mínimos necessários.
 
O critério será escolher a solução que:
 
cumpra os requisitos mínimos de rastreabilidade;
permita que uma doação seja cadastrada rapidamente pelo celular;
reduza o risco de abandono durante o preenchimento.
 
Como indicador para o piloto, o cadastro deverá conter 100% dos campos mínimos obrigatórios e deverá poder ser concluído, em média, em até um minuto.
 
Os campos obrigatórios serão:
 
tipo do alimento;
quantidade;
validade ou janela limite para retirada.
 
Para reduzir o esforço, o sistema poderá utilizar opções previamente cadastradas, botões de seleção, preenchimento automático de data e poucos campos de texto livre.
 
A saída utilizada foi anular o eixo do conflito.
 
Em vez de escolher entre rastreabilidade e simplicidade, o projeto mantém as informações mínimas exigidas, mas reduz a dificuldade de registrá-las. Dessa forma, a rastreabilidade não precisa significar necessariamente um cadastro demorado ou burocrático.
 
A solução será um formulário curto e adaptado ao celular, com apenas três informações obrigatórias e preenchimento simplificado. Assim, o doador consegue publicar rapidamente e a plataforma mantém o registro mínimo necessário para identificar e acompanhar os alimentos doados.

## Histórias de usuário
| # | História (Como… quero… para…) | INVEST: o que falha |
|---|---|---|
| ★ H0 | Como **Doador**, quero cadastrar doação de alimento com validade, e como **ONG**, quero aceitar, para evitar o descarte de comida boa. | Falha em Pequena → Fluxo completo. | Reduzido o escopo para cadastro e aceite simples sem login nem fotos. |
|H1|Como doador , quero cadastrar uma sobra de comida informando apenas o tipo, quantidade e validade em menos de 1 minuto, para que eu possa doar rapidamente sem atrapalhar a operação do meu negócio.|Valiosa|
|H2|Como representante de uma ONG receptora, quero visualizar uma lista de doações disponíveis filtradas por proximidade e aceitar a doação com um clique, para garantir que ela seja reservada para nossa cozinha e possamos planejar o cardápio.|Independente|
|H3|Como fiscal da vigilância sanitária, quero acessar o histórico completo com rastreabilidade detalhada de cada lote de alimento doado (incluindo origem, temperatura de armazenamento e laudo de validade), para garantir o cumprimento das normas sanitárias.|Pequena|
|H4|Como coordenadora da plataforma, quero acessar um painel analítico com métricas consolidadas de toneladas de alimentos salvos e o tempo médio de coleta por bairro, para apresentar relatórios de impacto a potenciais apoiadores e patrocinadores.|Independente / Pequena|
|H5|Como voluntário entregador, quero acessar a plataforma pelo navegador do celular com suporte a modo offline/conexão instável e acionar o GPS integrado para traçar a rota entre o doador e a ONG, para realizar a coleta de forma ágil na rua.|Pequena|
|H6|Como doador, quero cancelar ou atualizar a quantidade de uma doação já publicada antes que ela seja aceita por uma ONG, para corrigir imprevistos na minha cozinha sem gerar viagem perdida para os voluntários.|Valiosa|
|H7|Como doador, quero selecionar o tipo de alimento por categorias pré-definidas (ex: perecível, industrializado, hortifrúti) e informar obrigatoriamente a validade em horas, para cumprir a exigência mínima de rastreabilidade sanitária sem perder tempo escrevendo descrições longas.|Negociável|

### História Zero (★ H0)

* **Por que ela:** Permite cadastrar e aceitar doações imediatamente, garantindo que o alimento não estrague e que uma doação aceita não seja pego por outra ONG.
* **O que ficou FORA da fatia:**
  1. Login e cadastro de usuários.
  2. Filtros de busca.
  3. Notificações por e-mail/WhatsApp.
  4. Mapas e GPS.
  5. Upload de fotos.
* **Por quê:**
  * *Exclusões 1, 3 e 4 (Risco):* Evita falhas em conexões 3G/4G fracas na rua e elimina dependência de serviços pagos/externos.
  * *Exclusões 2 e 5 (Medição):* Permite medir se o fluxo básico de texto é suficiente antes de investir tempo em telas complexas.

---
O que a IA gerou: 
#1 — Aprovação de doações

O que ela gerou: uma user story em que Marta precisa aprovar manualmente cada doação antes de ela ficar visível para as ONGs.

O que mudamos — e por quê: tiramos a aprovação prévia obrigatória. O caso já diz que alimento perecível tem janela curta de retirada, e a "história zero" do enunciado é direta — doador publica, ONG vê, ONG aceita — sem passo de aprovação no meio. Colocar Marta como gargalo manual entre a publicação e a visibilidade da doação aumenta exatamente o tempo que o projeto quer reduzir (tempo entre "comida disponível" e "comida coletada"). Trocamos por uma abordagem de confiança-com-auditoria: a doação é publicada direto, e Marta (ou a vigilância sanitária) pode sinalizar/remover doações problemáticas depois, sem travar o fluxo principal.

Regra de negócio inventada: que toda doação passa por aprovação humana antes de ficar disponível. Essa regra não está em nenhum lugar do caso — foi a IA quem decidiu que Marta precisa ser um gate de qualidade manual. Quem decide sobre isso é a própria Marta em conjunto com a vigilância sanitária, pesando velocidade (perecibilidade) contra rastreabilidade/segurança alimentar — é exatamente um dos "conflitos de prioridade" que o enunciado já apontava e que a IA resolveu sozinha, na direção errada, sem que o grupo tivesse decidido.

Restrição que sumiu: a janela curta de validade dos perecíveis. Um fluxo de aprovação manual é incompatível com "se não for aceito e coletado a tempo, perde-se" — é o erro mais caro dessa história, porque vai contra o próprio objetivo de impacto do projeto.

#2 — Notificação de doações próximas

O que ela gerou: uma story de notificação em tempo real (push) para a ONG quando surge uma doação próxima.

O que mudamos — e por quê: trocamos "notificação em tempo real" por uma lista/feed que a ONG consulta (pull, não push). Notificação push em tempo real pressupõe infraestrutura de backend, serviço de push e conexão estável — nada disso combina com "equipe pequena, orçamento próximo de zero" e "precisa funcionar no navegador do celular dos voluntários, conexão instável". Além disso, o piloto roda num bairro só: "próximas" perde quase todo o sentido quando todo mundo já está no mesmo bairro por definição.

Regra de negócio inventada: que existe um critério automático de proximidade geográfica disparando notificações — a IA assumiu geolocalização e um algoritmo de "quem está mais perto recebe primeiro" como se fosse um recurso simples, quando isso é decisão de produto/técnica não trivial. O caso menciona a vantagem logística da ONG mais próxima como regra conhecida, mas não diz que isso vira notificação automática em tempo real — isso quem decide é o grupo, junto com Marta, ponderando esforço de implementação vs. benefício no piloto.

Restrição que sumiu: a conexão instável do celular na rua e o orçamento zero. Uma solução real-time/push é cara e frágil justamente no ambiente onde ela seria usada (voluntário na rua, sinal ruim).

#3 — Dashboard de impacto

O que ela gerou: uma story de dashboard para Marta acompanhar alimentos doados, refeições geradas e doações desperdiçadas, para mostrar resultado a apoiadores.

O que mudamos — e por quê: cortamos essa história do escopo do piloto (ou reduzimos a um contador simples, sem "refeições geradas"). O prazo é de poucas semanas, com um bairro só, equipe pequena e orçamento quase zero — construir um dashboard de métricas é esforço de análise de dados que não ajuda a validar a fatia executável (a "história zero"). Também não há volume real de doações ainda, então o dashboard mostraria pouquíssimo dado no início.

Regra de negócio inventada: a conversão de "quantidade de alimento" em "refeições geradas". Não existe no caso nenhuma fórmula ou critério de quantos kg/itens equivalem a uma refeição — a IA inventou essa métrica como se fosse óbvia. Quem decide sobre esse critério (se e quando ele existir) é Marta, possivelmente com apoio de alguém de nutrição ou da própria vigilância sanitária, não é uma decisão técnica trivial do time de desenvolvimento.

Restrição que sumiu: o prazo curto e o orçamento zero — e também o dado que falta: "Marta acha que o gargalo é o tempo de coleta, mas não há medição que confirme." Construir um dashboard de impacto antes de sequer confirmar essa hipótese é investir esforço num problema que ainda não foi validado.

|---|---|---|

## Critérios de aceite
**História H0**
Dado que existe uma doação publicada, dentro da validade e ainda não aceita por nenhuma ONG, quando uma ONG aceitar essa doação, então ela deve ficar reservada para essa ONG e deixar de estar disponível para outras ONGs.
Dado que o doador possui uma doação de alimento ainda não publicada, quando informar os dados obrigatórios, incluindo a validade, e confirmar o cadastro, então a doação deve ser registrada como disponível enquanto estiver dentro do prazo de validade.

**História H1**
Dado que o doador está cadastrado e apto a publicar uma doação, quando informar o tipo do alimento, a quantidade e a validade e confirmar o cadastro, então a doação deve ser publicada sem exigir outras informações obrigatórias.
Dado que o doador possui todas as informações necessárias para a doação, quando iniciar o cadastro e preencher os dados solicitados, então deve ser possível concluir a publicação em menos de 1 minuto em condições normais de uso.

**História H7**
Dado que o doador está cadastrando uma nova doação, quando tentar publicá-la sem selecionar uma categoria de alimento, então a publicação não deve ser concluída até que uma categoria válida seja selecionada.
Dado que o doador está cadastrando uma nova doação, quando tentar publicá-la sem informar a validade em horas, então a publicação não deve ser concluída e a validade deve ser indicada como obrigatória.
Dado que o doador informou a categoria, a quantidade e a validade, quando confirmar o cadastro, então a doação deve ser publicada sem exigir o preenchimento de uma descrição textual longa.

## Riscos
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
|Doação perecível expira antes de ser aceita/coletada, pois a notificação automática de proximidade foi cortada do escopo, aumentando o desperdício — contra o objetivo de impacto #2.|Média|Alto|Até 05/10, Rubem implementa um job que marca automaticamente doações expiradas (regra de negócio 2) e registra quantas expiraram sem coleta na 1ª semana do piloto, para validar se o problema é real.|
|Duas ONGs tentam aceitar a mesma doação ao mesmo tempo (concorrência), violando a regra de reserva exclusiva do H0.|Baixa|Alto|Até 05/10, Silvio implementa transação atômica no aceite da doação e escreve um teste automatizado que simula dois aceites simultâneos para confirmar que só um vence.|


## Hipótese e experimento

Acreditamos que o maior gargalo para a perda de alimentos doados é o tempo excessivo que leva entre a publicação da doação pelo doador e a aceitação por uma ONG.

Saberemos que estávamos errados se a taxa de aceitação de doações por ONGs em até 2 horas for superior a 80% e, mesmo assim, mais de 15% dos alimentos perecíveis forem descartados por falta de coleta a tempo, até a data de 05/10. (Isso indicaria que o gargalo real não é a velocidade de comunicação/aceite, mas sim a capacidade de logística e transporte dos voluntários/ONGs).

Como medimos:

Através do registro do horário de publicação e horário do clique de "aceitar" da ONG.

Através de uma planilha manual preenchida por 2 doadores parceiros do piloto, registrando o volume em kg de comida descartada ao final de cada dia no período do teste.

Desenho do Experimento (Sem Necessidade de Software Pronto)
Descrição do Teste: Antes mesmo de subir o sistema completo com backend/push, faremos um teste manual por 1 semana em um único bairro. Criaremos um grupo direto no WhatsApp/Telegram com 2 doadores (ex: um restaurante e uma padaria local) e 3 ONGs locais.

Execução: O doador envia uma mensagem curta no grupo com tipo de comida, quantidade e validade em horas (exatos dados da H1/H7). A primeira ONG que responder "Aceito" garante a reserva.

Custo/Recursos: R$ 0,00 e 0 horas de desenvolvimento de código complexo.

O que ele valida: Valida a suposição da Marta sobre onde está o gargalo e mede a adesão dos doadores ao formulário mínimo de 3 campos antes de gastar recursos construindo dashboards ou alertas complexos.

## Decisão de análise

Problema:

Definir qual é o escopo mínimo viável (História Zero — H0) para a primeira iteração do piloto, garantindo que o fluxo principal de doação e coleta aconteça na primeira semana sem travar o projeto por complexidade técnica ou falta de infraestrutura.

Alternativas:

Alternativa A (Fluxo Completo e Automatizado): Incluir no piloto o cadastro de usuários com autenticação, filtros avançados de busca por geolocalização (raio de 5 km), notificações push em tempo real para as ONGs e mapas/GPS integrados para os entregadores voluntários.

O que se ganha: Maior automação, conveniência do usuário e experiência visual completa.

O que se perde: Exige backend robusto, consome mais prazo e orçamento (que é próximo de zero) e falha em ambientes com conexão 3G/4G instável na rua.

Alternativa B (Fatia Mínima Executável — H0 Simplificada): Limitar o piloto ao cadastro básico da doação com 3 campos obrigatórios (tipo, quantidade e validade) e aceitação simples com 1 clique em um feed consultável (pull), deixando de fora login, notificações push, mapas, upload de fotos e aprovação manual.

O que se ganha: Entrega imediata, custo zero de infraestrutura complexa e funcionamento garantido em navegadores de celulares com sinal fraco.

O que se perde: Automação de alertas em tempo real e conveniência de navegação por GPS direto na plataforma.

Decisão e justificativa:

Alternativa B. A decisão apoia-se diretamente no Objetivo de Impacto #1 (reduzir o tempo para que avisos cheguem às ONGs) e nas restrições do projeto (equipe pequena, prazo de poucas semanas e orçamento zero). Adicionar recursos como push e mapas aumentaria o risco de falhas técnicas na rua e atrasaria a entrega da primeira versão funcional (Marta exige um projeto funcional com alta prioridade). A simplificação garante que o alimento perecível seja publicado e reservado antes de estragar.

Riscos e limitações:

Risco de atraso no aceite: Sem notificações push em tempo real, as ONGs precisam consultar a lista manualmente, o que pode fazer com que doações perecíveis com janela curta expirarem antes de serem vistas.

Sobrecarga de navegação externa: Sem GPS integrado na plataforma, os voluntários precisarão copiar o endereço e colar manualmente em aplicativos externos de mapa (ex: Google Maps), aumentando o esforço operacional da coleta na rua.

## Uso de IA
O que geramos com IA, o que verificamos e o que alteramos.
