// ===== UPLOAD ẢNH LÊN CLOUDINARY =====
// Hai thông tin lấy từ trang Cloudinary của bạn (xem hướng dẫn):
// CLOUD_NAME nằm ở Dashboard, UPLOAD_PRESET là tên preset loại "Unsigned" bạn tạo trong Settings > Upload
export const CLOUD_NAME = 't2e5yoie';
export const UPLOAD_PRESET = 'giuaky_preset';

// Hàm nhận ảnh dạng chuỗi data URI (data:image/jpeg;base64,....), tải lên Cloudinary
// và trả về đường dẫn (URL) của ảnh sau khi tải lên. Đường dẫn này sẽ lưu vào trường hinhanh.
export async function uploadImage(dataUri: string): Promise<string> {
  // Chưa điền thông tin thì báo lỗi rõ ràng, khỏi mất công đoán nguyên nhân
  if (CLOUD_NAME.startsWith('DÁN') || UPLOAD_PRESET.startsWith('DÁN')) {
    throw new Error('Bạn chưa điền CLOUD_NAME và UPLOAD_PRESET trong file src/cloudinary.ts.');
  }

  // FormData là "phiếu gửi" gồm nhiều cặp tên-giá trị, dùng để gửi file lên máy chủ
  const form = new FormData();
  // Cloudinary nhận ảnh dạng data URI ở trường "file", cách này chạy giống nhau trên web và điện thoại
  form.append('file', dataUri);
  // Tên preset không cần chữ ký (unsigned) để tải ảnh lên mà không lộ khóa bí mật
  form.append('upload_preset', UPLOAD_PRESET);

  // Gửi yêu cầu POST tới địa chỉ upload của Cloudinary
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  // Đọc kết quả trả về dạng JSON
  const json = await response.json();

  // Nếu Cloudinary báo lỗi (ví dụ sai preset) thì ném lỗi kèm nội dung để người dùng thấy
  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'Tải ảnh lên Cloudinary thất bại.');
  }
  // secure_url là đường dẫn https của ảnh đã tải lên
  return json.secure_url as string;
}