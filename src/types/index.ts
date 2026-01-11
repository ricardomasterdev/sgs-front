// Tipos base
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

// Auth
export interface LoginRequest {
  email: string
  senha: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface SalaoSimples {
  id: string
  codigo: string
  nome: string
  is_filial?: boolean
}

export interface UsuarioAuth {
  id: string
  nome: string
  email: string
  super_usuario: boolean
  is_admin_salao: boolean
  pertence_filial: boolean
  is_colaborador: boolean
  colaborador_id?: string
  colaborador_nome?: string
  saloes?: SalaoSimples[]
  filiais?: SalaoSimples[]
  perfil_codigo?: string
  foto_url?: string
}

export interface LoginResponse {
  token: TokenResponse
  usuario: UsuarioAuth
}

// Perfil
export type Perfil = 'super_admin' | 'admin' | 'gerente' | 'atendente' | 'caixa'

export interface PerfilCompleto {
  id: string
  salao_id?: string
  codigo: string
  nome: string
  descricao?: string
  permissoes?: Record<string, string[]>
  nivel_acesso: number
  sistema: boolean
  ativo: boolean
  created_at: string
  updated_at?: string
}

// Usuario
export type StatusUsuario = 'ativo' | 'inativo' | 'bloqueado' | 'pendente'

export interface Usuario {
  id: string
  salao_id?: string
  filial_id?: string
  perfil_id?: string
  nome: string
  email: string
  cpf?: string
  telefone?: string
  foto_url?: string
  status?: StatusUsuario
  perfil?: Perfil
  ativo?: boolean
  super_usuario?: boolean
  ultimo_acesso?: string
  perfil_completo?: PerfilCompleto
  // Campos extras para exibicao
  salao_nome?: string
  perfil_nome?: string
  perfil_codigo?: string
  created_at?: string
  updated_at?: string
}

// Salao
export interface Salao {
  id: string
  codigo?: string
  nome: string
  razao_social?: string
  cnpj?: string
  nome_proprietario?: string
  endereco?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  email?: string
  email_contato?: string
  telefone?: string
  telefone_contato?: string
  whatsapp?: string
  instagram?: string
  logo_url?: string
  cor_primaria?: string
  cor_secundaria?: string
  salao_principal_id?: string
  ativo: boolean
  created_at: string
  updated_at?: string
}

// Filial (usa mesma estrutura que Salao pois filial e um salao com salao_principal_id)
export interface Filial {
  id: string
  salao_id?: string
  salao_principal_id?: string
  codigo?: string
  nome: string
  endereco?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
  telefone?: string
  telefone_contato?: string
  whatsapp?: string
  email?: string
  email_contato?: string
  ativo: boolean
  created_at: string
  updated_at?: string
}

// Cliente
export type Genero = 'masculino' | 'feminino' | 'outro' | 'nao_informado'

export interface Cliente {
  id: string
  salao_id: string
  filial_id?: string
  nome: string
  nome_social?: string
  cpf?: string
  rg?: string
  data_nascimento?: string
  genero?: Genero
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  email?: string
  telefone?: string
  celular?: string
  whatsapp?: string
  instagram?: string
  aceita_whatsapp: boolean
  aceita_sms: boolean
  aceita_email: boolean
  observacoes?: string
  alergias?: string
  como_conheceu?: string
  foto_url?: string
  total_atendimentos: number
  ultima_visita?: string
  ativo: boolean
  created_at: string
  updated_at?: string
}

// Cargo
export interface Cargo {
  id: string
  salao_id: string
  nome: string
  descricao?: string
  ordem: number
  ativo: boolean
  created_at: string
  updated_at?: string
}

export interface CargoInfo {
  id: string
  nome: string
}

// Colaborador
export interface ServicoVinculado {
  servico_id: string
}

export interface ServicoDoColaborador {
  id: string
  servico_id: string
  servico_nome: string
}

export interface Colaborador {
  id: string
  salao_id: string
  nome: string
  whatsapp?: string
  cargo_id?: string
  cargo?: CargoInfo
  ativo: boolean
  servicos?: ServicoDoColaborador[]
  created_at: string
  updated_at?: string
}

// Servico
export interface Servico {
  id: string
  salao_id: string
  nome: string
  descricao?: string
  categoria?: string
  preco: number
  duracao_minutos: number
  comissao_percentual: number
  ordem: number
  ativo: boolean
  created_at: string
  updated_at?: string
}

// Produto
export interface Produto {
  id: string
  salao_id: string
  codigo?: string
  nome: string
  descricao?: string
  categoria?: string
  marca?: string
  preco_custo: number
  preco_venda: number
  comissao_percentual: number
  estoque_atual: number
  estoque_minimo: number
  unidade_medida: string
  codigo_barras?: string
  foto_url?: string
  ativo: boolean
  created_at: string
  updated_at?: string
}

// Tipo Recebimento
export interface TipoRecebimento {
  id: string
  salao_id: string
  nome: string
  descricao?: string
  taxa_percentual: number
  dias_recebimento: number
  ativo: boolean
  created_at: string
  updated_at?: string
}

// Comanda
export type StatusComanda = 'aberta' | 'em_atendimento' | 'aguardando_pagamento' | 'paga' | 'cancelada'
export type TipoItemComanda = 'servico' | 'produto'

export interface ComandaItem {
  id: string
  tipo: TipoItemComanda
  servico_id?: string
  produto_id?: string
  colaborador_id?: string
  descricao: string
  quantidade: number
  valor_unitario: number
  desconto: number
  valor_total: number
  comissao_percentual: number
  comissao_valor: number
  observacoes?: string
  colaborador_nome?: string
  created_at: string
}

export interface ComandaPagamento {
  id: string
  tipo_recebimento_id: string
  tipo_recebimento_nome?: string
  valor: number
  data_pagamento?: string
  observacoes?: string
  created_at: string
}

export interface Comanda {
  id: string
  salao_id: string
  filial_id?: string
  numero: string
  cliente_id?: string
  nome_cliente?: string
  cliente?: {
    id: string
    nome: string
    celular?: string
  }
  subtotal: number
  desconto: number
  desconto_percentual: number
  acrescimo: number
  total: number
  status: StatusComanda
  data_abertura?: string
  data_fechamento?: string
  usuario_id?: string
  observacoes?: string
  itens?: ComandaItem[]
  pagamentos?: ComandaPagamento[]
  created_at: string
  updated_at?: string
}

// WhatsApp
export type StatusSessaoWhatsapp = 'desconectada' | 'conectando' | 'conectada' | 'erro'

export interface SessaoWhatsapp {
  id: string
  salao_id?: string | null  // null para sessao geral
  salao_nome?: string | null  // nome do salao vinculado
  nome: string
  descricao?: string
  numero?: string
  session_id?: string
  status: StatusSessaoWhatsapp
  qr_code?: string
  ultima_conexao?: string
  ultimo_status_at?: string
  mensagem_status?: string
  ativo?: boolean
  created_at: string
  updated_at?: string
}

// Dashboard
export interface EstatisticasSalao {
  total_clientes: number
  total_colaboradores: number
  total_servicos: number
  total_produtos: number
  comandas_abertas: number
  faturamento_hoje: number
  faturamento_mes: number
  atendimentos_hoje: number
  atendimentos_mes: number
}

export interface ComandaRecente {
  id: string
  numero: string
  cliente_nome?: string
  total: number
  status: string
  data_abertura: string
}

export interface AniversarianteHoje {
  id: string
  nome: string
  idade: number
  celular?: string
  whatsapp?: string
}

export interface DashboardData {
  estatisticas: EstatisticasSalao
  comandas_recentes: ComandaRecente[]
  aniversariantes_hoje: AniversarianteHoje[]
}
