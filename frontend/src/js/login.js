document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Hàm kiểm tra email hợp lệ
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Ngăn form reload trang

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            alert('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        if (!validateEmail(email)) {
            alert('Email không hợp lệ.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            if (response.ok) {
                const data = await response.json();
                const user = data.data;
                localStorage.setItem('loggedInUser', JSON.stringify({
                    id: user.user_id,
                    name: user.full_name,
                    email: user.email,
                    role_id: user.role_id,
                    token: data.token
                }));            

                if (Number(user.role_id) === 5) {
                    alert('Đăng nhập thành công với quyền Admin!');
                    window.location.href = '/admin.html';
                } else if (Number(user.role_id) === 3) {
                    alert('Đăng nhập thành công!');
                    window.location.href = '/office.html';
                } else if (Number(user.role_id) === 2) {
                    alert('Đăng nhập thành công!');
                    window.location.href = '/guide.html';
                } else if (Number(user.role_id) === 4) {
                    alert('Đăng nhập thành công!');
                    window.location.href = '/manager.html';
                } else {
                    alert('Đăng nhập thành công!');
                    window.location.href = '/menu.html';
                }
            } else {
                const error = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    alert('Sai thông tin đăng nhập');
                } else if (response.status === 400) {
                    alert(error.message || 'Yêu cầu không hợp lệ.');
                } else {
                    alert('Đăng nhập thất bại. Vui lòng thử lại sau.');
                }
                console.error('Server Error:', error);
            }
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        }
    });
});