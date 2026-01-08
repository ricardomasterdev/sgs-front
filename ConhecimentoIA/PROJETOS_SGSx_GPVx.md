# Documentacao Completa dos Projetos SGSx e GPVx

## Visao Geral

Este documento contem todas as informacoes necessarias para entender e trabalhar com os dois sistemas principais:

- **SGSx (Sistema de Gestao de Saloes)** - Sistema para gerenciamento de saloes de beleza
- **GPVx (Gabinete de Prefeito Virtual)** - Sistema para gestao de gabinetes politicos (referencia)

Ambos compartilham a mesma estrutura arquitetural e servico de WhatsApp, mas com dominios de negocio diferentes.

---

## Estrutura dos Repositorios

### SGSx (Salao)
```
C:\sgs-front\         - Frontend React/Vite
C:\sgs-back\          - Backend FastAPI/Python
C:\SGSx-Whatsapp\     - Servico Node.js WhatsApp
```

### GPVx (Gabinete) - Referencia
```
C:\gpvx-front\        - Frontend React/Vite
C:\gabinete-back\     - Backend FastAPI/Python
C:\Gpvx-Whatsapp\     - Servico Node.js WhatsApp
```

---

## Tecnologias Utilizadas

### Frontend (sgs-front / gpvx-front)
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estatica
- **Vite** - Build tool e dev server
- **TailwindCSS** - Framework CSS utilitario
- **React Query (@tanstack/react-query)** - Gerenciamento de estado servidor
- **Zustand** - Gerenciamento de estado global (authStore)
- **React Router DOM** - Roteamento SPA
- **Axios** - Cliente HTTP
- **React Hot Toast** - Notificacoes toast
- **Lucide React** - Biblioteca de icones
- **date-fns** - Manipulacao de datas

### Backend (sgs-back / gabinete-back)
- **Python 3.11+** - Linguagem principal
- **FastAPI** - Framework web async
- **SQLAlchemy 2.0** - ORM com suporte async
- **PostgreSQL** - Banco de dados
- **asyncpg** - Driver async PostgreSQL
- **Alembic** - Migracoes de banco
- **Pydantic V2** - Validacao de dados
- **python-jose** - JWT tokens
- **passlib + bcrypt** - Hash de senhas
- **httpx** - Cliente HTTP async
- **psycopg2** - Driver sync PostgreSQL (para scripts)

### Servico WhatsApp (SGSx-Whatsapp)
- **Node.js 18+** - Runtime JavaScript
- **TypeScript** - Tipagem estatica
- **Express** - Framework web
- **whatsapp-web.js** - Biblioteca WhatsApp
- **Puppeteer** - Automacao browser (para WhatsApp)
- **QRCode** - Geracao de QR codes
- **Winston** - Logging

---

## Arquitetura do Sistema

### Comunicacao entre Servicos

```
[Frontend React]  <-->  [Backend FastAPI]  <-->  [Node WhatsApp Service]
    :3000/:5173           :8001                      :3003
         |                    |                          |
         |                    +---- PostgreSQL ----+     |
         |                           :5432              |
         +------------------- HTTP REST ----------------+
```

### Portas Padrao

| Servico | SGSx | GPVx |
|---------|------|------|
| Frontend Dev | 5173 | 5174 |
| Backend API | 8001 | 8000 |
| WhatsApp Node | 3003 | 3001 |
| PostgreSQL | 5432 | 5432 |

---

## Estrutura do Frontend (sgs-front)

