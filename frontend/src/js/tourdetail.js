const API_BASE = 'http://localhost:3000/api';

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
	const json = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(json.error || json.message || `HTTP ${res.status}`);
	return json;
}

function unwrapApiData(payload) {
	if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
	return payload;
}

function normalizeStatus(value) {
	return String(value ?? '').trim().toUpperCase();
}

function formatDate(d) {
	if (!d) return 'Không xác định';
	const dt = new Date(d);
	if (isNaN(dt)) return 'Không xác định';
	return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

function computeDurationText(startDate, endDate) {
	const s = new Date(startDate);
	const e = new Date(endDate);
	if (isNaN(s) || isNaN(e)) return 'Không xác định';
	const ms = e.setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0);
	const days = Math.max(1, Math.floor(ms / (24 * 3600 * 1000)) + 1);
	const nights = Math.max(0, days - 1);
	return `${days} ngày ${nights} đêm`;
}

function getTourIdFromUrl() {
	try {
		const q = new URLSearchParams(window.location.search);
		const n = Number(q.get('tourId') ?? q.get('tour_id') ?? q.get('id'));
		return Number.isFinite(n) && n > 0 ? n : 0;
	} catch {
		return 0;
	}
}

async function fetchTourById(tourId) {
	const payload = await fetchJson(`${API_BASE}/tours/${Number(tourId)}`);
	return unwrapApiData(payload);
}

async function fetchRegions() {
	const payload = await fetchJson(`${API_BASE}/regions`);
	const regions = unwrapApiData(payload);
	return Array.isArray(regions) ? regions : [];
}

async function fetchTimelineByTour(tourId) {
	const payload = await fetchJson(`${API_BASE}/tour-timeline/tour/${Number(tourId)}`);
	const items = unwrapApiData(payload);
	return Array.isArray(items) ? items : [];
}

async function fetchTourImages(tourId) {
	try {
		const payload = await fetchJson(`${API_BASE}/tour-images/tour/${encodeURIComponent(tourId)}`);
		const images = unwrapApiData(payload);
		const items = Array.isArray(images) ? images : [];
		return items
			.map((img) => img?.image_url)
			.filter((u) => typeof u === 'string' && u.trim().length > 0);
	} catch {
		return [];
	}
}

function setText(id, value) {
	const el = document.getElementById(id);
	if (el) el.textContent = String(value ?? '');
}

function setHtml(id, html) {
	const el = document.getElementById(id);
	if (el) el.innerHTML = html;
}

function renderTimeline(containerId, timelineItems) {
	const box = document.getElementById(containerId);
	if (!box) return;

	if (!timelineItems.length) {
		box.innerHTML = `<div class="td-empty">Chưa có lịch trình</div>`;
		return;
	}

	const sorted = timelineItems
		.slice()
		.sort(
			(a, b) =>
				Number(a.day_number ?? 0) - Number(b.day_number ?? 0) ||
				String(a.event_time ?? '').localeCompare(String(b.event_time ?? ''))
		);

	box.innerHTML = sorted
		.map((t) => {
			const time = escapeHtml(String(t.event_time || '').slice(0, 5));
			const place = escapeHtml(t.place_name || '');
			const desc = escapeHtml(t.description || '');
			const day = Number(t.day_number ?? 0);
			const dayLabel = day ? `Ngày ${day}` : '';

			return `
				<div class="td-timeline-item">
					<div class="td-timeline-top">
						<div class="td-time">${time}${dayLabel ? ` • ${escapeHtml(dayLabel)}` : ''}</div>
						<div class="td-place">${place}</div>
					</div>
					<div class="td-desc">${desc}</div>
				</div>
			`.trim();
		})
		.join('');
}

function renderHeroSlides(imageUrls, title) {
	const wrapper = document.getElementById('tdHeroSlides');
	if (!wrapper) return;

	const urls = Array.isArray(imageUrls) ? imageUrls : [];
	const safeTitle = escapeHtml(title || 'Ảnh tour');

	const fallback = '../src/assets/image/icon_logo.png';
	const slides = (urls.length ? urls : [fallback]).map((u) => {
		const src = escapeHtml(u);
		return `
			<div class="td-hero-slide">
				<img src="${src}" alt="${safeTitle}">
			</div>
		`.trim();
	});

	wrapper.innerHTML = slides.join('');
	wireHeroNativeControls();
}

