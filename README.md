# SGSx Frontend

Frontend do Sistema de Gestão de Salões (SGSx) desenvolvido com React e Vite.

## Tecnologias

- **React 19** - Biblioteca UI
- **Vite** - Build tool
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Query** - Gerenciamento de estado servidor
- **Zustand** - Gerenciamento de estado cliente
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas
- **React Router** - Roteamento

## Requisitos

- Node.js 18+
- npm ou yarn

## Configuração

### 1. Instalar dependências

```bash
npm install
# ou
yarn install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Executar

```bash
# Desenvolvimento
npm run dev

# Build produção
npm run build

# Preview build
npm run preview
```

## Estrutura do Projeto

```
sgs-front/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout principal
│   │   ├── ui/              # Componentes reutilizáveis
│   │   ├── clientes/        # Componentes de clientes
│   │   ├── colaboradores/   # Componentes de colaboradores
│   │   └── ...
│   ├── pages/               # Páginas da aplicação
│   │   ├── auth/            # Login
│   │   ├── dashboard/       # Dashboard
│   │   ├── clientes/        # Clientes
│   │   ├── colaboradores/   # Colaboradores
│   │   ├── servicos/        # Serviços
│   │   ├── produtos/        # Produtos
│   │   ├── comandas/        # Comandas
│   │   ├── tipos-recebimento/
│   │   ├── usuarios/        # Usuários
│   │   ├── filiais/         # Filiais
│   │   ├── whatsapp/        # WhatsApp
│   │   └── admin/           # Admin (salões)
│   ├── services/            # Serviços de API
│   ├── stores/              # Stores Zustand
│   ├── types/               # Tipos TypeScript
│   ├── utils/               # Utilitários
│   ├── App.tsx              # Componente raiz
│   └── main.tsx             # Entry point
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Funcionalidades

### Dashboard
- Visão geral do salão
- Métricas de comandas
- Resumo financeiro

### Clientes
- Cadastro completo de clientes
- Histórico de atendimentos
- Busca por nome, telefone, email

### Colaboradores
- Cadastro de colaboradores
- Vínculo com serviços
- Percentual de comissão

### Serviços
- Cadastro de serviços
- Preço e duração
- Comissão padrão

### Produtos
- Cadastro de produtos
- Controle de estoque
- Preço de custo e venda

### Comandas
- Abertura de comanda
- Adição de serviços e produtos
- Múltiplas formas de pagamento
- Fechamento e cancelamento

### Formas de Pagamento
- Cadastro de tipos de recebimento
- Taxa percentual
- Dias para recebimento

### Usuários
- Gestão de usuários do sistema
- Perfis de acesso

### Filiais
- Cadastro de filiais do salão
- Separação de dados por filial

### WhatsApp
- Gerenciamento de sessões
- QR Code para conexão
- Status em tempo real

### Administração (Super Admin)
- Gerenciamento de salões
- Visão multi-tenant

## Componentes UI

O projeto inclui uma biblioteca de componentes reutilizáveis:

- `Button` - Botões com variantes
- `Input` - Campos de entrada
- `Modal` - Modais
- `DataTable` - Tabela de dados
- `Pagination` - Paginação
- `ConfirmModal` - Modal de confirmação
- `Spinner` - Loading spinner

## Tema de Cores

O sistema utiliza uma paleta de cores rosa/roxo adequada para salões de beleza:

```javascript
primary: {
  50: '#fdf2f8',
  100: '#fce7f3',
  500: '#ec4899',  // Rosa principal
  600: '#db2777',
  700: '#be185d',
}
secondary: {
  50: '#faf5ff',
  100: '#f3e8ff',
  500: '#a855f7',  // Roxo secundário
  600: '#9333ea',
}
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Executa linting |

## Estrutura de Rotas

| Rota | Página | Acesso |
|------|--------|--------|
| `/login` | Login | Público |
| `/` | Dashboard | Autenticado |
| `/clientes` | Clientes | Autenticado |
| `/colaboradores` | Colaboradores | Autenticado |
| `/servicos` | Serviços | Autenticado |
| `/produtos` | Produtos | Autenticado |
| `/comandas` | Comandas | Autenticado |
| `/comandas/:id` | Detalhe Comanda | Autenticado |
| `/tipos-recebimento` | Formas de Pgto | Autenticado |
| `/usuarios` | Usuários | Admin+ |
| `/filiais` | Filiais | Admin+ |
| `/whatsapp` | WhatsApp | Autenticado |
| `/admin/saloes` | Salões | Super Admin |

## Autenticação

O sistema utiliza JWT com tokens de acesso e refresh:

- Access token: 30 minutos
- Refresh token: 7 dias
- Armazenamento em localStorage

## Licença

Projeto proprietário - SGSx
