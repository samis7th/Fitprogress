# Deploy AWS EC2

Este projeto pode subir em uma EC2 usando Docker Compose.

## 1. Preparar a EC2

Use uma instância Ubuntu.

Libere no Security Group:

- porta `22` para SSH
- porta `80` para acessar o frontend

## 2. Instalar Docker

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker ubuntu
```

Depois saia do SSH e entre novamente.

## 3. Enviar o projeto

Clone seu repositório na EC2:

```bash
git clone URL_DO_SEU_REPOSITORIO fitprogress
cd fitprogress
```

Ou envie a pasta do projeto por SCP.

## 4. Criar variáveis de produção

Crie o arquivo `.env` na raiz da EC2:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-public
```

## 5. Subir a aplicação

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 6. Testar

Abra:

```text
http://IP_PUBLICO_DA_EC2
```

API via proxy:

```text
http://IP_PUBLICO_DA_EC2/api/
```

## Comandos úteis

```bash
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```
