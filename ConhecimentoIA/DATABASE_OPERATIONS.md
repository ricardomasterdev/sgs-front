# Operacoes de Banco de Dados SGSx

Este documento descreve como executar operacoes no banco de dados do SGSx.

## Conexao com o Banco

O SGSx usa PostgreSQL com as seguintes configuracoes (definidas no arquivo `.env`):
- Host: 177.136.244.5
- Porta: 5432
- Banco: sgsx
- Usuario: codex
- Senha: (definida no .env)
- Schema: sgsx

## Scripts Disponiveis

### seed.py - Inicializacao Completa
Cria schema, tabelas, indices, triggers e dados iniciais.

```powershell
cd C:/sgs-back
./venv/Scripts/python.exe migrations/seed.py
```

**O que faz:**
1. Cria o schema `sgsx`
2. Cria tipos ENUM (perfil_tipo, status_comanda, tipo_item_comanda, status_sessao_whatsapp)
3. Cria todas as tabelas do sistema
4. Cria 14 indices de performance
5. Cria funcao e triggers de updated_at
6. Cria salao de demonstracao com filial matriz
7. Cria tipos de recebimento padrao (Dinheiro, PIX, Cartao Debito, Cartao Credito)
8. Cria servicos de exemplo
9. Cria usuarios iniciais (super@sgsx.com.br e admin@sgsx.com.br)

## Padrao para Scripts de Migracao

Use psycopg2 para conexao sincrona com o banco:

```python
"""
Script de migracao exemplo.
Execute: python migrations/nome_script.py
"""
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Carregar variaveis de ambiente
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()


def migrate():
    """Executa a migracao."""
    print("Iniciando migracao...")

    conn = psycopg2.connect(
        host=os.getenv('DATABASE_HOST', '177.136.244.5'),
        port=os.getenv('DATABASE_PORT', '5432'),
        user=os.getenv('DATABASE_USER', 'codex'),
        password=os.getenv('DATABASE_PASSWORD', ''),
        database=os.getenv('DATABASE_NAME', 'sgsx')
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    # Verificar colunas existentes
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'sgsx' AND table_name = 'sua_tabela'
    """)
    existing_columns = [row[0] for row in cur.fetchall()]

    # Adicionar coluna se nao existir
    if 'nova_coluna' not in existing_columns:
        cur.execute("""
            ALTER TABLE sgsx.sua_tabela
            ADD COLUMN nova_coluna TIPO_DADO
        """)
        print("Coluna adicionada!")

    cur.close()
    conn.close()
    print("Migracao concluida!")


if __name__ == "__main__":
    migrate()
```

## Execucao de Scripts

Sempre execute a partir da pasta do backend usando o venv:

```powershell
cd C:/sgs-back
./venv/Scripts/python.exe migrations/nome_do_script.py
```

## Estrutura das Tabelas

### sgsx.saloes
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| nome | VARCHAR(200) | Nome do salao |
| cnpj | VARCHAR(20) | CNPJ |
| email | VARCHAR(200) | Email |
| telefone | VARCHAR(20) | Telefone |
| endereco | TEXT | Endereco completo |
| ativo | BOOLEAN | Status ativo |
| created_at | TIMESTAMP | Data criacao |
| updated_at | TIMESTAMP | Data atualizacao |

### sgsx.filiais
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| salao_id | UUID | FK para saloes |
| nome | VARCHAR(200) | Nome da filial |
| endereco | TEXT | Endereco |
| telefone | VARCHAR(20) | Telefone |
| email | VARCHAR(200) | Email |
| ativo | BOOLEAN | Status ativo |
| created_at | TIMESTAMP | Data criacao |
| updated_at | TIMESTAMP | Data atualizacao |

