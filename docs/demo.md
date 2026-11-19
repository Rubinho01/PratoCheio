# Roteiro da demo — Prato Cheio

*Trabalho 3 · 3 minutos · outra pessoa precisa conseguir reproduzir só lendo isto*

## Antes de começar

Requisitos (os mesmos do README): **Node.js 22.13 ou superior** e **Docker**.

**O que precisa estar no ar**

- **PostgreSQL 16** em contêiner (serviço `db` do `docker-compose.yml`, porta **5433** do computador), criado por `npm run db:subir`.
- A **aplicação** em http://localhost:3000, criada por `npm start`.

**Variável de ambiente:** `DATABASE_URL` — sem ela a aplicação não conecta em nenhum banco. O valor para o PostgreSQL do contêiner já vem no `.env.example`: `postgres://pratocheio:pratocheio@localhost:5433/pratocheio`. O `npm start` lê o arquivo `.env`, criado no terceiro comando abaixo.

A partir de um clone novo:

```bash
git clone -b develop https://github.com/Rubinho01/PratoCheio.git
cd PratoCheio

npm install            # só na primeira vez
cp .env.example .env   # configuração local (define DATABASE_URL)
npm run db:subir       # sobe o PostgreSQL 16 (cria o banco de desenvolvimento e o de testes)
npm run db:migrar      # cria o schema (e as 3 categorias de alimento)
npm start              # sobe em http://localhost:3000
```

Conferência rápida (em outro terminal) — deve responder `{"ok":true}`:

```bash
curl http://localhost:3000/api/saude
```

**Começar sempre de um banco vazio.** O passo a passo supõe que não há doações (as doações da demo recebem os ids 1 e 2). Se já rodou antes, pare a aplicação (Ctrl+C) e recomece do zero:

```bash
docker compose down -v   # para o PostgreSQL e apaga os dados
npm run db:subir && npm run db:migrar && npm start
```

*Alternativa (README): banco e aplicação juntos em contêiner, sem Node na máquina — `docker compose up --build`, também em http://localhost:3000.*

*Os comandos `curl` deste roteiro são para bash (Linux, macOS ou Git Bash no Windows).*

## Roteiro (3 minutos)

| Tempo | O que mostrar | O que se prova |
|---|---|---|
| 0:00–0:20 | **O problema em uma frase:** "Restaurantes e padarias jogam comida boa fora porque não têm um canal rápido para avisar as ONGs que poderiam buscá-la antes de vencer." | por que o produto existe |
| 0:20–1:50 | **A história funcionando de verdade** (passos 1 a 6): o doador publica "Pães" → a ONG vê na lista e aceita → a doação sai da lista e vai para "Confirmar coleta" → o voluntário confirma a coleta → o relatório da Marta conta 1 aceite → o histórico do doador mostra a doação como coletada. | o produto executa ponta a ponta, com dados gravados no PostgreSQL |
| 1:50–2:30 | **Um caso de erro tratado** (passos 7 a 11): duas ONGs disputam a mesma doação ("Arroz") e a segunda recebe "esta doação já foi aceita"; publicar sem categoria é recusado; o endereço de retirada não é entregue a outra ONG. | o limite foi pensado: reserva exclusiva, campos obrigatórios e privacidade do endereço |
| 2:30–3:00 | **O que falta e por quê:** não há login (decisão da H0: publicar e aceitar em 1 clique); a doação não expira sozinha depois da validade e não há filtro por raio de 5 km (regras 2 e 3 da análise); a validade é uma data, não horas; sem notificação — a ONG consulta a lista. Detalhes em `docs/validacao.md`. | vocês sabem onde estão |

*Para caber em 3 minutos ao vivo: publique o "Arroz" (passo 7) e abra a segunda aba antes de começar a apresentar. O passo a passo abaixo reproduz tudo em ordem, sem pressa.*

## Passo a passo reproduzível

Use o navegador em http://localhost:3000 com o banco vazio (veja "Antes de começar").

**1. Abrir a aplicação (estado inicial).**
- **Ação:** abra http://localhost:3000.
- **Resultado esperado:** título "Comida boa encontra quem precisa."; o contador "Doações disponíveis" mostra **0**; a lista mostra "Nenhuma doação disponível"; no card "Confirmar coleta" aparece "Nenhuma doação aguardando coleta."; no card "Relatório da Marta", o mês de referência é o mês atual e o "Total de doações aceitas" é **0**. Ao abrir a lista **Categoria** do formulário, aparecem **Hortifrúti**, **Industrializado** e **Perecível**.

**2. O doador publica uma doação.**
- **Ação:** no card "Publicar uma doação", preencha: *Nome do doador (opcional)* = `Padaria do Zé`; *Tipo de alimento* = `Pães`; *Categoria* = `Perecível`; *Quantidade* = `20 unidades`; *Retirar até* = amanhã (escolha no calendário; o campo não aceita data passada); *Endereço de retirada* = `Rua das Flores, 123 - Centro`. Clique em **Publicar doação**.
- **Resultado esperado:** mensagem verde "Doação publicada com sucesso." e aviso "Doação publicada com sucesso!" no canto da tela; o formulário é limpo; o contador passa para **1**; a lista mostra o card **Pães** com "Quantidade: 20 unidades" e "Retirar até" a data escolhida. **O endereço não aparece** na lista.

