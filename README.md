# Clínica médica

API Express, TypeScript e Prisma com PostgreSQL.

## Executar

Copie `.env.example` para `.env` e ajuste `DATABASE_URL`.

```sh
npm ci
docker compose up -d
npm run db:push
npm run build
npm start
```

O projeto usa `db:push` para sincronizar o schema, incluindo a tabela de consultas.
Execute-o no seu banco antes de usar as novas rotas. Para desenvolvimento: `npm run dev`.

## CRUD de consultas

| Método | Rota | Operação |
| --- | --- | --- |
| GET | /consultas | Listar |
| GET | /consultas/:id | Buscar |
| POST | /consultas | Cadastrar |
| PUT | /consultas/:id | Atualizar todos os campos |
| DELETE | /consultas/:id | Excluir |

Corpo de POST e PUT:

```json
{
  "data": "2026-10-09",
  "turno": "manha",
  "medico": 1,
  "paciente": 1
}
```

`id` é gerado automaticamente. `medico` e `paciente` são IDs de registros
já cadastrados. Turnos: `manha`, `tarde`, `noite`. Data: `AAAA-MM-DD`,
armazenada como data sem horário. As respostas incluem `medicoId`,
`pacienteId` e os objetos `medico` e `paciente`.

Cadastro retorna 201, exclusão retorna 204, dados inválidos retornam 400,
consulta inexistente retorna 404 e referência inexistente ou exclusão de
médico/paciente com consultas retorna 409.
