# Soul Vídeo Histórias — versão elegante

Pacote completo para publicação na Vercel com painel administrativo e Supabase.

## Ordem recomendada
1. No Supabase > SQL Editor, execute `supabase-schema.sql`.
2. No GitHub, substitua o conteúdo do repositório pelos arquivos deste pacote.
3. Mantenha a branch conectada à Vercel. O deploy deve iniciar automaticamente.
4. Teste `/` e `/admin`.

## Estrutura
- `index.html` — site público redesenhado.
- `style.css` — visual elegante, leve e responsivo.
- `admin.html` / `admin.css` — painel administrativo.
- `js/site.js` — leitura do Supabase e renderização do site.
- `js/admin.js` — gravação por URL, eventos, depoimentos, missão e contatos.
- `js/config.js` — URL + publishable key do Supabase.
- `supabase-schema.sql` — schema/migração do banco.
- `assets/logo.png` e `assets/simbolo.png` — identidade visual existente.
- `vercel.json` — mantém `/admin` funcionando.

## Mídia
O painel usa URLs públicas para fotos e vídeos. Não depende do bucket de Storage para upload.
Vídeos do portfólio usam links do YouTube e aceitam múltiplos vídeos por evento.
