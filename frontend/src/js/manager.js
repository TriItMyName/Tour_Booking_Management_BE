const API_BASE_URL = 'http://localhost:3000/api';
const POLL_INTERVAL_MS = 30000;

const menuBtn = document.querySelector('.menu-icon-btn');
const sidebar = document.querySelector('.sidebar');
const tabButtons = document.querySelectorAll('.sidebar-list-item.tab-content');
const sections = document.querySelectorAll('.section');

document.addEventListener('DOMContentLoaded', async () => {
    initSidebar();
    initTabs();

    await Promise.all([loadRolesToSelect(), loadRegionsToSelect()]);
    initEmployeeHandlers();
    initTourHandlers();
    initTourImageHandlers();
    initStatusHandlers();

    // default tab
    await loadEmployees();
    setInterval(refreshActiveTab, POLL_INTERVAL_MS);
});

function initSidebar() {
    menuBtn?.addEventListener('click', () => sidebar?.classList.toggle('open'));
}

function initTabs() {
    tabButtons.forEach((btn, idx) => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();

            document.querySelector('.sidebar-list-item.active')?.classList.remove('active');
            document.querySelector('.section.active')?.classList.remove('active');

            btn.classList.add('active');
            sections[idx]?.classList.add('active');

            switch (idx) {
                case 0:
                    await loadEmployees(
                        document.getElementById('emp-status')?.value || '',
                        document.getElementById('emp-search-input')?.value || ''
                    );
                    break;
                case 1:
                    await loadTours(document.getElementById('tour-search-input')?.value || '');
                    break;
                case 2: {
                    const tid = getTourImagesTourId();
                    if (tid) await loadTourImages(tid);
                    else setTableMessage('mgr-show-tour-images', 6, 'Nhập Tour ID rồi bấm Tải ảnh');
                    break;
                }
                case 3:
                    await loadStatusSet(document.getElementById('status-set-search-input')?.value || '');
                    break;
                case 4:
                    await loadStatusView(
                        document.getElementById('view-tour-status')?.value || '',
                        document.getElementById('status-view-search-input')?.value || ''
                    );
                    break;
            }
        });
    });
}

function refreshActiveTab() {
    const idx = Array.from(tabButtons).findIndex((b) => b.classList.contains('active'));
    switch (idx) {
        case 0:
            loadEmployees(document.getElementById('emp-status')?.value || '', document.getElementById('emp-search-input')?.value || '');
            break;
        case 1:
            loadTours(document.getElementById('tour-search-input')?.value || '');
            break;
        case 2: {
            const tid = getTourImagesTourId();
            if (tid) loadTourImages(tid);
            break;
        }
        case 3:
            loadStatusSet(document.getElementById('status-set-search-input')?.value || '');
            break;
        case 4:
            loadStatusView(document.getElementById('view-tour-status')?.value || '', document.getElementById('status-view-search-input')?.value || '');
            break;
    }
}

async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = json?.message || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return json;
}

function getDataArray(json) {
    return Array.isArray(json) ? json : (json.data || []);
}

function setTableMessage(tbodyId, colspan, message) {
    const el = document.getElementById(tbodyId);
    if (el) el.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;">${escapeHtml(message)}</td></tr>`;
}


let roleMap = new Map();
let regionMap = new Map();

// Manager chỉ quản lý 2 role: GUIDE và OFFICE_STAFF
const ALLOWED_ROLE_NAMES = new Set(['guide', 'office_staff']);
let allowedRoleIds = new Set();

function normalizeRoleName(name) {
    return String(name ?? '').trim().toLowerCase();
}

function isAllowedRoleId(roleId) {
    if (!allowedRoleIds.size) return false;
    return allowedRoleIds.has(Number(roleId));
}

