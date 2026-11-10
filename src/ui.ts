// ===== HỘP THOẠI DÙNG CHUNG CHO WEB VÀ ĐIỆN THOẠI =====
// Alert của React Native không hoạt động trên web, nên mình viết hai hàm tự chọn cách hiển thị phù hợp.
import { Alert, Platform } from 'react-native';

// Hộp thoại hỏi xác nhận (ví dụ "Bạn có chắc muốn xóa?"). Trả về true nếu người dùng đồng ý.
export function confirmAsync(title: string, message: string): Promise<boolean> {
  // Trên web dùng hộp thoại confirm của trình duyệt
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n${message}`));
  }
  // Trên điện thoại dùng Alert của React Native, gói vào Promise để dùng với await
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Xóa', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

// Hộp thoại thông báo đơn giản (ví dụ khi có lỗi)
export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}