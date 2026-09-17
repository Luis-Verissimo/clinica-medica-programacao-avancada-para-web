# Roteiro: Migração de Memória para PostgreSQL com Docker e Prisma ORM

Este guia passo a passo ensina como transformar uma API Express com TypeScript que armazena dados em memória (como um array de `pacientes` no `server.ts`) em uma aplicação profissional com persistência real em **PostgreSQL**, utilizando **Docker** e **Prisma ORM**, seguindo a arquitetura em camadas e as melhores práticas da indústria.

---

## 1. Visão Geral da Arquitetura em Camadas

Para manter o código desacoplado, manutenível e fácil de testar, separamos as responsabilidades em pastas dentro de `src/`:

```
clinicaMedica/
├── docker-compose.yml         # Configuração do banco PostgreSQL
├── .env                       # Variáveis de ambiente (ignorado no git)
├── .env.example               # Modelo de variáveis de ambiente
├── prisma/
│   └── schema.prisma          # Modelos de dados e configuração do Prisma
└── src/
    ├── config/
    │   └── prisma.ts          # Instância única (Singleton) do Prisma Client
    ├── schemas/
    │   └── pacienteSchema.ts  # Validações em runtime com Zod e DTOs (Types)
    ├── repositories/
    │   └── pacienteRepository.ts # Consultas e operações diretas com o Prisma
    ├── services/
    │   └── pacienteService.ts    # Regras de negócio e validações lógicas
    ├── controllers/
    │   └── pacienteController.ts # Manipulação de req, res e status HTTP
    ├── routes/
    │   └── pacienteRoutes.ts     # Mapeamento de endpoints e verbos HTTP
    └── server.ts              # Inicialização do Express e middlewares
```

> **Sobre a nomenclatura de arquivos (`camelCase`):**
> Adotamos a convenção `pacienteRoutes.ts`, `pacienteController.ts`, `pacienteService.ts`, `pacienteRepository.ts` e `pacienteSchema.ts`. Essa convenção é direta, amplamente usada em projetos Express/Node e combina perfeitamente com os nomes das variáveis e classes importadas.

### Como as camadas se comunicam?

```mermaid
flowchart LR
    Cliente([Cliente / Postman]) -->|HTTP Req| Routes[Routes<br/>pacienteRoutes.ts]
    Routes -->|req, res| Controller[Controllers<br/>pacienteController.ts]
    Controller -->|Dados validados com Zod| Service[Services<br/>pacienteService.ts]
    Service -->|DTOs tipados| Repository[Repositories<br/>pacienteRepository.ts]
    Repository -->|Prisma Client| Database[(PostgreSQL em Docker)]
```

### O que vai em cada camada?

- **`routes/` (`pacienteRoutes.ts`)**: Define apenas os endpoints e verbos HTTP (ex: `GET /pacientes`, `POST /pacientes`) e delega a execução para o controller.
- **`controllers/` (`pacienteController.ts`)**: Lida estritamente com o protocolo HTTP (`req` e `res`). Extrai parâmetros da URL e corpo da requisição, aciona o schema de validação, chama o service correspondente e formata a resposta (`res.status().json()`). **Não contém regras de negócio nem SQL/Prisma**.
- **`services/` (`pacienteService.ts`)**: Concentra a **lógica de negócio** (ex: não permitir cadastrar dois pacientes com o mesmo CPF, validar se um paciente existe antes de atualizar). Não sabe o que é Express, nem tem acesso a `req` ou `res`.
- **`repositories/` (`pacienteRepository.ts`)**: Única camada responsável por conversar com o banco de dados via Prisma. Executa `findMany`, `findUnique`, `create`, `update`, `delete`.
- **`schemas/` (`pacienteSchema.ts`)**: Validação de dados em tempo de execução com **Zod** e definição dos **DTOs (Tipos/Contratos)** usados em todas as camadas internas.
- **`config/` (`prisma.ts`)**: Inicialização centralizada do Prisma Client como Singleton.

---

