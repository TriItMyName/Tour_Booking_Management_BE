document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Ngăn form reload trang

        // Lấy dữ liệu từ form
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (!username || !email || !password || !phone || !confirmPassword) {
            alert("Vui lòng điền đầy đủ thông tin.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp.");
            return;
        }

        try {
            // Tạo user mới với role mặc định Customer (role_id = 1)
            const payload = {
                role_id: 1,
                full_name: username,
                email,
                phone,
                password,
                // phone có thể bổ sung sau nếu cần
            };

            const userResponse = await fetch("http://localhost:3000/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await userResponse.json();

            if (!userResponse.ok || result.success === false) {
                console.error("Lỗi khi thêm người dùng:", result);
                alert(`Đăng ký thất bại: ${result.message || 'Không xác định'}`);
                return;
            }

            alert("Đăng ký thành công!");
            window.location.href = "/login.html";
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Đã xảy ra lỗi. Vui lòng thử lại sau.");
        }
    });
});