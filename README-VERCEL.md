# Soul Vídeo Histórias — pacote final para Vercel

Suba TODOS os arquivos e pastas deste pacote para a RAIZ do repositório.

Estrutura esperada:
- index.html
- admin.html
- style.css
- admin.css
- vercel.json
- assets/
- js/

Depois do deploy:
- site: https://SEU-DOMINIO.vercel.app/
- admin: https://SEU-DOMINIO.vercel.app/admin
- admin alternativo: https://SEU-DOMINIO.vercel.app/admin.html

IMPORTANTE:
O arquivo `js/config.js` deste pacote pode estar com placeholders.
Antes de subir ao GitHub, substitua esse arquivo pelo `config.js` que você já configurou no seu computador com:
- sua Supabase URL
- sua publishable key
- storageBucket: "imagens"

Nunca use a secret key/service_role no navegador.

Na Vercel:
- Framework Preset: Other
- Root Directory: deixe vazio ou `./`
- Build Command: vazio
- Output Directory: vazio
