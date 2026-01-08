# Certificados SSL Let's Encrypt - SGSx e GPVx

## Resumo

Este documento descreve o processo de emissao de certificados SSL validos do Let's Encrypt para os sistemas SGSx e GPVx.

---

## Dominios e Subdominios

### Dominio Principal
- **cdxsistemas.com.br**
- **www.cdxsistemas.com.br** (IP: 177.136.244.5)

### Subdominios a Criar no DNS

| Subdominio | Tipo | Valor | Porta | Servico |
|------------|------|-------|-------|---------|
| `api-sgs.cdxsistemas.com.br` | A | 177.136.244.5 | 8001 | Backend SGSx (Salao) |
| `api-gpvx.cdxsistemas.com.br` | A | 177.136.244.5 | 8000 | Backend GPVx (Gabinete) |
| `ws-sgs.cdxsistemas.com.br` | A | 177.136.244.5 | 3003 | WhatsApp SGSx |
| `ws-gpvx.cdxsistemas.com.br` | A | 177.136.244.5 | 3001 | WhatsApp GPVx |
| `sgs.cdxsistemas.com.br` | A | 177.136.244.5 | 443 | Frontend SGSx |
| `gpvx.cdxsistemas.com.br` | A | 177.136.244.5 | 443 | Frontend GPVx |

---

## Provedor DNS

- **Registro.br** (DNS autoritativo do dominio)
- Propagacao pode levar de 5 minutos a algumas horas

### Status dos Subdominios (Criados em 09/01/2026)

| Subdominio | Status |
|------------|--------|
| `api-sgs.cdxsistemas.com.br` | ATIVO - Certificado emitido |
| `api-gpvx.cdxsistemas.com.br` | ATIVO - Certificado emitido |
| `ws-sgs.cdxsistemas.com.br` | ATIVO - Certificado emitido |
| `ws-gpvx.cdxsistemas.com.br` | ATIVO - Certificado emitido |
| `sgs.cdxsistemas.com.br` | ATIVO - Certificado emitido |
| `gpvx.cdxsistemas.com.br` | ATIVO - Certificado emitido |

### Certificados Emitidos (09/01/2026)

- **Ferramenta usada:** certbot (Python)
- **Validade:** 09/01/2026 a 09/04/2026 (90 dias)
- **Localizacao:** `C:\sgs-front\ssl-certsletsencryptconfig\live\api-sgs.cdxsistemas.com.br\`
- **Arquivos:**
  - `fullchain.pem` - Certificado completo (copiado como server.crt)
  - `privkey.pem` - Chave privada (copiada como server.key)

### Verificar Propagacao

```bash
nslookup api-sgs.cdxsistemas.com.br
nslookup api-gpvx.cdxsistemas.com.br
nslookup ws-sgs.cdxsistemas.com.br
nslookup ws-gpvx.cdxsistemas.com.br
nslookup sgs.cdxsistemas.com.br
nslookup gpvx.cdxsistemas.com.br
```

Quando todos retornarem o IP 177.136.244.5, a propagacao esta completa.

---

## Ferramenta de Emissao

### Win-ACME (Windows ACME Client)
- Localizado em: `C:\ssl-certs\win-acme\`
- Executavel: `wacs.exe`
- Suporta validacao DNS via Cloudflare API

---

## Processo de Emissao de Certificados

### Passo 1: Criar Subdominios no Cloudflare

1. Acesse https://dash.cloudflare.com
2. Selecione o dominio cdxsistemas.com.br
3. Va em DNS > Records
4. Adicione cada subdominio da tabela acima como registro tipo A
5. **IMPORTANTE:** Desative o proxy (clique na nuvem laranja para ficar cinza)

### Passo 2: Obter API Token do Cloudflare

1. Acesse https://dash.cloudflare.com/profile/api-tokens
2. Clique em "Create Token"
3. Use o template "Edit zone DNS"
4. Em Zone Resources, selecione "cdxsistemas.com.br"
5. Clique "Continue to summary" > "Create Token"
6. Copie e guarde o token

### Passo 3: Emitir Certificados com Win-ACME

```powershell
cd C:\ssl-certs\win-acme
.\wacs.exe --target manual --host api-sgs.cdxsistemas.com.br,api-gpvx.cdxsistemas.com.br,ws-sgs.cdxsistemas.com.br,ws-gpvx.cdxsistemas.com.br,sgs.cdxsistemas.com.br,gpvx.cdxsistemas.com.br --validation dns-01 --validationmode dns-01 --dnscreatescript ./Scripts/Cloudflare.ps1 --dnsdeletescript ./Scripts/Cloudflare.ps1
```

Ou usar modo interativo:
```powershell
cd C:\ssl-certs\win-acme
.\wacs.exe
```

### Passo 4: Copiar Certificados para os Projetos

Apos emissao, os certificados estarao em:
- `C:\ProgramData\win-acme\acme-v02.api.letsencrypt.org\Certificates\`

Copiar para:
```powershell
copy "C:\ProgramData\win-acme\...\*.pem" C:\sgs-back\
copy "C:\ProgramData\win-acme\...\*.pem" C:\gpvx-back\
copy "C:\ProgramData\win-acme\...\*.pem" C:\SGSx-Whatsapp\
copy "C:\ProgramData\win-acme\...\*.pem" C:\Gpvx-Whatsapp\
```

### Passo 5: Atualizar Configuracoes

Atualizar arquivos .env com os novos dominios:

**SGSx Frontend (.env.production):**
```env
VITE_API_URL=https://api-sgs.cdxsistemas.com.br:8001/api/v1
VITE_WHATSAPP_API_URL=https://ws-sgs.cdxsistemas.com.br:3003
VITE_WHATSAPP_WS_URL=https://ws-sgs.cdxsistemas.com.br:3003
```

**GPVx Frontend (.env.production):**
```env
VITE_API_URL=https://api-gpvx.cdxsistemas.com.br:8000/api/v1
VITE_WHATSAPP_API_URL=https://ws-gpvx.cdxsistemas.com.br:3001/api/whatsapp
VITE_WHATSAPP_WS_URL=https://ws-gpvx.cdxsistemas.com.br:3001
```

### Passo 6: Rebuild dos Frontends

```bash
cd C:\sgs-front && npm run build
cd C:\gpvx-front && npm run build
```

### Passo 7: Executar em Modo Producao

Os backends foram configurados para suportar dois modos:
- **Desenvolvimento:** usa `.env` e certificados mkcert (localhost)
- **Producao:** usa `.env.production` e certificados Let's Encrypt (dominios)

#### Backends Python (SGSx/GPVx)

```bash
# Modo Desenvolvimento
cd C:\sgs-back && python main.py
cd C:\gpvx-back && python main.py

