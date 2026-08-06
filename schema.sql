
-- =====================================================
-- SCHEMA SUPABASE - SOUL VIDEO HISTORIA
-- =====================================================
-- Execute estes comandos no SQL Editor do Supabase

-- -----------------------------------------------------
-- TABELA: videos (Portfólio / Galerias)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    city TEXT DEFAULT 'Juiz de Fora - MG',
    description TEXT,
    video_id TEXT NOT NULL,
    poster_url TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_sort_order ON public.videos(sort_order);

-- -----------------------------------------------------
-- TABELA: depoimentos (Testimonials)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.depoimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    evento TEXT DEFAULT 'Evento',
    texto TEXT NOT NULL,
    media_type TEXT DEFAULT 'foto' CHECK (media_type IN ('foto', 'video')),
    media_src TEXT,
    video_id TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_depoimentos_sort_order ON public.depoimentos(sort_order);

-- -----------------------------------------------------
-- TABELA: site_images (Imagens do Site)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_key TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    label TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

-- Política: SELECT público (qualquer um pode visualizar)
CREATE POLICY "Allow public select on videos"
    ON public.videos FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public select on depoimentos"
    ON public.depoimentos FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public select on site_images"
    ON public.site_images FOR SELECT TO anon USING (true);

-- Política: INSERT/UPDATE/DELETE apenas para usuários autenticados (admin)
CREATE POLICY "Allow admin full access on videos"
    ON public.videos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin full access on depoimentos"
    ON public.depoimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin full access on site_images"
    ON public.site_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------
-- STORAGE: BUCKET 'media'
-- -----------------------------------------------------
-- Crie o bucket manualmente no painel do Supabase:
-- Nome: media
-- Tipo: Public (para leitura pública das imagens)
-- 
-- Políticas de Storage necessárias:
-- 1. SELECT: allow public access (para leitura das imagens no site)
-- 2. INSERT: allow authenticated users (apenas admin pode fazer upload)
-- 3. DELETE: allow authenticated users

-- -----------------------------------------------------
-- FUNÇÃO: Atualizar updated_at automaticamente
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON public.videos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------
-- DADOS INICIAIS (Opcional - para não começar vazio)
-- -----------------------------------------------------
INSERT INTO public.site_images (image_key, url, label, sort_order) VALUES
('hero-bg', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80', 'Background Inicial', 0),
('quem-somos', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', 'Quem Somos', 1)
ON CONFLICT (image_key) DO NOTHING;

INSERT INTO public.site_images (image_key, url, label, sort_order) VALUES
('missao-0', 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80', 'Afeto & Conexão', 2),
('missao-1', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80', 'Olhar Cinematográfico', 3),
('missao-2', 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80', 'Memória Eterna', 4)
ON CONFLICT (image_key) DO NOTHING;

INSERT INTO public.depoimentos (nome, evento, texto, media_type, media_src, video_id, sort_order) VALUES
('Mariana & Gabriel', 'Casamento', 'A Soul capturou cada momento do nosso dia de uma forma que nem imaginávamos. Quando assistimos ao filme, choramos de novo, como se estivéssemos revivendo tudo. A sensibilidade deles é incomparável.', 'foto', 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=300&q=80', NULL, 0),
('Isabela Ferreira', '15 Anos', 'Meus pais me deram de presente o filme da minha festa e foi a coisa mais linda que já recebi. Cada detalhe, cada sorriso, cada abraço... A Soul tem um dom de ver o que os outros não veem.', 'video', NULL, 'dQw4w9WgXcQ', 1),
('Carolina & Ricardo', 'Casamento', 'Contratamos a Soul por indicação e hoje nós é que indicamos para todo mundo. O cuidado, a atenção e o talento são fora do comum. Nosso filme é um tesouro que vamos guardar para sempre.', 'foto', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=300&q=80', NULL, 2)
ON CONFLICT DO NOTHING;

INSERT INTO public.videos (category, title, city, description, video_id, poster_url, photos, sort_order) VALUES
('casamentos', 'Mariana & Gabriel', 'Juiz de Fora - MG', 'Um dia leve, cercado pela natureza e por olhares emocionados. A Mariana e o Gabriel escolheram renovar os votos ao pôr do sol com a presença da família e amigos mais próximos.', 'dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', 
'["https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=300&q=80","https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=300&q=80","https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=300&q=80"]'::jsonb, 0)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CONFIGURAÇÃO DE AUTENTICAÇÃO
-- =====================================================
-- 1. No painel do Supabase, vá em Authentication > Settings
-- 2. Desative "Enable email confirmations" (se quiser login direto sem confirmação)
-- 3. Crie um usuário manualmente em Authentication > Users:
--    Email: admin@soulvideo.com.br
--    Senha: admin1234 (ou a senha desejada)
-- 4. O login no painel será feito via supabase.auth.signInWithPassword