async function loadRolesToSelect() {
    const sel = document.getElementById('emp-role');
    if (!sel) return;

    sel.innerHTML = `<option value="">Đang tải roles...</option>`;

    try {
        const json = await fetchJson(`${API_BASE_URL}/roles`);
        const roles = getDataArray(json);

        const allowedRoles = roles.filter(r => ALLOWED_ROLE_NAMES.has(normalizeRoleName(r.role_name)));
        allowedRoleIds = new Set(allowedRoles.map(r => Number(r.role_id)));
        roleMap = new Map(allowedRoles.map(r => [String(r.role_id), r.role_name]));

        if (!allowedRoles.length) {
            sel.innerHTML = `<option value="">Không có role GUIDE / OFFICE_STAFF</option>`;
            return;
        }

        sel.innerHTML = allowedRoles
            .map(r => `<option value="${escapeHtml(r.role_id)}">${escapeHtml(r.role_name)}</option>`)
            .join('');
    } catch (e) {
        allowedRoleIds = new Set();
        sel.innerHTML = `<option value="">Không tải được roles</option>`;
    }
}

async function loadRegionsToSelect() {
    const sel = document.getElementById('tour-region');
    if (!sel) return;

    sel.innerHTML = `<option value="">Đang tải regions...</option>`;

    try {
        const json = await fetchJson(`${API_BASE_URL}/regions`);
        const regions = getDataArray(json);
        regionMap = new Map(regions.map(r => [String(r.region_id), r.region_name]));

        sel.innerHTML = regions
            .map(r => `<option value="${escapeHtml(r.region_id)}">${escapeHtml(r.region_name)}</option>`)
            .join('');
    } catch (e) {
        sel.innerHTML = `<option value="">Không tải được regions</option>`;
    }
}


function initEmployeeHandlers() {
    document.getElementById('emp-status')?.addEventListener('change', (e) => {
        loadEmployees(e.target.value, document.getElementById('emp-search-input')?.value || '');
    });

    document.getElementById('emp-search-btn')?.addEventListener('click', () => {
        loadEmployees(document.getElementById('emp-status')?.value || '', document.getElementById('emp-search-input')?.value || '');
    });

    document.getElementById('emp-search-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loadEmployees(document.getElementById('emp-status')?.value || '', document.getElementById('emp-search-input')?.value || '');
        }
    });

    document.getElementById('emp-refresh-btn')?.addEventListener('click', () => {
        const s = document.getElementById('emp-status');
        const q = document.getElementById('emp-search-input');
        if (s) s.value = '';
        if (q) q.value = '';
        loadEmployees();
    });

    document.getElementById('emp-create-btn')?.addEventListener('click', createEmployee);
    document.getElementById('emp-update-btn')?.addEventListener('click', updateEmployee);
    document.getElementById('emp-cancel-btn')?.addEventListener('click', resetEmployeeForm);
}

async function loadEmployees(isActive = '', search = '') {
    try {
        setTableMessage('mgr-show-users', 8, 'Đang tải dữ liệu...');
        const json = await fetchJson(`${API_BASE_URL}/users`);
        let users = getDataArray(json);

        // loại admin (role_id = 5) để đúng "nhân viên"
        users = users.filter(u => Number(u.role_id) !== 5);

        // chỉ hiển thị 2 role: GUIDE + OFFICE_STAFF
        if (allowedRoleIds.size) {
            users = users.filter(u => isAllowedRoleId(u.role_id));
        } else {
            // fallback nếu API /roles lỗi mà /users có role_name
            users = users.filter(u => ALLOWED_ROLE_NAMES.has(normalizeRoleName(u.role_name)) || !u.role_name);
        }

        if (isActive !== '') users = users.filter(u => String(u.is_active) === String(isActive));

        if (search) {
            const key = search.toLowerCase();
            users = users.filter(u =>
                String(u.full_name || '').toLowerCase().includes(key) ||
                String(u.email || '').toLowerCase().includes(key)
            );
        }

        renderEmployees(users);
    } catch (e) {
        console.error('Employees load error', e);
        setTableMessage('mgr-show-users', 8, 'Lỗi tải dữ liệu');
    }
}