```
src/
├── components/           # Componentes reutilizaveis
│   ├── admin/           # Componentes de administracao
│   ├── cargos/          # Modal de cargos
│   ├── clientes/        # Modal de clientes
│   ├── colaboradores/   # Modal de colaboradores
│   ├── comandas/        # Componentes de comandas
│   ├── layout/          # Layout principal, Sidebar, Navbar
│   ├── produtos/        # Modal de produtos
│   ├── servicos/        # Modal de servicos
│   ├── ui/              # Componentes UI genericos (Button, Modal, DataTable, etc)
│   └── whatsapp/        # Componentes WhatsApp
│       ├── WhatsAppFormModal.tsx       # Modal criar/editar sessao
│       ├── WhatsAppSendMessageModal.tsx # Modal enviar mensagem para cliente
│       ├── WhatsAppSendTestModal.tsx   # Modal enviar mensagem teste
│       └── index.ts                    # Exports
│
├── pages/               # Paginas da aplicacao
│   ├── admin/          # Paginas super admin (saloes, perfis, usuarios)
│   ├── aniversariantes/ # Lista de aniversariantes
│   ├── auth/           # Login
│   ├── cargos/         # Gerenciar cargos
│   ├── clientes/       # Gerenciar clientes
│   ├── colaboradores/  # Gerenciar colaboradores
│   ├── comandas/       # Gerenciar comandas
│   ├── dashboard/      # Dashboard principal
│   ├── filiais/        # Gerenciar filiais
│   ├── produtos/       # Gerenciar produtos
│   ├── servicos/       # Gerenciar servicos
│   ├── tipos-recebimento/ # Formas de pagamento
│   ├── usuarios/       # Gerenciar usuarios do salao
│   └── whatsapp/       # Gerenciar sessoes WhatsApp
│
├── services/           # Servicos de API
│   ├── api.ts          # Axios instance configurado
│   ├── auth.service.ts # Autenticacao
│   ├── cliente.service.ts
│   ├── colaborador.service.ts
│   ├── comanda.service.ts
│   ├── dashboard.service.ts
│   ├── produto.service.ts
│   ├── servico.service.ts
│   ├── whatsapp.service.ts
│   └── ...
│
├── stores/             # Estado global (Zustand)
│   └── authStore.ts    # Store de autenticacao
│
├── types/              # Tipos TypeScript
│   └── index.ts        # Todas as interfaces
│
├── utils/              # Utilitarios
│   ├── cn.ts           # Classnames utility
│   ├── formatters.ts   # Formatadores
│   └── masks.ts        # Mascaras de input (phone, cpf, cnpj, etc)
│
├── App.tsx             # Componente raiz com rotas
├── main.tsx            # Entry point
└── index.css           # Estilos globais TailwindCSS
```

---

## Estrutura do Backend (sgs-back)

```
app/
├── api/
│   ├── endpoints/       # Endpoints REST
│   │   ├── admin.py     # Rotas super admin
│   │   ├── auth.py      # Autenticacao
│   │   ├── cargos.py
│   │   ├── clientes.py
│   │   ├── colaboradores.py
│   │   ├── comandas.py
│   │   ├── dashboard.py
│   │   ├── filiais.py
│   │   ├── produtos.py
│   │   ├── saloes.py
│   │   ├── servicos.py
│   │   ├── tipos_recebimento.py
│   │   ├── usuarios.py
│   │   └── whatsapp.py  # Endpoints WhatsApp
│   └── router.py        # Agregador de rotas
│
├── core/
│   ├── config.py        # Configuracoes (pydantic settings)
│   ├── security.py      # JWT, hash passwords
│   └── deps.py          # Dependencias FastAPI (get_db, get_current_user)
│
├── db/
│   ├── base.py          # Base declarativa SQLAlchemy
│   └── session.py       # Engine e SessionMaker async
│
├── models/              # Models SQLAlchemy
│   ├── base.py          # BaseModel com id, created_at, updated_at
│   ├── usuario.py       # Usuario, Perfil
│   ├── salao.py         # Salao (tambem usado para filiais)
│   ├── cliente.py
│   ├── cargo.py
│   ├── colaborador.py   # Colaborador, ColaboradorServico
│   ├── servico.py
│   ├── produto.py
│   ├── tipo_recebimento.py
│   ├── comanda.py       # Comanda, ComandaItem, ComandaPagamento
│   ├── whatsapp.py      # SessaoWhatsapp, WhatsAppMensagem
│   └── auxiliar.py      # Estado, Municipio
│
├── schemas/             # Schemas Pydantic
│   ├── auth.py
│   ├── usuario.py
│   ├── salao.py
│   ├── cliente.py
│   └── ...
│
└── __init__.py

main.py                  # Entry point FastAPI
migrations/              # Alembic migrations
database/               # Scripts SQL auxiliares
ConhecimentoIA/         # Documentacao para IA
```

---

## Banco de Dados PostgreSQL

### Informacoes de Conexao

```
Host:     177.136.244.5
Porta:    5432
Database: sgsx
Schema:   sgsx
Usuario:  codex
Senha:    Ric@7901
```

### Principais Tabelas