## 2. A Ordem Lógica de Construção (Entendendo os Types e DTOs)

> ### 💡 Por que os Types/DTOs precisam vir antes do Repositório?
> Ao construir o `pacienteRepository.ts` e o `pacienteService.ts`, você precisará tipar parâmetros como:
> ```typescript
> async criar(dados: ???)
> async atualizar(id: number, dados: ???)
> ```
> Se você tentar criar o repositório primeiro sem definir esses tipos, o TypeScript acusará erro ou você será tentado a usar `any`.
> 
> No ecossistema TypeScript moderno, temos duas fontes principais de tipos:
> 1. **Tipos da Entidade no Banco**: gerados automaticamente pelo Prisma a partir do `schema.prisma` (ex: `Paciente` completo, que contém `id`, `nome`, `cpf`, `telefone`, `criadoEm`, `atualizadoEm`).
> 2. **DTOs (Data Transfer Objects)**: tipos dos dados que *trafegam* entre as camadas para operações específicas. Por exemplo, ao criar um paciente, o cliente **não** envia `id` nem datas; ele envia apenas `{ nome, cpf, telefone }`.
>
> Por isso, criaremos primeiro o **Prisma (que gera a entidade)** e logo em seguida o **Schema/DTOs com Zod**, permitindo que o Repositório, o Serviço e o Controlador usem tipos precisos do início ao fim!

---

## 3. Passo a Passo da Migração

### Passo 1: Configurar o PostgreSQL com Docker Compose

Em vez de instalar o PostgreSQL diretamente no sistema operacional (o que pode gerar conflitos de versão e portas), usamos o Docker.

Crie o arquivo `docker-compose.yml` na raiz do projeto:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: clinica_postgres
    restart: always
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: adminpassword
      POSTGRES_DB: clinica_medica
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### O que cada configuração significa?
- **`image: postgres:16-alpine`**: Versão leve do PostgreSQL rodando sobre Alpine Linux.
- **`environment`**: Define usuário, senha e o nome inicial do banco que o Postgres criará ao iniciar.
- **`ports: "5432:5432"`**: Expõe a porta interna do container (`5432`) para a porta da sua máquina local (`5432`), permitindo que a aplicação conecte via `localhost:5432`.
- **`volumes: postgres_data`**: Garante **persistência de dados**. Sem isso, quando o container parasse, todos os registros seriam perdidos. Com o volume nomeado, os dados ficam gravados no disco da máquina hospedeira.

Crie o arquivo `.env` na raiz do projeto para configurar a conexão da aplicação:

```env
PORT=3000
DATABASE_URL="postgresql://admin:adminpassword@localhost:5432/clinica_medica?schema=public"
```

Inicie o banco com o comando:

```bash
docker compose up -d
```
> O parâmetro `-d` (detached) roda o container em segundo plano, liberando o terminal. Para verificar se está rodando: `docker ps`.

---

### Passo 2: Instalar e Inicializar o Prisma

Instale o cliente do Prisma como dependência de produção e o compilador/CLI do Prisma como dependência de desenvolvimento:

```bash
npm install @prisma/client
npm install -D prisma
```

Inicialize a estrutura do Prisma (caso a pasta `prisma/` ainda não exista):

```bash
npx prisma init
```

Esse comando cria a pasta `prisma/` com o arquivo `schema.prisma`.

---

### Passo 3: Definir o Modelo no `prisma/schema.prisma`