function renderEmployees(users) {
    const tbody = document.getElementById('mgr-show-users');
    if (!tbody) return;
    if (!users.length) return setTableMessage('mgr-show-users', 8, 'Không có dữ liệu');

    tbody.innerHTML = users.map(u => {
        const activeText = Number(u.is_active) === 1 ? 'Hoạt động' : 'Khóa';
        const roleName = roleMap.get(String(u.role_id)) || `Role #${u.role_id}`;
        const phone = u.phone || 'N/A';

        return `<tr>
            <td>${escapeHtml(u.user_id)}</td>
            <td>${escapeHtml(u.full_name || 'N/A')}</td>
            <td>${escapeHtml(u.email || 'N/A')}</td>
            <td>${escapeHtml(phone)}</td>
            <td>${escapeHtml(roleName)}</td>
            <td><span class="status-badge ${Number(u.is_active) === 1 ? 'active' : 'inactive'}">${activeText}</span></td>
            <td>${formatDate(u.created_at)}</td>
            <td>
                <button class="btn-action edit" data-emp-action="edit" data-id="${escapeHtml(u.user_id)}">Sửa</button>
                <button class="btn-action delete" data-emp-action="delete" data-id="${escapeHtml(u.user_id)}">Xóa</button>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('button[data-emp-action]')?.forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-emp-action');
            if (!id || !action) return;

            if (action === 'edit') {
                await fillEmployeeForm(id);
                return;
            }

            if (action === 'delete') {
                const ok = confirm('Xóa nhân viên này?');
                if (!ok) return;
                await deleteEmployee(id);
            }
        });
    });
}

async function fillEmployeeForm(userId) {
    try {
        const json = await fetchJson(`${API_BASE_URL}/users/${userId}`);
        const u = json.data || json;

        document.getElementById('emp-edit-id').value = u.user_id;
        document.getElementById('emp-full-name').value = u.full_name || '';
        document.getElementById('emp-email').value = u.email || '';
        document.getElementById('emp-phone').value = u.phone || '';
        document.getElementById('emp-role').value = String(u.role_id ?? '');
        document.getElementById('emp-password').value = '';
        document.getElementById('emp-active').value = String(u.is_active ?? 1);

        setEmployeeEditMode(true);
    } catch (e) {
        alert('Không lấy được dữ liệu nhân viên');
    }
}

function setEmployeeEditMode(isEditing) {
    document.getElementById('emp-create-btn').disabled = isEditing;
    document.getElementById('emp-update-btn').disabled = !isEditing;
    document.getElementById('emp-cancel-btn').disabled = !isEditing;
}

function resetEmployeeForm() {
    document.getElementById('emp-edit-id').value = '';
    document.getElementById('emp-full-name').value = '';
    document.getElementById('emp-email').value = '';
    document.getElementById('emp-phone').value = '';
    document.getElementById('emp-password').value = '';
    document.getElementById('emp-active').value = '1';
    setEmployeeEditMode(false);
}

async function createEmployee() {
    const role_id = document.getElementById('emp-role')?.value;
    const full_name = document.getElementById('emp-full-name')?.value?.trim();
    const email = document.getElementById('emp-email')?.value?.trim();
    const phone = document.getElementById('emp-phone')?.value?.trim();
    const password = document.getElementById('emp-password')?.value;
    const is_active = Number(document.getElementById('emp-active')?.value || 1);

    if (!role_id || !full_name || !email || !password) {
        alert('Vui lòng nhập role, họ tên, email và mật khẩu');
        return;
    }

    if (!isAllowedRoleId(role_id)) {
        alert('Chỉ được tạo nhân viên với role GUIDE hoặc OFFICE_STAFF');
        return;
    }

    try {
        await fetchJson(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role_id: Number(role_id), full_name, email, phone, password, is_active }),
        });

        resetEmployeeForm();
        await loadEmployees(document.getElementById('emp-status')?.value || '', document.getElementById('emp-search-input')?.value || '');
    } catch (e) {
        alert(`Thêm nhân viên thất bại: ${e.message}`);
    }
}

async function updateEmployee() {
    const userId = document.getElementById('emp-edit-id')?.value;
    if (!userId) return;

    const role_id = document.getElementById('emp-role')?.value;
    const full_name = document.getElementById('emp-full-name')?.value?.trim();
    const email = document.getElementById('emp-email')?.value?.trim();
    const phone = document.getElementById('emp-phone')?.value?.trim();
    const password = document.getElementById('emp-password')?.value;
    const is_active = Number(document.getElementById('emp-active')?.value || 1);

    if (!role_id || !full_name || !email) {
        alert('Vui lòng nhập role, họ tên và email');
        return;
    }

    if (!isAllowedRoleId(role_id)) {
        alert('Chỉ được cập nhật role thành GUIDE hoặc OFFICE_STAFF');
        return;
    }

    const payload = {
        role_id: Number(role_id),
        full_name,
        email,
        phone,
        is_active,
    };

    // chỉ gửi password khi muốn đổi
    if (password) payload.password = password;

    try {
        await fetchJson(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        resetEmployeeForm();
        await loadEmployees(document.getElementById('emp-status')?.value || '', document.getElementById('emp-search-input')?.value || '');
    } catch (e) {
        alert(`Cập nhật thất bại: ${e.message}`);
    }
}

async function deleteEmployee(userId) {
    try {
        await fetchJson(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' });
        await loadEmployees(document.getElementById('emp-status')?.value || '', document.getElementById('emp-search-input')?.value || '');
    } catch (e) {
        alert(`Xóa thất bại: ${e.message}`);
    }
}

function initTourHandlers() {
    document.getElementById('tour-search-btn')?.addEventListener('click', () => {
        loadTours(document.getElementById('tour-search-input')?.value || '');
    });

    document.getElementById('tour-search-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loadTours(document.getElementById('tour-search-input')?.value || '');
        }
    });

    document.getElementById('tour-refresh-btn')?.addEventListener('click', () => {
        const q = document.getElementById('tour-search-input');
        if (q) q.value = '';
        loadTours();
    });

    document.getElementById('tour-create-btn')?.addEventListener('click', createTour);
    document.getElementById('tour-update-btn')?.addEventListener('click', updateTour);
    document.getElementById('tour-cancel-btn')?.addEventListener('click', resetTourForm);
}

/* =====================
   Tour Images (tab riêng)
===================== */
function getTourImagesTourId() {
    const input = document.getElementById('tour-images-tour-id');
    const fromInput = input?.value ? String(input.value).trim() : '';
    if (fromInput) return fromInput;
    const fromEdit = document.getElementById('tour-edit-id')?.value ? String(document.getElementById('tour-edit-id').value).trim() : '';
    return fromEdit;
}

function setTourImagesTourId(tourId) {
    const input = document.getElementById('tour-images-tour-id');
    if (input) input.value = String(tourId ?? '').trim();
}

function initTourImageHandlers() {
    document.getElementById('tour-images-load-btn')?.addEventListener('click', async () => {
        const tid = getTourImagesTourId();
        if (!tid) {
            alert('Vui lòng nhập Tour ID');
            return;
        }
        await loadTourImages(tid);
    });

    document.getElementById('tour-images-refresh-btn')?.addEventListener('click', async () => {
        const tid = getTourImagesTourId();
        if (!tid) {
            setTableMessage('mgr-show-tour-images', 6, 'Nhập Tour ID rồi bấm Tải ảnh');
            return;
        }
        await loadTourImages(tid);
    });

    document.getElementById('tour-images-add-btn')?.addEventListener('click', async () => {
        const tid = getTourImagesTourId();
        if (!tid) {
            alert('Vui lòng nhập Tour ID');
            return;
        }
        await addTourImages(tid);
    });
}

async function loadTourImages(tourId) {
    try {
        setTableMessage('mgr-show-tour-images', 6, 'Đang tải dữ liệu...');
        const json = await fetchJson(`${API_BASE_URL}/tour-images/tour/${tourId}`);
        const images = getDataArray(json);
        renderTourImages(images);
    } catch (e) {
        console.error('Tour images load error', e);
        setTableMessage('mgr-show-tour-images', 6, 'Lỗi tải dữ liệu');
    }
}

function renderTourImages(images) {
    const tbody = document.getElementById('mgr-show-tour-images');
    if (!tbody) return;
    if (!images.length) return setTableMessage('mgr-show-tour-images', 6, 'Chưa có ảnh');

    tbody.innerHTML = images
        .map((img) => {
            const isMain = Number(img.is_main) === 1;
            const url = String(img.image_url || '');
            const safeUrl = escapeHtml(url);
            const thumbSrc = safeUrl || '';
            return `<tr>
                <td>${escapeHtml(img.image_id)}</td>
                <td>
                    <img class="tour-image-thumb" src="${thumbSrc}" alt="Tour image" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'" />
                </td>
                <td><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a></td>
                <td>${isMain ? 'Yes' : 'No'}</td>
                <td>${formatDate(img.created_at)}</td>
                <td>
                    <button class="btn-action edit" data-img-action="main" data-id="${escapeHtml(img.image_id)}" ${isMain ? 'disabled' : ''}>Đặt main</button>
                    <button class="btn-action delete" data-img-action="delete" data-id="${escapeHtml(img.image_id)}">Xóa</button>
                </td>
            </tr>`;
        })
        .join('');

    tbody.querySelectorAll('button[data-img-action]')?.forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-img-action');
            if (!id || !action) return;

            if (action === 'main') {
                await setMainTourImage(id);
                return;
            }

            if (action === 'delete') {
                const ok = confirm('Xóa ảnh này?');
                if (!ok) return;
                await deleteTourImage(id);
            }
        });
    });
}

function parseImageUrls(text) {
    return String(text || '')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
}

async function addTourImages(tourId) {
    const ta = document.getElementById('tour-images-input');
    const firstMain = document.getElementById('tour-images-first-main')?.checked;
    const urls = parseImageUrls(ta?.value);

    if (!urls.length) {
        alert('Vui lòng nhập ít nhất 1 URL ảnh (mỗi dòng 1 URL)');
        return;
    }

    const images = urls.map((u, idx) => ({ image_url: u, is_main: Boolean(firstMain && idx === 0) }));

    try {
        await fetchJson(`${API_BASE_URL}/tour-images/tour/${tourId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images }),
        });

        if (ta) ta.value = '';
        await loadTourImages(tourId);
    } catch (e) {
        alert(`Thêm ảnh thất bại: ${e.message}`);
    }
}

