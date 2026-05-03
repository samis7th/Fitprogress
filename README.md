<div align="center">

<br>

# 🏋️ FitProgress 

**Plataforma full stack para acompanhamento de treinos, evolução corporal, metas de carga e nutrição.**

<br>

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

<br>

![status](https://img.shields.io/badge/status-production%20ready-4CAF50?style=flat-square)
![license](https://img.shields.io/badge/license-portfolio-gray?style=flat-square)
![rls](https://img.shields.io/badge/security-RLS%20enabled-orange?style=flat-square)

<br>

</div>

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Stack](#-stack)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Banco de Dados](#-banco-de-dados)
- [Segurança](#-segurança)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Rodando com Docker](#-rodando-com-docker)
- [Rodando sem Docker](#-rodando-sem-docker)
- [Rotas da API](#-rotas-da-api)
- [Deploy na AWS](#-deploy-na-aws-ec2)
- [Comandos Úteis](#-comandos-úteis)

---

## 🎯 Visão Geral

FitProgress é um dashboard moderno de academia com autenticação via Supabase, backend em FastAPI e frontend em React. O sistema permite que o usuário:

- Faça **login e cadastro** via Supabase Auth com renovação automática de sessão
- Cadastre e acompanhe **treinos planejados** por dia da semana
- **Execute treinos** registrando séries, cargas e repetições reais
- Visualize **recordes pessoais (PRs)** por exercício calculados automaticamente
- Crie **metas de carga e repetições** com detecção automática de conclusão
- Registre **evolução de peso** com gráfico histórico
- Registre **refeições** com calorias, proteína e tipo de refeição
- Use **tema claro/escuro** com personalização visual

---

## ✨ Funcionalidades

<details>
<summary><strong>🗓️ Planejamento Semanal</strong></summary>

- Cadastro de treino por dia da semana
- Cada treino pode conter múltiplos exercícios com nome, grupo muscular, categoria, séries, repetições e carga alvo

</details>

<details>
<summary><strong>🏃 Execução de Treinos</strong></summary>

- Seleção de treino planejado
- Registro de execução real com séries, cargas e repetições
- Histórico completo por sessão
- Remoção de registros individuais
- Suporte a treinos avulsos

</details>

<details>
<summary><strong>🏆 Recordes Pessoais (PRs)</strong></summary>

- Cálculo automático de PRs com base nos treinos registrados
- PRs recentes visíveis no dashboard principal

</details>

<details>
<summary><strong>🎯 Metas</strong></summary>

- Cadastro de meta por exercício (carga e repetições opcionais)
- Barra de progresso visual
- Conclusão manual ou **detecção automática** com base nos PRs

</details>

<details>
<summary><strong>⚖️ Evolução de Peso</strong></summary>

- Registro de peso por data
- Histórico e gráfico de evolução corporal via Recharts

</details>

<details>
<summary><strong>🥗 Dieta & Nutrição</strong></summary>

Registro por data com:

| Campo | Opções |
|---|---|
| Tipo de refeição | Café · Almoço · Janta · Pré treino · Pós treino · Lanche · Livre |
| Nutrição | Calorias · Proteína (g) |
| Descrição | Texto livre dos alimentos |

</details>

<details>
<summary><strong>💪 Catálogo de Exercícios</strong></summary>

- Catálogo inicial pré-carregado
- Filtro por grupo muscular
- Busca por nome
- Criação de exercícios personalizados
- Favoritos por usuário

</details>

---

## 🛠️ Stack

| Camada | Tecnologias |
|---|---|
| **Backend** | Python · FastAPI · Pydantic · Uvicorn · Supabase Python Client |
| **Frontend** | React · Vite · TailwindCSS · Axios · React Router · Recharts |
| **Banco & Auth** | Supabase PostgreSQL · Supabase Auth · JWT · Row Level Security |
| **Infra** | Docker · Docker Compose · Nginx (produção) · AWS EC2 |

---

## 📁 Estrutura do Projeto

```
project01/
├── backend/
│   ├── main.py
│   ├── db.py
│   ├── auth.py
│   ├── routes/
│   │   ├── dashboard.py
│   │   ├── dieta.py
│   │   ├── exercicios.py
│   │   ├── metas.py
│   │   ├── peso.py
│   │   ├── semana.py
│   │   └── treinos.py
│   ├── schemas/
│   │   ├── dieta_schema.py
│   │   ├── exercicio_schema.py
│   │   ├── meta_schema.py
│   │   ├── peso_schema.py
│   │   ├── semana_schema.py
│   │   └── treino_schema.py
│   └── services/
│       ├── dashboard_service.py
│       └── pr_service.py
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layout/
│       ├── pages/
│       ├── services/
│       └── utils/
│
├── supabase/
│   └── schema.sql          ← execute no SQL Editor do Supabase
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── requirements.txt
└── README.md
```

---

## 🗄️ Banco de Dados

### `treinos`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador único |
| `usuario_id` | uuid | Vinculado ao `auth.uid()` |
| `sessao_id` | uuid | Agrupador de sessão |
| `nome_treino` | text | Nome da sessão |
| `exercicio` | text | Nome do exercício |
| `grupo` | text | Grupo muscular |
| `categoria` | text | Categoria do exercício |
| `series` | int | Número de séries |
| `carga` | numeric | Carga utilizada |
| `repeticoes` | int | Repetições executadas |
| `data` | date | Data do treino |
| `created_at` | timestamp | Criação do registro |

### `treino_semana`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador único |
| `usuario_id` | uuid | Vinculado ao `auth.uid()` |
| `dia_semana` | text | Dia da semana |
| `nome_treino` | text | Nome do treino planejado |
| `exercicios` | jsonb | Lista de exercícios planejados |

### `metas`

| Campo | Tipo | Descrição |
|---|---|---|
| `exercicio` | text | Exercício alvo |
| `meta_carga` | numeric | Carga alvo |
| `meta_repeticoes` | int | Repetições alvo (opcional) |
| `concluida` | boolean | Status da meta |
| `concluida_em` | timestamp | Data de conclusão |

### `exercicios`

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | text | Nome do exercício |
| `grupo` | text | Grupo muscular |
| `categoria` | text | Categoria |
| `criado_por` | uuid | `null` = padrão · `auth.uid()` = personalizado |

> **Setup:** execute `supabase/schema.sql` no SQL Editor do Supabase para criar todas as tabelas, índices, grants, políticas RLS e o catálogo inicial.

---

## 🔒 Segurança

```
✅  Backend valida JWT antes de qualquer rota protegida
✅  usuario_id nunca vem do body — obtido do token autenticado
✅  Todas as rotas protegidas usam Depends(get_current_user)
✅  Consultas usam cliente Supabase autenticado com JWT do usuário
✅  RLS garante que cada usuário acessa apenas seus próprios dados
✅  Favoritos e exercícios personalizados isolados por usuário
⚠️  Nunca use a chave service_role no backend deste projeto
```

---

## ⚙️ Variáveis de Ambiente

> ⚠️ **Nunca envie arquivos `.env` para o GitHub.** Eles estão no `.gitignore`.

### Backend — `.env` (raiz do projeto)

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-public
CORS_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public
```

> Use sempre a chave **`anon public`** do Supabase.

---

## 🐳 Rodando com Docker

**Pré-requisitos:** Docker Desktop · Docker Compose · Projeto Supabase configurado

```bash
# Subir
docker compose up --build

# Parar
docker compose down

# Limpar containers órfãos
docker compose down --remove-orphans
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3001 |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |

---

## 💻 Rodando sem Docker

### Backend

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

---

## 📡 Rotas da API

### Autenticação

Todas as rotas protegidas exigem o token JWT no header:

```http
Authorization: Bearer SEU_ACCESS_TOKEN
```

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/dashboard/resumo` | Resumo do dashboard |
| `GET` `POST` | `/treinos` | Listar / criar treino |
| `GET` `POST` | `/treinos/sessoes` `/treinos/sessao` | Sessões |
| `GET` | `/treinos/pr` | Recordes pessoais |
| `PATCH` `DELETE` | `/treinos/{id}` | Editar / remover treino |
| `GET` `POST` | `/semana` | Planejamento semanal |
| `PATCH` `DELETE` | `/semana/{id}` | Editar / remover dia |
| `GET` `POST` | `/peso` | Registros de peso |
| `PATCH` `DELETE` | `/peso/{id}` | Editar / remover peso |
| `GET` `POST` | `/metas` | Metas |
| `PATCH` `DELETE` | `/metas/{id}` | Editar / remover meta |
| `GET` `POST` | `/dieta` | Refeições |
| `PATCH` `DELETE` | `/dieta/{id}` | Editar / remover refeição |
| `GET` `POST` | `/exercicios` | Catálogo de exercícios |
| `GET` `POST` | `/exercicios/favoritos` | Favoritos |
| `DELETE` | `/exercicios/favoritos/{id}` | Remover favorito |

---

## ☁️ Deploy na AWS EC2

```bash
# 1. Clonar repositório
git clone URL_DO_REPOSITORIO fitprogress
cd fitprogress

# 2. Criar arquivo .env
nano .env

# 3. Subir em produção
docker compose -f docker-compose.prod.yml up -d --build
```

### `.env` de produção

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-public
CORS_ORIGINS=http://IP_PUBLICO_DA_EC2
```

### Security Group — portas necessárias

| Porta | Protocolo | Uso |
|---|---|---|
| `22` | TCP | SSH |
| `80` | TCP | HTTP |
| `443` | TCP | HTTPS (opcional) |

> Em produção o frontend usa `VITE_API_URL=/api` — o Nginx faz proxy para o backend pelo mesmo domínio.

---

## 🧰 Comandos Úteis

```bash
# Docker local
docker compose up --build
docker compose down
docker compose restart backend
docker compose restart frontend

# Docker produção
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down

# Backend local
uvicorn backend.main:app --reload

# Frontend local
cd frontend && npm run dev
cd frontend && npm run build
```

---

### 🚫 Arquivos que não devem ir ao GitHub

```
.env
frontend/.env
node_modules/
frontend/node_modules/
frontend/dist/
venv/
__pycache__/
*.pyc
```

> Arquivos de exemplo podem ir: `.env.production.example` e `frontend/.env.example`

---

<div align="center">

**FitProgress** · Desenvolvido para portfólio e estudos

</div>
