# Configuracao HTTPS - SGSx e GPVx

## Resumo

Todos os sistemas SGSx (Salao) e GPVx (Gabinete) foram configurados para usar **somente HTTPS** em desenvolvimento e producao.

**ATUALIZADO EM 09/01/2026:** Certificados Let's Encrypt emitidos para dominios cdxsistemas.com.br

---

## Configuracao Atual

### URLs por Ambiente

| Projeto | Desenvolvimento | Producao |
|---------|-----------------|----------|
| SGSx Frontend | https://localhost:8001/api/v1 | https://api-sgs.cdxsistemas.com.br:8001/api/v1 |
| GPVx Frontend | https://localhost:8000/api/v1 | https://api-gpvx.cdxsistemas.com.br:8000/api/v1 |
| SGSx Backend -> WhatsApp | https://localhost:3003 | https://ws-sgs.cdxsistemas.com.br:3003 |
| GPVx Backend -> WhatsApp | https://localhost:3001 | https://ws-gpvx.cdxsistemas.com.br:3001 |
| SGSx WhatsApp -> Backend | https://localhost:8001 | https://api-sgs.cdxsistemas.com.br:8001 |
| GPVx WhatsApp -> Backend | https://localhost:8000/api/v1 | https://api-gpvx.cdxsistemas.com.br:8000/api/v1 |

### Dominios de Producao (Let's Encrypt)

| Servico | Dominio | Porta |
|---------|---------|-------|
| SGSx Backend API | api-sgs.cdxsistemas.com.br | 8001 |
| GPVx Backend API | api-gpvx.cdxsistemas.com.br | 8000 |
| SGSx WhatsApp | ws-sgs.cdxsistemas.com.br | 3003 |
| GPVx WhatsApp | ws-gpvx.cdxsistemas.com.br | 3001 |
| SGSx Frontend | sgs.cdxsistemas.com.br | 443 |
| GPVx Frontend | gpvx.cdxsistemas.com.br | 443 |

---

## Certificados SSL

### Producao - Let's Encrypt (Validos)

Certificados emitidos em **09/01/2026**, validos ate **09/04/2026**.

| Arquivo | Localizacao |
|---------|-------------|
| Certificado original | C:\sgs-front\ssl-certsletsencryptconfig\live\api-sgs.cdxsistemas.com.br\ |
| `server.key` | C:\ssl-certs\, C:\sgs-back\, C:\gpvx-back\, C:\SGSx-Whatsapp\, C:\Gpvx-Whatsapp\ |
| `server.crt` | C:\ssl-certs\, C:\sgs-back\, C:\gpvx-back\, C:\SGSx-Whatsapp\, C:\Gpvx-Whatsapp\ |

**Comando para renovacao:**
```bash
certbot renew --config-dir C:\ssl-certs\letsencrypt\config --work-dir C:\ssl-certs\letsencrypt\work --logs-dir C:\ssl-certs\letsencrypt\logs
```

### Desenvolvimento - mkcert (Localhost)

Para desenvolvimento local, usar certificados mkcert:
```bash
cd C:\ssl-certs
mkcert localhost 127.0.0.1
```

---

## Arquivos de Configuracao

### SGSx (Salao)

| Arquivo | Ambiente | Conteudo Principal |
|---------|----------|-------------------|
| `C:\sgs-front\.env` | Dev | VITE_API_URL=https://localhost:8001/api/v1 |
| `C:\sgs-front\.env.production` | Prod | VITE_API_URL=https://api-sgs.cdxsistemas.com.br:8001/api/v1 |
| `C:\sgs-back\.env` | Dev | WHATSAPP_SERVICE_URL=https://localhost:3003 |
| `C:\sgs-back\.env.production` | Prod | WHATSAPP_SERVICE_URL=https://ws-sgs.cdxsistemas.com.br:3003 |
| `C:\SGSx-Whatsapp\.env` | Dev | BACKEND_URL=https://localhost:8001 |
| `C:\SGSx-Whatsapp\.env.production` | Prod | BACKEND_URL=https://api-sgs.cdxsistemas.com.br:8001 |

