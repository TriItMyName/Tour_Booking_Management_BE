const API_BASE = 'http://localhost:3000/api';
const POLL_INTERVAL_MS = 30000;
const MAX_SLIDES = 4;

let __menuPollTimer = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function unwrapApiData(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
}

function isTourOpen(tour) {
  const status = String(tour?.status ?? '').trim().toUpperCase();
  return status === 'OPEN';
}

function setLoggedInUserName() {
  const userInfoEl = document.getElementById('userInfo');
  if (!userInfoEl) return;

  try {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    userInfoEl.textContent = loggedInUser?.name ? String(loggedInUser.name) : '';
  } catch {
    userInfoEl.textContent = '';
  }
}

function wireOldMenuInteractions() {
  const menuBars = document.querySelector('#menu-bars');
  const navbar = document.querySelector('.navbar');
  const searchIcon = document.querySelector('#search-icon');
  const searchForm = document.querySelector('#search-form');
  const closeBtn = document.querySelector('#close');

  if (menuBars && navbar) {
    menuBars.addEventListener('click', () => {
      menuBars.classList.toggle('fa-times');
      navbar.classList.toggle('active');
    });
  }

  if (searchIcon && searchForm) {
    searchIcon.addEventListener('click', () => {
      searchForm.classList.add('active');
    });
  }

  if (closeBtn && searchForm) {
    closeBtn.addEventListener('click', () => {
      searchForm.classList.remove('active');
    });
  }

  window.addEventListener('scroll', () => {
    if (menuBars) menuBars.classList.remove('fa-times');
    if (navbar) navbar.classList.remove('active');
  });
}

async function getTourMainImageUrl(tourId) {
  try {
    const imagesPayload = await fetchJson(
      `${API_BASE}/tour-images/tour/${encodeURIComponent(tourId)}`
    );
    const images = unwrapApiData(imagesPayload);
    if (Array.isArray(images) && images.length > 0) {
      const main = images.find((img) => Number(img.is_main) === 1) ?? images[0];
      if (main?.image_url) return main.image_url;
    }
  } catch {
    // ignore
  }

  return '../src/assets/image/icon_logo.png';
}

function buildSlideHtml(tour, imageUrl) {
  const title = escapeHtml(tour?.tour_name);
  const desc = escapeHtml(tour?.description ?? 'Khám phá những chuyến đi đáng nhớ ngay hôm nay.');
  const tourId = tour?.tour_id;
  const detailHref = tourId ? `tourdetail.html?tourId=${encodeURIComponent(tourId)}` : 'showregions.html';

  return `
    <div class="swiper-slide slide">
      <div class="content">
        <span>Tour nổi bật</span>
        <h3>${title}</h3>
        <p>${desc}</p>
        <a href="${detailHref}" class="btn">Xem ngay</a>
      </div>
      <div class="image">
        <img src="${escapeHtml(imageUrl)}" alt="${title}">
      </div>
    </div>
  `.trim();
}

function initSwiper(slideCount) {
  if (typeof Swiper === 'undefined') return;

  if (window.__menuSwiper && typeof window.__menuSwiper.destroy === 'function') {
    window.__menuSwiper.destroy(true, true);
  }

  const loopEnabled = slideCount > 1;

  window.__menuSwiper = new Swiper('.home-slider', {
    spaceBetween: 160,
    centeredSlides: true,
    autoplay: {
      delay: 7500,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    loop: loopEnabled,
  });
}

async function loadFeaturedTours(slidesEl) {
  slidesEl.innerHTML = `
    <div class="swiper-slide slide">
      <div class="content">
        <span>Đang tải...</span>
        <h3>Tour nổi bật</h3>
        <p>Vui lòng chờ trong giây lát.</p>
      </div>
    </div>
  `;

  let tours;
  try {
    const toursPayload = await fetchJson(`${API_BASE}/tours`);
    tours = unwrapApiData(toursPayload);
  } catch {
    slidesEl.innerHTML = `
      <div class="swiper-slide slide">
        <div class="content">
          <span>Lỗi</span>
          <h3>Không tải được tour</h3>
          <p>Vui lòng kiểm tra backend API.</p>
        </div>
      </div>
    `;
    initSwiper(1);
    return;
  }

  const items = Array.isArray(tours) ? tours.filter(isTourOpen).slice(0, MAX_SLIDES) : [];

  if (items.length === 0) {
    slidesEl.innerHTML = `
      <div class="swiper-slide slide">
        <div class="content">
          <span>Không có dữ liệu</span>
          <h3>Chưa có tour</h3>
          <p>Hãy thử lại sau.</p>
        </div>
      </div>
    `;
    initSwiper(1);
    return;
  }

  const slideHtml = await Promise.all(
    items.map(async (tour) => {
      const imageUrl = await getTourMainImageUrl(tour.tour_id);
      return buildSlideHtml(tour, imageUrl);
    })
  );

  slidesEl.innerHTML = slideHtml.join('');
  initSwiper(items.length);
}

async function loadRegions(selectEl) {
  try {
    const regionsPayload = await fetchJson(`${API_BASE}/regions`);
    const regions = unwrapApiData(regionsPayload);
    const items = Array.isArray(regions) ? regions : [];

    if (items.length === 0) {
      selectEl.innerHTML = '<a href="#" data-region-id="">(Không có dữ liệu)</a>';
      return;
    }

    selectEl.innerHTML = [
      '<a href="showregions.html" data-region-id="" class="active">Tất cả</a>',
      ...items.map((r) => {
        const id = escapeHtml(r.region_id);
        const name = escapeHtml(r.region_name);
        return `<a href="showregions.html?regionId=${id}" data-region-id="${id}">${name}</a>`;
      }),
    ].join('');
  } catch {
    selectEl.innerHTML = '<a href="#" data-region-id="">(Lỗi tải danh mục)</a>';
  }
}

function wireRegionsDropdown(dropdownEl, labelEl) {
  if (!dropdownEl) return;

  dropdownEl.addEventListener('click', (e) => {
    const link = e.target instanceof Element ? e.target.closest('a[data-region-id]') : null;
    if (!link) return;

    const name = link.textContent?.trim() || 'Tất cả';
    if (labelEl) labelEl.textContent = name;

    for (const a of dropdownEl.querySelectorAll('a')) a.classList.remove('active');
    link.classList.add('active');
  });
}

let __menuInitialized = false;
function initMenuPage() {
  if (__menuInitialized) return;

  const slidesEl = document.getElementById('menu-slides');
  const regionDropdown = document.getElementById('regionDropdown');
  const regionLabel = document.getElementById('regionLabel');

  // Wait until shared header is present
  if (!document.querySelector('header') || !regionDropdown) return;

  __menuInitialized = true;

  setLoggedInUserName();
  wireOldMenuInteractions();

  if (regionDropdown) {
    wireRegionsDropdown(regionDropdown, regionLabel);
    loadRegions(regionDropdown);
  }
  if (slidesEl) loadFeaturedTours(slidesEl);

  if (__menuPollTimer) clearInterval(__menuPollTimer);
  __menuPollTimer = setInterval(() => {
    if (document.hidden) return;
    if (regionDropdown) loadRegions(regionDropdown);
    if (slidesEl) loadFeaturedTours(slidesEl);
  }, POLL_INTERVAL_MS);
}

document.addEventListener('DOMContentLoaded', initMenuPage);
document.addEventListener('sharedHeader:loaded', initMenuPage);
