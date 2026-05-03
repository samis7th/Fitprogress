# FitProgress AI

FitProgress AI é uma plataforma full stack para acompanhamento de treinos, evolução corporal, metas de carga e nutrição. O projeto foi construído como um dashboard moderno de academia, com autenticação via Supabase, backend em FastAPI e frontend em React.

## Visão Geral

O sistema permite que o usuário:

- Faça login e cadastro usando Supabase Auth.
- Cadastre e acompanhe treinos planejados por dia da semana.
- Execute treinos planejados registrando séries, cargas e repetições reais.
- Mantenha treinos avulsos e histórico por sessão.
- Visualize recordes pessoais por exercício.
- Crie metas de carga e repetições.
- Marque metas como concluídas manualmente.
- Veja metas atingidas automaticamente com base nos PRs.
- Registre evolução de peso com gráfico.
- Registre refeições por dia, tipo de refeição, calorias, proteína e descrição.
- Escolha exercícios por grupo muscular, busque por nome, crie exercícios próprios e favorite exercícios.
- Use o dashboard em tema claro/escuro e com personalização visual.

## Stack

### Backend

- Python
- FastAPI
- Supabase Python Client
- PostgreSQL via Supabase
- Supabase Auth com JWT
- Pydantic
- Uvicorn
- Docker

### Frontend

- React
- Vite
- TailwindCSS
- Axios
- React Router
- Recharts
- Docker/Nginx para produção

### Banco e Segurança

- Supabase PostgreSQL
- Row Level Security (RLS)
- Políticas por usuário autenticado
- JWT Supabase no header `Authorization`
- Separação por `usuario_id = auth.uid()`

## Estrutura do Projeto

```text
project01/
  backend/
    main.py
    db.py
    auth.py
    routes/
      dashboard.py
      dieta.py
      exercicios.py
      metas.py
      peso.py
      semana.py
      treinos.py
    schemas/
      dieta_schema.py
      exercicio_schema.py
      meta_schema.py
      peso_schema.py
      semana_schema.py
      treino_schema.py
    services/
      dashboard_service.py
      pr_service.py

  frontend/
    src/
      components/
      context/
      layout/
      pages/
      services/
      utils/
    Dockerfile
    Dockerfile.prod
    nginx.conf
    package.json

  supabase/
    schema.sql

  Dockerfile
  docker-compose.yml
  docker-compose.prod.yml
  requirements.txt
  README.md
  README_AWS.md
```

## Funcionalidades

### Autenticação

- Login via Supabase Auth.
- Cadastro via Supabase Auth.
- Persistência de sessão com `access_token` e `refresh_token`.
- Renovação de sessão no frontend quando possível.
- Backend valida o JWT antes de acessar qualquer rota protegida.

### Dashboard

- Resumo de treinos concluídos.
- Total de sessões.
- Peso atual.
- Metas ativas.
- Treino planejado para o dia.
- Recorde principal.
- Gráfico de peso.
- PRs recentes.

### Semana

- Cadastro de treino por dia da semana.
- Cada treino pode conter múltiplos exercícios.
- Cada exercício planejado possui:
  - Nome
  - Grupo muscular
  - Categoria
  - Séries
  - Repetições
  - Carga alvo

### Treinos

- Seleção de treino planejado.
- Registro de execução real do treino.
- Histórico por sessão.
- Remoção de registros individuais.
- Cálculo de PRs com base nos treinos registrados.

### Exercícios

- Catálogo inicial de exercícios.
- Filtro por grupo muscular.
- Busca por nome.
- Criação de exercícios personalizados.
- Favoritos por usuário.

### Metas

- Cadastro de meta por exercício.
- Meta de carga.
- Meta opcional de repetições.
- Barra de progresso.
- Conclusão manual.
- Detecção automática de meta atingida com base nos PRs.

### Peso

- Registro de peso por data.
- Histórico de peso.
- Gráfico de evolução corporal.

### Dieta

- Registro por data.
- Tipo de refeição:
  - Café
  - Almoço
  - Janta
  - Pré treino
  - Pós treino
  - Lanche
  - Refeição livre
- Calorias.
- Proteína.
- Descrição dos alimentos da refeição.

## Variáveis de Ambiente

Nunca envie arquivos `.env` para o GitHub. Eles estão protegidos no `.gitignore`.

### Backend

