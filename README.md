# Tour Booking Management - Backend

Đây là mã nguồn Backend cho hệ thống Quản lý Đặt Tour, được xây dựng với **Node.js**, **Express**, và cơ sở dữ liệu **MySQL**. Dự án tuân theo mô hình **MVC** (Model - View - Controller).

## Công nghệ chính
- **Node.js & Express:** Framework xây dựng API.
- **MySQL2:** Kết nối Database.
- **JWT & Bcryptjs:** Xác thực và bảo mật mật khẩu.

## Thực mục chính
- `backend/config/`: Cấu hình kết nối cơ sở dữ liệu.
- `backend/controllers/`: Xử lý logic API.
- `backend/models/`: Truy vấn và thao tác với MySQL.
- `backend/routers/`: Định nghĩa các đường dẫn (endpoints) API.
- `backend/server.js`: File khởi chạy ứng dụng.

## Hướng dẫn chạy dự án nhanh

1. **Cài đặt thư viện:**
   ```bash
   cd backend
   npm install
   ```

2. **Cấu hình môi trường:**
   Tạo file `.env` ở thư mục `backend/` và cấu hình các thông số cần thiết (Port, Database,...).

3. **Khởi chạy ứng dụng:**
   ```bash
   npm run dev   # Chạy môi trường phát triển (có nodemon)
   # hoặc
   npm start     # Chạy file thông thường
   ```
