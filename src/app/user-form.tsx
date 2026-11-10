// ===== MÀN HÌNH THÊM / SỬA NGƯỜI DÙNG (giao diện mới) =====
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkAvatar } from '../aiCheck';
import { isLoggedIn } from '../auth';
import { uploadImage } from '../cloudinary';
import { addUser, emailExists, getUser, updateUser } from '../userService';

const PRIMARY = '#3F51B5';

// Trên web, trình duyệt tự vẽ viền đen quanh ô đang chọn; tắt đi để chỉ còn viền xanh của mình
const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : {}) as object;

export default function UserFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [email, setEmail] = useState('');
  const [matkhau, setMatkhau] = useState('');
  const [hoten, setHoten] = useState('');
  const [hinhanh, setHinhanh] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Lỗi riêng của ảnh đại diện, hiện ngay dưới ảnh chứ không lẫn với lỗi của các ô nhập
  const [imageError, setImageError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Trạng thái kiểm tra ảnh bằng AI: đang kiểm tra / đã đạt
  const [aiStatus, setAiStatus] = useState<'' | 'checking' | 'ok'>('');
  // Tên ô đang được chọn để đổi màu viền
  const [focused, setFocused] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/');
      return;
    }
    if (!id) {
      return;
    }
    const loadUser = async () => {
      try {
        const user = await getUser(id);
        if (user) {
          setEmail(user.email);
          setMatkhau(user.matkhau);
          setHoten(user.hoten);
          setHinhanh(user.hinhanh);
        } else {
          setError('Không tìm thấy người dùng này.');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled) {
      return;
    }
    const asset = result.assets[0];
    if (!asset.base64) {
      setImageError('Không đọc được ảnh, hãy thử ảnh khác.');
      return;
    }
    const dataUri = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;

    // Gửi ảnh cho AI kiểm tra trước, ảnh đạt mới được dùng làm ảnh đại diện
    setImageError('');
    setAiStatus('checking');
    const check = await checkAvatar(dataUri);
    if (!check.ok) {
      setAiStatus('');
      setImageError(check.reason);
      return;
    }
    setPendingImage(dataUri);
    setAiStatus('ok');
  };

  const handleSave = async () => {
    const emailClean = email.trim().toLowerCase();
    const hotenClean = hoten.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      setError('Email không hợp lệ.');
      return;
    }
    if (matkhau.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (hotenClean === '') {
      setError('Vui lòng nhập họ tên.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (await emailExists(emailClean, id)) {
        setError('Email này đã có người dùng khác sử dụng.');
        return;
      }
      let imageUrl = hinhanh;
      if (pendingImage) {
        imageUrl = await uploadImage(pendingImage);
      }
      const data = { email: emailClean, matkhau, hoten: hotenClean, hinhanh: imageUrl };
      if (id) {
        await updateUser(id, data);
      } else {
        await addUser(data);
      }
      router.replace('/users');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại, hãy thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const previewUri = pendingImage ?? (hinhanh !== '' ? hinhanh : null);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  // Một ô nhập có biểu tượng bên trái, dùng lại cho cả 3 trường
  const fieldStyle = (name: string) => [styles.inputBox, focused === name && styles.inputFocused];
  const iconColor = (name: string) => (focused === name ? PRIMARY : '#8A8FA6');

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Ảnh đại diện có huy hiệu máy ảnh ở góc */}
        <View style={styles.avatarArea}>
          <Pressable onPress={pickImage} style={styles.avatarWrapper}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialIcons name="person" size={60} color="#9FA8DA" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <MaterialIcons name="photo-camera" size={18} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={styles.pickHint}>{previewUri ? 'Chạm để đổi ảnh' : 'Chạm để chọn ảnh đại diện'}</Text>
          {/* Kết quả kiểm tra của AI */}
          {aiStatus === 'checking' && (
            <View style={styles.aiRow}>
              <ActivityIndicator size="small" color={PRIMARY} />
              <Text style={styles.aiText}>AI đang kiểm tra ảnh...</Text>
            </View>
          )}
          {aiStatus === 'ok' && (
            <View style={styles.aiRow}>
              <MaterialIcons name="verified" size={16} color="#2E7D32" />
              <Text style={[styles.aiText, { color: '#2E7D32' }]}>AI xác nhận ảnh hợp lệ</Text>
            </View>
          )}
          {/* Ảnh bị từ chối thì báo lỗi ngay dưới ảnh */}
          {imageError !== '' && (
            <View style={styles.imageErrorBox}>
              <MaterialIcons name="error-outline" size={16} color="#C62828" />
              <Text style={styles.imageErrorText}>{imageError}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Họ tên</Text>
          <View style={fieldStyle('hoten')}>
            <MaterialIcons name="badge" size={20} color={iconColor('hoten')} />
            <TextInput
              style={styles.input}
              placeholder="Nguyễn Văn A"
              placeholderTextColor="#A8ADC2"
              value={hoten}
              onChangeText={setHoten}
              onFocus={() => setFocused('hoten')}
              onBlur={() => setFocused('')}
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={fieldStyle('email')}>
            <MaterialIcons name="mail-outline" size={20} color={iconColor('email')} />
            <TextInput
              style={styles.input}
              placeholder="nguyenvana@gmail.com"
              placeholderTextColor="#A8ADC2"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Mật khẩu</Text>
          <View style={fieldStyle('matkhau')}>
            <MaterialIcons name="lock-outline" size={20} color={iconColor('matkhau')} />
            <TextInput
              style={styles.input}
              placeholder="Ít nhất 6 ký tự"
              placeholderTextColor="#A8ADC2"
              value={matkhau}
              onChangeText={setMatkhau}
              onFocus={() => setFocused('matkhau')}
              onBlur={() => setFocused('')}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color="#8A8FA6" />
            </Pressable>
          </View>

          {error !== '' && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={18} color="#C62828" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleSave}
            disabled={saving || aiStatus === 'checking'}
            style={({ pressed }) => [styles.saveButton, (pressed || saving || aiStatus === 'checking') && styles.pressed]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>{isEdit ? 'Cập nhật' : 'Thêm người dùng'}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, alignItems: 'center' },
  avatarArea: { alignItems: 'center', marginTop: 8, marginBottom: 16 },
  avatarWrapper: { width: 124, height: 124 },
  avatar: { width: 124, height: 124, borderRadius: 62, backgroundColor: '#E8EAF6', borderWidth: 4, borderColor: '#FFFFFF' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    borderWidth: 3,
    borderColor: '#F4F5FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    maxWidth: 320,
  },
  imageErrorText: { flexShrink: 1, color: '#C62828', fontSize: 13 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  aiText: { fontSize: 13, color: '#6B7090', fontWeight: '600' },
  pickHint: { color: '#6B7090', fontSize: 13, marginTop: 10 },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1A237E',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
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
  saveButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});