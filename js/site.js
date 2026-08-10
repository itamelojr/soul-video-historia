const cfg = window.SOUL_CONFIG || {};

const ready =
  cfg.supabaseUrl &&
  !cfg.supabaseUrl.includes("COLE_") &&
  cfg.supabaseKey &&
  !cfg.supabaseKey.includes("COLE_");

const db = ready
  ? supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey)
  : null;


// ======================================================
// ANO DO RODAPÉ
// ======================================================

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


// ======================================================
// MENU MOBILE
// ======================================================

const mobileToggle = document.querySelector(".mobile-toggle");

if (mobileToggle) {
  mobileToggle.onclick = () => {
    const nav = document.querySelector(".nav");

    if (nav) {
      nav.classList.toggle("open");
    }
  };
}


// ======================================================
// ACORDEÃO DA GALERIA
// ======================================================

document.querySelectorAll(".accordion").forEach((button) => {
  button.onclick = () => {
    const submenu = button.nextElementSibling;

    if (!submenu) return;

    submenu.classList.toggle("open");

    const signal = button.querySelector("span");

    if (signal) {
      signal.textContent = submenu.classList.contains("open")
        ? "−"
        : "+";
    }
  };
});


// ======================================================
// BOTÕES DAS CATEGORIAS
// ======================================================

document.querySelectorAll(".submenu button").forEach((button) => {
  button.onclick = () => {
    loadPortfolio(
      button.dataset.category,
      button.dataset.sub
    );
  };
});


// ======================================================
// IDENTIFICAR ID DO YOUTUBE
// ======================================================

function youtubeId(url) {
  if (!url) return "";

  try {
    const value = url.trim();

    const patterns = [
      /youtu\.be\/([^?&/]+)/i,
      /youtube\.com\/watch\?v=([^?&/]+)/i,
      /youtube\.com\/embed\/([^?&/]+)/i,
      /youtube\.com\/shorts\/([^?&/]+)/i,
      /youtube\.com\/live\/([^?&/]+)/i
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);

      if (match && match[1]) {
        return match[1];
      }
    }

    return "";
  } catch (error) {
    console.error("Erro ao identificar vídeo do YouTube:", error);
    return "";
  }
}


// ======================================================
// COLOCAR IMAGEM
// ======================================================

function setImg(id, url) {
  const element = document.getElementById(id);

  if (!element || !url) return;

  element.src = url;
  element.classList.remove("placeholder");
}


// ======================================================
// CARREGAMENTO PRINCIPAL
// ======================================================

async function loadBase() {
  if (!db) return;

  // HOME
  const { data: home, error: homeError } = await db
    .from("home_content")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (homeError) {
    console.error("Erro ao carregar Início:", homeError);
  }

  if (home) {
    const homeTitle = document.getElementById("homeTitle");
    const homeText = document.getElementById("homeText");
    const heroMedia = document.getElementById("heroMedia");

    if (homeTitle && home.title) {
      homeTitle.textContent = home.title;
    }

    if (homeText && home.text) {
      homeText.textContent = home.text;
    }

    if (heroMedia && home.background_url) {
      if (/\.(mp4|webm|mov)(\?|$)/i.test(home.background_url)) {
        heroMedia.innerHTML = `
          <video
            autoplay
            muted
            loop
            playsinline
            src="${home.background_url}">
          </video>
        `;
      } else {
        heroMedia.style.backgroundImage =
          `url("${home.background_url}")`;
      }
    }
  }


  // QUEM SOMOS
  const { data: about, error: aboutError } = await db
    .from("about_content")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (aboutError) {
    console.error("Erro ao carregar Quem Somos:", aboutError);
  }

  if (about) {
    const aboutTitle = document.getElementById("aboutTitle");
    const aboutText = document.getElementById("aboutText");

    if (aboutTitle) {
      aboutTitle.textContent =
        about.title || "Quem Somos";
    }

    if (aboutText) {
      aboutText.textContent =
        about.text || "";
    }

    setImg("aboutLarge", about.photo_large_url);
    setImg("about1", about.photo_1_url);
    setImg("about2", about.photo_2_url);
    setImg("about3", about.photo_3_url);
  }


  loadTestimonials();
}


// ======================================================
// GALERIA / PORTFÓLIO
// ======================================================

