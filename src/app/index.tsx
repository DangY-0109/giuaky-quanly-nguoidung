// ===== MÀN HÌNH ĐĂNG NHẬP ADMIN (giao diện mới) =====
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { login } from '../auth';

const PRIMARY = '#3F51B5';

// Trên web, trình duyệt tự vẽ viền đen quanh ô đang chọn; tắt đi để chỉ còn viền xanh của mình
const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : {}) as object;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  // Ô nào đang được chọn thì viền đổi màu
  const [focused, setFocused] = useState<'email' | 'password' | ''>('');

  const handleLogin = () => {
    if (login(email, password)) {
      router.replace('/users');
    } else {
      setError('Sai email hoặc mật khẩu admin.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Khối màu phía trên: biểu tượng và tên ứng dụng */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="admin-panel-settings" size={44} color={PRIMARY} />
          </View>
          <Text style={styles.heroTitle}>Quản lý người dùng</Text>
          <Text style={styles.heroSub}>Đăng nhập bằng tài khoản admin</Text>
        </View>

        {/* Thẻ đăng nhập đè lên khối màu */}
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputBox, focused === 'email' && styles.inputFocused]}>
            <MaterialIcons name="mail-outline" size={20} color={focused === 'email' ? PRIMARY : '#8A8FA6'} />
            <TextInput
              style={styles.input}
              placeholder="admin@example.com"
              placeholderTextColor="#A8ADC2"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError('');
              }}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Mật khẩu</Text>
          <View style={[styles.inputBox, focused === 'password' && styles.inputFocused]}>
            <MaterialIcons name="lock-outline" size={20} color={focused === 'password' ? PRIMARY : '#8A8FA6'} />
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu"
              placeholderTextColor="#A8ADC2"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError('');
              }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused('')}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color="#8A8FA6" />
            </Pressable>
          </View>

          {/* Thông báo lỗi nằm trong khung đỏ nhạt */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={18} color="#C62828" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable onPress={handleLogin} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F4F5FB' },
  scroll: { flexGrow: 1, alignItems: 'center' },
  hero: {
    width: '100%',
    backgroundColor: PRIMARY,
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 84,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { fontSize: 14, color: '#C5CAE9', marginTop: 4 },
  card: {
    width: '100%',
    maxWidth: 420,
    marginTop: -52,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#1A237E',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#4A4F66', marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E1E4F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#F8F9FD',
  },
  inputFocused: { borderColor: PRIMARY, backgroundColor: '#FFFFFF' },
  input: { flex: 1, height: 48, marginLeft: 10, fontSize: 15, color: '#1C1B1F', ...noOutline },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: { flex: 1, color: '#C62828', fontSize: 13 },
  button: {
    height: 50,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  pressed: { opacity: 0.75 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});