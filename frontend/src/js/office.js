const API_BASE_URL = 'http://localhost:3000/api';
const POLL_INTERVAL_MS = 30000;

const menuBtn = document.querySelector('.menu-icon-btn');
const sidebar = document.querySelector('.sidebar');
const tabButtons = document.querySelectorAll('.sidebar-list-item.tab-content');
const sections = document.querySelectorAll('.section');

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTabs();
  initFilters();

  loadToursStatus();
  setInterval(refreshActiveTab, POLL_INTERVAL_MS);
});

function initSidebar() {
  menuBtn?.addEventListener('click', () => sidebar?.classList.toggle('open'));
}

function initTabs() {
  tabButtons.forEach((btn, idx) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      document.querySelector('.sidebar-list-item.active')?.classList.remove('active');
      document.querySelector('.section.active')?.classList.remove('active');

      btn.classList.add('active');
      sections[idx]?.classList.add('active');

      if (idx === 0) {
        loadToursStatus(
          document.getElementById('office-tour-status')?.value || '',
          document.getElementById('tour-status-search-input')?.value || ''
        );
      } else if (idx === 1) {
        loadToursApproval(
          document.getElementById('approval-search-input')?.value || ''
        );
      }
    });
  });
}

function initFilters() {
  document.getElementById('office-tour-status')?.addEventListener('change', (e) => {
    loadToursStatus(
      e.target.value,
      document.getElementById('tour-status-search-input')?.value || ''
    );
  });

  document.getElementById('tour-status-search-btn')?.addEventListener('click', () => {
    loadToursStatus(
      document.getElementById('office-tour-status')?.value || '',
      document.getElementById('tour-status-search-input')?.value || ''
    );
  });

  document.getElementById('tour-status-search-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loadToursStatus(
        document.getElementById('office-tour-status')?.value || '',
        document.getElementById('tour-status-search-input')?.value || ''
      );
    }
  });

  document.getElementById('tour-status-refresh-btn')?.addEventListener('click', () => {
    const s = document.getElementById('office-tour-status');
    const q = document.getElementById('tour-status-search-input');
    if (s) s.value = '';
    if (q) q.value = '';
    loadToursStatus();
  });

  document.getElementById('approval-search-btn')?.addEventListener('click', () => {
    loadToursApproval(document.getElementById('approval-search-input')?.value || '');
  });

  document.getElementById('approval-search-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loadToursApproval(document.getElementById('approval-search-input')?.value || '');
    }
  });

  document.getElementById('approval-refresh-btn')?.addEventListener('click', () => {
    const q = document.getElementById('approval-search-input');
    if (q) q.value = '';
    loadToursApproval();
  });
}

function refreshActiveTab() {
  const activeIdx = Array.from(tabButtons).findIndex((b) => b.classList.contains('active'));

  if (activeIdx === 1) {
    loadToursApproval(document.getElementById('approval-search-input')?.value || '');
    return;
  }

  loadToursStatus(
    document.getElementById('office-tour-status')?.value || '',
    document.getElementById('tour-status-search-input')?.value || ''
  );
}

async function fetchTours() {
  const res = await fetch(`${API_BASE_URL}/tours`);
  const json = await res.json().catch(() => ({}));
  return Array.isArray(json) ? json : (json.data || []);
}

