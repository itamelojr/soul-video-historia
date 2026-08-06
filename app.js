// =====================================================
// SOUL VIDEO HISTORIA - APP.JS (Integrado ao Supabase)
// =====================================================

const defaultImg = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80';
const categoryLabels = {
    'casamentos': 'Filme Principal',
    'casamento-teasers': 'Teaser',
    'casamento-std': 'Save The Date',
    'xv': 'Filme Principal',
    'xv-teasers': 'Teaser',
    'xv-std': 'Save The Date'
};

// Cache local dos dados (carregados do Supabase)
let portfolioData = {};
let siteImages = {};
let depoimentosData = [];
let currentUser = null;

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function extractYouTubeID(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.trim();
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function generateId() {
    return 'story-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

function generateDepoId() {
    return 'depo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

// Upload de arquivo para o Supabase Storage
async function uploadToStorage(file, folder = '') {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = folder ? `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 8)}.${ext}` : `${Date.now()}-${Math.random().toString(36).substr(2, 8)}.${ext}`;

    const { data, error } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: true });

    if (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao fazer upload da imagem: ' + error.message);
        return null;
    }

    const { data: publicUrlData } = supabaseClient.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);

    return publicUrlData.publicUrl;
}

// =====================================================
// CARREGAMENTO DE DADOS DO SUPABASE
// =====================================================

async function loadPortfolio() {
    const { data, error } = await supabaseClient
        .from('videos')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Erro ao carregar vídeos:', error);
        return;
    }

    portfolioData = {};
    const categories = ['casamentos', 'casamento-teasers', 'casamento-std', 'xv', 'xv-teasers', 'xv-std'];
    categories.forEach(cat => portfolioData[cat] = []);

    data.forEach(video => {
        if (!portfolioData[video.category]) portfolioData[video.category] = [];
        portfolioData[video.category].push({
            dbId: video.id,
            id: video.id,
            title: video.title,
            city: video.city,
            desc: video.description,
            videoId: video.video_id,
            poster: video.poster_url,
            photos: Array.isArray(video.photos) ? video.photos : [defaultImg, defaultImg, defaultImg]
        });
    });
}

async function loadDepoimentos() {
    const { data, error } = await supabaseClient
        .from('depoimentos')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Erro ao carregar depoimentos:', error);
        return;
    }

    depoimentosData = data.map(d => ({
        dbId: d.id,
        id: d.id,
        nome: d.nome,
        evento: d.evento,
        texto: d.texto,
        mediaType: d.media_type,
        mediaSrc: d.media_src,
        videoId: d.video_id
    }));
}

async function loadSiteImages() {
    const { data, error } = await supabaseClient
        .from('site_images')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Erro ao carregar imagens do site:', error);
        return;
    }

    siteImages = {
        'quem-somos': defaultImg,
        'hero-bg': defaultImg,
        'missao': []
    };

    data.forEach(img => {
        if (img.image_key === 'quem-somos') {
            siteImages['quem-somos'] = img.url;
        } else if (img.image_key === 'hero-bg') {
            siteImages['hero-bg'] = img.url;
        } else if (img.image_key.startsWith('missao-')) {
            const idx = parseInt(img.image_key.replace('missao-', ''));
            siteImages.missao[idx] = { src: img.url, label: img.label || '' };
        }
    });
}

// =====================================================
// RENDERIZAÇÃO
// =====================================================

function renderPortfolio() {
    Object.keys(portfolioData).forEach(category => {
        const container = document.getElementById(`gallery-${category}`);
        if (!container) return;
        container.innerHTML = '';
        const videos = portfolioData[category];
        if (videos.length === 0) {
            container.innerHTML = `<div class="text-center py-16"><i class="fa-solid fa-film text-4xl text-brandGreen/20 mb-3"></i><p class="text-brandDark/40 text-sm">Nenhum vídeo cadastrado nesta categoria.</p></div>`;
            return;
        }
        videos.forEach((video, index) => {
            const card = createVideoCard(video, category, index);
            container.appendChild(card);
        });
    });
}

