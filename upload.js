// Configuração do Supabase e função de Upload
// Lembre-se de substituir URL_DO_SEU_SUPABASE e CHAVE_ANON_DO_SUPABASE pelas suas chaves do painel
const supabaseUrl = 'https://SUA-URL-AQUI.supabase.co';
const supabaseKey = 'SUA-CHAVE-ANON-AQUI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

async function fazerUploadImagem(inputElement) {
  const arquivo = inputElement.files[0];
  if (!arquivo) {
    alert("Selecione um arquivo primeiro!");
    return;
  }

  // Gera um nome único para o arquivo usando a data/hora atual
  const caminhoArquivo = `background-${Date.now()}.${arquivo.name.split('.').pop()}`;

  // Faz o upload para o bucket IMAGENS (com letras maiúsculas)
  const { data, error } = await supabase.storage
    .from('IMAGENS')
    .upload(caminhoArquivo, arquivo, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error("Erro ao fazer upload:", error.message);
    alert("Erro no upload: " + error.message);
  } else {
    console.log("Upload com sucesso:", data);
    
    // Obter URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from('IMAGENS')
      .getPublicUrl(caminhoArquivo);
      
    alert("Background da página inicial atualizado!");
    
    // Exemplo: Atualiza a imagem de fundo na tela imediatamente
    document.body.style.backgroundImage = `url('${publicUrlData.publicUrl}')`;
  }
}