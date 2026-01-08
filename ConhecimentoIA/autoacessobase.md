# Auto Acesso Base de Dados - Referencia Rapida

## Objetivo
Este documento explica como o Claude pode acessar automaticamente o banco de dados PostgreSQL para executar migracoes e ajustes sem precisar pedir ao usuario para rodar scripts manualmente.

---

## Dados de Conexao

```
Host:     177.136.244.5
Porta:    5432
Usuario:  codex
Senha:    Ric@7901
Database: sgsx
Schema:   sgsx
```

---

## Como Usar - Passo a Passo

### 1. Criar Script Python com psycopg2

Quando precisar fazer alteracoes no banco, criar um script Python:

```python
import psycopg2

def executar_alteracao():
    conn = psycopg2.connect(
        host='177.136.244.5',
        port=5432,
        user='codex',
        password='Ric@7901',
        database='sgsx'
    )
    conn.autocommit = True
    cursor = conn.cursor()

    try:
        # Executar comandos SQL aqui
        cursor.execute("ALTER TABLE sgsx.tabela ADD COLUMN IF NOT EXISTS nova_coluna VARCHAR(100)")
        print("[OK] Alteracao executada")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    executar_alteracao()
```

### 2. Executar o Script

```bash
cd C:\sgs-back
python nome_do_script.py
```

---

## Operacoes Comuns

### Adicionar Coluna
```python
cursor.execute("""
    ALTER TABLE sgsx.nome_tabela
    ADD COLUMN IF NOT EXISTS nova_coluna VARCHAR(100)
""")
```

### Criar Indice
```python
cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_nome
    ON sgsx.nome_tabela(coluna)
""")
```

### Verificar Valores de Enum
```python
cursor.execute("""
    SELECT enumlabel FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'nome_do_enum'
    AND t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'sgsx')
""")
result = cursor.fetchall()
valores = [r[0] for r in result]
print(f"Valores do enum: {valores}")
```

### Renomear Valor de Enum
```python
cursor.execute("ALTER TYPE sgsx.nome_enum RENAME VALUE 'valor_antigo' TO 'valor_novo'")
```

### Adicionar Valor ao Enum
```python
cursor.execute("ALTER TYPE sgsx.nome_enum ADD VALUE 'novo_valor'")
```

### Consultar Estrutura de Tabela
```python
cursor.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'sgsx' AND table_name = 'nome_tabela'
""")
for row in cursor.fetchall():
    print(row)
```

---

## Regras Importantes

1. **Sempre usar schema `sgsx`** - Todas as tabelas estao neste schema
2. **Usar `IF NOT EXISTS`** - Para operacoes idempotentes (podem rodar varias vezes)
3. **autocommit = True** - Para DDL (ALTER, CREATE) funcionar corretamente
4. **Evitar caracteres especiais** - No print, usar ASCII simples (nao usar acentos/emojis no Windows)
5. **Fechar conexao** - Sempre usar try/finally para garantir fechamento

---

## Exemplo Completo de Migracao

```python
"""
Migracao: Descricao do que faz
"""
import psycopg2

def run_migration():
    conn = psycopg2.connect(
        host='177.136.244.5',
        port=5432,
        user='codex',
        password='Ric@7901',
        database='sgsx'
    )
    conn.autocommit = True
    cursor = conn.cursor()

    try:
        print("Conectado ao banco de dados...")

        # 1. Primeira alteracao
        print("Executando alteracao 1...")
        cursor.execute("""
            -- SQL aqui
        """)
        print("[OK] Alteracao 1 concluida")

        # 2. Segunda alteracao
        print("Executando alteracao 2...")
        cursor.execute("""
            -- SQL aqui
        """)
        print("[OK] Alteracao 2 concluida")

        print("\n[SUCESSO] Migracao concluida!")

    except Exception as e:
        print(f"[ERRO] {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
```

---

## Tabelas Principais do Sistema