Crie um arquivo `.env` na raiz do projeto:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-public
CORS_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
```

Use a chave `anon public` do Supabase. Não use a chave `service_role` no backend deste projeto.

### Frontend

Crie um arquivo `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public
```

## Supabase

O schema completo está em:

```text
supabase/schema.sql
```

Execute esse arquivo no SQL Editor do Supabase.

Ele cria ou atualiza:

- `treinos`
- `peso`
- `metas`
- `dieta`
- `treino_semana`
- `exercicios`
- `favoritos_exercicios`
- índices
- grants
- políticas RLS
- catálogo inicial de exercícios

## Tabelas Principais

### `treinos`

Armazena treinos executados, tanto avulsos quanto exercícios de uma sessão planejada.

Campos principais:

- `id`
- `usuario_id`
- `sessao_id`
- `nome_treino`
- `exercicio`
- `grupo`
- `categoria`
- `series`
- `carga`
- `repeticoes`
- `data`
- `created_at`

### `treino_semana`

Armazena o planejamento semanal do usuário.

Campos principais:

- `id`
- `usuario_id`
- `dia_semana`
- `nome_treino`
- `exercicios`
- `created_at`

### `metas`

Armazena metas de carga e repetições.

Campos principais:

- `id`
- `usuario_id`
- `exercicio`
- `meta_carga`
- `meta_repeticoes`
- `concluida`
- `concluida_em`
- `created_at`

### `exercicios`

Armazena exercícios padrão e exercícios criados pelo usuário.

Campos principais:

- `id`
- `nome`
- `grupo`
- `categoria`
- `criado_por`
- `created_at`

Regra:

- Exercícios padrão possuem `criado_por = null`.
- Exercícios personalizados possuem `criado_por = auth.uid()`.

## Segurança

O projeto foi preparado para usar autenticação real com Supabase JWT.

Pontos importantes:

- O backend não aceita `usuario_id` via query string ou body.
- O `usuario_id` é obtido pelo token autenticado.
- Todas as rotas protegidas usam `Depends(get_current_user)`.
- As consultas usam cliente Supabase autenticado com o JWT do usuário.
- O filtro final de segurança fica no Supabase RLS.
- As políticas RLS garantem que cada usuário só acesse os próprios dados.
- Favoritos e exercícios personalizados também são isolados por usuário.

## Rodando com Docker

Pré-requisitos:

- Docker Desktop
- Docker Compose
- Projeto Supabase configurado

Suba o projeto:

```powershell
docker compose up --build
```

Acesse:

```text
Frontend: http://localhost:3001
API:      http://localhost:8000
Swagger:  http://localhost:8000/docs
```

Para parar:

```powershell
docker compose down
```

Para limpar containers órfãos:

```powershell
docker compose down --remove-orphans
```

## Rodando sem Docker

### Backend

Crie e ative um ambiente virtual:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Instale as dependências:

```powershell
pip install -r requirements.txt
```

Rode a API:

```powershell
uvicorn backend.main:app --reload
```

### Frontend

Entre na pasta do frontend:

```powershell
cd frontend
```

Instale as dependências:

```powershell
npm install
```

Rode o frontend:

```powershell
npm run dev
```

## Rotas da API

### Health

```http
GET /
```

### Dashboard

```http
GET /dashboard/resumo
```

### Treinos

```http
GET /treinos
POST /treinos
GET /treinos/sessoes
POST /treinos/sessao
GET /treinos/pr
PATCH /treinos/{treino_id}
DELETE /treinos/{treino_id}
```

### Semana

```http
GET /semana
POST /semana
PATCH /semana/{treino_semana_id}
DELETE /semana/{treino_semana_id}
```

### Peso

```http
GET /peso
POST /peso
PATCH /peso/{peso_id}
DELETE /peso/{peso_id}
```

### Metas

```http
GET /metas
POST /metas
PATCH /metas/{meta_id}
DELETE /metas/{meta_id}
```

### Dieta

```http
GET /dieta
POST /dieta
PATCH /dieta/{dieta_id}
DELETE /dieta/{dieta_id}
```

### Exercícios

```http
GET /exercicios
POST /exercicios
GET /exercicios/favoritos
POST /exercicios/favoritos
DELETE /exercicios/favoritos/{favorito_id}
```

## Autorização nas Requisições

As rotas protegidas esperam o token JWT no header:

```http
Authorization: Bearer SEU_ACCESS_TOKEN
```

No frontend, o Axios envia esse header automaticamente quando o usuário está autenticado.

## Deploy com Docker Compose

Existe um arquivo de produção:

```text
docker-compose.prod.yml
```

Ele sobe:

- Backend FastAPI em container interno.
- Frontend React buildado e servido por Nginx.
- Proxy `/api` do Nginx para o backend.

Comando:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Em produção, o frontend usa:

```text
VITE_API_URL=/api
```

Assim o navegador acessa a API pelo mesmo domínio do frontend.

## Deploy na AWS EC2

Fluxo recomendado:

1. Subir o projeto para o GitHub.
2. Criar uma EC2 Ubuntu.
3. Instalar Docker e Docker Compose Plugin.
4. Clonar o repositório na EC2.
5. Criar o arquivo `.env` na raiz da EC2.
6. Rodar o compose de produção.

Exemplo:

```bash
git clone URL_DO_REPOSITORIO fitprogress-ai
cd fitprogress-ai
nano .env
docker compose -f docker-compose.prod.yml up -d --build
```

Arquivo `.env` de produção:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-public
CORS_ORIGINS=http://IP_PUBLICO_DA_EC2
```

Libere no Security Group:

- Porta `22` para SSH.
- Porta `80` para HTTP.
- Porta `443` se configurar HTTPS.

## GitHub

Antes de fazer commit, confirme que estes arquivos não serão enviados:

```text
.env
frontend/.env
node_modules/
frontend/node_modules/
frontend/dist/
venv/
.venv/
__pycache__/
*.pyc
```

Arquivos de exemplo podem ir para o GitHub:

```text
.env.production.example
frontend/.env.example
```

## Comandos Úteis

### Docker local

```powershell
docker compose up --build
docker compose down
docker compose restart backend
docker compose restart frontend
```

### Docker produção

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down
```

### Backend

```powershell
uvicorn backend.main:app --reload
```

### Frontend

```powershell
cd frontend
npm run dev
npm run build
```

## Status do Projeto

O projeto está pronto para produção inicial, com:

- Autenticação integrada.
- RLS no Supabase.
- Backend modular.
- Frontend responsivo.
- Docker local.
- Docker de produção.
- Estrutura preparada para deploy em AWS.

## Licença

Projeto desenvolvido para portfólio e estudos.
