// ===== KIỂM TRA ẢNH ĐẠI DIỆN BẰNG AI (Gemini) =====
// Đặt file này ở src/aiCheck.ts (cùng chỗ với auth.ts, userService.ts, cloudinary.ts)

// Khóa API lấy từ file .env (EXPO_PUBLIC_ là tiền tố bắt buộc để Expo đưa biến vào app)
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

// Tên mô hình: nếu báo lỗi 404, vào Google AI Studio, mở ví dụ "Image understanding" và chép đúng tên mô hình ở đó
const MODEL = 'gemini-3-flash-preview';

export type AvatarCheck = {
  ok: boolean; // true = ảnh dùng được
  reason: string; // lý do (hiện cho người dùng khi ảnh bị từ chối)
};

// Câu lệnh gửi cho AI: yêu cầu trả về JSON gọn để dễ đọc kết quả
const PROMPT =
  'Bạn kiểm tra ảnh đại diện cho ứng dụng quản lý người dùng. ' +
  'Hãy trả về JSON với đúng 3 khóa: ' +
  '"hasFace" (true nếu ảnh có đúng một khuôn mặt người nhìn rõ), ' +
  '"appropriate" (false nếu ảnh có nội dung phản cảm, bạo lực hoặc người lớn), ' +
  '"reason" (một câu tiếng Việt ngắn giải thích nếu ảnh không đạt, nếu đạt thì để chuỗi rỗng).';

// Nhận ảnh dạng data URI (data:image/jpeg;base64,....) như màn hình thêm/sửa đang dùng
export async function checkAvatar(dataUri: string): Promise<AvatarCheck> {
  // Chưa cấu hình khóa API thì bỏ qua bước kiểm tra, không chặn người dùng
  if (API_KEY === '') {
    return { ok: true, reason: '' };
  }

  // Tách phần kiểu ảnh và phần dữ liệu base64 ra khỏi data URI
  const match = /^data:(.+?);base64,(.+)$/.exec(dataUri);
  if (!match) {
    return { ok: true, reason: '' };
  }
  const [, mimeType, base64] = match;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }],
            },
          ],
          // Ép AI trả về JSON thuần, không kèm chữ thừa
          generationConfig: { responseMimeType: 'application/json', temperature: 0 },
        }),
      },
    );

    if (!response.ok) {
      // Lỗi từ phía dịch vụ (hết lượt miễn phí, sai tên mô hình...): bỏ qua, không chặn người dùng
      console.warn('Gemini trả lỗi', response.status);
      return { ok: true, reason: '' };
    }

    const json = await response.json();
    const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());

    if (result.appropriate === false) {
      return { ok: false, reason: result.reason || 'Ảnh có nội dung không phù hợp.' };
    }
    if (result.hasFace === false) {
      return { ok: false, reason: result.reason || 'Ảnh chưa có khuôn mặt rõ ràng, hãy chọn ảnh khác.' };
    }
    return { ok: true, reason: '' };
  } catch (e) {
    // Mất mạng hoặc AI trả sai định dạng: cũng bỏ qua để việc lưu vẫn chạy được
    console.warn('Không kiểm tra được ảnh bằng AI', e);
    return { ok: true, reason: '' };
  }
}