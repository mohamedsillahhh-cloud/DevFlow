# DevFlow

Aplicação full-stack com duas interfaces independentes conectadas ao mesmo banco Supabase:

- **`web/`** – Interface web moderna (React + Vite) para gestão de projetos, finanças, investimentos e timer
- **Raiz** – Cliente desktop nativo desenvolvido em PyQt6

## Configuração do Ambiente

O projeto requer variáveis de ambiente específicas para cada interface:

### Cliente Desktop (PyQt6)
```
SUPABASE_URL=sua_url_aqui
SUPABASE_KEY=sua_chave_aqui
```

### Interface Web
```
VITE_ALLOWED_EMAIL=email@exemplo.com
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui
```

> ⚠️ **Importante**: A interface web utiliza apenas a chave anônima (pública) do Supabase. Nunca exponha a service key em aplicações client-side.

## Executando Localmente

### Interface Web
```bash
cd web
npm install
npm run dev
```

### Cliente Desktop
```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python main.py
```

## Gerando Executável

Para compilar o cliente desktop:
```bash
build.bat
```

## Deploy em Produção

O projeto está configurado para deploy no Render via `render.yaml`:

1. Criar novo **Static Site** no Render
2. Conectar este repositório
3. Configurar as variáveis de ambiente:
   - `VITE_ALLOWED_EMAIL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

> 📝 **Nota**: Apenas a interface web (`web/`) é servida no Render. O cliente PyQt6 permanece como aplicação desktop local.

OBRIGADO PELA ATENÇÃO
