# Soul Vídeo Histórias — versão requintada

Projeto criado do zero para o site público + painel administrativo.

## Estrutura
- `index.html`: site público
- `admin.html`: painel administrativo
- `style.css` / `admin.css`: identidade visual
- `js/config.js`: conexão com Supabase
- `js/site.js` / `js/admin.js`: lógica
- `assets/`: logo e símbolo gráfico fornecidos
- `supabase-schema.sql`: estrutura do banco

## Conectar ao Supabase
Abra `js/config.js` e substitua somente:
- `COLE_SUA_SUPABASE_URL_AQUI`
- `COLE_SUA_PUBLISHABLE_KEY_AQUI`

Use a **publishable/anon key**, nunca a `service_role`.

## Admin
Abra `admin.html` e entre com o usuário criado no Supabase Authentication.

O painel permite:
- alterar frase/texto e foto ou vídeo de fundo da Home;
- alterar texto, foto grande e 3 fotos de Quem Somos;
- adicionar eventos ilimitados em Casamento/15 anos → Teaser/Save the Date;
- cada evento: título, texto, YouTube e até 4 fotos;
- adicionar/remover depoimentos com foto ou vídeo.

## Contatos configurados
- Instagram Eventos: @soul.videohistorias
- Instagram 15 anos: @soul15anos
- WhatsApp: +55 32 98844-2521

## Observação
A Home aplica uma camada bege com 40% sobre a mídia de fundo, conforme solicitado.