### GPVx (Gabinete)

| Arquivo | Ambiente | Conteudo Principal |
|---------|----------|-------------------|
| `C:\gpvx-front\.env` | Dev | VITE_API_URL=https://localhost:8000/api/v1 |
| `C:\gpvx-front\.env.production` | Prod | VITE_API_URL=https://api-gpvx.cdxsistemas.com.br:8000/api/v1 |
| `C:\gpvx-back\.env` | Dev | WHATSAPP_NODE_URL=https://localhost:3001 |
| `C:\gpvx-back\.env.production` | Prod | WHATSAPP_NODE_URL=https://ws-gpvx.cdxsistemas.com.br:3001 |
| `C:\Gpvx-Whatsapp\.env` | Dev | BACKEND_URL=https://localhost:8000/api/v1 |
| `C:\Gpvx-Whatsapp\.env.production` | Prod | BACKEND_URL=https://api-gpvx.cdxsistemas.com.br:8000/api/v1 |

---

## Como Iniciar os Servidores

### Scripts de Gerenciamento (Recomendado)

Use os scripts .bat com menu interativo:
- **SGSx:** `C:\Users\Administrator\Desktop\Sistema SALAO\`
- **GPVx:** `C:\Users\Administrator\Desktop\Sistema Gabinete Executar\`

Cada script oferece:
- **[1] DESENVOLVIMENTO** - usa localhost com mkcert
- **[2] PRODUCAO** - usa dominios cdxsistemas.com.br com Let's Encrypt

### Backends (FastAPI/Python)

```bash
# DESENVOLVIMENTO
cd C:\sgs-back && python main.py
cd C:\gpvx-back && python main.py

# PRODUCAO (usa .env.production)
cd C:\sgs-back && python main.py --production
cd C:\gpvx-back && python main.py --production
```

### WhatsApp Nodes

```bash
# DESENVOLVIMENTO
cd C:\SGSx-Whatsapp && npm run build && npm start
cd C:\Gpvx-Whatsapp && node src/index.js

# PRODUCAO (NODE_ENV=production)
cd C:\SGSx-Whatsapp && npm run build && npm run start:prod
cd C:\Gpvx-Whatsapp && set NODE_ENV=production && node src/index.js
```

### Frontends (Desenvolvimento)

```bash
# SGSx Frontend
cd C:\sgs-front && npm run dev

# GPVx Frontend
cd C:\gpvx-front && npm run dev
```

Para producao, os frontends sao servidos via IIS a partir da pasta `dist/`.

---

## Portas Utilizadas

| Servico | SGSx | GPVx |
|---------|------|------|
| Frontend Dev | 5173 | 5174 |
| Backend | 8001 | 8000 |
| WhatsApp Node | 3003 | 3001 |

---

## Troubleshooting

### Certificado Nao Confiavel

Como os certificados sao autoassinados, o navegador mostrara aviso de seguranca. Para desenvolvimento:
- Chrome: Clique em "Avancado" > "Continuar para localhost (inseguro)"
- Firefox: Clique em "Avancado" > "Aceitar o risco e continuar"

### Para Producao

Substitua os certificados autoassinados por certificados validos:
1. Obtenha certificados de uma CA (Let's Encrypt, Comodo, etc.)
2. Substitua `server.key` e `server.crt` nos projetos
3. Reinicie os servidores

### Erro de Conexao HTTPS

Se houver erro de conexao:
1. Verifique se os certificados existem nas pastas
2. Verifique se `SSL_KEYFILE` e `SSL_CERTFILE` estao configurados no `.env`
3. Verifique se as portas estao livres

---

*Documento atualizado em: 09 Janeiro 2026*
*Versao: 3.0 - HTTPS com Let's Encrypt e suporte Dev/Prod*