### sgsx.usuarios
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| salao_id | UUID | FK para saloes |
| filial_id | UUID | FK para filiais |
| nome | VARCHAR(200) | Nome do usuario |
| email | VARCHAR(200) | Email (unique) |
| senha_hash | VARCHAR(255) | Hash da senha |
| perfil | perfil_tipo | ENUM: super_admin, admin, gerente, atendente, caixa |
| ativo | BOOLEAN | Status ativo |
| ultimo_acesso | TIMESTAMP | Ultimo acesso |
| created_at | TIMESTAMP | Data criacao |
| updated_at | TIMESTAMP | Data atualizacao |

### sgsx.clientes
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| salao_id | UUID | FK para saloes |
| filial_id | UUID | FK para filiais |
| nome | VARCHAR(200) | Nome do cliente |
| cpf | VARCHAR(14) | CPF |
| email | VARCHAR(200) | Email |
| telefone | VARCHAR(20) | Telefone |
| whatsapp | VARCHAR(20) | WhatsApp |
| data_nascimento | DATE | Data nascimento |
| genero | VARCHAR(20) | Genero |
| endereco | TEXT | Endereco |
| observacoes | TEXT | Observacoes |
| ativo | BOOLEAN | Status ativo |
| created_at | TIMESTAMP | Data criacao |
| updated_at | TIMESTAMP | Data atualizacao |

### sgsx.servicos
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| salao_id | UUID | FK para saloes |
| nome | VARCHAR(200) | Nome do servico |
| descricao | TEXT | Descricao |
| preco | DECIMAL(10,2) | Preco |
| duracao_minutos | INTEGER | Duracao em minutos |
| comissao_percentual | DECIMAL(5,2) | % de comissao |
| ativo | BOOLEAN | Status ativo |
| created_at | TIMESTAMP | Data criacao |
| updated_at | TIMESTAMP | Data atualizacao |

### sgsx.colaboradores
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| salao_id | UUID | FK para saloes |
| filial_id | UUID | FK para filiais |
| nome | VARCHAR(200) | Nome |
| cpf | VARCHAR(14) | CPF |
| email | VARCHAR(200) | Email |
| telefone | VARCHAR(20) | Telefone |
| cargo | VARCHAR(100) | Cargo |
| data_admissao | DATE | Data admissao |
| comissao_padrao | DECIMAL(5,2) | % comissao padrao |
| ativo | BOOLEAN | Status ativo |
| created_at | TIMESTAMP | Data criacao |
| updated_at | TIMESTAMP | Data atualizacao |

### sgsx.colaborador_servicos
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| colaborador_id | UUID | FK para colaboradores |
| servico_id | UUID | FK para servicos |
| comissao_especifica | DECIMAL(5,2) | % comissao especifica |
| created_at | TIMESTAMP | Data criacao |

### sgsx.produtos
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| salao_id | UUID | FK para saloes |
| nome | VARCHAR(200) | Nome do produto |
| codigo | VARCHAR(50) | Codigo/SKU |
| descricao | TEXT | Descricao |
| categoria | VARCHAR(100) | Categoria |
| marca | VARCHAR(100) | Marca |
| preco_custo | DECIMAL(10,2) | Preco de custo |
| preco_venda | DECIMAL(10,2) | Preco de venda |
| estoque_atual | DECIMAL(10,3) | Estoque atual |
| estoque_minimo | DECIMAL(10,3) | Estoque minimo |
| unidade_medida | VARCHAR(10) | UN, KG, ML, etc |
| ativo | BOOLEAN | Status ativo |
| created_at | TIMESTAMP | Data criacao |
| updated_at | TIMESTAMP | Data atualizacao |

### sgsx.tipos_recebimento
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| salao_id | UUID | FK para saloes |
| nome | VARCHAR(100) | Nome (Dinheiro, PIX, etc) |
| descricao | TEXT | Descricao |
| taxa_percentual | DECIMAL(5,2) | % de taxa |
| dias_recebimento | INTEGER | Dias para receber |
| ativo | BOOLEAN | Status ativo |
| created_at | TIMESTAMP | Data criacao |
| updated_at | TIMESTAMP | Data atualizacao |