Abra o arquivo `prisma/schema.prisma` e declare o modelo `Paciente`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Paciente {
  id           Int      @id @default(autoincrement())
  nome         String
  cpf          String   @unique
  telefone     String
  criadoEm     DateTime @default(now()) @map("criado_em")
  atualizadoEm DateTime @updatedAt @map("atualizado_em")

  @@map("pacientes")
}
```

#### Entendendo as diretivas do Prisma:
- `@id`: Define a chave primária da tabela.
- `@default(autoincrement())`: Cria uma sequência incremental automática (equivalente ao tipo `SERIAL` no PostgreSQL).
- `@unique`: Garante no nível de banco de dados que não haverá duplicidade de CPFs.
- `@default(now())` e `@updatedAt`: Gravam a data de criação e atualizam automaticamente a data a cada modificação.
- `@@map("pacientes")` e `@map(...)`: Permite manter as propriedades em `camelCase` no TypeScript (`criadoEm`), mas mapeadas para nomes padronizados em `snake_case` no PostgreSQL (`criado_em`).

Execute a migration para aplicar a tabela no banco:

```bash
npx prisma migrate dev --name init
```

#### O que o `prisma migrate dev` faz nos bastidores?
1. Lê seu arquivo `schema.prisma`.
2. Gera um arquivo de migração SQL dentro de `prisma/migrations/`.
3. Executa o SQL no PostgreSQL criando a tabela física `pacientes`.
4. Executa automaticamente o `prisma generate`, gerando o código e os tipos TypeScript correspondentes dentro de `node_modules/@prisma/client`.

> **Dica**: O Prisma inclui uma interface web excelente para visualizar e editar os dados do banco sem instalar softwares adicionais:
> ```bash
> npx prisma studio
> ```

---

### Passo 4: Criar o Singleton do Prisma Client (`src/config/prisma.ts`)

No Node.js, cada instância de `new PrismaClient()` cria seu próprio pool de conexões com o banco. Se você instanciar o Prisma dentro de cada repositório ou controller, esgotará rapidamente o limite de conexões do PostgreSQL. Por isso, usamos o padrão **Singleton** (uma única instância compartilhada em toda a aplicação).

Crie o arquivo `src/config/prisma.ts`:

```typescript
// src/config/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
```

---

### Passo 5: Criar Schemas de Validação e DTOs (`src/schemas/pacienteSchema.ts`)

> **Aqui criamos os tipos e validações que serão usados pelas próximas camadas!**

O TypeScript valida os tipos apenas durante o desenvolvimento (compilação). Para garantir que dados inválidos enviados pelo cliente via HTTP (como um CPF vazio ou um número como texto) sejam barrados em tempo de execução, usamos o **Zod**.

O Zod nos dá um superpoder: a partir do próprio schema de validação, ele infere os tipos TypeScript (`z.infer`), evitando que precisemos escrever interfaces duplicadas manualmente!

Crie o arquivo `src/schemas/pacienteSchema.ts`:

```typescript
// src/schemas/pacienteSchema.ts
import { z } from "zod";

// Schema para validação do corpo no cadastro de um novo paciente
export const criarPacienteSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  telefone: z.string().min(8, "Telefone inválido"),
});

// Schema para atualização: todos os campos tornam-se opcionais (.partial())
export const atualizarPacienteSchema = criarPacienteSchema.partial();

// Schema para validar o parâmetro de rota :id (converte string da URL para number)
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("O ID deve ser um número inteiro positivo"),
});

// Tipos (DTOs) inferidos automaticamente a partir dos schemas Zod:
export type CriarPacienteDTO = z.infer<typeof criarPacienteSchema>;
export type AtualizarPacienteDTO = z.infer<typeof atualizarPacienteSchema>;
```

---

### Passo 6: Camada de Repositório (`src/repositories/pacienteRepository.ts`)

Agora que temos `CriarPacienteDTO` e `AtualizarPacienteDTO`, podemos construir o repositório totalmente tipado, sem nenhuma ambiguidade.

O repositório é responsável **exclusivamente por consultas e comandos no banco de dados**. Ele não sabe sobre `req`, `res`, e não aplica regras de negócio complexas.

Crie o arquivo `src/repositories/pacienteRepository.ts`:

```typescript
// src/repositories/pacienteRepository.ts
import { prisma } from "../config/prisma.js";
import type { CriarPacienteDTO, AtualizarPacienteDTO } from "../schemas/pacienteSchema.js";

export class PacienteRepository {
  async listarTodos() {
    return await prisma.paciente.findMany({
      orderBy: { id: "asc" },
    });
  }

