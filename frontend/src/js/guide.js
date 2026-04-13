const API_BASE_URL = 'http://localhost:3000/api';
const POLL_INTERVAL_MS = 30000;

const menuBtn = document.querySelector('.menu-icon-btn');
const sidebar = document.querySelector('.sidebar');
const tabButtons = document.querySelectorAll('.sidebar-list-item.tab-content');
const sections = document.querySelectorAll('.section');

let _scheduleCache = [];
let _timelineTicker = null;
let _timelineRunning = false;
let _schedulePollInFlight = false;

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTabs();
  initNotificationControls();
  initScheduleControls();

  loadNotifications();
  setInterval(refreshActiveTab, POLL_INTERVAL_MS);

  window.addEventListener('focus', forceTimelineSync);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) forceTimelineSync();
  });
});

function initSidebar() {
  menuBtn?.addEventListener('click', () => sidebar?.classList.toggle('open'));
}

function isScheduleActive() {
  const idx = Array.from(tabButtons).findIndex((b) => b.classList.contains('active'));
  return idx === 1;
}

function initTabs() {
  tabButtons.forEach((btn, idx) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      document.querySelector('.sidebar-list-item.active')?.classList.remove('active');
      document.querySelector('.section.active')?.classList.remove('active');

      btn.classList.add('active');
      sections[idx]?.classList.add('active');

      if (idx === 0) {
        stopTimelineTicker();
        loadNotifications();
        return;
      }

      if (idx === 1) {
        await loadGuideSchedule(false);
        forceTimelineSync();
        startTimelineTicker();
      }
    });
  });
}

function refreshActiveTab() {
  const idx = Array.from(tabButtons).findIndex((b) => b.classList.contains('active'));
  if (idx === 0) loadNotifications();
  if (idx === 1) {
    if (!document.hidden) {
      updateAllTimelineHighlights();
      pollScheduleIfActive();
    }
  }
}

async function pollScheduleIfActive() {
  if (!isScheduleActive()) return;
  if (document.hidden) return;
  if (_schedulePollInFlight) return;

  _schedulePollInFlight = true;
  try {
    await loadGuideSchedule(false);
    forceTimelineSync();
  } catch (e) {
    console.error(e);
  } finally {
    _schedulePollInFlight = false;
  }
}

function getLoggedInUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    return Number(u.id || 0);
  } catch {
    return 0;
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(d) {
  if (!d) return 'Không xác định';
  const dt = new Date(d);
  if (isNaN(dt)) return 'Không xác định';
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

function formatDateTime(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, '0');
  const mi = String(dt.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

function mapRegion(regionId) {
  const regions = { 1: 'MIỀN BẮC', 2: 'MIỀN TRUNG', 3: 'MIỀN NAM' };
  return regions[Number(regionId)] || 'N/A';
}

async function fetchTourById(tourId) {
  const res = await fetch(`${API_BASE_URL}/tours/${Number(tourId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json.data || json;
}

async function finishTourApi(tourId, guideId) {
  const res = await fetch(`${API_BASE_URL}/tours/${Number(tourId)}/finish`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guide_id: Number(guideId) })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json;
}

async function fetchNotificationsByUser(userId) {
  const res = await fetch(`${API_BASE_URL}/notifications/user/${Number(userId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return Array.isArray(json) ? json : (json.data || []);
}

async function markNotificationRead(notificationId) {
  const res = await fetch(`${API_BASE_URL}/notifications/${Number(notificationId)}/read`, { method: 'PATCH' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json;
}

async function markAllNotificationsRead(userId) {
  const res = await fetch(`${API_BASE_URL}/notifications/user/${Number(userId)}/read-all`, { method: 'PATCH' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json;
}

async function deleteReadNotifications(userId) {
  const res = await fetch(`${API_BASE_URL}/notifications/user/${Number(userId)}/read`, { method: 'DELETE' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json;
}

function initNotificationControls() {
  document.getElementById('customer-noti-refresh-btn')?.addEventListener('click', loadNotifications);

  document.getElementById('customer-noti-readall-btn')?.addEventListener('click', async () => {
    try {
      const userId = getLoggedInUserId();
      if (!userId) return;
      await markAllNotificationsRead(userId);
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  });

  document.getElementById('customer-noti-delete-read-btn')?.addEventListener('click', async () => {
    try {
      const userId = getLoggedInUserId();
      if (!userId) return;
      await deleteReadNotifications(userId);
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  });
}

async function loadNotifications() {
  const list = document.getElementById('customer-noti-list');
  if (!list) return;

  const userId = getLoggedInUserId();
  if (!userId) {
    list.innerHTML = `<div class="customer-empty">Chưa đăng nhập</div>`;
    return;
  }

  try {
    list.innerHTML = `<div class="customer-empty">Đang tải dữ liệu...</div>`;
    let items = await fetchNotificationsByUser(userId);

    items = items.slice().sort((a, b) => {
      const da = new Date(a.created_at || a.createdAt || 0).getTime();
      const db = new Date(b.created_at || b.createdAt || 0).getTime();
      return db - da;
    });

    if (!items.length) {
      list.innerHTML = `<div class="customer-empty">Chưa có thông báo</div>`;
      return;
    }

    list.innerHTML = items.map((n) => {
      const id = n.id ?? n.notification_id ?? n.notificationId ?? '';
      const isRead = Number(n.is_read ?? n.isRead ?? 0) === 1;
      const title = isRead ? 'Thông báo' : 'Thông báo (chưa đọc)';
      const meta = formatDateTime(n.created_at || n.createdAt);

      return `
        <div class="customer-noti-item ${isRead ? '' : 'unread'}" data-id="${escapeHtml(id)}" data-read="${isRead ? '1' : '0'}">
          <div class="customer-noti-title">${escapeHtml(title)}</div>
          ${meta ? `<div class="customer-noti-meta">${escapeHtml(meta)}</div>` : ''}
          <div class="customer-noti-content">${escapeHtml(n.content || '')}</div>
        </div>`;
    }).join('');

    list.querySelectorAll('.customer-noti-item')?.forEach((el) => {
      el.addEventListener('click', async () => {
        const id = el.getAttribute('data-id');
        const alreadyRead = el.getAttribute('data-read') === '1';
        if (!id || alreadyRead) return;

        try {
          await markNotificationRead(id);
          loadNotifications();
        } catch (e) {
          console.error(e);
        }
      });
    });
  } catch (e) {
    console.error(e);
    list.innerHTML = `<div class="customer-empty">Lỗi tải thông báo</div>`;
  }
}

function initScheduleControls() {
  document.getElementById('customer-schedule-refresh-btn')?.addEventListener('click', async () => {
    await loadGuideSchedule(true);
    forceTimelineSync();
    startTimelineTicker();
  });
}

async function fetchScheduleByGuide(guideId) {
  const res = await fetch(`${API_BASE_URL}/tour-timeline/schedule/guide/${Number(guideId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return Array.isArray(json) ? json : (json.data || []);
}

async function fetchTimelineByTour(tourId) {
  const res = await fetch(`${API_BASE_URL}/tour-timeline/tour/${Number(tourId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return Array.isArray(json) ? json : (json.data || []);
}

function parseTimeToHms(timeStr) {
  const m = String(timeStr || '').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return { h: 0, m: 0, s: 0 };
  return { h: Number(m[1]) || 0, m: Number(m[2]) || 0, s: Number(m[3]) || 0 };
}

function localMidnightFromStartDate(startDate) {
  if (!startDate) return null;

  const s = String(startDate).trim();
  const pure = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (pure) {
    const y = Number(pure[1]), mo = Number(pure[2]), d = Number(pure[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    return new Date(y, mo - 1, d, 0, 0, 0, 0);
  }

  const dt = new Date(s);
  if (isNaN(dt)) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0);
}

function buildEventDateTime(tourStartDate, dayNumber, eventTimeStr) {
  const base = localMidnightFromStartDate(tourStartDate);
  if (!base) return null;

  const t = parseTimeToHms(eventTimeStr);
  const dn = Number(dayNumber || 1);
  const offsetDays = Math.max(0, dn - 1);

  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + offsetDays,
    t.h, t.m, t.s, 0
  );
}

function renderTimelineBarHTML(tourStartDate, timelineItems) {
  const nodes = (Array.isArray(timelineItems) ? timelineItems : [])
    .map(it => {
      const dt = buildEventDateTime(tourStartDate, it.day_number, it.event_time);
      return { ...it, _ts: dt ? dt.getTime() : NaN };
    })
    .filter(n => Number.isFinite(n._ts))
    .sort((a, b) => a._ts - b._ts);

  if (!nodes.length) return `<div class="customer-empty">Chưa có mốc lịch trình</div>`;

  const nodesHtml = nodes.map(n => {
    const time = String(n.event_time || '').slice(0, 5);
    const dayLabel = `Day ${n.day_number ?? 1}`;
    const place = n.location || 'Không rõ';
    return `
      <div class="tl-node" data-ts="${n._ts}">
        <div class="tl-time">${escapeHtml(time)}</div>
        <div class="tl-day">${escapeHtml(dayLabel)}</div>
        <div class="tl-dot"></div>
        <div class="tl-place">${escapeHtml(place)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="customer-timeline">
      <div class="tl-line"></div>
      <div class="tl-nodes">${nodesHtml}</div>
    </div>
  `;
}

async function loadGuideSchedule(forceReload = false) {
  const box = document.getElementById('customer-schedule-list');
  if (!box) return;

  const guideId = getLoggedInUserId();
  if (!guideId) {
    box.innerHTML = `<div class="customer-empty">Chưa đăng nhập</div>`;
    _scheduleCache = [];
    return;
  }

  try {
    box.innerHTML = `<div class="customer-empty">Đang tải dữ liệu...</div>`;

    const schedule = await fetchScheduleByGuide(guideId);

    const enriched = await Promise.all(schedule.map(async (t) => {
      const tourId = t.tour_id ?? t.tourId;

      let timeline = t.timeline || t.tour_timeline || t.timeline_items || null;
      if (!Array.isArray(timeline) && tourId) {
        try { timeline = await fetchTimelineByTour(tourId); }
        catch { timeline = []; }
      }

      let tourStatus = t.status || t.tour_status || null;
      if (!tourStatus && tourId) {
        try {
          const tour = await fetchTourById(tourId);
          tourStatus = tour?.status || null;
        } catch {
          tourStatus = null;
        }
      }

      return {
        ...t,
        tour_id: tourId,
        timeline: Array.isArray(timeline) ? timeline : [],
        status: tourStatus
      };
    }));

    _scheduleCache = enriched;
    renderGuideSchedule(_scheduleCache);

    if (forceReload) {
      requestAnimationFrame(() => {
        renderGuideSchedule(_scheduleCache);
        bindFinishButtons();
        updateAllTimelineHighlights();
      });
    } else {
      bindFinishButtons();
      updateAllTimelineHighlights();
    }
  } catch (e) {
    console.error(e);
    box.innerHTML = `<div class="customer-empty">Lỗi tải lịch trình</div>`;
    _scheduleCache = [];
  }
}

function renderGuideSchedule(items) {
  const box = document.getElementById('customer-schedule-list');
  if (!box) return;

  if (!items || !items.length) {
    box.innerHTML = `<div class="customer-empty">Chưa có lịch trình</div>`;
    return;
  }

  box.innerHTML = items.map((t) => {
    const tourId = t.tour_id ?? '';
    const tourName = t.tour_name || t.tourName || 'Tour';
    const regionName = t.region_name || t.regionName || mapRegion(t.region_id);
    const status = String(t.status || '').toUpperCase();

    const sub = `Từ ${formatDate(t.start_date)} đến ${formatDate(t.end_date)} • ${regionName} • Tối đa: ${t.max_participants ?? 'N/A'} • Trạng thái: ${status || 'N/A'}`;

    const canFinish = status === 'ONGOING';

    return `
      <div class="schedule-card" data-tour-id="${escapeHtml(tourId)}">
        <div class="schedule-title">${escapeHtml(tourName)}</div>
        <div class="schedule-sub">${escapeHtml(sub)}</div>

        <div class="schedule-actions">
          ${canFinish ? `
            <button class="schedule-finish-btn" type="button" data-finish-tour-id="${escapeHtml(tourId)}">
              <i class="fa-solid fa-flag-checkered"></i> Xác nhận kết thúc tour
            </button>
          ` : `
            <div class="schedule-actions-hint">Không thể kết thúc (chỉ khi tour đang ONGOING).</div>
          `}
        </div>

        ${renderTimelineBarHTML(t.start_date, t.timeline)}
      </div>
    `;
  }).join('');
}

function bindFinishButtons() {
  const guideId = getLoggedInUserId();
  if (!guideId) return;

  document.querySelectorAll('[data-finish-tour-id]')?.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tourId = Number(btn.getAttribute('data-finish-tour-id') || 0);
      if (!tourId) return;

      try {
        btn.disabled = true;
        btn.classList.add('is-loading');

        await finishTourApi(tourId, guideId);

        await loadGuideSchedule(true);
        loadNotifications();
      } catch (e) {
        console.error(e);
        alert(e?.message || 'Kết thúc tour thất bại');
      } finally {
        btn.disabled = false;
        btn.classList.remove('is-loading');
      }
    });
  });
}

function updateAllTimelineHighlights() {
  if (!isScheduleActive()) return;

  const nowMs = Date.now();
  const cards = Array.from(document.querySelectorAll('#customer-schedule-list .schedule-card'));

  for (const card of cards) {
    const nodes = Array.from(card.querySelectorAll('.tl-node[data-ts]'));
    if (!nodes.length) continue;

    const firstTs = Number(nodes[0].dataset.ts);
    const lastTs = Number(nodes[nodes.length - 1].dataset.ts);

    // Clear current states first
    for (const n of nodes) n.classList.remove('active', 'passed');

    if (!Number.isFinite(firstTs) || !Number.isFinite(lastTs)) continue;
    // Not started yet: nothing is active/passed
    if (nowMs < firstTs) continue;
    // Finished all events: everything passed, nothing active (avoid blinking forever)
    if (nowMs > lastTs) {
      for (const n of nodes) n.classList.add('passed');
      nodes[nodes.length - 1].classList.add('active');
      continue;
    }

    let activeIndex = -1;
    for (let i = 0; i < nodes.length; i++) {
      const ts = Number(nodes[i].dataset.ts);
      if (Number.isFinite(ts) && ts <= nowMs) activeIndex = i;
    }

    if (activeIndex === -1) continue;

    for (let i = 0; i < nodes.length; i++) {
      if (i < activeIndex) nodes[i].classList.add('passed');
      else if (i === activeIndex) nodes[i].classList.add('active');
    }
  }
}

function forceTimelineSync() {
  if (!isScheduleActive()) return;
  updateAllTimelineHighlights();
  requestAnimationFrame(updateAllTimelineHighlights);
}

function startTimelineTicker() {
  stopTimelineTicker();
  _timelineRunning = true;

  const tick = () => {
    if (!_timelineRunning) return;

    if (isScheduleActive() && !document.hidden) {
      updateAllTimelineHighlights();
    }

    const now = Date.now();
    const delay = 1000 - (now % 1000);
    _timelineTicker = setTimeout(tick, delay);
  };

  tick();
}

function stopTimelineTicker() {
  _timelineRunning = false;
  if (_timelineTicker) clearTimeout(_timelineTicker);
  _timelineTicker = null;
}