### sgsx.comandas
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| salao_id | UUID | FK para saloes |
| filial_id | UUID | FK para filiais |
| cliente_id | UUID | FK para clientes |
| usuario_id | UUID | FK para usuarios |
| numero | SERIAL | Numero da comanda |
| nome_cliente | VARCHAR(200) | Nome cliente (avulso) |
| status | status_comanda | ENUM: aberta, em_atendimento, aguardando_pagamento, paga, cancelada |
| subtotal | DECIMAL(10,2) | Subtotal |
| desconto | DECIMAL(10,2) | Desconto |
| acrescimo | DECIMAL(10,2) | Acrescimo |
| total | DECIMAL(10,2) | Total |
| observacoes | TEXT | Observacoes |
| data_abertura | TIMESTAMP | Data abertura |
| data_fechamento | TIMESTAMP | Data fechamento |
| created_at | TIMESTAMP | Data criacao |
| updated_at | TIMESTAMP | Data atualizacao |

### sgsx.comanda_itens
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| comanda_id | UUID | FK para comandas |
| tipo | tipo_item_comanda | ENUM: servico, produto |
| servico_id | UUID | FK para servicos |
| produto_id | UUID | FK para produtos |
| colaborador_id | UUID | FK para colaboradores |
| descricao | VARCHAR(200) | Descricao do item |
| quantidade | DECIMAL(10,3) | Quantidade |
| valor_unitario | DECIMAL(10,2) | Valor unitario |
| valor_total | DECIMAL(10,2) | Valor total |
| comissao_percentual | DECIMAL(5,2) | % comissao |
| comissao_valor | DECIMAL(10,2) | Valor comissao |
| created_at | TIMESTAMP | Data criacao |

### sgsx.comanda_pagamentos
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| comanda_id | UUID | FK para comandas |
| tipo_recebimento_id | UUID | FK para tipos_recebimento |
| valor | DECIMAL(10,2) | Valor pago |
| created_at | TIMESTAMP | Data criacao |

### sgsx.sessoes_whatsapp
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| salao_id | UUID | FK para saloes |
| nome | VARCHAR(100) | Nome da sessao |
| descricao | TEXT | Descricao |
| numero | VARCHAR(20) | Numero conectado |
| status | status_sessao_whatsapp | ENUM: desconectada, conectando, conectada, erro |
| ultima_conexao | TIMESTAMP | Ultima conexao |
| created_at | TIMESTAMP | Data criacao |
| updated_at | TIMESTAMP | Data atualizacao |

## Exemplos de Scripts

### Verificar Estrutura de Tabela

```python
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def check_table(table_name):
    conn = psycopg2.connect(
        host=os.getenv('DATABASE_HOST'),
        port=os.getenv('DATABASE_PORT'),
        user=os.getenv('DATABASE_USER'),
        password=os.getenv('DATABASE_PASSWORD'),
        database=os.getenv('DATABASE_NAME')
    )
    cur = conn.cursor()
    cur.execute(f"""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'sgsx' AND table_name = '{table_name}'
        ORDER BY ordinal_position
    """)
    print(f"\nEstrutura da tabela {table_name}:")
    for col in cur.fetchall():
        print(f"  - {col[0]}: {col[1]} (nullable: {col[2]})")
    cur.close()
    conn.close()


if __name__ == "__main__":
    check_table("clientes")
```

### Adicionar Nova Coluna

```python
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

load_dotenv()


def add_column():
    conn = psycopg2.connect(
        host=os.getenv('DATABASE_HOST'),
        port=os.getenv('DATABASE_PORT'),
        user=os.getenv('DATABASE_USER'),
        password=os.getenv('DATABASE_PASSWORD'),
        database=os.getenv('DATABASE_NAME')
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    # Verificar se coluna existe
    cur.execute("""
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'sgsx'
        AND table_name = 'clientes'
        AND column_name = 'instagram'
    """)

    if not cur.fetchone():
        cur.execute("""
            ALTER TABLE sgsx.clientes
            ADD COLUMN instagram VARCHAR(100)
        """)
        print("Coluna instagram adicionada!")
    else:
        print("Coluna instagram ja existe!")

    cur.close()
    conn.close()


if __name__ == "__main__":
    add_column()
```

