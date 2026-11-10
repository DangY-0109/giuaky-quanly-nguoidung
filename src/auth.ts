// ===== ĐĂNG NHẬP ADMIN ĐƠN GIẢN =====
// Tài khoản admin cố định. Mình không lưu admin vào Firebase vì đề cấm thêm trường
// và CSDL chỉ dành cho người dùng thường. Bạn có thể đổi hai giá trị này tùy ý.
export const ADMIN_EMAIL = 'admin@gmail.com';
export const ADMIN_PASSWORD = '123456';

// Biến ghi nhớ đã đăng nhập hay chưa. Tắt app hoặc tải lại trang web thì biến này về false
// và người dùng phải đăng nhập lại.
let loggedIn = false;

// Kiểm tra email và mật khẩu, đúng thì đánh dấu đã đăng nhập và trả về true
export function login(email: string, password: string): boolean {
  if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    loggedIn = true;
    return true;
  }
  return false;
}

// Đăng xuất: đánh dấu chưa đăng nhập
export function logout(): void {
  loggedIn = false;
}

// Cho các màn hình hỏi: đã đăng nhập chưa?
export function isLoggedIn(): boolean {
  return loggedIn;
}