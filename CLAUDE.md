# CLAUDE.md — Backend (Diário de Classe)

Regras para manter o padrão do backend. Node.js + Express 5 + Prisma, **ESM, JavaScript puro**.

> Não rodar `git` sem o usuário pedir.

## Stack

- **Express 5.1**, Node ESM (`import`/`export`, arquivos `.js`).
- **Prisma 6.18** — schema em `src/db/prisma/schema.prisma`, client gerado em `src/db/generated/client` (**nunca editar o gerado**).
- **i18next** (pt/en) — mensagens ao usuário via `req.t('chave')`.
- **Jest 30** (ESM: `NODE_OPTIONS='--experimental-vm-modules'`), ESLint 9 + Prettier, Husky.
- Segurança: `helmet`, `cors`, validação de input.
- JWT **manual** (HMAC-SHA256) em `src/middlewares/auth/isLoggedIn.js` — não trocar por lib sem pedir.

## Arquitetura em 3 camadas

```
Request → Router → [middlewares de validação/auth] → Controller → Service → Repository → Prisma
```

Cada operação = 1 arquivo por camada (ex.: criar aluno → `createAlunoController.js`, `createAlunoService.js`).

### Fluxo obrigatório para uma nova operação

1. **Repository** (`src/repositories/<entidade>Repository.js`) — 1 por entidade, estende `AbstractRepository`. Implementa `getEntity()` (retorna `prisma.<entidade>`) e `getSelectFields()` (whitelist de campos retornados). Reusar o existente quando já houver.
2. **Service** (`src/services/<entidade>/<operacao><Entidade>Service.js`) — estende `AbstractService`. Lógica de negócio. Contrato:
   ```js
   export class CreateAlunoService extends AbstractService {
     constructor(Repository, data) { super(Repository); this.data = data; }
     async execute() { return await this.repository.create({ ... }, { select: this.repository.selectFields }); }
     static async handle(data) { return await new CreateAlunoService(AlunoRepository, data).execute(); }
   }
   ```
3. **Controller** (`src/controllers/<entidade>/<operacao><Entidade>Controller.js`) — estende `AbstractController` (ou `Abstract<Entidade>Controller` quando há autorização contextual). Contrato:
   ```js
   export class CreateAlunoController extends AbstractController {
     constructor(req, res) {
       super(req, res);
     }
     async execute() {
       try {
         const novo = await CreateAlunoService.handle(this.req.body);
         return this.res.status(201).json(novo);
       } catch (error) {
         return this.handleError(error, 'alunos.create.error');
       }
     }
     static async handle(req, res) {
       await new CreateAlunoController(req, res).execute();
     }
   }
   ```
4. **Middleware de validação** (`src/middlewares/<entidade>/validate<Operacao>.js`) — estende `BaseValidateEntity`. `getDataForFilter()` = whitelist de campos; `getDataValidations()` = regras via builder `ValidateData`. Exporta função `(req, res, next) => new Validator(req, res, next).handle()`.
5. **Rota** — registrar em `src/routes/<entidade>Router.js`, encadeando middlewares antes do `Controller.handle`:
   ```js
   router.post('/', validateCreateAluno, CreateAlunoController.handle);
   router.get('/:id', validateId, GetAlunoController.handle);
   ```
   Agregar o router em `src/routes.js`.

## Convenções de nomenclatura

| Item                 | Arquivo                                | Classe/export                              |
| -------------------- | -------------------------------------- | ------------------------------------------ |
| Controller           | `createAlunoController.js` (camelCase) | `CreateAlunoController` (PascalCase)       |
| Service              | `createAlunoService.js`                | `CreateAlunoService`                       |
| Repository           | `alunoRepository.js`                   | `AlunoRepository` (default export)         |
| Middleware validação | `validateCreateAluno.js`               | função `validateCreateAluno`               |
| Router               | `alunoRouter.js`                       | default export                             |
| Classe base          | `abstract*.js` / `base*.js`            | `AbstractController`, `BaseValidateEntity` |

- Controllers/Services usam **named export**; Repositories/Routers usam **default export** (seguir o vizinho).
- Prisma: model `PascalCase` singular + `@@map("tabela_plural")`; enums `UPPER_SNAKE`/valores como já usados.

## Erros

- Controller sempre envolve `execute()` em `try/catch` e chama `this.handleError(error, 'chave.i18n')`.
- Validação → 400 (middleware). Não autorizado → lançar `UnauthorizedError` (401). Conflito de negócio → `res.status(409)` com `req.t(...)`.
- Handler global: `src/middlewares/error-handler.js`. Stack trace só em `development`.
- **Fail secure**: no `catch` sempre negar/retornar erro — nunca liberar acesso.

## Validação de input

Builder fluente `ValidateData` (`src/utilities/validateData.js`):

```js
nome: ValidateData.require().isString().minCharacters(3).maxCharacters(200).validate(nome, 'nome'),
email: ValidateData.require().isEmail().maxCharacters(200).validate(email, 'email'),
telefone: ValidateData.optional().isString().minCharacters(10).maxCharacters(11).validate(telefone, 'telefone'),
```

Sempre declarar a whitelist em `getDataForFilter()` — nunca confiar em campos não listados.

## Auth / Autorização

- `isLoggedIn` popula `req.user` (com `req.user.isAdmin`). `adminOnly` restringe a admin.
- Autorização por recurso em controllers abstratos: usuário não-admin recebe `this.where` filtrando só os próprios registros (ex.: `AbstractAlunoController`). Seguir esse padrão ao expor dados por entidade.

## Dados / Prisma

- Acesso **só** via Repository/Prisma (queries parametrizadas — nunca SQL cru com input).
- Sempre passar `select: this.repository.selectFields` para limitar campos retornados.
- Migrations: `npm run db:migrate` (dev). Não usar `db:push` para mudanças que precisam de histórico.

## Testes

- `__tests__/units/**` e `__tests__/integrations/**`, arquivos `*.test.js`.
- `describe`/`test`, `beforeEach` para fixtures, `jest.fn()`/`jest.spyOn()`, mocks em `__mocks__/`.
- Sem DB real em unitários. Ao criar Service/Controller/Repository novo, adicionar teste no mesmo estilo.

## Config / env

- `src/utilities/constants.js` centraliza env (classe `Constants`). Ler env por lá, não `process.env` espalhado.
- Segredos (`JWT_SECRET_TOKEN`, `DATABASE_URL`) só via env; manter `.env.example` com placeholders.
