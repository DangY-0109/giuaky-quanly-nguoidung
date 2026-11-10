// ===== MÀN HÌNH DANH SÁCH NGƯỜI DÙNG (giao diện mới) =====
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    Pressable,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isLoggedIn, logout } from '../auth';
import { confirmAsync, notify } from '../ui';
import { User, deleteUser, listenUsers } from '../userService';

const PRIMARY = '#3F51B5';

// Trên web, trình duyệt tự vẽ viền đen quanh ô đang chọn; tắt đi để chỉ còn viền xanh của mình
const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : {}) as object;

// Bảng màu cho ảnh chữ cái đầu (khi người dùng chưa có ảnh), chọn theo tên nên mỗi người một màu cố định
const AVATAR_COLORS = [
  { bg: '#E8EAF6', fg: '#3F51B5' },
  { bg: '#E0F2F1', fg: '#00796B' },
  { bg: '#FFF3E0', fg: '#E65100' },
  { bg: '#FCE4EC', fg: '#AD1457' },
  { bg: '#EDE7F6', fg: '#5E35B1' },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  return (last.charAt(0) || '?').toUpperCase();
}

function colorOf(name: string) {
  let sum = 0;
  for (const ch of name) {
    sum += ch.charCodeAt(0);
  }
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/');
      return;
    }
    const unsubscribe = listenUsers(
      (list) => {
        setUsers(list);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        notify('Lỗi kết nối Firebase', error.message);
      },
    );
    return unsubscribe;
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (keyword === '') {
      return users;
    }
    return users.filter(
      (u) => u.hoten.toLowerCase().includes(keyword) || u.email.toLowerCase().includes(keyword),
    );
  }, [users, search]);

  const handleDelete = async (user: User) => {
    const ok = await confirmAsync('Xóa người dùng', `Bạn có chắc muốn xóa "${user.hoten}" không?`);
    if (!ok) {
      return;
    }
    try {
      await deleteUser(user.id);
    } catch (e) {
      notify('Lỗi', e instanceof Error ? e.message : 'Không xóa được người dùng.');
    }
  };

  const handleExport = async () => {
    const data = users.map((u) => ({
      email: u.email,
      matkhau: u.matkhau,
      hoten: u.hoten,
      hinhanh: u.hinhanh,
    }));
    const text = JSON.stringify(data, null, 2);

    if (Platform.OS === 'web') {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nguoidung.json';
      link.click();
      URL.revokeObjectURL(url);
    } else {
      await Share.share({ message: text });
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const renderItem = ({ item }: { item: User }) => {
    const color = colorOf(item.hoten);
    return (
      <View style={styles.userCard}>
        {item.hinhanh ? (
          <Image source={{ uri: item.hinhanh }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={[styles.avatarLetter, { color: color.fg }]}>{initialsOf(item.hoten)}</Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.hoten}
          </Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="mail-outline" size={14} color="#8A8FA6" />
            <Text style={styles.userText} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="lock-outline" size={14} color="#8A8FA6" />
            <Text style={styles.userText} numberOfLines={1}>
              {showPassword ? item.matkhau : '•'.repeat(Math.min(item.matkhau.length, 10))}
            </Text>
          </View>
        </View>

        {/* Nút Sửa / Xóa có nền màu nhạt cho dễ bấm */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push({ pathname: '/user-form', params: { id: item.id } })}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: '#E8EAF6' }, pressed && styles.pressed]}
          >
            <MaterialIcons name="edit" size={20} color={PRIMARY} />
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item)}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: '#FDECEA' }, pressed && styles.pressed]}
          >
            <MaterialIcons name="delete-outline" size={20} color="#D32F2F" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {/* Ô tìm kiếm */}
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={22} color="#8A8FA6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo họ tên hoặc email"
            placeholderTextColor="#A8ADC2"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search !== '' && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialIcons name="close" size={20} color="#8A8FA6" />
            </Pressable>
          )}
        </View>

        {/* Hàng chip chức năng + số lượng */}
        <View style={styles.chipRow}>
          <Text style={styles.count}>
            {filteredUsers.length} / {users.length} người dùng
          </Text>
          <View style={styles.chips}>
            {/* <Pressable onPress={handleExport} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
              <MaterialIcons name="file-download" size={16} color={PRIMARY} />
              <Text style={styles.chipText}>Xuất JSON</Text>
            </Pressable> */}
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={({ pressed }) => [styles.chip, showPassword && styles.chipActive, pressed && styles.pressed]}
            >
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={16}
                color={showPassword ? '#FFFFFF' : PRIMARY}
              />
              <Text style={[styles.chipText, showPassword && { color: '#FFFFFF' }]}>
                {showPassword ? 'Ẩn MK' : 'Hiện MK'}
              </Text>
            </Pressable>
            <Pressable onPress={handleLogout} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
              <MaterialIcons name="logout" size={16} color="#D32F2F" />
              <Text style={[styles.chipText, { color: '#D32F2F' }]}>Thoát</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <MaterialIcons name={users.length === 0 ? 'group-add' : 'search-off'} size={48} color="#C5CAE9" />
                <Text style={styles.empty}>
                  {users.length === 0
                    ? 'Chưa có người dùng nào. Bấm nút + để thêm người đầu tiên.'
                    : 'Không có kết quả phù hợp.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Nút thêm nổi ở góc dưới phải */}
      <Pressable
        onPress={() => router.push('/user-form')}
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      >
        <MaterialIcons name="person-add" size={26} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#F4F5FB' },
  content: { flex: 1, width: '100%', maxWidth: 900, padding: 14 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    shadowColor: '#1A237E',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  searchInput: { flex: 1, height: 48, marginLeft: 8, fontSize: 15, color: '#1C1B1F', ...noOutline },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginVertical: 12 },
  count: { color: '#6B7090', fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE1F3',
  },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { color: PRIMARY, fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#1A237E',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8EAF6' },
  avatarLetter: { fontSize: 22, fontWeight: '700' },
  userInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1C1B1F', marginBottom: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  userText: { flex: 1, fontSize: 13, color: '#5A5F78' },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 48, paddingHorizontal: 24 },
  empty: { textAlign: 'center', color: '#6B7090', marginTop: 10, fontSize: 14, lineHeight: 20 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A237E',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});