function wireHeroNativeControls() {
	const track = document.getElementById('tdHeroSlides');
	if (!track) return;

	const hero = track.closest('.td-hero-native');
	const prevBtn = hero ? hero.querySelector('.td-hero-prev') : null;
	const nextBtn = hero ? hero.querySelector('.td-hero-next') : null;

	const slideWidth = () => Math.max(1, track.clientWidth);
	const maxIndex = () => Math.max(0, track.children.length - 1);
	const currentIndex = () => Math.max(0, Math.min(maxIndex(), Math.round(track.scrollLeft / slideWidth())));

	const snapTo = (idx, behavior = 'smooth') => {
		const i = Math.max(0, Math.min(maxIndex(), Number(idx) || 0));
		track.scrollTo({ left: i * slideWidth(), behavior });
		updateNav();
	};

	const updateNav = () => {
		if (!prevBtn && !nextBtn) return;
		const i = currentIndex();
		const last = maxIndex();
		if (prevBtn) prevBtn.disabled = i <= 0;
		if (nextBtn) nextBtn.disabled = i >= last;
	};

	if (prevBtn) prevBtn.addEventListener('click', () => snapTo(currentIndex() - 1));
	if (nextBtn) nextBtn.addEventListener('click', () => snapTo(currentIndex() + 1));

	// Drag-to-scroll for desktop mouse
	let isDown = false;
	let startX = 0;
	let startScrollLeft = 0;
	let moved = false;

	track.addEventListener('mousedown', (e) => {
		isDown = true;
		moved = false;
		track.classList.add('is-dragging');
		startX = e.pageX;
		startScrollLeft = track.scrollLeft;
	});

	window.addEventListener('mouseup', () => {
		if (!isDown) return;
		isDown = false;
		track.classList.remove('is-dragging');
		// Snap after drag end
		if (moved) snapTo(currentIndex());
	});

	track.addEventListener('mouseleave', () => {
		if (!isDown) return;
		isDown = false;
		track.classList.remove('is-dragging');
		if (moved) snapTo(currentIndex());
	});

	track.addEventListener('mousemove', (e) => {
		if (!isDown) return;
		e.preventDefault();
		const walk = e.pageX - startX;
		if (Math.abs(walk) > 3) moved = true;
		track.scrollLeft = startScrollLeft - walk;
	});

	track.addEventListener('scroll', () => {
		// keep buttons in sync while user scrolls (touchpad, buttons, drag)
		updateNav();
	});

	window.addEventListener('resize', () => updateNav());
	updateNav();
}

let __booted = false;
async function boot() {
	if (__booted) return;

	// Wait until shared header is present
	if (!document.querySelector('header') || !document.getElementById('regionDropdown')) return;
	__booted = true;

	const tourId = getTourIdFromUrl();
	if (!tourId) {
		setText('tdTitle', 'Thiếu tourId');
		setHtml('tdTimeline', `<div class="td-empty">Vui lòng quay lại danh sách tour.</div>`);
		setTimeout(() => {
			window.location.href = 'showregions.html';
		}, 900);
		return;
	}

	// Load regions into header dropdown (best-effort)
	try {
		const regions = await fetchRegions();
		const dropdown = document.getElementById('regionDropdown');
		if (dropdown) {
			dropdown.innerHTML = [
				'<a href="showregions.html" data-region-id="" class="active">Tất cả</a>',
				...regions.map((r) => {
					const id = escapeHtml(r.region_id);
					const name = escapeHtml(r.region_name);
					return `<a href="showregions.html?regionId=${id}" data-region-id="${id}">${name}</a>`;
				}),
			].join('');
		}
	} catch {
		// ignore
	}

	// Show logged-in name (best-effort)
	try {
		const userInfoEl = document.getElementById('userInfo');
		const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
		if (userInfoEl) userInfoEl.textContent = loggedInUser?.name ? String(loggedInUser.name) : '';
	} catch {
		// ignore
	}

	try {
		const tour = await fetchTourById(tourId);
		const timeline = await fetchTimelineByTour(tourId);
		const allImages = await fetchTourImages(tourId);

		const title = tour?.tour_name || 'Tour';
		const regionName = tour?.region_name || '';

		setText('tdTitle', title);
		setText('tdSideTitle', title);

		const metaParts = [
			tour?.start_date ? `Khởi hành: ${formatDate(tour.start_date)}` : null,
			tour?.end_date ? `Kết thúc: ${formatDate(tour.end_date)}` : null,
			tour?.max_participants ? `Tối đa: ${tour.max_participants}` : null,
			regionName ? `Miền: ${regionName}` : tour?.region_id ? `Miền: ${tour.region_id}` : null,
		].filter(Boolean);
		setText('tdMeta', metaParts.join(' • '));

		renderHeroSlides(allImages, title);
		setText('tdHighlights', tour?.description || '—');

		setText('tdCode', tour?.tour_id || tourId);
		setText('tdDuration', computeDurationText(tour?.start_date, tour?.end_date));
		setText('tdStart', formatDate(tour?.start_date));
		setText('tdEnd', formatDate(tour?.end_date));
		setText('tdRegion', regionName || (tour?.region_id ?? 'N/A'));
		setText('tdMax', tour?.max_participants ?? 'N/A');
		setText('tdStatus', normalizeStatus(tour?.status) || 'N/A');

		const dateInput = document.getElementById('tdDate');
		if (dateInput) dateInput.value = formatDate(tour?.start_date);

		renderTimeline('tdTimeline', timeline);

		const status = normalizeStatus(tour?.status);
		const bookBtn = document.getElementById('tdBookBtn');
		const bookHint = document.getElementById('tdBookHint');
		if (bookBtn) {
			bookBtn.href = `booktour.html?tourId=${encodeURIComponent(tourId)}`;
			if (status !== 'OPEN') {
				bookBtn.classList.add('is-disabled');
				if (bookHint) bookHint.textContent = 'Tour hiện không ở trạng thái OPEN.';
			} else {
				if (bookHint) bookHint.textContent = '';
			}
		}
	} catch (e) {
		console.error(e);
		setText('tdTitle', 'Không tải được tour');
		setHtml('tdTimeline', `<div class="td-empty">Vui lòng kiểm tra backend API.</div>`);
	}
}

document.addEventListener('DOMContentLoaded', boot);
document.addEventListener('sharedHeader:loaded', boot);