| Tabela | Descricao |
|--------|-----------|
| `sgsx.saloes` | Saloes e filiais (filial tem salao_principal_id) |
| `sgsx.usuarios` | Usuarios do sistema |
| `sgsx.perfis` | Perfis de acesso |
| `sgsx.clientes` | Clientes dos saloes |
| `sgsx.cargos` | Cargos dos colaboradores |
| `sgsx.colaboradores` | Profissionais dos saloes |
| `sgsx.colaborador_servicos` | Vinculo colaborador-servico |
| `sgsx.servicos` | Servicos oferecidos |
| `sgsx.produtos` | Produtos para venda |
| `sgsx.tipos_recebimento` | Formas de pagamento |
| `sgsx.comandas` | Comandas de atendimento |
| `sgsx.comanda_itens` | Itens da comanda |
| `sgsx.comanda_pagamentos` | Pagamentos da comanda |
| `sgsx.sessoes_whatsapp` | Sessoes WhatsApp |
| `sgsx.whatsapp_mensagens` | Historico de mensagens |

### Multi-tenancy

O sistema e multi-tenant baseado em `salao_id`:
- Cada salao tem seus proprios dados isolados
- Usuarios podem ter acesso a multiplos saloes
- Super Admin tem acesso a todos os saloes
- Filiais sao saloes com `salao_principal_id` preenchido

### Salao Sistema

Existe um salao especial para recursos do sistema:
```python
SALAO_SISTEMA_ID = UUID('00000000-0000-0000-0000-000000000000')
```

Sessoes WhatsApp com `salao_id = None` ou `salao_id = SALAO_SISTEMA_ID` sao consideradas "gerais" (sem vinculo com salao especifico).

---

## Servico WhatsApp (SGSx-Whatsapp)

### Estrutura

```
src/
├── config.ts            # Configuracoes (porta, paths)
├── logger.ts            # Winston logger
├── types.ts             # Interfaces TypeScript
├── session-manager.ts   # Gerenciador de sessoes WhatsApp
└── index.ts             # Entry point Express

sessions/                # Dados persistidos das sessoes
logs/                   # Arquivos de log
```

### Endpoints da API Node

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /health | Health check |
| GET | /sessions | Listar todas sessoes |
| POST | /sessions | Criar nova sessao |
| GET | /sessions/:id | Detalhes de uma sessao |
| POST | /sessions/:id/connect | Iniciar conexao (gera QR) |
| POST | /sessions/:id/disconnect | Desconectar sessao |
| DELETE | /sessions/:id | Remover sessao |
| GET | /sessions/:id/qr | Obter QR code atual |
| POST | /sessions/:id/send | Enviar mensagem |

### Fluxo de Conexao WhatsApp

1. Backend cria sessao no Node (`POST /sessions`)
2. Backend solicita conexao (`POST /sessions/:id/connect`)
3. Node gera QR code e notifica via webhook
4. Usuario escaneia QR code no celular
5. Node detecta conexao e notifica backend via webhook
6. Backend atualiza status para "conectada"

### Webhooks (Node -> Backend)

O servico Node envia eventos para o backend:

```
POST /api/whatsapp/webhook
```

Eventos:
- `connected` - Sessao conectada
- `disconnected` - Sessao desconectada
- `qr_generated` - Novo QR code gerado
- `status_changed` - Status alterado
- `message_received` - Mensagem recebida

### Formato de Telefone Brasileiro

O sistema formata telefones para WhatsApp:
- Remove caracteres nao numericos
- Adiciona DDI 55 se necessario
- Remove o 9 extra de celulares (55DDD9XXXXXXXX -> 55DDXXXXXXXX)

```typescript
// Exemplo em session-manager.ts
function formatBrazilianPhone(telefone: string): string {
  let numero = telefone.replace(/\D/g, '')
  if (!numero.startsWith('55')) {
    numero = '55' + numero
  }
  // Se tem 13 digitos, remover o 9 extra
  if (numero.length === 13) {
    const ddd = numero.substring(2, 4)
    const nono = numero.substring(4, 5)
    const resto = numero.substring(5)
    if (nono === '9' && resto.length === 8) {
      numero = '55' + ddd + resto
    }
  }
  return numero
}
```

---

## Autenticacao

### JWT Tokens

O sistema usa JWT com refresh tokens:
- `access_token` - Curta duracao, enviado em cada request
- `refresh_token` - Longa duracao, usado para renovar access token

### Headers

```
Authorization: Bearer {access_token}
```

### Refresh Flow

1. Request retorna 401
2. Frontend tenta refresh com `/auth/refresh`
3. Se sucesso, repete request original
4. Se falha, redireciona para login