async function setMainTourImage(imageId) {
    const tourId = getTourImagesTourId();
    if (!tourId) return;
    try {
        await fetchJson(`${API_BASE_URL}/tour-images/${imageId}/main`, { method: 'PATCH' });
        await loadTourImages(tourId);
    } catch (e) {
        alert(`Đặt ảnh chính thất bại: ${e.message}`);
    }
}

async function deleteTourImage(imageId) {
    const tourId = getTourImagesTourId();
    if (!tourId) return;
    try {
        await fetchJson(`${API_BASE_URL}/tour-images/${imageId}`, { method: 'DELETE' });
        await loadTourImages(tourId);
    } catch (e) {
        alert(`Xóa ảnh thất bại: ${e.message}`);
    }
}

async function loadTours(search = '') {
    try {
        setTableMessage('mgr-show-tours', 8, 'Đang tải dữ liệu...');
        const json = await fetchJson(`${API_BASE_URL}/tours`);
        let tours = getDataArray(json);

        if (search) {
            const key = search.toLowerCase();
            tours = tours.filter(t => String(t.tour_name || '').toLowerCase().includes(key));
        }

        renderTours(tours);
    } catch (e) {
        console.error('Tours load error', e);
        setTableMessage('mgr-show-tours', 8, 'Lỗi tải dữ liệu');
    }
}