# Modo Producao (usa .env.production)
cd C:\sgs-back && python main.py --production
cd C:\gpvx-back && python main.py --production
```

#### WhatsApp Nodes

```bash
# Modo Desenvolvimento
cd C:\SGSx-Whatsapp && npm run start
cd C:\Gpvx-Whatsapp && node src/index.js

# Modo Producao (define NODE_ENV=production)
cd C:\SGSx-Whatsapp && npm run start:prod
cd C:\Gpvx-Whatsapp && set NODE_ENV=production && node src/index.js
```

#### Scripts .bat Atualizados

Use os scripts em:
- `C:\Users\Administrator\Desktop\Sistema SALAO\`
- `C:\Users\Administrator\Desktop\Sistema Gabinete Executar\`

Cada script tem opcoes:
- **[1] DESENVOLVIMENTO** - usa localhost/IPs
- **[2] PRODUCAO** - usa dominios cdxsistemas.com.br

---

## URLs Finais (Apos Configuracao)

### SGSx (Salao)
| Servico | URL |
|---------|-----|
| Frontend | https://sgs.cdxsistemas.com.br |
| Backend API | https://api-sgs.cdxsistemas.com.br:8001/api/v1 |
| Backend Docs | https://api-sgs.cdxsistemas.com.br:8001/docs |
| WhatsApp | https://ws-sgs.cdxsistemas.com.br:3003 |

### GPVx (Gabinete)
| Servico | URL |
|---------|-----|
| Frontend | https://gpvx.cdxsistemas.com.br |
| Backend API | https://api-gpvx.cdxsistemas.com.br:8000/api/v1 |
| Backend Docs | https://api-gpvx.cdxsistemas.com.br:8000/docs |
| WhatsApp | https://ws-gpvx.cdxsistemas.com.br:3001 |

---

## Renovacao Automatica

O Win-ACME configura automaticamente uma tarefa agendada no Windows para renovar os certificados antes de expirarem (a cada 60 dias).

Para verificar:
```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like "*acme*"}
```

---

## Troubleshooting

### Erro de DNS nao propagado
- Aguarde 5-10 minutos apos criar registros no Cloudflare
- Verifique com: `nslookup api-sgs.cdxsistemas.com.br`

### Erro de validacao DNS
- Certifique-se que o proxy do Cloudflare esta desativado
- Verifique se o API Token tem permissao para editar DNS

### Certificado nao reconhecido
- Verifique se copiou os arquivos .pem corretos
- Reinicie os servidores

---

## Arquivos de Certificado

| Arquivo | Descricao |
|---------|-----------|
| `fullchain.pem` ou `server.crt` | Certificado + cadeia intermediaria |
| `privkey.pem` ou `server.key` | Chave privada |

---

## Contato Cloudflare API

- Dashboard: https://dash.cloudflare.com
- API Tokens: https://dash.cloudflare.com/profile/api-tokens
- Documentacao: https://developers.cloudflare.com/api/

---

*Documento criado em: Janeiro 2026*
*Validade dos certificados Let's Encrypt: 90 dias (renovacao automatica)*
