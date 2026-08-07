const cfg=window.SOUL_CONFIG||{}; const ready=cfg.supabaseUrl&&!cfg.supabaseUrl.includes("COLE_")&&cfg.supabaseKey&&!cfg.supabaseKey.includes("COLE_");
const db=ready?supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey):null;
document.getElementById("year").textContent=new Date().getFullYear();
document.querySelector(".mobile-toggle").onclick=()=>document.querySelector(".nav").classList.toggle("open");
document.querySelectorAll(".accordion").forEach(b=>b.onclick=()=>{b.nextElementSibling.classList.toggle("open");b.querySelector("span").textContent=b.nextElementSibling.classList.contains("open")?"−":"+"});
document.querySelectorAll(".submenu button").forEach(b=>b.onclick=()=>loadPortfolio(b.dataset.category,b.dataset.sub));
const youtubeId=u=>{if(!u)return"";let m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/);return m?m[1]:""};
function setImg(id,url){let e=document.getElementById(id);if(url){e.src=url;e.classList.remove("placeholder")}}
async function loadBase(){
 if(!db)return;
 let {data:h}=await db.from("home_content").select("*").eq("is_active",true).limit(1).maybeSingle();
 if(h){homeTitle.textContent=h.title||homeTitle.textContent;homeText.textContent=h.text||homeText.textContent;if(h.background_url){if(/\.(mp4|webm|mov)(\?|$)/i.test(h.background_url)){heroMedia.innerHTML=`<video autoplay muted loop playsinline src="${h.background_url}"></video>`}else heroMedia.style.backgroundImage=`url("${h.background_url}")`}}
 let {data:a}=await db.from("about_content").select("*").eq("is_active",true).limit(1).maybeSingle();
 if(a){aboutTitle.textContent=a.title||"Quem Somos";aboutText.textContent=a.text||"";setImg("aboutLarge",a.photo_large_url);setImg("about1",a.photo_1_url);setImg("about2",a.photo_2_url);setImg("about3",a.photo_3_url)}
 loadTestimonials();
}
async function loadPortfolio(cat,sub){
 document.querySelectorAll(".submenu button").forEach(x=>x.classList.toggle("active",x.dataset.category===cat&&x.dataset.sub===sub));
 portfolioContent.innerHTML="<p class='muted'>Carregando histórias...</p>"; if(!db){portfolioContent.innerHTML="<div class='empty-state'><h3>Conecte o Supabase</h3><p>Preencha js/config.js para carregar os eventos.</p></div>";return}
 const {data:cats}=await db.from("portfolio_categories").select("id").eq("name",cat).limit(1); if(!cats?.length)return empty();
 const {data:subs}=await db.from("portfolio_subcategories").select("id").eq("category_id",cats[0].id).eq("name",sub).limit(1); if(!subs?.length)return empty();
 const {data:events}=await db.from("portfolio_events").select("*").eq("subcategory_id",subs[0].id).eq("is_published",true).order("sort_order");
 if(!events?.length)return empty();
 let html="";
 for(const e of events){let {data:vids}=await db.from("portfolio_videos").select("*").eq("event_id",e.id).eq("is_published",true).order("sort_order");let {data:imgs}=await db.from("portfolio_images").select("*").eq("event_id",e.id).order("sort_order").limit(4);let v=vids?.[0];html+=`<article class="event"><p class="eyebrow">${cat} · ${sub}</p><h3>${e.title}</h3><p class="event-copy">${e.description||""}</p>${v?`<div class="video-wrap"><iframe src="https://www.youtube.com/embed/${youtubeId(v.youtube_url)}" allowfullscreen loading="lazy"></iframe></div>`:""}<div class="event-images">${(imgs||[]).map(i=>`<img src="${i.image_url}" alt="${i.alt_text||e.title}" loading="lazy">`).join("")}</div></article>`}
 portfolioContent.innerHTML=html;
}
function empty(){portfolioContent.innerHTML="<div class='empty-state'><h3>Nenhum evento cadastrado ainda</h3><p>Adicione eventos pelo painel administrativo.</p></div>"}
async function loadTestimonials(){if(!db)return;let {data}=await db.from("testimonials").select("*").eq("is_published",true).order("sort_order");if(!data?.length)return;testimonialsGrid.innerHTML=data.map(t=>`<article class="testimonial">${t.media_url?(t.media_type==="video"?`<video src="${t.media_url}" controls playsinline></video>`:`<img src="${t.media_url}" alt="${t.client_name||"Depoimento"}" loading="lazy">`):""}<blockquote>“${t.testimonial_text||""}”</blockquote><p>${t.client_name||""}</p></article>`).join("")}
loadBase();