function renderTours(tours) {
    const tbody = document.getElementById('mgr-show-tours');
    if (!tbody) return;
    if (!tours.length) return setTableMessage('mgr-show-tours', 8, 'Không có dữ liệu');

    tbody.innerHTML = tours.map(t => {
        const status = normalizeStatus(t.status);
        const regionName = regionMap.get(String(t.region_id)) || `Region #${t.region_id}`;
        return `<tr>
            <td>${escapeHtml(t.tour_id)}</td>
            <td>${escapeHtml(t.tour_name)}</td>
            <td>${formatDate(t.start_date)}</td>
            <td>${formatDate(t.end_date)}</td>
            <td>${escapeHtml(t.max_participants)}</td>
            <td><span class="status-badge ${status.toLowerCase()}">${mapTourStatusVi(status)}</span></td>
            <td>${escapeHtml(regionName)}</td>
            <td>
                <button class="btn-action edit" data-tour-action="edit" data-id="${escapeHtml(t.tour_id)}">Sửa</button>
                <button class="btn-action delete" data-tour-action="delete" data-id="${escapeHtml(t.tour_id)}">Xóa</button>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('button[data-tour-action]')?.forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-tour-action');
            if (!id || !action) return;

            if (action === 'edit') {
                await fillTourForm(id);
                return;
            }

            if (action === 'delete') {
                const ok = confirm('Xóa tour này?');
                if (!ok) return;
                await deleteTour(id);
            }
        });
    });
}

async function fillTourForm(tourId) {
    try {
        const json = await fetchJson(`${API_BASE_URL}/tours/${tourId}`);
        const t = json.data || json;

        document.getElementById('tour-edit-id').value = t.tour_id;
        document.getElementById('tour-name').value = t.tour_name || '';
        document.getElementById('tour-start').value = isoDate(t.start_date);
        document.getElementById('tour-end').value = isoDate(t.end_date);
        document.getElementById('tour-max').value = t.max_participants ?? '';
        document.getElementById('tour-region').value = String(t.region_id ?? '');
        document.getElementById('tour-desc').value = t.description || '';

        // sync qua tab Hình ảnh tour
        setTourImagesTourId(t.tour_id);

        setTourEditMode(true);
    } catch (e) {
        alert('Không lấy được dữ liệu tour');
    }
}

function setTourEditMode(isEditing) {
    document.getElementById('tour-create-btn').disabled = isEditing;
    document.getElementById('tour-update-btn').disabled = !isEditing;
    document.getElementById('tour-cancel-btn').disabled = !isEditing;
}

function resetTourForm() {
    document.getElementById('tour-edit-id').value = '';
    document.getElementById('tour-name').value = '';
    document.getElementById('tour-start').value = '';
    document.getElementById('tour-end').value = '';
    document.getElementById('tour-max').value = '';
    document.getElementById('tour-desc').value = '';
    setTourEditMode(false);
}

async function createTour() {
    const tour_name = document.getElementById('tour-name')?.value?.trim();
    const start_date = document.getElementById('tour-start')?.value;
    const end_date = document.getElementById('tour-end')?.value;
    const max_participants = Number(document.getElementById('tour-max')?.value || 0);
    const region_id = Number(document.getElementById('tour-region')?.value || 0);
    const description = document.getElementById('tour-desc')?.value?.trim() || '';

    if (!tour_name || !start_date || !end_date || !max_participants || !region_id) {
        alert('Vui lòng nhập tên tour, ngày, số người tối đa và miền');
        return;
    }

    try {
        // mặc định tạo tour ở trạng thái DRAFT (chờ duyệt)
        const created = await fetchJson(`${API_BASE_URL}/tours`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tour_name, description, start_date, end_date, max_participants, region_id, status: 'DRAFT' }),
        });

        const newId = created?.data?.tour_id;
        if (newId) {
            document.getElementById('tour-edit-id').value = String(newId);
            setTourEditMode(true);
            // sync qua tab Hình ảnh tour
            setTourImagesTourId(newId);
        }

        await loadTours(document.getElementById('tour-search-input')?.value || '');
    } catch (e) {
        alert(`Thêm tour thất bại: ${e.message}`);
    }
}

async function updateTour() {
    const tourId = document.getElementById('tour-edit-id')?.value;
    if (!tourId) return;

    const tour_name = document.getElementById('tour-name')?.value?.trim();
    const start_date = document.getElementById('tour-start')?.value;
    const end_date = document.getElementById('tour-end')?.value;
    const max_participants = Number(document.getElementById('tour-max')?.value || 0);
    const region_id = Number(document.getElementById('tour-region')?.value || 0);
    const description = document.getElementById('tour-desc')?.value?.trim() || '';

    if (!tour_name || !start_date || !end_date || !max_participants || !region_id) {
        alert('Vui lòng nhập tên tour, ngày, số người tối đa và miền');
        return;
    }

    try {
        await fetchJson(`${API_BASE_URL}/tours/${tourId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tour_name, description, start_date, end_date, max_participants, region_id }),
        });

        resetTourForm();
        await loadTours(document.getElementById('tour-search-input')?.value || '');
    } catch (e) {
        alert(`Cập nhật tour thất bại: ${e.message}`);
    }
}