function createVideoCard(video, category, index) {
    const div = document.createElement('div');
    div.id = video.id;
    div.className = 'story-card bg-brandBeige rounded-3xl p-6 md:p-8 shadow-sm border border-brandGreen/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative mb-8';
    div.setAttribute('data-id', video.dbId);
    div.setAttribute('data-category', category);

    const posterSrc = video.poster || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
    const label = categoryLabels[category] || category;
    div.innerHTML = `
        <button onclick="deleteVideo('${category}', '${video.dbId}')" title="Excluir Vídeo" class="absolute top-4 right-4 z-20 w-9 h-9 bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white rounded-full flex items-center justify-center transition border border-red-200">
            <i class="fa-solid fa-trash-can text-sm"></i>
        </button>
        <div class="lg:col-span-7">
            <div class="aspect-video bg-brandDark rounded-2xl overflow-hidden relative group cursor-pointer shadow-md" onclick="openVideoPlayer('${video.videoId}')">
                <img src="${posterSrc}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
                <div class="absolute inset-0 bg-brandDark/30 flex items-center justify-center">
                    <i class="fa-solid fa-circle-play text-6xl text-brandWhite group-hover:text-brandOrange group-hover:scale-110 transition"></i>
                </div>
            </div>
        </div>
        <div class="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div>
                <span class="text-xs text-brandOrange font-semibold uppercase tracking-widest">${label}</span>
                <h3 class="text-2xl md:text-3xl font-serif text-brandGreen mt-1">${video.title}</h3>
                <p class="text-xs text-brandDark/50 mb-3">${video.city}</p>
                <div class="max-h-32 overflow-y-auto pr-2 story-text-scroll bg-white/40 p-3 rounded-xl border border-brandGreen/5">
                    <p class="text-sm text-brandDark/70 font-light leading-relaxed">${video.desc}</p>
                </div>
            </div>
            <div>
                <p class="text-xs font-medium uppercase tracking-wider text-brandGreen/80 mb-2">Registros do Evento</p>
                <div class="grid grid-cols-3 gap-2">
                    <img src="${video.photos[0] || defaultImg}" class="rounded-xl aspect-square object-cover" loading="lazy">
                    <img src="${video.photos[1] || defaultImg}" class="rounded-xl aspect-square object-cover" loading="lazy">
                    <img src="${video.photos[2] || defaultImg}" class="rounded-xl aspect-square object-cover" loading="lazy">
                </div>
            </div>
        </div>
    `;
    return div;
}

function renderDepoimentos() {
    const container = document.getElementById('depoimentos-container');
    if (!container) return;
    container.innerHTML = '';
    if (depoimentosData.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-12"><i class="fa-solid fa-comments text-4xl text-brandGreen/20 mb-3"></i><p class="text-brandDark/40 text-sm">Nenhum depoimento cadastrado ainda.</p></div>`;
        return;
    }
    depoimentosData.forEach(depo => {
        const card = createDepoimentoCard(depo);
        container.appendChild(card);
    });
}

function createDepoimentoCard(depo) {
    const div = document.createElement('div');
    div.id = depo.id;
    div.className = 'testimonial-card bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brandGreen/10 relative';
    div.setAttribute('data-id', depo.dbId);

    let mediaHTML = '';
    if (depo.mediaType === 'video' && depo.videoId) {
        const thumbUrl = `https://img.youtube.com/vi/${depo.videoId}/mqdefault.jpg`;
        mediaHTML = `<div class="testimonial-video-thumb w-16 h-16 rounded-full overflow-hidden border-2 border-brandOrange/30 mx-auto mb-4 relative" onclick="openVideoPlayer('${depo.videoId}')"><img src="${thumbUrl}" class="w-full h-full object-cover"><i class="fa-solid fa-circle-play text-white text-lg"></i></div>`;
    } else {
        const fotoSrc = depo.mediaSrc || defaultImg;
        mediaHTML = `<div class="w-16 h-16 rounded-full overflow-hidden border-2 border-brandOrange/30 mx-auto mb-4"><img src="${fotoSrc}" class="w-full h-full object-cover" alt="${depo.nome}"></div>`;
    }
    div.innerHTML = `
        <div class="text-center">
            ${mediaHTML}
            <div class="quote-mark mb-2">"</div>
            <p class="text-sm text-brandDark/70 font-light leading-relaxed mb-5 italic">${depo.texto}</p>
            <div class="w-8 h-0.5 bg-brandOrange mx-auto mb-3"></div>
            <h4 class="text-brandGreen font-serif text-lg">${depo.nome}</h4>
            <span class="text-[11px] text-brandOrange font-medium uppercase tracking-widest">${depo.evento}</span>
        </div>
    `;
    return div;
}

