const c=window.SOUL_CONFIG||{};
if(!c.supabaseUrl||!c.supabaseKey||String(c.supabaseUrl).includes("COLE_")){
  document.body.innerHTML="<h2 style='padding:40px'>Configure o arquivo js/config.js com a URL e a publishable key do Supabase.</h2>";
}else{
  const db=supabase.createClient(c.supabaseUrl,c.supabaseKey);
  const $=id=>document.getElementById(id);
  const status=m=>{$("status").textContent=m||""};
  const clean=v=>{const s=String(v||"").trim();return s||null};

  async function auth(){const {data}=await db.auth.getSession();show(!!data.session)}
  function show(ok){
    $("login").hidden=ok;$("panel").hidden=!ok;
    if(ok){loadHome();loadAbout();loadMission();listEvents();listTestimonials();loadSettings()}
  }
  $("loginBtn").onclick=async()=>{
    const {error}=await db.auth.signInWithPassword({email:$("email").value,password:$("password").value});
    $("loginMsg").textContent=error?error.message:"";
    if(!error)show(true)
  };
  $("logout").onclick=async()=>{await db.auth.signOut();show(false)};

  document.querySelectorAll(".nav-btn[data-tab]").forEach(b=>b.onclick=()=>{
    document.querySelectorAll(".tab").forEach(x=>x.hidden=true);
    document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));
    $(b.dataset.tab).hidden=false;b.classList.add("active");status("");
  });

  async function getActive(table){
    const {data,error}=await db.from(table).select("*").eq("is_active",true).order("updated_at",{ascending:false}).limit(1).maybeSingle();
    if(error)throw error;return data;
  }
  async function upsertActive(table,obj){
    const old=await getActive(table);
    const q=old?db.from(table).update(obj).eq("id",old.id):db.from(table).insert(obj);
    const {error}=await q;if(error)throw error;
  }

  async function loadHome(){
    try{const d=await getActive("home_content");if(d){$("hTitle").value=d.title||"";$("hText").value=d.text||"";$("hMedia").value=d.background_url||""}}catch(e){status(e.message)}
  }
  $("saveHome").onclick=async()=>{
    try{status("Salvando...");await upsertActive("home_content",{title:$("hTitle").value,text:$("hText").value,background_url:clean($("hMedia").value),is_active:true,updated_at:new Date().toISOString()});status("Início salvo.")}catch(e){status(e.message)}
  };

  async function loadAbout(){
    try{const d=await getActive("about_content");if(d){$("aTitle").value=d.title||"";$("aText").value=d.text||"";$("aLarge").value=d.photo_large_url||"";$("a1").value=d.photo_1_url||"";$("a2").value=d.photo_2_url||"";$("a3").value=d.photo_3_url||""}}catch(e){status(e.message)}
  }
  $("saveAbout").onclick=async()=>{
    try{status("Salvando...");await upsertActive("about_content",{title:$("aTitle").value,text:$("aText").value,photo_large_url:clean($("aLarge").value),photo_1_url:clean($("a1").value),photo_2_url:clean($("a2").value),photo_3_url:clean($("a3").value),is_active:true,updated_at:new Date().toISOString()});status("Quem Somos salvo.")}catch(e){status(e.message)}
  };

  async function loadMission(){
    try{const d=await getActive("mission_content");if(d){$("mTitle").value=d.title||"";$("mText").value=d.text||"";$("m1").value=d.photo_1_url||"";$("m2").value=d.photo_2_url||"";$("m3").value=d.photo_3_url||"";$("m4").value=d.photo_4_url||""}}catch(e){status("Execute primeiro o novo supabase-schema.sql. "+e.message)}
  }
  $("saveMission").onclick=async()=>{
    try{status("Salvando...");await upsertActive("mission_content",{title:$("mTitle").value,text:$("mText").value,photo_1_url:clean($("m1").value),photo_2_url:clean($("m2").value),photo_3_url:clean($("m3").value),photo_4_url:clean($("m4").value),is_active:true,updated_at:new Date().toISOString()});status("Nossa Missão salva.")}catch(e){status(e.message)}
  };

  const subMap={"Casamento":["Teaser","Save the Date"],"15 anos":["Teaser","Save the Date"],"Corporativo":["Filmes","Eventos"]};
  function syncSubs(){
    const vals=subMap[$("eCat").value]||[];
    $("eSub").innerHTML=vals.map(v=>`<option>${v}</option>`).join("");
  }
  $("eCat").onchange=syncSubs;syncSubs();

  function addField(container,cls,placeholder,value=""){
    const row=document.createElement("div");row.className="dynamic-row";
    row.innerHTML=`<input class="${cls}" type="url" placeholder="${placeholder}"><button type="button" class="remove-field">×</button>`;
    row.querySelector("input").value=value;
    row.querySelector("button").onclick=()=>row.remove();
    $(container).appendChild(row);
  }
  $("addVideoField").onclick=()=>addField("videoFields","eventVideo","https://youtube.com/...");
  $("addPhotoField").onclick=()=>addField("photoFields","eventPhoto","https://...");
  addField("videoFields","eventVideo","https://youtube.com/...");
  for(let i=0;i<4;i++)addField("photoFields","eventPhoto","https://...");

  async function ids(cat,sub){
    let {data:a,error:e1}=await db.from("portfolio_categories").select("id").eq("name",cat).limit(1).maybeSingle();
    if(e1)throw e1;
    if(!a){const r=await db.from("portfolio_categories").insert({name:cat}).select("id").single();if(r.error)throw r.error;a=r.data}
    let {data:b,error:e2}=await db.from("portfolio_subcategories").select("id").eq("category_id",a.id).eq("name",sub).limit(1).maybeSingle();
    if(e2)throw e2;
    if(!b){const r=await db.from("portfolio_subcategories").insert({category_id:a.id,name:sub}).select("id").single();if(r.error)throw r.error;b=r.data}
    return b.id;
  }

  $("addEvent").onclick=async()=>{
    try{
      status("Adicionando...");
      const sid=await ids($("eCat").value,$("eSub").value);
      const {data:ev,error}=await db.from("portfolio_events").insert({subcategory_id:sid,title:$("eTitle").value,description:$("eText").value}).select().single();
      if(error)throw error;
      const vids=[...document.querySelectorAll(".eventVideo")].map(x=>clean(x.value)).filter(Boolean);
      const photos=[...document.querySelectorAll(".eventPhoto")].map(x=>clean(x.value)).filter(Boolean);
      for(let i=0;i<vids.length;i++){const r=await db.from("portfolio_videos").insert({event_id:ev.id,youtube_url:vids[i],sort_order:i});if(r.error)throw r.error}
      for(let i=0;i<photos.length;i++){const r=await db.from("portfolio_images").insert({event_id:ev.id,image_url:photos[i],sort_order:i});if(r.error)throw r.error}
      $("eTitle").value="";$("eText").value="";
      document.querySelectorAll(".eventVideo,.eventPhoto").forEach(x=>x.value="");
      status("Evento adicionado.");listEvents();
    }catch(e){status(e.message)}
  };

  async function listEvents(){
    const {data,error}=await db.from("portfolio_events").select("id,title,created_at").order("created_at",{ascending:false});
    if(error){status(error.message);return}
    $("eventList").innerHTML=(data||[]).map(x=>`<div class="item"><span>${x.title||"Sem título"}</span><button class="danger" onclick="delEvent('${x.id}')">Excluir</button></div>`).join("");
  }
  window.delEvent=async id=>{if(confirm("Excluir este evento e suas mídias?")){const {error}=await db.from("portfolio_events").delete().eq("id",id);if(error)status(error.message);else listEvents()}};

  $("addTestimonial").onclick=async()=>{
    try{
      status("Adicionando...");
      const {error}=await db.from("testimonials").insert({
        client_name:$("tName").value,testimonial_text:$("tText").value,media_type:$("tMediaType").value,
        media_url:clean($("tMedia").value),horizontal_photo_url:clean($("tHorizontal").value),is_published:true
      });
      if(error)throw error;
      $("tName").value="";$("tText").value="";$("tMedia").value="";$("tHorizontal").value="";
      status("Depoimento adicionado.");listTestimonials();
    }catch(e){status(e.message)}
  };
  async function listTestimonials(){
    const {data,error}=await db.from("testimonials").select("id,client_name").order("created_at",{ascending:false});
    if(error){status(error.message);return}
    $("testimonialList").innerHTML=(data||[]).map(x=>`<div class="item"><span>${x.client_name||"Sem nome"}</span><button class="danger" onclick="delT('${x.id}')">Excluir</button></div>`).join("");
  }
  window.delT=async id=>{if(confirm("Excluir este depoimento?")){const {error}=await db.from("testimonials").delete().eq("id",id);if(error)status(error.message);else listTestimonials()}};

  async function loadSettings(){
    try{
      const {data,error}=await db.from("site_settings").select("*").eq("id",1).maybeSingle();if(error)throw error;
      if(data){$("sWhatsapp").value=data.whatsapp_url||"";$("sInstagram").value=data.instagram_url||"";$("sInstagramLabel").value=data.instagram_label||"";$("sInstagram15").value=data.instagram_15_url||"";$("sInstagram15Label").value=data.instagram_15_label||""}
    }catch(e){status("Execute primeiro o novo supabase-schema.sql. "+e.message)}
  }
  $("saveSettings").onclick=async()=>{
    try{
      status("Salvando...");
      const obj={id:1,whatsapp_url:clean($("sWhatsapp").value),instagram_url:clean($("sInstagram").value),instagram_label:$("sInstagramLabel").value,instagram_15_url:clean($("sInstagram15").value),instagram_15_label:$("sInstagram15Label").value,updated_at:new Date().toISOString()};
      const {error}=await db.from("site_settings").upsert(obj);if(error)throw error;status("Contato e redes salvos.");
    }catch(e){status(e.message)}
  };

  auth();
}