  async buscarPorId(id: number) {
    return await prisma.paciente.findUnique({
      where: { id },
    });
  }

  async buscarPorCpf(cpf: string) {
    return await prisma.paciente.findUnique({
      where: { cpf },
    });
  }

  async criar(dados: CriarPacienteDTO) {
    return await prisma.paciente.create({
      data: dados,
    });
  }

  async atualizar(id: number, dados: AtualizarPacienteDTO) {
    return await prisma.paciente.update({
      where: { id },
      data: dados,
    });
  }

  async remover(id: number) {
    return await prisma.paciente.delete({
      where: { id },
    });
  }
}
```

---

### Passo 7: Camada de Serviço (`src/services/pacienteService.ts`)

A camada de serviço contém as **regras de negócio** da aplicação:
- Um paciente não pode ser cadastrado se o CPF já existir.
- Não podemos atualizar ou deletar um paciente inexistente.
- Se o CPF for alterado na atualização, não pode colidir com o CPF de outro paciente.

Quando uma regra é violada, o serviço lança um erro (`throw new Error(...)`), deixando para o controlador decidir como formatar isso em resposta HTTP.

Crie o arquivo `src/services/pacienteService.ts`:

```typescript
// src/services/pacienteService.ts
import { PacienteRepository } from "../repositories/pacienteRepository.js";
import type { CriarPacienteDTO, AtualizarPacienteDTO } from "../schemas/pacienteSchema.js";

export class PacienteService {
  private repository = new PacienteRepository();

  async listar() {
    return await this.repository.listarTodos();
  }

  async buscarPorId(id: number) {
    const paciente = await this.repository.buscarPorId(id);
    if (!paciente) {
      throw new Error("Paciente não encontrado");
    }
    return paciente;
  }

  async cadastrar(dados: CriarPacienteDTO) {
    const pacienteComMesmoCpf = await this.repository.buscarPorCpf(dados.cpf);
    if (pacienteComMesmoCpf) {
      throw new Error("Já existe um paciente cadastrado com este CPF");
    }
    return await this.repository.criar(dados);
  }

  async atualizar(id: number, dados: AtualizarPacienteDTO) {
    // Garante que o paciente existe antes de atualizar
    await this.buscarPorId(id);

    // Se informou um novo CPF, verifica se pertence a outro paciente
    if (dados.cpf) {
      const pacienteComMesmoCpf = await this.repository.buscarPorCpf(dados.cpf);
      if (pacienteComMesmoCpf && pacienteComMesmoCpf.id !== id) {
        throw new Error("Já existe outro paciente cadastrado com este CPF");
      }
    }

    return await this.repository.atualizar(id, dados);
  }

  async excluir(id: number) {
    // Garante que o paciente existe antes de deletar
    await this.buscarPorId(id);
    await this.repository.remover(id);
  }
}
```

---

### Passo 8: Camada de Controle (`src/controllers/pacienteController.ts`)

O controlador é a ponte entre o protocolo HTTP (Express) e o serviço:
1. Recebe a requisição (`req`).
2. Valida os dados de entrada usando os schemas Zod (`.parse()`).
3. Envia os dados validados para o `PacienteService`.
4. Responde ao cliente com o status code semântico apropriado (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).

Crie o arquivo `src/controllers/pacienteController.ts`:

```typescript
// src/controllers/pacienteController.ts
import type { Request, Response } from "express";
import { PacienteService } from "../services/pacienteService.js";
import {
  criarPacienteSchema,
  atualizarPacienteSchema,
  idParamSchema,
} from "../schemas/pacienteSchema.js";

const service = new PacienteService();

export class PacienteController {
  // GET /pacientes
  async index(req: Request, res: Response) {
    try {
      const pacientes = await service.listar();
      return res.json(pacientes);
    } catch (error: any) {
      return res.status(500).json({ mensagem: error.message });
    }
  }