**3. A ONG aceita a doação.**
- **Ação:** no card "Doações disponíveis", preencha *Nome da ONG* = `ONG Esperança` e clique em **Aceitar** no card "Pães".
- **Resultado esperado:** aviso "Doação aceita por ONG Esperança."; o card "Pães" **sai da lista** e o contador volta para **0**; no card "Confirmar coleta" surge "Pães" com "20 unidades · ONG: ONG Esperança · Retirar até …" e o botão **Marcar coletada**; o "Total de doações aceitas" do relatório passa para **1**.

**4. O voluntário confirma a coleta.**
- **Ação:** no card "Confirmar coleta", preencha *Nome do voluntário* = `Ana Silva` e clique em **Marcar coletada** no card "Pães".
- **Resultado esperado:** aviso "Coleta registrada com sucesso!"; o card "Pães" some e aparece "Nenhuma doação aguardando coleta.".

**5. O relatório continua contando a doação já coletada.**
- **Ação:** observe o card "Relatório da Marta" (mês atual).
- **Resultado esperado:** "Total de doações aceitas" continua **1** — a contagem usa o mês do aceite, mesmo com a doação já coletada.

**6. O histórico do doador mostra o ciclo completo.**
- **Ação:** em um terminal:
  ```bash
  curl -s -G "http://localhost:3000/api/doacoes/minhas" --data-urlencode "doador=Padaria do Zé"
  ```
- **Resultado esperado:** uma lista JSON com **1** doação (id 1): `"tipo":"Pães"`, `"categoria":"Perecível"`, `"status":"coletada"`, `"ong":"ONG Esperança"`, `"voluntario":"Ana Silva"`, e os horários `aceita_em` e `coletada_em` preenchidos (formato `AAAA-MM-DD HH:MM:SS`, em UTC).

**7. Erro tratado: publicar sem categoria.**
- **Ação:** em um terminal:
  ```bash
  curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:3000/api/doacoes \
    -H "Content-Type: application/json" \
    -d '{"tipo":"Sopa","quantidade":"10 porções","validade":"2027-12-01","enderecoRetirada":"Rua A, 1"}'
  ```
- **Resultado esperado:** `{"erro":"categoria é obrigatória"}` e `HTTP 400`; nenhuma doação é criada (o contador da tela continua **0**). *(Na tela, o campo Categoria é obrigatório e o navegador impede o envio em branco.)*

**8. Preparar a disputa: publicar "Arroz" e abrir uma segunda aba.**
- **Ação:** na aba atual, publique: *Nome do doador* = `Padaria do Zé`; *Tipo de alimento* = `Arroz`; *Categoria* = `Industrializado`; *Quantidade* = `5 sacos`; *Retirar até* = amanhã; *Endereço de retirada* = `Rua Central, 80`. Em seguida abra **uma segunda aba** em http://localhost:3000 e **não a recarregue mais**.
- **Resultado esperado:** as **duas abas** mostram "Arroz" na lista de disponíveis (contador **1**).

**9. A primeira ONG aceita o Arroz (aba 1).**
- **Ação:** na aba 1, *Nome da ONG* = `ONG Esperança` → **Aceitar** no card "Arroz".
- **Resultado esperado:** aviso "Doação aceita por ONG Esperança."; "Arroz" sai da lista e aparece em "Confirmar coleta"; o "Total de doações aceitas" passa para **2**.

**10. Erro tratado: a segunda ONG tenta aceitar a mesma doação (aba 2).**
- **Ação:** na aba 2 (ainda mostrando "Arroz"), *Nome da ONG* = `ONG Vida` → **Aceitar** no card "Arroz".
- **Resultado esperado:** aviso **vermelho** "esta doação já foi aceita"; o botão volta a "Aceitar". Ao recarregar a aba 2 (F5), "Arroz" não está mais na lista e, em "Confirmar coleta", aparece com **"ONG: ONG Esperança"** (e não "ONG Vida").

**11. Limite de privacidade: o endereço só vai para a ONG que aceitou.**
- **Ação:** em um terminal (id 2 = Arroz):
  ```bash
  curl -s -w "\nHTTP %{http_code}\n" -G "http://localhost:3000/api/doacoes/2/retirada" --data-urlencode "ong=ONG Vida"
  curl -s -w "\nHTTP %{http_code}\n" -G "http://localhost:3000/api/doacoes/2/retirada" --data-urlencode "ong=ONG Esperança"
  ```
- **Resultado esperado:** o primeiro comando devolve `{"erro":"esta doação foi aceita por outra ONG"}` e `HTTP 400`; o segundo devolve `HTTP 200` com `"ong":"ONG Esperança"` e `"endereco_retirada":"Rua Central, 80"`.

## Testado por

Outro integrante executou este roteiro sem ajuda: **[nome do integrante que NÃO escreveu o roteiro]**, em **19/11/2026**.

O que precisou ser corrigido depois que ele executou: **[listar cada passo em que ele travou e o que foi ajustado neste arquivo — ou escrever "nada precisou mudar"]**.

*Se ele travou em algum passo, o roteiro está incompleto — corrija antes de entregar.*