### Perfis de Usuario

| Codigo | Nivel | Descricao |
|--------|-------|-----------|
| super_admin | 100 | Acesso total ao sistema |
| admin | 80 | Admin do salao |
| gerente | 60 | Gerente |
| atendente | 40 | Atendente |
| caixa | 20 | Caixa |

---

## Componentes UI Principais

### DataTable
Tabela de dados com paginacao, ordenacao e loading state.

### Modal
Modal generico com titulo, conteudo e botoes.

### Button
Botao com variantes (primary, secondary, danger) e loading state.

### Input
Campo de input com label, erro e suporte a mascaras.

### Select
Campo de selecao com opcoes.

### Spinner
Indicador de carregamento.

### ConfirmModal
Modal de confirmacao para acoes destrutivas.

---

## Fluxos de Negocio

### Comanda

1. Abrir comanda (pode vincular cliente)
2. Adicionar itens (servicos e/ou produtos)
3. Aplicar descontos/acrescimos
4. Registrar pagamentos
5. Fechar comanda

### Cliente

- Cadastro completo com dados pessoais
- Historico de atendimentos
- Preferencias de comunicacao (WhatsApp, SMS, Email)
- Aniversariantes

### Colaborador

- Vinculado a cargo
- Vinculado a servicos que realiza
- Recebe comissao por atendimento

---

## Variaveis de Ambiente

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8001/api/v1
```

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://codex:Ric@7901@177.136.244.5:5432/sgsx
SECRET_KEY=sua-chave-secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
WHATSAPP_SERVICE_URL=http://localhost:3003
```

### WhatsApp (.env)
```env
PORT=3003
SESSIONS_PATH=./sessions
PUPPETEER_HEADLESS=true
BACKEND_WEBHOOK_URL=http://localhost:8001/api/whatsapp/webhook
```

---

## Comandos Uteis

### Frontend
```bash
cd C:\sgs-front
npm install          # Instalar dependencias
npm run dev          # Iniciar dev server
npm run build        # Build producao
```

### Backend
```bash
cd C:\sgs-back
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### WhatsApp
```bash
cd C:\SGSx-Whatsapp
npm install
npm run build
npm start            # Producao
npm run dev          # Desenvolvimento
```

---

## Diferencas entre SGSx e GPVx

| Aspecto | SGSx (Salao) | GPVx (Gabinete) |
|---------|--------------|-----------------|
| Dominio | Saloes de beleza | Gabinetes politicos |
| Entidade Principal | Salao | Gabinete |
| Clientes | Clientes do salao | Contribuintes/Cidadaos |
| Atendimento | Comandas | Ocorrencias |
| Profissionais | Colaboradores | Assessores |
| Porta Backend | 8001 | 8000 |
| Porta WhatsApp | 3003 | 3001 |
| Base URL Frontend | /sgs | /gpv |

### Codigo Compartilhado

Ambos projetos seguem a mesma arquitetura e podem compartilhar:
- Componentes UI
- Estrutura de services
- Logica de autenticacao
- Integracao WhatsApp

---

## Padroes de Codigo

### Frontend

- Componentes funcionais com hooks
- TypeScript strict mode
- TailwindCSS para estilos
- React Query para dados do servidor
- Zustand para estado global
- Servicos separados por dominio

### Backend

- FastAPI com async/await
- SQLAlchemy 2.0 ORM
- Pydantic V2 para validacao
- Dependency injection
- Separacao por camadas (api, models, schemas, services)

---

## Troubleshooting

### Erro 503 ao enviar mensagem WhatsApp
- Verificar se servico Node esta rodando
- Verificar se sessao esta conectada
- Checar logs do Node em `SGSx-Whatsapp/logs/`

### Erro de autenticacao 401
- Token expirado - fazer login novamente
- Verificar se refresh token esta configurado

### Sessao WhatsApp nao conecta
- Verificar se Puppeteer esta instalado
- Checar se porta 3003 esta livre
- Verificar logs do servico Node

### Erro NOT NULL no banco
- Verificar se todos campos obrigatorios estao preenchidos
- Checar schema Pydantic vs Model SQLAlchemy

---

## Contato e Suporte

Para duvidas sobre o codigo ou arquitetura, consulte este documento ou os READMEs de cada projeto.

---

*Documento atualizado em: Janeiro 2026*
*Versao: 1.0*