async function officeDecision(tourId, decision) {
  const res = await fetch(`${API_BASE_URL}/bookings/office-decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tour_id: Number(tourId), decision })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json;
}

async function officeDecisionWithGuide(tourId, decision, guideId) {
  const body = { tour_id: Number(tourId), decision };
  if (guideId) body.guide_id = Number(guideId);

  const res = await fetch(`${API_BASE_URL}/bookings/office-decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json;
}

async function fetchBookingsByStatus(status) {
  const res = await fetch(`${API_BASE_URL}/bookings/status/${encodeURIComponent(status)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return Array.isArray(json) ? json : (json.data || []);
}

async function fetchAvailableGuidesForTour(tourId) {
  const res = await fetch(`${API_BASE_URL}/assignments/available-guides/tour/${Number(tourId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return Array.isArray(json) ? json : (json.data || []);
}

async function loadToursStatus(status = '', search = '') {
  try {
    setTableMessage('office-show-tours-status', 7, 'Đang tải dữ liệu...');

    let tours = await fetchTours();
    const getStatus = (t) => String(t.status ?? '').trim().toUpperCase();

    if (status) {
      const target = String(status).toUpperCase();
      tours = tours.filter((t) => getStatus(t) === target);
    }

    if (search) {
      const key = search.toLowerCase();
      tours = tours.filter((t) => String(t.tour_name || '').toLowerCase().includes(key));
    }

    renderToursStatus(tours);
  } catch (err) {
    console.error('Tours status load error', err);
    setTableMessage('office-show-tours-status', 7, 'Lỗi tải dữ liệu');
  }
}

function renderToursStatus(tours) {
  const tbody = document.getElementById('office-show-tours-status');
  if (!tbody) return;
  if (!tours.length) return setTableMessage('office-show-tours-status', 7, 'Không có dữ liệu');

  tbody.innerHTML = tours.map((t) => {
    const status = String(t.status ?? '').trim().toUpperCase();
    return `<tr>
            <td>${escapeHtml(t.tour_id)}</td>
            <td>${escapeHtml(t.tour_name)}</td>
            <td>${formatDate(t.start_date)}</td>
            <td>${formatDate(t.end_date)}</td>
            <td>${escapeHtml(t.max_participants ?? 'N/A')}</td>
            <td><span class="status-badge ${status.toLowerCase()}">${mapTourStatusVi(status)}</span></td>
            <td>${mapRegion(t.region_id)}</td>
        </tr>`;
  }).join('');
}

async function loadToursApproval(search = '') {
  try {
    setTableMessage('office-show-tours-approval', 7, 'Đang tải dữ liệu...');

    const bookings = await fetchBookingsByStatus('PENDING');
    const pendingTourIds = new Set((Array.isArray(bookings) ? bookings : []).map((b) => Number(b.tour_id)).filter(Boolean));

    let tours = await fetchTours();
    const getStatus = (t) => String(t.status ?? '').trim().toUpperCase();

    // Chỉ hiện tour đã có booking PENDING và đang ở DRAFT
    tours = tours.filter((t) => pendingTourIds.has(Number(t.tour_id)) && getStatus(t) === 'DRAFT');

    if (search) {
      const key = search.toLowerCase();
      tours = tours.filter((t) => String(t.tour_name || '').toLowerCase().includes(key));
    }

    renderToursApproval(tours);
  } catch (err) {
    console.error('Tours approval load error', err);
    setTableMessage('office-show-tours-approval', 7, 'Lỗi tải dữ liệu');
  }
}

function renderToursApproval(tours) {
  const tbody = document.getElementById('office-show-tours-approval');
  if (!tbody) return;
  if (!tours.length) return setTableMessage('office-show-tours-approval', 7, 'Không có dữ liệu');

  tbody.innerHTML = tours.map((t) => {
    const tourId = t.tour_id;
    return `<tr>
            <td>${escapeHtml(tourId)}</td>
            <td>${escapeHtml(t.tour_name)}</td>
            <td>${formatDate(t.start_date)}</td>
            <td>${formatDate(t.end_date)}</td>
            <td><span class="status-badge draft">Chờ duyệt</span></td>
            <td>
                <select class="office-guide-select" data-tour-id="${escapeHtml(tourId)}">
                    <option value="">Đang tải...</option>
                </select>
            </td>
            <td>
                <button class="btn-action approve" data-action="approve" data-tour-id="${escapeHtml(tourId)}">
                    Duyệt
                </button>
                <button class="btn-action reject" data-action="reject" data-tour-id="${escapeHtml(tourId)}">
                    Từ chối
                </button>
            </td>
        </tr>`;
  }).join('');

  // Load available guides for each tour row
  tbody.querySelectorAll('select.office-guide-select')?.forEach(async (selectEl) => {
    const tourId = selectEl.getAttribute('data-tour-id');
    if (!tourId) return;

    try {
      const guides = await fetchAvailableGuidesForTour(tourId);
      if (!Array.isArray(guides) || guides.length === 0) {
        selectEl.innerHTML = '<option value="">Không có guide rảnh</option>';
        // Disable approve if no guide
        const approveBtn = tbody.querySelector(`button[data-action="approve"][data-tour-id="${CSS.escape(String(tourId))}"]`);
        if (approveBtn) approveBtn.disabled = true;
        return;
      }

      selectEl.innerHTML = [
        '<option value="">Chọn hướng dẫn viên</option>',
        ...guides.map((g) => `<option value="${escapeHtml(g.user_id)}">${escapeHtml(g.full_name)}</option>`)
      ].join('');
    } catch (e) {
      console.error(e);
      selectEl.innerHTML = '<option value="">Lỗi tải guide</option>';
      const approveBtn = tbody.querySelector(`button[data-action="approve"][data-tour-id="${CSS.escape(String(tourId))}"]`);
      if (approveBtn) approveBtn.disabled = true;
    }
  });

  tbody.querySelectorAll('button[data-action]')?.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tourId = btn.getAttribute('data-tour-id');
      const action = btn.getAttribute('data-action');
      if (!tourId || !action) return;

      btn.disabled = true;

      try {
        if (action === 'approve') {
          const selectEl = tbody.querySelector(`select.office-guide-select[data-tour-id="${CSS.escape(String(tourId))}"]`);
          const guideId = selectEl ? String(selectEl.value || '').trim() : '';
          if (!guideId) {
            alert('Vui lòng chọn hướng dẫn viên trước khi duyệt.');
            return;
          }
          await officeDecisionWithGuide(tourId, 'APPROVE', guideId);
        } else {
          await officeDecisionWithGuide(tourId, 'REJECT');
        }

        loadToursApproval(document.getElementById('approval-search-input')?.value || '');
        loadToursStatus(
          document.getElementById('office-tour-status')?.value || '',
          document.getElementById('tour-status-search-input')?.value || ''
        );
      } catch (err) {
        console.error(err);
        alert('Thao tác thất bại. Kiểm tra backend /api/bookings/office-decision');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function setTableMessage(tbodyId, colspan, message) {
  const el = document.getElementById(tbodyId);
  if (el) el.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;">${escapeHtml(message)}</td></tr>`;
}

function mapRegion(regionId) {
  const regions = { 1: 'MIỀN BẮC', 2: 'MIỀN TRUNG', 3: 'MIỀN NAM' };
  return regions[Number(regionId)] || 'N/A';
}

function mapTourStatusVi(s) {
  const key = String(s ?? '').trim().toUpperCase();
  const m = {
    DRAFT: 'Chờ duyệt',
    OPEN: 'Mở',
    CLOSED: 'Đóng',
    ONGOING: 'Đang diễn ra',
    FINISHED: 'Hoàn thành',
    CANCELLED: 'Từ chối/Đã hủy',
  };
  return m[key] || key || 'N/A';
}

function formatDate(d) {
  if (!d) return 'Không xác định';
  const dt = new Date(d);
  if (isNaN(dt)) return 'Không xác định';
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
