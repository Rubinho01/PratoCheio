## 2. Modelo de Dados

### 2.1 Principais entidades

A principal entidade implementada no sistema é a **Doação**, representada pela tabela `doacoes`.

Atualmente, a **ONG** não possui uma tabela própria no banco de dados. Ela é representada apenas pelo atributo `ong` presente na tabela `doacoes`.

---

### 2.2 Relacionamentos entre as entidades

No modelo atual, não existem relacionamentos formais entre diferentes tabelas, pois apenas a tabela `doacoes` está implementada.

A associação entre uma doação e uma ONG é realizada diretamente pelo campo `ong`.

```text
Doação
  |
  └── ong
```

Portanto, não existe atualmente uma chave estrangeira ou uma tabela específica para representar as ONGs.

---

### 2.3 Atributos importantes

A entidade `Doação` possui os seguintes atributos:

| Atributo     | Tipo    | Descrição                                    |
| ------------ | ------- | -------------------------------------------- |
| `id`         | INTEGER | Identificador único da doação.               |
| `tipo`       | TEXT    | Tipo de alimento ou produto disponibilizado. |
| `quantidade` | TEXT    | Quantidade disponível para doação.           |
| `validade`   | TEXT    | Validade do alimento ou produto.             |
| `status`     | TEXT    | Estado atual da doação.                      |
| `ong`        | TEXT    | ONG associada à doação.                      |
| `criada_em`  | TEXT    | Data e hora de criação da doação.            |

---

### 2.4 Atributos que influenciam regras de negócio

Os principais atributos relacionados às regras de negócio são:

* **`status`**: representa a situação atual da doação. Toda nova doação é criada com o valor padrão `disponivel`.

* **`ong`**: identifica a ONG vinculada à doação. O campo pode permanecer vazio enquanto nenhuma organização tiver realizado o aceite.

* **`validade`**: pode influenciar a prioridade e a urgência da retirada da doação.

* **`quantidade`**: informa a quantidade disponível, podendo influenciar a capacidade de recebimento e retirada.

* **`tipo`**: identifica o conteúdo da doação e permite que as organizações saibam qual alimento ou produto está sendo disponibilizado.

---

### 2.5 Transição do aceite e seus estados

Ao ser cadastrada, uma nova doação possui inicialmente:

```text
status = "disponivel"
ong = NULL
```

Esse estado representa uma doação disponível e que ainda não foi vinculada a nenhuma ONG.

Quando ocorre o aceite, o registro pode ser atualizado com a ONG responsável e com a alteração do status da doação.

A transição pode ser representada da seguinte forma:

```text
Doação criada
     |
     v
Disponível
status = "disponivel"
ong = NULL
     |
     v
Aceite da doação
     |
     v
Doação vinculada a uma ONG
ong = organização responsável
status = novo estado definido pela aplicação
```

O arquivo `db.js` define explicitamente apenas o estado inicial:

```text
disponivel
```

Os demais estados utilizados após o aceite não estão definidos diretamente no modelo de banco de dados e dependem da lógica implementada nas demais partes da aplicação.