async function deleteTour(tourId) {
    try {
        await fetchJson(`${API_BASE_URL}/tours/${tourId}`, { method: 'DELETE' });
        await loadTours(document.getElementById('tour-search-input')?.value || '');
    } catch (e) {
        alert(`Xóa tour thất bại: ${e.message}`);
    }
}

/* =====================
   Tour status (set + view)
===================== */
function initStatusHandlers() {
    // set status
    document.getElementById('status-set-search-btn')?.addEventListener('click', () => {
        loadStatusSet(document.getElementById('status-set-search-input')?.value || '');
    });

    document.getElementById('status-set-search-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loadStatusSet(document.getElementById('status-set-search-input')?.value || '');
        }
    });

    document.getElementById('status-set-refresh-btn')?.addEventListener('click', () => {
        const q = document.getElementById('status-set-search-input');
        if (q) q.value = '';
        loadStatusSet();
    });

    // view status
    document.getElementById('view-tour-status')?.addEventListener('change', (e) => {
        loadStatusView(e.target.value, document.getElementById('status-view-search-input')?.value || '');
    });

    document.getElementById('status-view-search-btn')?.addEventListener('click', () => {
        loadStatusView(document.getElementById('view-tour-status')?.value || '', document.getElementById('status-view-search-input')?.value || '');
    });

    document.getElementById('status-view-search-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loadStatusView(document.getElementById('view-tour-status')?.value || '', document.getElementById('status-view-search-input')?.value || '');
        }
    });

    document.getElementById('status-view-refresh-btn')?.addEventListener('click', () => {
        const s = document.getElementById('view-tour-status');
        const q = document.getElementById('status-view-search-input');
        if (s) s.value = '';
        if (q) q.value = '';
        loadStatusView();
    });
}

