// Stack = kiểu điều hướng xếp chồng màn hình (giống Navigator bên Flutter)
import { Stack } from 'expo-router';

// Layout gốc của app: khai báo 3 màn hình và kiểu thanh tiêu đề của chúng
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        // Thanh tiêu đề màu chàm, chữ trắng
        headerStyle: { backgroundColor: '#3F51B5' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        // Màu nền phần thân của mọi màn hình
        contentStyle: { backgroundColor: '#F2F4FA' },
      }}
    >
      {/* Màn hình đăng nhập (file index.tsx): ẩn thanh tiêu đề cho gọn */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* Màn hình danh sách (file users.tsx): ẩn nút quay lại để không lùi về trang đăng nhập */}
      <Stack.Screen
        name="users"
        options={{ title: 'Quản lý người dùng', headerBackVisible: false }}
      />
      {/* Màn hình thêm / sửa (file user-form.tsx) */}
      <Stack.Screen name="user-form" options={{ title: 'Thông tin người dùng' }} />
    </Stack>
  );
}