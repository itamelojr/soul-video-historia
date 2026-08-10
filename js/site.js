(() => {
  "use strict";
  const cfg = window.SOUL_CONFIG || {};
  const configured = cfg.supabaseUrl && cfg.supabaseKey &&
    !String(cfg.supabaseUrl).includes("COLE_") &&
    !String(cfg.supabaseKey).includes("COLE_");
  const db = configured ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey) : null;
  const $ = id => document.getElementById(id);

  $("year").textContent = new Date().getFullYear();

  const topbar = $("topbar");
  window.addEventListener("scroll", () => topbar.classList.toggle("scrolled", window.scrollY > 20), {passive:true});

  const toggle = $("mobileToggle"), nav = $("mainNav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
  }, {threshold:.08});
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  function esc(v=""){
    return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function setImg(id,url){
    const el=$(id);
    if(!el) return;
    if(url){ el.src=url; el.style.visibility="visible"; }
    else { el.removeAttribute("src"); el.style.visibility="hidden"; }
  }
  function youtubeId(url){
    if(!url) return "";
    const m=String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/);
    return m ? m[1] : "";
  }
  function setHeroMedia(url){
    if(!url) return;
    const hero=$("heroMedia");
    if(/\.(mp4|webm|mov)(\?|$)/i.test(url)){
      hero.style.backgroundImage="none";
      hero.innerHTML=`<video autoplay muted loop playsinline preload="metadata" src="${esc(url)}"></video>`;
    }else{
      hero.innerHTML="";
      hero.style.backgroundImage=`url("${url.replace(/"/g,"%22")}")`;
    }
  }

  async function loadHome(){
    if(!db) return;
    const {data,error}=await db.from("home_content").select("*").eq("is_active",true).order("updated_at",{ascending:false}).limit(1).maybeSingle();
    if(error){console.error(error);return}
    if(!data)return;
    $("homeTitle").textContent=data.title||"Histórias que o tempo não apaga.";
    $("homeText").textContent=data.text||"";
    setHeroMedia(data.background_url);
  }

  async function loadAbout(){
    if(!db)return;
    const {data,error}=await db.from("about_content").select("*").eq("is_active",true).order("updated_at",{ascending:false}).limit(1).maybeSingle();
    if(error){console.error(error);return}
    if(!data)return;
    $("aboutTitle").textContent=data.title||"Quem Somos";
    $("aboutText").textContent=data.text||"";
    setImg("aboutLarge",data.photo_large_url);
    setImg("about1",data.photo_1_url);
    setImg("about2",data.photo_2_url);
    setImg("about3",data.photo_3_url);
  }

  async function loadMission(){
    if(!db)return;
    const {data,error}=await db.from("mission_content").select("*").eq("is_active",true).order("updated_at",{ascending:false}).limit(1).maybeSingle();
    if(error){console.warn("Missão:",error.message);return}
    if(!data)return;
    $("missionTitle").textContent=data.title||"Nossa Missão";
    $("missionText").textContent=data.text||"";
    setImg("mission1",data.photo_1_url);
    setImg("mission2",data.photo_2_url);
    setImg("mission3",data.photo_3_url);
    setImg("mission4",data.photo_4_url);
  }

  async function loadSettings(){
    if(!db)return;
    const {data,error}=await db.from("site_settings").select("*").eq("id",1).maybeSingle();
    if(error || !data)return;
    if(data.whatsapp_url){
      $("topWhatsapp").href=data.whatsapp_url;
      $("contactWhatsapp").href=data.whatsapp_url;
    }
    if(data.instagram_url){
      $("contactInstagram").href=data.instagram_url;
      $("contactInstagram").textContent=data.instagram_label||"@soul.videohistorias";
    }
    if(data.instagram_15_url){
      $("contactInstagram15").href=data.instagram_15_url;
      $("contactInstagram15").textContent=data.instagram_15_label||"@soul15anos";
    }
  }

  const subMap={
    "Casamento":["Teaser","Save the Date"],
    "15 anos":["Teaser","Save the Date"],
    "Corporativo":["Filmes","Eventos"]
  };
  let selectedCategory="Casamento", selectedSub="Teaser";

  function renderSubs(){
    const box=$("portfolioSubs");
    const items=subMap[selectedCategory]||[];
    if(!items.includes(selectedSub)) selectedSub=items[0]||"";
    box.innerHTML=items.map(s=>`<button class="portfolio-sub ${s===selectedSub?"active":""}" data-sub="${esc(s)}">${esc(s)}</button>`).join("");
    box.querySelectorAll("button").forEach(b=>b.onclick=()=>{
      selectedSub=b.dataset.sub; renderSubs(); loadPortfolio(selectedCategory,selectedSub);
    });
  }

  document.querySelectorAll(".portfolio-tab").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll(".portfolio-tab").forEach(b=>b.classList.toggle("active",b===btn));
    selectedCategory=btn.dataset.category;
    selectedSub=(subMap[selectedCategory]||[])[0]||"";
    renderSubs(); loadPortfolio(selectedCategory,selectedSub);
  });

  function showEmpty(area,msg="Ainda não há histórias cadastradas nesta categoria."){
    area.innerHTML=`<div class="empty-state"><img src="assets/simbolo.png" alt=""><h3>Em breve</h3><p>${esc(msg)}</p></div>`;
  }

  async function loadPortfolio(categoryName,subcategoryName){
    const area=$("portfolioContent");
    if(!db){showEmpty(area,"Supabase não configurado.");return}
    area.innerHTML='<p class="muted">Carregando histórias...</p>';

    const {data:cats,error:catErr}=await db.from("portfolio_categories").select("id").eq("name",categoryName).limit(1);
    if(catErr || !cats?.length){showEmpty(area);return}
    const {data:subs,error:subErr}=await db.from("portfolio_subcategories").select("id").eq("category_id",cats[0].id).eq("name",subcategoryName).limit(1);
    if(subErr || !subs?.length){showEmpty(area);return}

    const {data:events,error}=await db.from("portfolio_events")
      .select("id,title,description,created_at")
      .eq("subcategory_id",subs[0].id)
      .order("created_at",{ascending:false});
    if(error || !events?.length){showEmpty(area);return}

    const ids=events.map(e=>e.id);
    const [{data:videos},{data:images}]=await Promise.all([
      db.from("portfolio_videos").select("*").in("event_id",ids).order("sort_order",{ascending:true}),
      db.from("portfolio_images").select("*").in("event_id",ids).order("sort_order",{ascending:true})
    ]);

    area.innerHTML=events.map(ev=>{
      const evVideos=(videos||[]).filter(v=>v.event_id===ev.id);
      const evImages=(images||[]).filter(i=>i.event_id===ev.id);
      const videoHtml=evVideos.map(v=>{
        const yid=youtubeId(v.youtube_url);
        return yid ? `<div class="video-frame"><iframe loading="lazy" src="https://www.youtube.com/embed/${esc(yid)}" title="${esc(ev.title)}" allowfullscreen></iframe></div>` : "";
      }).join("");
      const photos=evImages.map(i=>`<img loading="lazy" src="${esc(i.image_url)}" alt="${esc(ev.title)}">`).join("");
      return `<article class="event-card">
        <div class="event-header"><h3>${esc(ev.title||"História")}</h3><p>${esc(ev.description||"")}</p></div>
        ${videoHtml?`<div class="video-grid">${videoHtml}</div>`:""}
        ${photos?`<div class="photo-grid">${photos}</div>`:""}
      </article>`;
    }).join("");
  }

  async function loadTestimonials(){
    if(!db)return;
    const {data,error}=await db.from("testimonials").select("*").eq("is_published",true).order("sort_order",{ascending:true}).order("created_at",{ascending:false});
    if(error){console.error(error);return}
    const grid=$("testimonialsGrid");
    if(!data?.length){grid.innerHTML='<p class="muted">Os depoimentos cadastrados no painel aparecerão aqui.</p>';return}
    grid.innerHTML=data.map(t=>{
      let media="";
      if(t.media_url){
        media=t.media_type==="video"
          ? `<video src="${esc(t.media_url)}" controls playsinline preload="metadata"></video>`
          : `<img src="${esc(t.media_url)}" alt="${esc(t.client_name||"Depoimento")}" loading="lazy">`;
      }
      const horizontal=t.horizontal_photo_url?`<img class="horizontal-photo" src="${esc(t.horizontal_photo_url)}" alt="" loading="lazy">`:"";
      return `<article class="testimonial">${media}<blockquote>“${esc(t.testimonial_text||"")}”</blockquote><p class="client">${esc(t.client_name||"")}</p>${horizontal}</article>`;
    }).join("");
  }

  renderSubs();
  loadHome();
  loadAbout();
  loadMission();
  loadSettings();
  loadTestimonials();
  loadPortfolio(selectedCategory,selectedSub);
})();