// =====================================================
// OPERAÇÕES CRUD - VÍDEOS (SUPABASE)
// =====================================================

async function addVideo(category, videoData) {
    const { data, error } = await supabaseClient
        .from('videos')
        .insert([{
            category: category,
            title: videoData.title,
            city: videoData.city,
            description: videoData.desc,
            video_id: videoData.videoId,
            poster_url: videoData.poster,
            photos: videoData.photos,
            sort_order: portfolioData[category] ? portfolioData[category].length : 0
        }])
        .select()
        .single();

    if (error) {
        console.error('Erro ao adicionar vídeo:', error);
        alert('Erro ao publicar história: ' + error.message);
        return null;
    }

    await loadPortfolio();
    renderPortfolio();
    return data;
}

async function deleteVideo(category, videoDbId) {
    if (!confirm('Deseja realmente apagar esta história do site?')) return;

    const { error } = await supabaseClient
        .from('videos')
        .delete()
        .eq('id', videoDbId);

    if (error) {
        console.error('Erro ao excluir vídeo:', error);
        alert('Erro ao excluir: ' + error.message);
        return;
    }

    await loadPortfolio();
    renderPortfolio();
    if (!document.getElementById('adminSubTabManage').classList.contains('hidden')) {
        renderAdminManageList();
    }
}

async function moveVideo(category, videoDbId, direction) {
    const arr = portfolioData[category];
    const idx = arr.findIndex(v => v.dbId === videoDbId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= arr.length) return;

    // Troca local
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];

    // Atualiza sort_order no banco para ambos
    const updates = arr.map((v, i) => ({
        id: v.dbId,
        sort_order: i
    }));

    const { error } = await supabaseClient
        .from('videos')
        .upsert(updates, { onConflict: 'id' });

    if (error) {
        console.error('Erro ao reordenar:', error);
        alert('Erro ao reordenar: ' + error.message);
        await loadPortfolio();
    }

    renderPortfolio();
    renderAdminManageList();
}

// =====================================================
// OPERAÇÕES CRUD - DEPOIMENTOS (SUPABASE)
// =====================================================

function toggleDepoMediaType() {
    const tipo = document.querySelector('input[name="depoMediaType"]:checked').value;
    if (tipo === 'foto') {
        document.getElementById('depoFotoInput').classList.remove('hidden');
        document.getElementById('depoVideoInput').classList.add('hidden');
    } else {
        document.getElementById('depoFotoInput').classList.add('hidden');
        document.getElementById('depoVideoInput').classList.remove('hidden');
    }
}

async function addDepoimento() {
    const nome = document.getElementById('depoNome').value.trim();
    const evento = document.getElementById('depoEvento').value.trim();
    const texto = document.getElementById('depoTexto').value.trim();
    const mediaType = document.querySelector('input[name="depoMediaType"]:checked').value;

    if (!nome || !texto) {
        alert('Preencha ao menos o Nome e o Texto do depoimento!');
        return;
    }

    let mediaSrc = null;
    let videoId = null;

    if (mediaType === 'foto') {
        const file = document.getElementById('depoFotoFile').files[0];
        if (file) {
            mediaSrc = await uploadToStorage(file, 'depoimentos');
        } else {
            mediaSrc = defaultImg;
        }
    } else {
        const url = document.getElementById('depoVideoUrl').value.trim();
        if (!url) {
            alert('Insira o link do vídeo do YouTube!');
            return;
        }
        videoId = extractYouTubeID(url);
    }

    const { data, error } = await supabaseClient
        .from('depoimentos')
        .insert([{
            nome: nome,
            evento: evento || 'Evento',
            texto: texto,
            media_type: mediaType,
            media_src: mediaSrc,
            video_id: videoId,
            sort_order: depoimentosData.length
        }])
        .select()
        .single();

    if (error) {
        console.error('Erro ao adicionar depoimento:', error);
        alert('Erro ao adicionar depoimento: ' + error.message);
        return;
    }

    await loadDepoimentos();
    renderDepoimentos();
    renderAdminDepoimentosList();

    document.getElementById('depoNome').value = '';
    document.getElementById('depoEvento').value = '';
    document.getElementById('depoTexto').value = '';
    document.getElementById('depoFotoFile').value = '';
    document.getElementById('depoVideoUrl').value = '';
    alert('Depoimento adicionado com sucesso!');
}

