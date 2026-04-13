const API_BASE = 'http://localhost:3000/api';
const POLL_INTERVAL_MS = 30000;

let __showregionsPollTimer = null;

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
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

function isTourOpen(tour) {
  const status = String(tour?.status ?? '').trim().toUpperCase();
  return status === 'OPEN';
}

function getRegionIdFromUrl() {
  try {
    const regionId = new URLSearchParams(window.location.search).get('regionId');
    const n = Number(regionId);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
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
    const payload = await fetchJson(`${API_BASE}/tour-images/tour/${encodeURIComponent(tourId)}`);
    const images = unwrapApiData(payload);
    if (Array.isArray(images) && images.length > 0) {
      const main = images.find((img) => Number(img.is_main) === 1) ?? images[0];
      if (main?.image_url) return main.image_url;
    }
  } catch {
    // ignore
  }

  return '../src/assets/image/icon_logo.png';
}

function renderTours(gridEl, tours) {
  if (!gridEl) return;

  if (!tours.length) {
    gridEl.innerHTML = '<div class="tours-empty">Không có tour phù hợp.</div>';
    return;
  }

  gridEl.innerHTML = tours
    .map((t) => {
      const tourId = escapeHtml(t.tour_id);
      const title = escapeHtml(t.tour_name);
      const desc = escapeHtml(t.description ?? '');
      const regionName = escapeHtml(t.region_name ?? '');
      const start = escapeHtml(t.start_date ?? '');
      const end = escapeHtml(t.end_date ?? '');
      const maxP = escapeHtml(t.max_participants ?? '');
      const image = escapeHtml(t.__image_url || '../src/assets/image/icon_logo.png');
      const detailUrl = `tourdetail.html?tourId=${tourId}`;

      return `
        <div class="tour-card">
          <a href="${detailUrl}" class="tour-card-link" aria-label="Xem chi tiết ${title}">
            <img src="${image}" alt="${title}">
          </a>
          <div class="tour-card-body">
            <div class="tour-card-title"><a href="${detailUrl}" class="tour-card-link">${title}</a></div>
            <div class="tour-card-desc">${desc}</div>
            <div class="tour-card-meta">
              <div><b>Miền:</b> ${regionName || escapeHtml(String(t.region_id ?? ''))}</div>
              <div><b>Bắt đầu:</b> ${start}</div>
              <div><b>Kết thúc:</b> ${end}</div>
              <div><b>Tối đa:</b> ${maxP}</div>
            </div>
            <div class="tour-card-actions">
              <a class="btn" href="${detailUrl}">Chi tiết</a>
              <a class="btn" href="booktour.html?tourId=${tourId}">Đặt tour</a>
            </div>
          </div>
        </div>
      `.trim();
    })
    .join('');
}

async function loadTours(regionId) {
  const gridEl = document.getElementById('toursGrid');
  if (!gridEl) return;

  gridEl.innerHTML = '<div class="tours-empty">Đang tải dữ liệu...</div>';

  let tours;
  try {
    const payload = await fetchJson(`${API_BASE}/tours`);
    tours = unwrapApiData(payload);
  } catch {
    gridEl.innerHTML = '<div class="tours-empty">Không tải được danh sách tour.</div>';
    return;
  }

  let items = Array.isArray(tours) ? tours : [];
  items = items.filter(isTourOpen);
  if (regionId) items = items.filter((t) => Number(t.region_id) === Number(regionId));

  // Attach images (best-effort)
  items = await Promise.all(
    items.map(async (t) => {
      const imageUrl = await getTourMainImageUrl(t.tour_id);
      return { ...t, __image_url: imageUrl };
    })
  );

  renderTours(gridEl, items);
}

async function loadRegions(regionId) {
  const dropdownEl = document.getElementById('regionDropdown');
  const labelEl = document.getElementById('regionLabel');
  const titleRegionEl = document.getElementById('showregions-title-region');

  if (!dropdownEl) return;

  try {
    const payload = await fetchJson(`${API_BASE}/regions`);
    const regions = unwrapApiData(payload);
    const items = Array.isArray(regions) ? regions : [];

    dropdownEl.innerHTML = [
      `<a href="showregions.html" data-region-id="" class="${regionId ? '' : 'active'}">Tất cả</a>`,
      ...items.map((r) => {
        const id = escapeHtml(r.region_id);
        const name = escapeHtml(r.region_name);
        const active = Number(id) === Number(regionId) ? 'active' : '';
        return `<a href="showregions.html?regionId=${id}" data-region-id="${id}" class="${active}">${name}</a>`;
      }),
    ].join('');

    const current = items.find((r) => Number(r.region_id) === Number(regionId));
    const label = current ? String(current.region_name) : 'Tất cả';
    if (labelEl) labelEl.textContent = label;
    if (titleRegionEl) titleRegionEl.textContent = label;
  } catch {
    dropdownEl.innerHTML = '<a href="#" data-region-id="" class="active">(Lỗi tải danh mục)</a>';
    if (labelEl) labelEl.textContent = 'Tất cả';
    if (titleRegionEl) titleRegionEl.textContent = 'Tất cả';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Init may run before shared header is injected.
  bootShowregions();
});

let __showregionsBooted = false;
async function bootShowregions() {
  if (__showregionsBooted) return;
  const dropdownEl = document.getElementById('regionDropdown');
  if (!document.querySelector('header') || !dropdownEl) return;

  __showregionsBooted = true;
  setLoggedInUserName();
  wireOldMenuInteractions();

  const regionId = getRegionIdFromUrl();
  await loadRegions(regionId);
  await loadTours(regionId);

  if (__showregionsPollTimer) clearInterval(__showregionsPollTimer);
  __showregionsPollTimer = setInterval(async () => {
    if (document.hidden) return;
    const rid = getRegionIdFromUrl();
    await loadRegions(rid);
    await loadTours(rid);
  }, POLL_INTERVAL_MS);
}

document.addEventListener('sharedHeader:loaded', () => {
  bootShowregions();
});
