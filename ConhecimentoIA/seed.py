"""
Script de inicializacao do banco de dados SGSx.
Cria schema, tabelas e dados iniciais.

Execute: python migrations/seed.py
"""
import uuid
from datetime import datetime
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from passlib.context import CryptContext

import sys
import os

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Carregar variáveis de ambiente
from dotenv import load_dotenv
load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def seed():
    """Executa a criacao do banco de dados."""
    print("=" * 60)
    print("SGSx - Inicializacao do Banco de Dados")
    print("=" * 60)

    # Configurações do banco
    DB_HOST = os.getenv('DATABASE_HOST', '177.136.244.5')
    DB_PORT = os.getenv('DATABASE_PORT', '5432')
    DB_USER = os.getenv('DATABASE_USER', 'codex')
    DB_PASSWORD = os.getenv('DATABASE_PASSWORD', '')
    DB_NAME = os.getenv('DATABASE_NAME', 'sgsx')

    print(f"\nConectando a {DB_HOST}:{DB_PORT}/{DB_NAME}...")

    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    print("Conexao estabelecida!")

    # 1. Criar Schema
    print("\n[1/8] Criando schema sgsx...")
    cur.execute("CREATE SCHEMA IF NOT EXISTS sgsx")
    print("  Schema sgsx criado/verificado!")

    # 2. Criar ENUM types
    print("\n[2/8] Criando tipos ENUM...")

    # Verificar e criar enum perfil_tipo
    cur.execute("""
        SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_tipo'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'sgsx'))
    """)
    if not cur.fetchone()[0]:
        cur.execute("""
            CREATE TYPE sgsx.perfil_tipo AS ENUM ('super_admin', 'admin', 'gerente', 'atendente', 'caixa')
        """)
        print("  Tipo perfil_tipo criado!")
    else:
        print("  Tipo perfil_tipo ja existe!")

    # Verificar e criar enum status_comanda
    cur.execute("""
        SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_comanda'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'sgsx'))
    """)
    if not cur.fetchone()[0]:
        cur.execute("""
            CREATE TYPE sgsx.status_comanda AS ENUM ('aberta', 'em_atendimento', 'aguardando_pagamento', 'paga', 'cancelada')
        """)
        print("  Tipo status_comanda criado!")
    else:
        print("  Tipo status_comanda ja existe!")

    # Verificar e criar enum tipo_item_comanda
    cur.execute("""
        SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_item_comanda'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'sgsx'))
    """)
    if not cur.fetchone()[0]:
        cur.execute("""
            CREATE TYPE sgsx.tipo_item_comanda AS ENUM ('servico', 'produto')
        """)
        print("  Tipo tipo_item_comanda criado!")
    else:
        print("  Tipo tipo_item_comanda ja existe!")

    # Verificar e criar enum status_sessao_whatsapp
    cur.execute("""
        SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_sessao_whatsapp'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'sgsx'))
    """)
    if not cur.fetchone()[0]:
        cur.execute("""
            CREATE TYPE sgsx.status_sessao_whatsapp AS ENUM ('desconectada', 'conectando', 'conectada', 'erro')
        """)
        print("  Tipo status_sessao_whatsapp criado!")
    else:
        print("  Tipo status_sessao_whatsapp ja existe!")

    # 3. Criar tabelas
    print("\n[3/8] Criando tabelas...")

    # Tabela saloes
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.saloes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nome VARCHAR(200) NOT NULL,
            cnpj VARCHAR(20),
            email VARCHAR(200),
            telefone VARCHAR(20),
            endereco TEXT,
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela saloes criada!")

    # Tabela filiais
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.filiais (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID NOT NULL REFERENCES sgsx.saloes(id),
            nome VARCHAR(200) NOT NULL,
            endereco TEXT,
            telefone VARCHAR(20),
            email VARCHAR(200),
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela filiais criada!")

    # Tabela perfis
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.perfis (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID REFERENCES sgsx.saloes(id) ON DELETE CASCADE,
            codigo VARCHAR(50) NOT NULL,
            nome VARCHAR(100) NOT NULL,
            descricao TEXT,
            permissoes JSONB DEFAULT '{}',
            nivel_acesso INTEGER DEFAULT 10,
            sistema BOOLEAN DEFAULT FALSE,
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    print("  Tabela perfis criada!")

    # Tabela usuarios
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.usuarios (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID REFERENCES sgsx.saloes(id),
            filial_id UUID REFERENCES sgsx.filiais(id),
            perfil_id UUID REFERENCES sgsx.perfis(id),
            nome VARCHAR(200) NOT NULL,
            email VARCHAR(200) NOT NULL UNIQUE,
            senha_hash VARCHAR(255) NOT NULL,
            perfil sgsx.perfil_tipo DEFAULT 'atendente',
            ativo BOOLEAN DEFAULT TRUE,
            ultimo_acesso TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela usuarios criada!")

    # Tabela clientes
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.clientes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID NOT NULL REFERENCES sgsx.saloes(id),
            filial_id UUID REFERENCES sgsx.filiais(id),
            nome VARCHAR(200) NOT NULL,
            cpf VARCHAR(14),
            email VARCHAR(200),
            telefone VARCHAR(20),
            whatsapp VARCHAR(20),
            data_nascimento DATE,
            genero VARCHAR(20),
            endereco TEXT,
            observacoes TEXT,
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela clientes criada!")

    # Tabela servicos
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.servicos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID NOT NULL REFERENCES sgsx.saloes(id),
            nome VARCHAR(200) NOT NULL,
            descricao TEXT,
            preco DECIMAL(10,2) NOT NULL DEFAULT 0,
            duracao_minutos INTEGER DEFAULT 30,
            comissao_percentual DECIMAL(5,2) DEFAULT 0,
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela servicos criada!")

    # Tabela colaboradores
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.colaboradores (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID NOT NULL REFERENCES sgsx.saloes(id),
            filial_id UUID REFERENCES sgsx.filiais(id),
            nome VARCHAR(200) NOT NULL,
            cpf VARCHAR(14),
            email VARCHAR(200),
            telefone VARCHAR(20),
            cargo VARCHAR(100),
            data_admissao DATE,
            comissao_padrao DECIMAL(5,2) DEFAULT 0,
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela colaboradores criada!")

    # Tabela colaborador_servicos (relacionamento N:N)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.colaborador_servicos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            colaborador_id UUID NOT NULL REFERENCES sgsx.colaboradores(id) ON DELETE CASCADE,
            servico_id UUID NOT NULL REFERENCES sgsx.servicos(id) ON DELETE CASCADE,
            comissao_especifica DECIMAL(5,2),
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(colaborador_id, servico_id)
        )
    """)
    print("  Tabela colaborador_servicos criada!")

    # Tabela produtos
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.produtos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID NOT NULL REFERENCES sgsx.saloes(id),
            nome VARCHAR(200) NOT NULL,
            codigo VARCHAR(50),
            descricao TEXT,
            categoria VARCHAR(100),
            marca VARCHAR(100),
            preco_custo DECIMAL(10,2) DEFAULT 0,
            preco_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
            estoque_atual DECIMAL(10,3) DEFAULT 0,
            estoque_minimo DECIMAL(10,3) DEFAULT 0,
            unidade_medida VARCHAR(10) DEFAULT 'UN',
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela produtos criada!")

    # Tabela tipos_recebimento
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.tipos_recebimento (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID NOT NULL REFERENCES sgsx.saloes(id),
            nome VARCHAR(100) NOT NULL,
            descricao TEXT,
            taxa_percentual DECIMAL(5,2) DEFAULT 0,
            dias_recebimento INTEGER DEFAULT 0,
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela tipos_recebimento criada!")

    # Tabela comandas
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.comandas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID NOT NULL REFERENCES sgsx.saloes(id),
            filial_id UUID REFERENCES sgsx.filiais(id),
            cliente_id UUID REFERENCES sgsx.clientes(id),
            usuario_id UUID REFERENCES sgsx.usuarios(id),
            numero SERIAL,
            nome_cliente VARCHAR(200),
            status sgsx.status_comanda DEFAULT 'aberta',
            subtotal DECIMAL(10,2) DEFAULT 0,
            desconto DECIMAL(10,2) DEFAULT 0,
            acrescimo DECIMAL(10,2) DEFAULT 0,
            total DECIMAL(10,2) DEFAULT 0,
            observacoes TEXT,
            data_abertura TIMESTAMP DEFAULT NOW(),
            data_fechamento TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela comandas criada!")

    # Tabela comanda_itens
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.comanda_itens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            comanda_id UUID NOT NULL REFERENCES sgsx.comandas(id) ON DELETE CASCADE,
            tipo sgsx.tipo_item_comanda NOT NULL,
            servico_id UUID REFERENCES sgsx.servicos(id),
            produto_id UUID REFERENCES sgsx.produtos(id),
            colaborador_id UUID REFERENCES sgsx.colaboradores(id),
            descricao VARCHAR(200) NOT NULL,
            quantidade DECIMAL(10,3) DEFAULT 1,
            valor_unitario DECIMAL(10,2) NOT NULL,
            valor_total DECIMAL(10,2) NOT NULL,
            comissao_percentual DECIMAL(5,2) DEFAULT 0,
            comissao_valor DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela comanda_itens criada!")

    # Tabela comanda_pagamentos
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.comanda_pagamentos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            comanda_id UUID NOT NULL REFERENCES sgsx.comandas(id) ON DELETE CASCADE,
            tipo_recebimento_id UUID NOT NULL REFERENCES sgsx.tipos_recebimento(id),
            valor DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela comanda_pagamentos criada!")

    # Tabela sessoes_whatsapp
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.sessoes_whatsapp (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID NOT NULL REFERENCES sgsx.saloes(id),
            nome VARCHAR(100) NOT NULL,
            descricao TEXT,
            numero VARCHAR(20),
            status sgsx.status_sessao_whatsapp DEFAULT 'desconectada',
            ultima_conexao TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("  Tabela sessoes_whatsapp criada!")

    # Tabela whatsapp_mensagens
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.whatsapp_mensagens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID NOT NULL REFERENCES sgsx.saloes(id) ON DELETE CASCADE,
            sessao_id UUID REFERENCES sgsx.sessoes_whatsapp(id) ON DELETE SET NULL,
            remote_jid VARCHAR(100) NOT NULL,
            message_id VARCHAR(200) NOT NULL,
            tipo VARCHAR(50) DEFAULT 'chat',
            conteudo TEXT,
            from_me BOOLEAN DEFAULT FALSE,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            status VARCHAR(50) DEFAULT 'recebida',
            cliente_id UUID REFERENCES sgsx.clientes(id) ON DELETE SET NULL,
            comanda_id UUID REFERENCES sgsx.comandas(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    cur.execute("COMMENT ON TABLE sgsx.whatsapp_mensagens IS 'Historico de mensagens enviadas e recebidas via WhatsApp'")
    cur.execute("COMMENT ON COLUMN sgsx.whatsapp_mensagens.remote_jid IS 'Identificador do contato no WhatsApp (numero@c.us)'")
    cur.execute("COMMENT ON COLUMN sgsx.whatsapp_mensagens.from_me IS 'TRUE se foi enviada por nos, FALSE se foi recebida'")
    print("  Tabela whatsapp_mensagens criada!")

    # 4. Criar indices
    print("\n[4/8] Criando indices...")

    indices = [
        "CREATE INDEX IF NOT EXISTS idx_filiais_salao ON sgsx.filiais(salao_id)",
        "CREATE INDEX IF NOT EXISTS idx_perfis_salao ON sgsx.perfis(salao_id)",
        "CREATE INDEX IF NOT EXISTS idx_perfis_codigo ON sgsx.perfis(codigo)",
        "CREATE INDEX IF NOT EXISTS idx_usuarios_salao ON sgsx.usuarios(salao_id)",
        "CREATE INDEX IF NOT EXISTS idx_usuarios_email ON sgsx.usuarios(email)",
        "CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON sgsx.usuarios(perfil_id)",
        "CREATE INDEX IF NOT EXISTS idx_clientes_salao ON sgsx.clientes(salao_id)",
        "CREATE INDEX IF NOT EXISTS idx_clientes_nome ON sgsx.clientes(nome)",
        "CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON sgsx.clientes(telefone)",
        "CREATE INDEX IF NOT EXISTS idx_colaboradores_salao ON sgsx.colaboradores(salao_id)",
        "CREATE INDEX IF NOT EXISTS idx_servicos_salao ON sgsx.servicos(salao_id)",
        "CREATE INDEX IF NOT EXISTS idx_produtos_salao ON sgsx.produtos(salao_id)",
        "CREATE INDEX IF NOT EXISTS idx_comandas_salao ON sgsx.comandas(salao_id)",
        "CREATE INDEX IF NOT EXISTS idx_comandas_status ON sgsx.comandas(status)",
        "CREATE INDEX IF NOT EXISTS idx_comandas_data ON sgsx.comandas(data_abertura)",
        "CREATE INDEX IF NOT EXISTS idx_comanda_itens_comanda ON sgsx.comanda_itens(comanda_id)",
        "CREATE INDEX IF NOT EXISTS idx_comanda_pagamentos_comanda ON sgsx.comanda_pagamentos(comanda_id)",
        "CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_salao ON sgsx.whatsapp_mensagens(salao_id)",
        "CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_sessao ON sgsx.whatsapp_mensagens(sessao_id)",
        "CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_cliente ON sgsx.whatsapp_mensagens(cliente_id)",
        "CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_remote_jid ON sgsx.whatsapp_mensagens(remote_jid)",
        "CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_timestamp ON sgsx.whatsapp_mensagens(timestamp DESC)",
    ]

    for idx in indices:
        cur.execute(idx)
    print(f"  {len(indices)} indices criados!")

    # 5. Criar funcao de updated_at
    print("\n[5/8] Criando funcao de updated_at...")
    cur.execute("""
        CREATE OR REPLACE FUNCTION sgsx.update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    print("  Funcao update_updated_at criada!")

    # 6. Criar triggers
    print("\n[6/8] Criando triggers...")

    tabelas_com_updated_at = [
        'saloes', 'filiais', 'perfis', 'usuarios', 'clientes',
        'colaboradores', 'servicos', 'produtos',
        'tipos_recebimento', 'comandas', 'sessoes_whatsapp',
        'whatsapp_mensagens'
    ]

    for tabela in tabelas_com_updated_at:
        cur.execute(f"DROP TRIGGER IF EXISTS trigger_updated_at_{tabela} ON sgsx.{tabela}")
        cur.execute(f"""
            CREATE TRIGGER trigger_updated_at_{tabela}
            BEFORE UPDATE ON sgsx.{tabela}
            FOR EACH ROW EXECUTE FUNCTION sgsx.update_updated_at()
        """)
    print(f"  {len(tabelas_com_updated_at)} triggers criados!")

    # 7. Criar salao padrao
    print("\n[7/8] Criando salao padrao...")

    # Verificar se ja existe
    cur.execute("SELECT id FROM sgsx.saloes WHERE nome = 'Salao Demonstracao' LIMIT 1")
    salao_row = cur.fetchone()

    if salao_row:
        salao_id = salao_row[0]
        print("  Salao padrao ja existe!")
    else:
        salao_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO sgsx.saloes (id, nome, email, telefone)
            VALUES (%s, 'Salao Demonstracao', 'contato@salao.com', '(11) 99999-9999')
        """, (salao_id,))
        print("  Salao padrao criado!")

        # Criar filial matriz
        filial_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO sgsx.filiais (id, salao_id, nome)
            VALUES (%s, %s, 'Matriz')
        """, (filial_id, salao_id))
        print("  Filial Matriz criada!")

        # Criar tipos de recebimento padrao
        tipos = [
            ('Dinheiro', 'Pagamento em dinheiro', 0, 0),
            ('PIX', 'Pagamento instantaneo via PIX', 0, 0),
            ('Cartao Debito', 'Pagamento com cartao de debito', 1.5, 1),
            ('Cartao Credito', 'Pagamento com cartao de credito', 3.5, 30),
            ('Notinha a Pagar', 'Fiado / Conta a receber do cliente', 0, 0),
        ]
        for nome, desc, taxa, dias in tipos:
            cur.execute("""
                INSERT INTO sgsx.tipos_recebimento (salao_id, nome, descricao, taxa_percentual, dias_recebimento)
                VALUES (%s, %s, %s, %s, %s)
            """, (salao_id, nome, desc, taxa, dias))
        print("  Tipos de recebimento criados!")

        # Criar servicos de exemplo
        servicos = [
            ('Corte Feminino', 80.00, 45, 30),
            ('Corte Masculino', 50.00, 30, 30),
            ('Escova', 60.00, 40, 25),
            ('Hidratacao', 90.00, 60, 20),
            ('Coloracao', 150.00, 90, 25),
            ('Manicure', 40.00, 40, 30),
            ('Pedicure', 50.00, 50, 30),
            ('Sobrancelha', 30.00, 20, 30),
        ]
        for nome, preco, duracao, comissao in servicos:
            cur.execute("""
                INSERT INTO sgsx.servicos (salao_id, nome, preco, duracao_minutos, comissao_percentual)
                VALUES (%s, %s, %s, %s, %s)
            """, (salao_id, nome, preco, duracao, comissao))
        print("  Servicos de exemplo criados!")

    # 8. Criar perfis do sistema e usuarios padrao
    print("\n[8/8] Criando perfis e usuarios padrao...")

    import json

    # Criar perfis do sistema
    perfis_sistema = [
        ('super_admin', 'Super Administrador', 'Acesso total ao sistema', 100, {
            'saloes': ['criar', 'editar', 'excluir', 'listar'],
            'usuarios': ['criar', 'editar', 'excluir', 'listar'],
            'configuracoes': ['editar'],
        }),
        ('admin', 'Administrador', 'Administrador do salao', 90, {
            'filiais': ['criar', 'editar', 'excluir', 'listar'],
            'usuarios': ['criar', 'editar', 'excluir', 'listar'],
            'clientes': ['criar', 'editar', 'excluir', 'listar'],
            'colaboradores': ['criar', 'editar', 'excluir', 'listar'],
            'servicos': ['criar', 'editar', 'excluir', 'listar'],
            'produtos': ['criar', 'editar', 'excluir', 'listar'],
            'comandas': ['criar', 'editar', 'excluir', 'listar', 'fechar', 'cancelar'],
        }),
        ('gerente', 'Gerente', 'Gerente de filial', 70, {}),
        ('atendente', 'Atendente', 'Atendente/Recepcionista', 50, {}),
        ('caixa', 'Caixa', 'Operador de caixa', 30, {}),
    ]

    perfis_map = {}
    for codigo, nome, descricao, nivel, permissoes in perfis_sistema:
        cur.execute("SELECT id FROM sgsx.perfis WHERE codigo = %s AND salao_id IS NULL", (codigo,))
        row = cur.fetchone()
        if not row:
            perfil_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO sgsx.perfis (id, codigo, nome, descricao, nivel_acesso, permissoes, sistema)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE)
            """, (perfil_id, codigo, nome, descricao, nivel, json.dumps(permissoes)))
            perfis_map[codigo] = perfil_id
        else:
            perfis_map[codigo] = str(row[0])
    print("  Perfis do sistema criados!")

    # Super Admin
    cur.execute("SELECT id FROM sgsx.usuarios WHERE email = 'super@sgsx.com.br' LIMIT 1")
    if not cur.fetchone():
        cur.execute("""
            INSERT INTO sgsx.usuarios (nome, email, senha_hash, perfil, perfil_id)
            VALUES ('Super Admin', 'super@sgsx.com.br', %s, 'super_admin', %s)
        """, (hash_password("super123"), perfis_map['super_admin']))
        print("  Usuario super@sgsx.com.br criado! (senha: super123)")
    else:
        print("  Usuario super@sgsx.com.br ja existe!")

    # Admin do salao
    cur.execute("SELECT id FROM sgsx.usuarios WHERE email = 'admin@sgsx.com.br' LIMIT 1")
    if not cur.fetchone():
        cur.execute("""
            INSERT INTO sgsx.usuarios (salao_id, nome, email, senha_hash, perfil, perfil_id)
            VALUES (%s, 'Administrador', 'admin@sgsx.com.br', %s, 'admin', %s)
        """, (salao_id, hash_password("admin123"), perfis_map['admin']))
        print("  Usuario admin@sgsx.com.br criado! (senha: admin123)")
    else:
        print("  Usuario admin@sgsx.com.br ja existe!")

    cur.close()
    conn.close()

    print("\n" + "=" * 60)
    print("Inicializacao concluida com sucesso!")
    print("=" * 60)
    print("\nUsuarios criados:")
    print("  - super@sgsx.com.br / super123 (Super Admin)")
    print("  - admin@sgsx.com.br / admin123 (Admin do Salao)")
    print("\nProximo passo: uvicorn main:app --reload")


if __name__ == "__main__":
    seed()