| Tabela | Descricao |
|--------|-----------|
| `sgsx.saloes` | Saloes de beleza |
| `sgsx.usuarios` | Usuarios do sistema |
| `sgsx.clientes` | Clientes dos saloes |
| `sgsx.profissionais` | Profissionais |
| `sgsx.servicos` | Servicos oferecidos |
| `sgsx.produtos` | Produtos |
| `sgsx.comandas` | Comandas de atendimento |
| `sgsx.sessoes_whatsapp` | Sessoes WhatsApp |

---

## Instrucao para o Claude

Quando o usuario pedir para fazer alteracoes no banco de dados:

1. Criar script Python em `C:\sgs-back\`
2. Usar psycopg2 com os dados de conexao acima
3. Executar o script automaticamente via Bash
4. Reportar resultado ao usuario

**NAO precisa pedir confirmacao** - o usuario ja autorizou acesso direto ao banco.

---

## Exemplo Real - Sessao de 08/01/2026

### Problema
Erro ao criar sessao WhatsApp:
- Coluna `session_id` nao existia na tabela `sessoes_whatsapp`
- Enum `status_sessao_whatsapp` tinha valores em ingles, mas codigo esperava portugues

### Solucao Aplicada

1. **Criei o script `run_migration_sync.py`:**

```python
"""
Script para executar migracao do WhatsApp (usando psycopg2)
"""
import psycopg2

def run_migration():
    conn = psycopg2.connect(
        host='177.136.244.5',
        port=5432,
        user='codex',
        password='Ric@7901',
        database='sgsx'
    )
    conn.autocommit = True
    cursor = conn.cursor()

    try:
        print("Conectado ao banco de dados...")

        # 1. Adicionar coluna session_id se nao existir
        print("Adicionando coluna session_id...")
        cursor.execute("""
            ALTER TABLE sgsx.sessoes_whatsapp
            ADD COLUMN IF NOT EXISTS session_id VARCHAR(100)
        """)
        print("[OK] Coluna session_id adicionada")

        # 2. Criar indice
        print("Criando indice...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessoes_whatsapp_session
            ON sgsx.sessoes_whatsapp(session_id)
        """)
        print("[OK] Indice criado")

        # 3. Verificar enum status_sessao_whatsapp
        print("Verificando enum status_sessao_whatsapp...")
        cursor.execute("""
            SELECT enumlabel FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'status_sessao_whatsapp'
            AND t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'sgsx')
        """)
        result = cursor.fetchall()
        current_values = [r[0] for r in result]
        print(f"Valores atuais do enum: {current_values}")

        # Se enum tem valores em ingles, renomear para portugues
        if 'disconnected' in current_values:
            print("Renomeando valores do enum de ingles para portugues...")
            cursor.execute("ALTER TYPE sgsx.status_sessao_whatsapp RENAME VALUE 'disconnected' TO 'desconectada'")
            cursor.execute("ALTER TYPE sgsx.status_sessao_whatsapp RENAME VALUE 'connecting' TO 'conectando'")
            cursor.execute("ALTER TYPE sgsx.status_sessao_whatsapp RENAME VALUE 'connected' TO 'conectada'")
            cursor.execute("ALTER TYPE sgsx.status_sessao_whatsapp RENAME VALUE 'qr_code' TO 'erro'")
            print("[OK] Enum renomeado")
        else:
            print("[OK] Enum ja esta em portugues")

        print("\n[SUCESSO] Migracao concluida!")

    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
```

2. **Executei via Bash:**

```bash
cd C:\sgs-back && python run_migration_sync.py
```

3. **Resultado:**

```
Conectado ao banco de dados...
Adicionando coluna session_id...
[OK] Coluna session_id adicionada
Criando indice...
[OK] Indice criado
Verificando enum status_sessao_whatsapp...
Valores atuais do enum: ['desconectada', 'conectando', 'conectada', 'erro']
[OK] Enum ja esta em portugues

[SUCESSO] Migracao concluida!
```

### Observacoes Importantes

- **Nao usar caracteres Unicode** (acentos, emojis) nos prints - causa erro de encoding no Windows
- **psycopg2 ja esta instalado** no ambiente do backend
- **asyncpg NAO esta instalado** - usar psycopg2 (sincrono) ao inves de asyncpg
- **Operacoes com IF NOT EXISTS/IF EXISTS** sao seguras para rodar multiplas vezes