async function loadStatusSet(search = '') {
    try {
        setTableMessage('mgr-set-status', 5, 'Đang tải dữ liệu...');
        const json = await fetchJson(`${API_BASE_URL}/tours`);
        let tours = getDataArray(json);

        if (search) {
            const key = search.toLowerCase();
            tours = tours.filter(t => String(t.tour_name || '').toLowerCase().includes(key));
        }

        renderStatusSet(tours);
    } catch (e) {
        console.error('Status set load error', e);
        setTableMessage('mgr-set-status', 5, 'Lỗi tải dữ liệu');
    }
}

function renderStatusSet(tours) {
    const tbody = document.getElementById('mgr-set-status');
    if (!tbody) return;
    if (!tours.length) return setTableMessage('mgr-set-status', 5, 'Không có dữ liệu');

    tbody.innerHTML = tours.map(t => {
        const current = normalizeStatus(t.status);
        return `<tr>
            <td>${escapeHtml(t.tour_id)}</td>
            <td>${escapeHtml(t.tour_name)}</td>
            <td><span class="status-badge ${current.toLowerCase()}">${mapTourStatusVi(current)}</span></td>
            <td>
                <select class="table-select" data-status-select="1" data-id="${escapeHtml(t.tour_id)}">
                    ${renderStatusOptions(current)}
                </select>
            </td>
            <td>
                <button class="btn-action edit" data-status-action="apply" data-id="${escapeHtml(t.tour_id)}">Áp dụng</button>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('button[data-status-action="apply"]')?.forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!id) return;

            const sel = tbody.querySelector(`select[data-status-select][data-id="${CSS.escape(id)}"]`);
            const next = sel?.value;
            if (!next) return;

            try {
                await fetchJson(`${API_BASE_URL}/tours/${id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: next }),
                });

                await loadStatusSet(document.getElementById('status-set-search-input')?.value || '');
            } catch (e) {
                alert(`Cập nhật trạng thái thất bại: ${e.message}`);
            }
        });
    });
}