async function loadPortfolio(category, subcategory) {
  document
    .querySelectorAll(".submenu button")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.category === category &&
        button.dataset.sub === subcategory
      );
    });

  const portfolioContent =
    document.getElementById("portfolioContent");

  if (!portfolioContent) return;

  portfolioContent.innerHTML =
    "<p class='muted'>Carregando histórias...</p>";


  if (!db) {
    portfolioContent.innerHTML = `
      <div class="empty-state">
        <h3>Conecte o Supabase</h3>
        <p>Preencha js/config.js para carregar os eventos.</p>
      </div>
    `;

    return;
  }


  // LOCALIZA A CATEGORIA
  const {
    data: categories,
    error: categoryError
  } = await db
    .from("portfolio_categories")
    .select("id")
    .eq("name", category)
    .limit(1);

  if (categoryError) {
    console.error(
      "Erro ao carregar categoria:",
      categoryError
    );

    return empty();
  }

  if (!categories?.length) {
    return empty();
  }


  // LOCALIZA A SUBCATEGORIA
  const {
    data: subcategories,
    error: subcategoryError
  } = await db
    .from("portfolio_subcategories")
    .select("id")
    .eq("category_id", categories[0].id)
    .eq("name", subcategory)
    .limit(1);

  if (subcategoryError) {
    console.error(
      "Erro ao carregar subcategoria:",
      subcategoryError
    );

    return empty();
  }

  if (!subcategories?.length) {
    return empty();
  }


  // BUSCA OS EVENTOS
  const {
    data: events,
    error: eventsError
  } = await db
    .from("portfolio_events")
    .select("*")
    .eq(
      "subcategory_id",
      subcategories[0].id
    )
    .eq("is_published", true)
    .order("sort_order", {
      ascending: true
    });

  if (eventsError) {
    console.error(
      "Erro ao carregar eventos:",
      eventsError
    );

    return empty();
  }

  if (!events?.length) {
    return empty();
  }


  let html = "";


  // ====================================================
  // CADA EVENTO
  // ====================================================

  for (const event of events) {

    // BUSCA TODOS OS VÍDEOS DO EVENTO
    const {
      data: videos,
      error: videosError
    } = await db
      .from("portfolio_videos")
      .select("*")
      .eq("event_id", event.id)
      .eq("is_published", true)
      .order("sort_order", {
        ascending: true
      });

    if (videosError) {
      console.error(
        `Erro ao carregar vídeos do evento ${event.title}:`,
        videosError
      );
    }


    // BUSCA AS FOTOS
    const {
      data: images,
      error: imagesError
    } = await db
      .from("portfolio_images")
      .select("*")
      .eq("event_id", event.id)
      .order("sort_order", {
        ascending: true
      })
      .limit(4);

    if (imagesError) {
      console.error(
        `Erro ao carregar imagens do evento ${event.title}:`,
        imagesError
      );
    }


    // ================================================
    // CORREÇÃO:
    // RENDERIZA TODOS OS VÍDEOS DO EVENTO
    // ================================================

    const videosHtml = (videos || [])
      .map((video) => {

        const id = youtubeId(
          video.youtube_url
        );

        if (!id) {
          console.warn(
            "Link do YouTube não reconhecido:",
            video.youtube_url
          );

          return "";
        }

        return `
          <div class="video-wrap">
            <iframe
              src="https://www.youtube.com/embed/${id}"
              title="${event.title || "Vídeo"}"
              loading="lazy"
              frameborder="0"
              allow="
                accelerometer;
                autoplay;
                clipboard-write;
                encrypted-media;
                gyroscope;
                picture-in-picture;
                web-share
              "
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen>
            </iframe>
          </div>
        `;
      })
      .join("");


    // FOTOS
    const imagesHtml = (images || [])
      .map((image) => {
        return `
          <img
            src="${image.image_url}"
            alt="${image.alt_text || event.title || "Evento"}"
            loading="lazy"
          >
        `;
      })
      .join("");


    // EVENTO COMPLETO
    html += `
      <article class="event">

        <p class="eyebrow">
          ${category} · ${subcategory}
        </p>

        <h3>
          ${event.title || ""}
        </h3>

        <p class="event-copy">
          ${event.description || ""}
        </p>

        ${videosHtml}

        ${
          imagesHtml
            ? `
              <div class="event-images">
                ${imagesHtml}
              </div>
            `
            : ""
        }

      </article>
    `;
  }


  portfolioContent.innerHTML = html;
}


// ======================================================
// ESTADO VAZIO
// ======================================================

function empty() {
  const portfolioContent =
    document.getElementById("portfolioContent");

  if (!portfolioContent) return;

  portfolioContent.innerHTML = `
    <div class="empty-state">
      <h3>Nenhum evento cadastrado ainda</h3>
      <p>
        Adicione eventos pelo painel administrativo.
      </p>
    </div>
  `;
}


// ======================================================
// DEPOIMENTOS
// ======================================================

async function loadTestimonials() {
  if (!db) return;

  const testimonialsGrid =
    document.getElementById("testimonialsGrid");

  if (!testimonialsGrid) return;

  const {
    data,
    error
  } = await db
    .from("testimonials")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", {
      ascending: true
    });

  if (error) {
    console.error(
      "Erro ao carregar depoimentos:",
      error
    );

    return;
  }

  if (!data?.length) return;

  testimonialsGrid.innerHTML = data
    .map((testimonial) => {

      let media = "";

      if (testimonial.media_url) {

        if (
          testimonial.media_type === "video"
        ) {
          media = `
            <video
              src="${testimonial.media_url}"
              controls
              playsinline>
            </video>
          `;
        } else {
          media = `
            <img
              src="${testimonial.media_url}"
              alt="${testimonial.client_name || "Depoimento"}"
              loading="lazy"
            >
          `;
        }
      }

      return `
        <article class="testimonial">

          ${media}

          <blockquote>
            “${testimonial.testimonial_text || ""}”
          </blockquote>

          <p>
            ${testimonial.client_name || ""}
          </p>

        </article>
      `;
    })
    .join("");
}


// ======================================================
// INICIAR SITE
// ======================================================

loadBase();
