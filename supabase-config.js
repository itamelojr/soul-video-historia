// =====================================================
// SUPABASE CONFIGURAÇÃO GLOBAL
// =====================================================
// Substitua os valores abaixo pelas credenciais do seu projeto Supabase
// Encontradas em: Project Settings > API > Project URL / Project API keys > anon public

const SUPABASE_URL = 'https://SUA-URL-AQUI.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-CHAVE-ANON-AQUI';

// Inicializa o cliente Supabase globalmente
// Requer: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> no HTML
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bucket de Storage para uploads
const STORAGE_BUCKET = 'media';