function renderStatusOptions(current) {
    const statuses = ['DRAFT', 'OPEN', 'ONGOING', 'CLOSED', 'FINISHED', 'CANCELLED'];
    return statuses
        .map(s => `<option value="${s}" ${s === current ? 'selected' : ''}>${mapTourStatusVi(s)}</option>`)
        .join('');
}

async function loadStatusView(status = '', search = '') {
    try {
        setTableMessage('mgr-view-status', 7, 'Đang tải dữ liệu...');
        const json = await fetchJson(`${API_BASE_URL}/tours`);
        let tours = getDataArray(json);

        const getStatus = (t) => normalizeStatus(t.status);

        if (status) {
            const target = String(status).trim().toUpperCase();
            tours = tours.filter(t => getStatus(t) === target);
        }

        if (search) {
            const key = search.toLowerCase();
            tours = tours.filter(t => String(t.tour_name || '').toLowerCase().includes(key));
        }

        renderStatusView(tours);
    } catch (e) {
        console.error('Status view load error', e);
        setTableMessage('mgr-view-status', 7, 'Lỗi tải dữ liệu');
    }
}

function renderStatusView(tours) {
    const tbody = document.getElementById('mgr-view-status');
    if (!tbody) return;
    if (!tours.length) return setTableMessage('mgr-view-status', 7, 'Không có dữ liệu');

    tbody.innerHTML = tours.map(t => {
        const status = normalizeStatus(t.status);
        const regionName = regionMap.get(String(t.region_id)) || `Region #${t.region_id}`;
        return `<tr>
            <td>${escapeHtml(t.tour_id)}</td>
            <td>${escapeHtml(t.tour_name)}</td>
            <td>${formatDate(t.start_date)}</td>
            <td>${formatDate(t.end_date)}</td>
            <td>${escapeHtml(t.max_participants)}</td>
            <td><span class="status-badge ${status.toLowerCase()}">${mapTourStatusVi(status)}</span></td>
            <td>${escapeHtml(regionName)}</td>
        </tr>`;
    }).join('');
}

/* =====================
   Helpers
===================== */
function normalizeStatus(value) {
    return String(value ?? '').trim().toUpperCase() || 'DRAFT';
}

function mapTourStatusVi(status) {
    const s = normalizeStatus(status);
    const m = {
        DRAFT: 'Chờ duyệt',
        OPEN: 'Mở',
        CLOSED: 'Đóng',
        ONGOING: 'Đang diễn ra',
        FINISHED: 'Hoàn thành',
        CANCELLED: 'Đã hủy',
    };
    return m[s] || s;
}

function formatDate(d) {
    if (!d) return 'Không xác định';
    const dt = new Date(d);
    if (isNaN(dt)) return 'Không xác định';
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

function isoDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return '';
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