async function deleteDepoimento(id) {
    if (!confirm('Deseja realmente remover este depoimento?')) return;

    const { error } = await supabaseClient
        .from('depoimentos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir depoimento:', error);
        alert('Erro ao excluir: ' + error.message);
        return;
    }

    await loadDepoimentos();
    renderDepoimentos();
    renderAdminDepoimentosList();
}

async function moveDepoimento(id, direction) {
    const idx = depoimentosData.findIndex(d => d.dbId === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= depoimentosData.length) return;

    [depoimentosData[idx], depoimentosData[newIdx]] = [depoimentosData[newIdx], depoimentosData[idx]];

    const updates = depoimentosData.map((d, i) => ({
        id: d.dbId,
        sort_order: i
    }));

    const { error } = await supabaseClient
        .from('depoimentos')
        .upsert(updates, { onConflict: 'id' });

    if (error) {
        console.error('Erro ao reordenar depoimentos:', error);
        alert('Erro ao reordenar: ' + error.message);
        await loadDepoimentos();
    }

    renderDepoimentos();
    renderAdminDepoimentosList();
}

function renderAdminDepoimentosList() {
    const container = document.getElementById('adminDepoimentosList');
    if (!container) return;
    container.innerHTML = '';
    if (depoimentosData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-4 text-xs">Nenhum depoimento cadastrado.</p>';
        return;
    }
    depoimentosData.forEach((depo, index) => {
        const item = document.createElement('div');
        item.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 gap-2";
        const mediaIcon = depo.mediaType === 'video' ? '<i class="fa-brands fa-youtube text-red-500"></i>' : '<i class="fa-solid fa-image text-brandGreen"></i>';
        const previewSrc = depo.mediaType === 'video' ? `https://img.youtube.com/vi/${depo.videoId}/default.jpg` : (depo.mediaSrc || defaultImg);
        item.innerHTML = `
            <div class="flex items-center gap-2 min-w-0 flex-1">
                <img src="${previewSrc}" class="w-10 h-10 rounded-lg object-cover flex-shrink-0">
                <div class="min-w-0">
                    <span class="font-medium text-brandDark text-xs block truncate">${depo.nome}</span>
                    <span class="text-[10px] text-brandDark/50">${depo.evento} ${mediaIcon}</span>
                </div>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
                <button onclick="moveDepoimento('${depo.dbId}', -1)" ${index === 0 ? 'disabled' : ''} class="sort-btn w-7 h-7 rounded-full bg-brandGreen/10 text-brandGreen hover:bg-brandGreen hover:text-white flex items-center justify-center text-[10px]" title="Mover para cima"><i class="fa-solid fa-arrow-up"></i></button>
                <button onclick="moveDepoimento('${depo.dbId}', 1)" ${index === depoimentosData.length - 1 ? 'disabled' : ''} class="sort-btn w-7 h-7 rounded-full bg-brandGreen/10 text-brandGreen hover:bg-brandGreen hover:text-white flex items-center justify-center text-[10px]" title="Mover para baixo"><i class="fa-solid fa-arrow-down"></i></button>
                <button onclick="deleteDepoimento('${depo.dbId}')" class="w-7 h-7 rounded-full bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center text-[10px] transition" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(item);
    });
}

// =====================================================
// PLAYER DE VÍDEO (inalterado)
// =====================================================

function openVideoPlayer(videoId) {
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('videoPlayerContainer');
    container.innerHTML = `<iframe class="w-full h-full border-0" src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function closeVideoPlayer(event) {
    if (event.target === event.currentTarget) {
        forceCloseModal();
    }
}

function forceCloseModal() {
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('videoPlayerContainer');
    modal.classList.add('opacity-0');
    setTimeout(() => { modal.classList.add('hidden'); container.innerHTML = ''; }, 300);
}

// =====================================================
// NAVEGAÇÃO E TABS (inalterado)
// =====================================================

function switchTab(category) {
    document.querySelectorAll('.gallery-content').forEach(g => g.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-brandGreen', 'text-white');
        b.classList.add('bg-brandBeige', 'text-brandDark');
    });
    const targetGallery = document.getElementById(`gallery-${category}`);
    if (targetGallery) targetGallery.classList.remove('hidden');
    const activeBtn = document.getElementById(`tab-${category}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-brandGreen', 'text-white');
        activeBtn.classList.remove('bg-brandBeige', 'text-brandDark');
    }
}

// =====================================================
// AUTENTICAÇÃO ADMIN (SUPABASE AUTH)
// =====================================================

async function checkAdminSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        showAdminPanel();
    }
}

function showAdminPanel() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    renderAdminManageList();
    renderImagesAdmin();
    renderAdminDepoimentosList();
}

async function openAdminModal() {
    document.getElementById('adminModal').classList.remove('hidden');
    await checkAdminSession();
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

async function loginAdmin() {
    const email = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPass').value;

    if (!email || !password) {
        alert('Preencha usuário e senha!');
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        console.error('Erro de login:', error);
        alert('Credenciais inválidas: ' + error.message);
        return;
    }

    currentUser = data.user;
    showAdminPanel();
}

async function logoutAdmin() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
}

function switchAdminSubTab(tab) {
    const tabs = ['publish', 'manage', 'depoimentos', 'images'];
    tabs.forEach(t => {
        document.getElementById(`adminSubTab${t.charAt(0).toUpperCase() + t.slice(1)}`).classList.add('hidden');
        const btn = document.getElementById(`btn-tab-${t}`);
        btn.className = "pb-2 text-brandDark/60 hover:text-brandOrange px-4 whitespace-nowrap";
    });
    document.getElementById(`adminSubTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`btn-tab-${tab}`);
    activeBtn.className = "pb-2 border-b-2 border-brandOrange text-brandOrange font-semibold px-4 whitespace-nowrap";
    if (tab === 'manage') renderAdminManageList();
    if (tab === 'images') renderImagesAdmin();
    if (tab === 'depoimentos') renderAdminDepoimentosList();
}

// =====================================================
// CADASTRO DE NOVA HISTÓRIA (SUPABASE + STORAGE)
// =====================================================

async function addNewStory() {
    const cat = document.getElementById('newCategory').value;
    const title = document.getElementById('newTitle').value.trim();
    const city = document.getElementById('newCity').value.trim() || 'Juiz de Fora - MG';
    const desc = document.getElementById('newDesc').value.trim();
    const videoRaw = document.getElementById('newVideoUrl').value.trim();
    const posterInput = document.getElementById('newPosterFile');
    const file1 = document.getElementById('newPhoto1').files[0];
    const file2 = document.getElementById('newPhoto2').files[0];
    const file3 = document.getElementById('newPhoto3').files[0];

    if(!title || !desc || !videoRaw) { 
        alert('Preencha ao menos o Título, o Link do Vídeo e a Descrição!'); 
        return; 
    }

    const videoId = extractYouTubeID(videoRaw);

    // Uploads paralelos
    const [posterSrc, p1, p2, p3] = await Promise.all([
        posterInput.files && posterInput.files[0] ? uploadToStorage(posterInput.files[0], 'posters') : Promise.resolve(null),
        file1 ? uploadToStorage(file1, 'eventos') : Promise.resolve(defaultImg),
        file2 ? uploadToStorage(file2, 'eventos') : Promise.resolve(defaultImg),
        file3 ? uploadToStorage(file3, 'eventos') : Promise.resolve(defaultImg)
    ]);

    const newVideo = {
        title: title,
        city: city,
        desc: desc,
        videoId: videoId,
        poster: posterSrc,
        photos: [p1, p2, p3]
    };

    await addVideo(cat, newVideo);

    document.getElementById('newTitle').value = '';
    document.getElementById('newCity').value = '';
    document.getElementById('newDesc').value = '';
    document.getElementById('newVideoUrl').value = '';
    document.getElementById('newPosterFile').value = '';
    document.getElementById('newPhoto1').value = '';
    document.getElementById('newPhoto2').value = '';
    document.getElementById('newPhoto3').value = '';
    switchTab(cat);
    alert('História publicada com sucesso na categoria!');
}

// =====================================================
// GERENCIAMENTO ADMIN (lista)
// =====================================================

function renderAdminManageList() {
    const listContainer = document.getElementById('adminStoryList');
    const filter = document.getElementById('manageCategoryFilter').value;
    listContainer.innerHTML = '';
    let hasAny = false;
    Object.keys(portfolioData).forEach(category => {
        if (filter !== 'all' && filter !== category) return;
        const videos = portfolioData[category];
        if (videos.length === 0) return;
        hasAny = true;
        const catHeader = document.createElement('div');
        catHeader.className = "text-[10px] uppercase tracking-widest text-brandOrange font-bold mt-2 mb-1";
        catHeader.textContent = document.querySelector(`#tab-${category}`)?.textContent?.replace(/[\[\]]/g, '').trim() || category;
        listContainer.appendChild(catHeader);
        videos.forEach((video, index) => {
            const item = document.createElement('div');
            item.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 gap-2";
            item.innerHTML = `
                <div class="flex items-center gap-2 min-w-0 flex-1">
                    <img src="${video.photos[0] || defaultImg}" class="w-10 h-10 rounded-lg object-cover flex-shrink-0">
                    <div class="min-w-0">
                        <span class="font-medium text-brandDark text-xs block truncate">${video.title}</span>
                        <span class="text-[10px] text-brandDark/50">${video.city}</span>
                    </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                    <button onclick="moveVideo('${category}', '${video.dbId}', -1)" ${index === 0 ? 'disabled' : ''} class="sort-btn w-7 h-7 rounded-full bg-brandGreen/10 text-brandGreen hover:bg-brandGreen hover:text-white flex items-center justify-center text-[10px]" title="Mover para cima"><i class="fa-solid fa-arrow-up"></i></button>
                    <button onclick="moveVideo('${category}', '${video.dbId}', 1)" ${index === videos.length - 1 ? 'disabled' : ''} class="sort-btn w-7 h-7 rounded-full bg-brandGreen/10 text-brandGreen hover:bg-brandGreen hover:text-white flex items-center justify-center text-[10px]" title="Mover para baixo"><i class="fa-solid fa-arrow-down"></i></button>
                    <button onclick="deleteVideo('${category}', '${video.dbId}')" class="w-7 h-7 rounded-full bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center text-[10px] transition" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            listContainer.appendChild(item);
        });
    });
    if (!hasAny) {
        listContainer.innerHTML = '<p class="text-center text-gray-400 py-4 text-xs">Nenhuma história cadastrada.</p>';
    }
}

// =====================================================
// IMAGENS DO SITE (SUPABASE + STORAGE)
// =====================================================

async function renderImagesAdmin() {
    await loadSiteImages();

    const qsPreview = document.getElementById('preview-quem-somos');
    if (qsPreview) qsPreview.src = siteImages['quem-somos'];
    const heroPreview = document.getElementById('preview-hero-bg');
    if (heroPreview) heroPreview.src = siteImages['hero-bg'];

    const missaoContainer = document.getElementById('missao-images-admin');
    missaoContainer.innerHTML = '';

    // Garante 3 slots de missão
    for (let idx = 0; idx < 3; idx++) {
        const img = siteImages.missao[idx] || { src: defaultImg, label: ['Afeto & Conexão', 'Olhar Cinematográfico', 'Memória Eterna'][idx] };
        const row = document.createElement('div');
        row.className = "flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-brandGreen/10";
        row.innerHTML = `
            <img src="${img.src}" class="w-16 h-16 rounded-lg object-cover border border-brandGreen/10">
            <div class="flex-1">
                <p class="text-[11px] font-medium text-brandDark">${img.label}</p>
                <input type="file" accept="image/*" onchange="updateMissaoImage(${idx}, this)" class="w-full text-[10px] mt-1">
            </div>
        `;
        missaoContainer.appendChild(row);
    }
}

async function updateSiteImage(key, input) {
    const file = input.files[0];
    if (!file) return;

    const url = await uploadToStorage(file, 'site');
    if (!url) return;

    const { error } = await supabaseClient
        .from('site_images')
        .upsert({ image_key: key, url: url, label: key }, { onConflict: 'image_key' });

    if (error) {
        console.error('Erro ao salvar imagem:', error);
        alert('Erro ao salvar: ' + error.message);
        return;
    }

    siteImages[key] = url;
    const imgEl = document.getElementById(`img-${key}`);
    if (imgEl) imgEl.src = url;
    const previewEl = document.getElementById(`preview-${key}`);
    if (previewEl) previewEl.src = url;
    alert('Imagem atualizada com sucesso!');
}

async function updateHeroBackground(input) {
    const file = input.files[0];
    if (!file) return;

    const url = await uploadToStorage(file, 'site');
    if (!url) return;

    const { error } = await supabaseClient
        .from('site_images')
        .upsert({ image_key: 'hero-bg', url: url, label: 'Background Inicial' }, { onConflict: 'image_key' });

    if (error) {
        console.error('Erro ao salvar background:', error);
        alert('Erro ao salvar: ' + error.message);
        return;
    }

    siteImages['hero-bg'] = url;
    const heroBg = document.getElementById('hero-bg');
    if (heroBg) heroBg.style.backgroundImage = `url('${url}')`;
    const previewEl = document.getElementById('preview-hero-bg');
    if (previewEl) previewEl.src = url;
    alert('Background da página inicial atualizado!');
}

async function updateMissaoImage(index, input) {
    const file = input.files[0];
    if (!file) return;

    const url = await uploadToStorage(file, 'site');
    if (!url) return;

    const labels = ['Afeto & Conexão', 'Olhar Cinematográfico', 'Memória Eterna'];
    const key = `missao-${index}`;

    const { error } = await supabaseClient
        .from('site_images')
        .upsert({ 
            image_key: key, 
            url: url, 
            label: labels[index],
            sort_order: index + 2
        }, { onConflict: 'image_key' });

    if (error) {
        console.error('Erro ao salvar imagem da missão:', error);
        alert('Erro ao salvar: ' + error.message);
        return;
    }

    siteImages.missao[index] = { src: url, label: labels[index] };
    const imgEl = document.getElementById(`missao-img-${index}`);
    if (imgEl) imgEl.src = url;
    renderImagesAdmin();
    alert('Imagem da galeria atualizada!');
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Mostra estado de carregamento
    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer) {
        galleryContainer.innerHTML = '<div class="text-center py-12"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-brandOrange mb-3"></i><p class="text-brandDark/50 text-sm">Carregando histórias...</p></div>';
    }

    await loadPortfolio();
    await loadDepoimentos();
    await loadSiteImages();

    // Aplica imagens do site
    const heroBg = document.getElementById('hero-bg');
    if (heroBg && siteImages['hero-bg']) heroBg.style.backgroundImage = `url('${siteImages['hero-bg']}')`;

    const imgQuemSomos = document.getElementById('img-quem-somos');
    if (imgQuemSomos && siteImages['quem-somos']) imgQuemSomos.src = siteImages['quem-somos'];

    siteImages.missao.forEach((img, idx) => {
        const el = document.getElementById(`missao-img-${idx}`);
        if (el && img) el.src = img.src;
    });

    renderPortfolio();
    renderDepoimentos();
    switchTab('casamentos');

    // Verifica sessão admin em background
    await checkAdminSession();
});