### Criar Nova Tabela

```python
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

load_dotenv()


def create_table():
    conn = psycopg2.connect(
        host=os.getenv('DATABASE_HOST'),
        port=os.getenv('DATABASE_PORT'),
        user=os.getenv('DATABASE_USER'),
        password=os.getenv('DATABASE_PASSWORD'),
        database=os.getenv('DATABASE_NAME')
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS sgsx.agendamentos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            salao_id UUID NOT NULL REFERENCES sgsx.saloes(id),
            cliente_id UUID REFERENCES sgsx.clientes(id),
            colaborador_id UUID REFERENCES sgsx.colaboradores(id),
            servico_id UUID REFERENCES sgsx.servicos(id),
            data_hora TIMESTAMP NOT NULL,
            duracao_minutos INTEGER,
            status VARCHAR(20) DEFAULT 'agendado',
            observacoes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    print("Tabela agendamentos criada!")

    # Criar indice
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_agendamentos_data
        ON sgsx.agendamentos(data_hora)
    """)
    print("Indice criado!")

    # Criar trigger
    cur.execute("DROP TRIGGER IF EXISTS trigger_updated_at_agendamentos ON sgsx.agendamentos")
    cur.execute("""
        CREATE TRIGGER trigger_updated_at_agendamentos
        BEFORE UPDATE ON sgsx.agendamentos
        FOR EACH ROW EXECUTE FUNCTION sgsx.update_updated_at()
    """)
    print("Trigger criado!")

    cur.close()
    conn.close()


if __name__ == "__main__":
    create_table()
```

## Notas Importantes

1. **Sempre use o schema 'sgsx'** nas queries SQL
2. **Use UUID para IDs** de novas tabelas
3. **Sempre teste** as migracoes em ambiente de desenvolvimento primeiro
4. **Faca backup** antes de executar migracoes em producao
5. **Use ISOLATION_LEVEL_AUTOCOMMIT** para operacoes DDL
6. **Adicione triggers de updated_at** para novas tabelas
7. **Crie indices** para colunas frequentemente filtradas

## Backup e Restore

### Backup
```bash
pg_dump -h 177.136.244.5 -U codex -n sgsx sgsx > backup_sgsx.sql
```

### Restore
```bash
psql -h 177.136.244.5 -U codex -d sgsx < backup_sgsx.sql
```

### sgsx.whatsapp_mensagens
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| salao_id | UUID | FK para saloes |
| sessao_id | UUID | FK para sessoes_whatsapp |
| remote_jid | VARCHAR(100) | Identificador WhatsApp (numero@c.us) |
| message_id | VARCHAR(200) | ID da mensagem no WhatsApp |
| tipo | VARCHAR(50) | Tipo: chat, image, video, audio, document |
| conteudo | TEXT | Conteudo da mensagem |
| from_me | BOOLEAN | TRUE se enviada, FALSE se recebida |
| timestamp | TIMESTAMPTZ | Data/hora da mensagem |
| status | VARCHAR(50) | Status: recebida, enviada, lida, erro |
| cliente_id | UUID | FK para clientes |
| comanda_id | UUID | FK para comandas |
| created_at | TIMESTAMPTZ | Data criacao |
| updated_at | TIMESTAMPTZ | Data atualizacao |

## Tipos ENUM Disponiveis

- **perfil_tipo**: super_admin, admin, gerente, atendente, caixa
- **status_comanda**: aberta, em_atendimento, aguardando_pagamento, paga, cancelada
- **tipo_item_comanda**: servico, produto
- **status_sessao_whatsapp**: desconectada, conectando, conectada, erro
