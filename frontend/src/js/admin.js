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
    loadDashboard();
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
            switch (idx) {
                case 0: loadDashboard(); break;
                case 1: loadUsers(); break;
                case 2: loadTours(); break;
                case 3: loadBookings(); break;
                case 4: loadLoginHistory(); break;
            }
        });
    });
}

// Dashboard totals
async function loadDashboard() {
    try {
        const [usersRes, toursRes, bookingsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/users`),
            fetch(`${API_BASE_URL}/tours`),
            fetch(`${API_BASE_URL}/bookings`)
        ]);
        const usersJson = await usersRes.json();
        const toursJson = await toursRes.json();
        const bookingsJson = await bookingsRes.json();
        const users = Array.isArray(usersJson) ? usersJson : usersJson.data || [];
        const tours = Array.isArray(toursJson) ? toursJson : toursJson.data || [];
        const bookings = Array.isArray(bookingsJson) ? bookingsJson : bookingsJson.data || [];

        const nonAdminUsers = users.filter((u) => Number(u.role_id) !== 5);
        setText('total-users', nonAdminUsers.length);
        setText('total-tours', tours.length);
        setText('total-bookings', bookings.length);
    } catch (err) {
        console.error('Dashboard load error', err);
    }
}

// Users
async function loadUsers(status = '', search = '') {
    try {
        const res = await fetch(`${API_BASE_URL}/users`);
        const json = await res.json();
        let users = Array.isArray(json) ? json : json.data || [];
        // Loại bỏ admin (role_id = 5)
        users = users.filter(u => Number(u.role_id) !== 5);
        if (status !== '') users = users.filter(u => String(u.is_active) === String(status));
        if (search) {
            const key = search.toLowerCase();
            users = users.filter(u => (u.full_name || '').toLowerCase().includes(key) || (u.email || '').toLowerCase().includes(key));
        }
        renderUsers(users);
    } catch (err) {
        console.error('Users load error', err);
        setTableMessage('show-user', 8, 'Lỗi tải dữ liệu');
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('show-user');
    if (!tbody) return;
    if (!users.length) return setTableMessage('show-user', 7, 'Không có dữ liệu');
    tbody.innerHTML = users.map(u => {
        const roleName = mapRole(u.role_id);
        const active = u.is_active ? 'Hoạt động' : 'Khóa';
        const phone = u.phone || u.phone_number || 'N/A';
        const created = formatDate(u.created_at);
        return `<tr>
            <td>${u.user_id}</td>
            <td>${escapeHtml(u.full_name)}</td>
            <td>${escapeHtml(u.email || 'N/A')}</td>
            <td>${escapeHtml(phone)}</td>
            <td>${roleName}</td>
            <td><span class="status-badge ${u.is_active ? 'active' : 'inactive'}">${active}</span></td>
            <td>${created}</td>
        </tr>`;
    }).join('');
}

// Tours
async function loadTours(status = '', search = '') {
    try {
        const res = await fetch(`${API_BASE_URL}/tours`);
        const json = await res.json();
        let tours = Array.isArray(json) ? json : json.data || [];
        const statusField = (t) => t.tour_status ?? t.status ?? '';
        if (status) tours = tours.filter(t => statusField(t) === status);
        if (search) {
            const key = search.toLowerCase();
            tours = tours.filter(t => (t.tour_name || '').toLowerCase().includes(key));
        }
        renderTours(tours);
    } catch (err) {
        console.error('Tours load error', err);
        setTableMessage('show-tours', 8, 'Lỗi tải dữ liệu');
    }
}

function renderTours(tours) {
    const tbody = document.getElementById('show-tours');
    if (!tbody) return;
    if (!tours.length) return setTableMessage('show-tours', 7, 'Không có dữ liệu');
    tbody.innerHTML = tours.map(t => {
        const status = (t.tour_status ?? t.status ?? '').toString();
        return `<tr>
            <td>${t.tour_id}</td>
            <td>${escapeHtml(t.tour_name)}</td>
            <td>${formatDate(t.start_date)}</td>
            <td>${formatDate(t.end_date)}</td>
            <td>${t.max_participants}</td>
            <td><span class="status-badge ${status.toLowerCase()}">${mapTourStatusVi(status)}</span></td>
            <td>${mapRegion(t.region_id)}</td>
        </tr>`;
    }).join('');
}

// Bookings
async function loadBookings(status = '') {
    try {
        const res = await fetch(`${API_BASE_URL}/bookings`);
        const json = await res.json();
        let items = Array.isArray(json) ? json : json.data || [];
        if (status) items = items.filter(b => (b.booking_status || '').toString() === status);
        renderBookings(items);
    } catch (err) {
        console.error('Bookings load error', err);
        setTableMessage('show-bookings', 6, 'Lỗi tải dữ liệu');
    }
}

function renderBookings(items) {
    const tbody = document.getElementById('show-bookings');
    if (!tbody) return;
    if (!items.length) return setTableMessage('show-bookings', 6, 'Không có dữ liệu');
    tbody.innerHTML = items.map(b => {
        const status = (b.booking_status || '').toString();
        const created = formatDate(b.created_at || b.booking_date);
        return `<tr>
            <td>${b.booking_id}</td>
            <td>Tour #${b.tour_id}</td>
            <td>User #${b.user_id}</td>
            <td><span class="status-badge ${status.toLowerCase()}">${mapBookingStatusVi(status)}</span></td>
            <td>${created}</td>
            <td></td>
        </tr>`;
    }).join('');
}

// Login history
async function loadLoginHistory(status = '') {
    try {
        const res = await fetch(`${API_BASE_URL}/login-history`);
        const json = await res.json();
        let items = Array.isArray(json) ? json : json.data || [];
        if (status) items = items.filter(h => (h.login_status || '').toString() === status);
        renderLoginHistory(items);
    } catch (err) {
        console.error('Login history load error', err);
        setTableMessage('show-login-history', 6, 'Lỗi tải dữ liệu');
    }
}

function renderLoginHistory(items) {
    const tbody = document.getElementById('show-login-history');
    if (!tbody) return;
    if (!items.length) return setTableMessage('show-login-history', 6, 'Không có dữ liệu');
    tbody.innerHTML = items.map((h, idx) => {
        const status = (h.login_status || '').toString();
        const name = (h.full_name || h.user_name || '').toString().trim();
        return `<tr>
            <td>${idx + 1}</td>
            <td>${h.user_id}</td>
            <td>${escapeHtml(name || `User #${h.user_id}`)}</td>
            <td>${formatDateTime(h.login_time)}</td>
            <td>${escapeHtml(h.ip_address || 'N/A')}</td>
            <td><span class="status-badge ${status.toLowerCase()}">${status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}</span></td>
        </tr>`;
    }).join('');
}

// Filters & search
function initFilters() {
    document.getElementById('tinh-trang-user')?.addEventListener('change', (e) => loadUsers(e.target.value));
    document.getElementById('tour-status')?.addEventListener('change', (e) => loadTours(e.target.value));
    document.getElementById('booking-status')?.addEventListener('change', (e) => loadBookings(e.target.value));
    document.getElementById('login-status')?.addEventListener('change', (e) => loadLoginHistory(e.target.value));

    document.querySelectorAll('.form-search').forEach((form, idx) => {
        const input = form.querySelector('.form-search-input');
        const btn = form.querySelector('.search-btn');
        const runSearch = () => {
            const term = input?.value || '';
            switch (idx) {
                case 0: loadUsers('', term); break;
                case 1: loadTours('', term); break;
                case 2: loadBookings(); break;
                case 3: loadLoginHistory(); break;
            }
        };

        btn?.addEventListener('click', runSearch);
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                runSearch();
            }
        });
    });

    document.querySelectorAll('.btn-control-large').forEach((btn) => {
        if (!btn.textContent?.includes('Làm mới')) return;
        btn.addEventListener('click', () => {
            refreshActiveTab();
        });
    });
}

// Helpers
function refreshActiveTab() {
    const activeIdx = Array.from(tabButtons).findIndex(b => b.classList.contains('active'));
    switch (activeIdx) {
        case 1: loadUsers(); break;
        case 2: loadTours(); break;
        case 3: loadBookings(); break;
        case 4: loadLoginHistory(); break;
        default: loadDashboard();
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setTableMessage(tbodyId, colspan, message) {
    const el = document.getElementById(tbodyId);
    if (el) el.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;">${message}</td></tr>`;
}

function mapRole(roleId) {
    const roles = { 1: 'Khách hàng', 2: 'Hướng dẫn viên', 3: 'Nhân viên văn phòng', 4: 'Quản lý', 5: 'Quản trị viên' };
    return roles[Number(roleId)] || 'N/A';
}

function mapRegion(regionId) {
    const regions = { 1: 'MIỀN BẮC', 2: 'MIỀN TRUNG', 3: 'MIỀN NAM' };
    return regions[Number(regionId)] || 'N/A';
}

function mapTourStatusVi(s) {
    const m = { OPEN: 'Mở', CLOSED: 'Đóng', ONGOING: 'Đang diễn ra', FINISHED: 'Hoàn thành', CANCELLED: 'Đã hủy' };
    return m[s] || s || 'N/A';
}

function mapBookingStatusVi(s) {
    const m = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy' };
    return m[s] || s || 'N/A';
}

function formatDate(d) {
    if (!d) return 'Không xác định';
    const dt = new Date(d);
    if (isNaN(dt)) return 'Không xác định';
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
}

function formatDateTime(d) {
    if (!d) return 'Không xác định';
    const dt = new Date(d);
    if (isNaN(dt)) return 'Không xác định';
    return `${formatDate(d)} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
