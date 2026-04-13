const API_BASE = 'http://localhost:3000/api';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message = payload?.message || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return res.json();
}

function unwrapApiData(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

function getTourIdFromUrl() {
  try {
    const tourId = new URLSearchParams(window.location.search).get('tourId');
    const n = Number(tourId);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function getLoggedInUser() {
  try {
    const u = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const id = Number(u?.id || 0);
    if (!id) return null;
    return {
      id,
      name: u?.name ? String(u.name) : '',
      email: u?.email ? String(u.email) : '',
    };
  } catch {
    return null;
  }
}

function setMessage(el, text) {
  if (!el) return;
  el.textContent = text || '';
}

function isTourOpen(tour) {
  const status = String(tour?.status ?? '').trim().toUpperCase();
  return status === 'OPEN';
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

async function loadRegionName(regionId) {
  try {
    const payload = await fetchJson(`${API_BASE}/regions`);
    const regions = unwrapApiData(payload);
    const items = Array.isArray(regions) ? regions : [];
    const r = items.find((x) => Number(x.region_id) === Number(regionId));
    return r?.region_name ? String(r.region_name) : '';
  } catch {
    return '';
  }
}

async function prefillUserFields(user) {
  const fullNameEl = document.getElementById('fullName');
  const emailEl = document.getElementById('email');
  const phoneEl = document.getElementById('phone');

  if (fullNameEl) fullNameEl.value = user?.name || '';
  if (emailEl) emailEl.value = user?.email || '';

  if (!user?.id || !phoneEl) return;

  try {
    const payload = await fetchJson(`${API_BASE}/users/${encodeURIComponent(user.id)}`);
    const data = unwrapApiData(payload);
    if (data?.phone) phoneEl.value = String(data.phone);
  } catch {
    // ignore
  }
}

async function renderTour(tourId) {
  const titleEl = document.getElementById('tourTitle');
  const descEl = document.getElementById('tourDesc');
  const imgEl = document.getElementById('tourImage');
  const idEl = document.getElementById('tourId');
  const regionEl = document.getElementById('tourRegion');
  const startEl = document.getElementById('tourStart');
  const endEl = document.getElementById('tourEnd');
  const maxEl = document.getElementById('tourMax');
  const statusEl = document.getElementById('tourStatus');
  const alertEl = document.getElementById('tourAlert');

  setMessage(alertEl, '');

  let tour;
  try {
    const payload = await fetchJson(`${API_BASE}/tours/${encodeURIComponent(tourId)}`);
    tour = unwrapApiData(payload);
  } catch (e) {
    if (titleEl) titleEl.textContent = 'Không tìm thấy tour';
    if (descEl) descEl.textContent = '';
    setMessage(alertEl, 'Tour không tồn tại hoặc không tải được dữ liệu.');
    return { ok: false, tour: null };
  }

  const imageUrl = await getTourMainImageUrl(tourId);
  if (imgEl) imgEl.src = imageUrl;

  const title = tour?.tour_name ? String(tour.tour_name) : `Tour #${tourId}`;
  const desc = tour?.description ? String(tour.description) : '';
  const status = String(tour?.status ?? '').trim().toUpperCase() || '-';

  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;
  if (idEl) idEl.textContent = String(tourId);
  if (startEl) startEl.textContent = tour?.start_date ? String(tour.start_date) : '-';
  if (endEl) endEl.textContent = tour?.end_date ? String(tour.end_date) : '-';
  if (maxEl) maxEl.textContent = tour?.max_participants != null ? String(tour.max_participants) : '-';
  if (statusEl) statusEl.textContent = status;

  const regionName = await loadRegionName(tour?.region_id);
  if (regionEl) regionEl.textContent = regionName || (tour?.region_id != null ? String(tour.region_id) : '-');

  if (!isTourOpen(tour)) {
    setMessage(alertEl, 'Tour hiện không ở trạng thái OPEN nên không thể đặt.');
    return { ok: false, tour };
  }

  return { ok: true, tour };
}

async function submitBooking({ tourId, userId, fullName, phone, email }) {
  // Best-effort: update user contact info
  try {
    await fetchJson(`${API_BASE}/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, phone, email }),
    });
  } catch {
    // ignore - booking can still proceed
  }

  const payload = await fetchJson(`${API_BASE}/bookings/book-and-close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tour_id: tourId, user_id: userId }),
  });

  return unwrapApiData(payload);
}

document.addEventListener('DOMContentLoaded', async () => {
  const tourId = getTourIdFromUrl();
  const bookingForm = document.getElementById('bookingForm');
  const messageEl = document.getElementById('bookingMessage');
  const submitBtn = document.getElementById('submitBookingBtn');

  if (!tourId) {
    setMessage(messageEl, 'Thiếu tourId. Vui lòng quay lại trang danh mục và chọn tour.');
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  const user = getLoggedInUser();
  if (!user) {
    setMessage(messageEl, 'Vui lòng đăng nhập để đặt tour.');
    // Keep UI visible, but prevent submit
    if (submitBtn) submitBtn.disabled = true;
  }

  await prefillUserFields(user);

  const { ok } = await renderTour(tourId);
  if (!ok && submitBtn) submitBtn.disabled = true;

  if (!bookingForm) return;

  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Vui lòng đăng nhập để đặt tour.');
      window.location.href = 'login.html';
      return;
    }

    const fullNameEl = document.getElementById('fullName');
    const phoneEl = document.getElementById('phone');
    const emailEl = document.getElementById('email');

    const fullName = String(fullNameEl?.value || '').trim();
    const phone = String(phoneEl?.value || '').trim();
    const email = String(emailEl?.value || '').trim();

    if (!fullName || !phone) {
      setMessage(messageEl, 'Vui lòng nhập Họ tên và Số điện thoại.');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    setMessage(messageEl, 'Đang gửi yêu cầu đặt tour...');

    try {
      await submitBooking({ tourId, userId: user.id, fullName, phone, email });
      setMessage(messageEl, 'Đặt tour thành công! Yêu cầu của bạn đang được xét duyệt.');
      setTimeout(() => {
        window.location.href = 'menu.html';
      }, 900);
    } catch (err) {
      const msg = err?.message || 'Đặt tour thất bại.';
      setMessage(messageEl, msg);
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