  // GET /pacientes/:id
  async show(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const paciente = await service.buscarPorId(id);
      return res.json(paciente);
    } catch (error: any) {
      return res.status(404).json({ mensagem: error.message });
    }
  }

  // POST /pacientes
  async store(req: Request, res: Response) {
    try {
      const dadosValidados = criarPacienteSchema.parse(req.body);
      const novoPaciente = await service.cadastrar(dadosValidados);
      return res.status(201).json(novoPaciente);
    } catch (error: any) {
      return res.status(400).json({ mensagem: error.message });
    }
  }

  // PUT /pacientes/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const dadosValidados = atualizarPacienteSchema.parse(req.body);
      const pacienteAtualizado = await service.atualizar(id, dadosValidados);
      return res.json(pacienteAtualizado);
    } catch (error: any) {
      return res.status(400).json({ mensagem: error.message });
    }
  }

  // DELETE /pacientes/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      await service.excluir(id);
      return res.status(200).json("Paciente removido com sucesso");
    } catch (error: any) {
      return res.status(404).json({ mensagem: error.message });
    }
  }
}
```

---

### Passo 9: Rotas (`src/routes/pacienteRoutes.ts`)

As rotas conectam os métodos HTTP e URLs aos métodos do controlador.

Crie o arquivo `src/routes/pacienteRoutes.ts`:

```typescript
// src/routes/pacienteRoutes.ts
import { Router } from "express";
import { PacienteController } from "../controllers/pacienteController.js";

const router = Router();
const controller = new PacienteController();

router.get("/pacientes", (req, res) => controller.index(req, res));
router.get("/pacientes/:id", (req, res) => controller.show(req, res));
router.post("/pacientes", (req, res) => controller.store(req, res));
router.put("/pacientes/:id", (req, res) => controller.update(req, res));
router.delete("/pacientes/:id", (req, res) => controller.delete(req, res));

export default router;
```

> **Por que usar `(req, res) => controller.index(req, res)` em vez de `controller.index` direto?**
> Passar a arrow function preserva o contexto do `this` dentro da classe do controlador, evitando que o método perca a referência de suas propriedades internas em tempo de execução.

---

### Passo 10: Servidor Principal Limpo (`src/server.ts`)

Com a arquitetura em camadas implementada, seu `src/server.ts` — que antes misturava rotas, array em memória, lógica e validação — agora tem uma única função: inicializar middlewares globais e escutar a porta.

Substitua o conteúdo de `src/server.ts`:

```typescript
// src/server.ts
import express from "express";
import dotenv from "dotenv";
import pacienteRoutes from "./routes/pacienteRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// Registro de rotas da aplicação
app.use(pacienteRoutes);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
```

---

## 4. Resumo dos Comandos Mais Usados

| Ação | Comando |
| :--- | :--- |
| Subir o PostgreSQL | `docker compose up -d` |
| Ver status do container | `docker ps` |
| Parar o PostgreSQL | `docker compose down` |
| Rodar migrations do Prisma | `npx prisma migrate dev` |
| Abrir o Prisma Studio (Interface Gráfica) | `npx prisma studio` |
| Rodar a API em desenvolvimento | `npm run dev` |

---

## 5. Por que essa estrutura é considerada moderna?

1. **Separação de Preocupações (Single Responsibility Principle)**: Se a regra de validação do CPF mudar, alteramos apenas o `pacienteSchema.ts`. Se as regras de negócio mudarem, mexemos apenas no `pacienteService.ts`. Se trocarmos de banco ou de ORM, apenas o `pacienteRepository.ts` e o Prisma são modificados, sem encostar nos controllers ou nas rotas.
2. **Type-Safety de ponta a ponta**: O Prisma gera tipagens automáticas a partir do banco, o Zod valida as entradas HTTP e infere os DTOs, garantindo que nenhum dado inconsistente chegue ao banco ou cause erros em tempo de execução.
3. **Facilidade para Testes Unitários**: Como o `PacienteService` depende de métodos claros do repositório, é muito simples escrever testes automatizados criando dublês (mocks) do `PacienteRepository` sem precisar conectar a um banco de dados real.

