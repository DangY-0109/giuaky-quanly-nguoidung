// ===== CÁC HÀM THÊM / ĐỌC / SỬA / XÓA NGƯỜI DÙNG TRÊN FIRESTORE =====
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Dữ liệu một người dùng đúng theo đề: chỉ có 4 trường, không thêm trường nào khác
export type UserData = {
  email: string;
  matkhau: string;
  hoten: string;
  hinhanh: string;
};

// Khi đọc ra thì kèm thêm id của tài liệu để biết sửa/xóa đúng người.
// id này do Firestore tự đặt tên cho tài liệu, KHÔNG phải trường lưu trong dữ liệu.
export type User = UserData & { id: string };

// Tên bộ sưu tập (collection) chứa người dùng trong Firestore
const COLLECTION = 'nguoidung';

// Đổi dữ liệu bất kỳ thành đúng 4 trường, để chắc chắn không bao giờ ghi thêm trường lạ lên Firebase
function onlyFourFields(data: UserData): UserData {
  return {
    email: data.email,
    matkhau: data.matkhau,
    hoten: data.hoten,
    hinhanh: data.hinhanh,
  };
}

// Lắng nghe danh sách người dùng theo thời gian thực: có ai thêm/sửa/xóa thì onData được gọi lại ngay.
// Hàm trả về một hàm "hủy lắng nghe" để gọi khi rời màn hình.
export function listenUsers(
  onData: (users: User[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, COLLECTION),
    (snapshot) => {
      // Mỗi tài liệu: lấy id và 4 trường dữ liệu ghép lại thành một User
      const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as UserData) }));
      // Sắp xếp theo họ tên cho dễ nhìn
      list.sort((a, b) => a.hoten.localeCompare(b.hoten, 'vi'));
      onData(list);
    },
    (error) => onError(error),
  );
}

// Lấy một người dùng theo id (dùng cho màn hình sửa). Không có thì trả về null.
export async function getUser(id: string): Promise<User | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) {
    return null;
  }
  return { id: snap.id, ...(snap.data() as UserData) };
}

// Kiểm tra email đã có người dùng khác dùng chưa. excludeId là id của chính người đang sửa (bỏ qua họ).
export async function emailExists(email: string, excludeId?: string): Promise<boolean> {
  const q = query(collection(db, COLLECTION), where('email', '==', email));
  const result = await getDocs(q);
  // Có tài liệu nào khớp email mà không phải chính người đang sửa thì tức là trùng
  return result.docs.some((d) => d.id !== excludeId);
}

// Thêm người dùng mới
export async function addUser(data: UserData): Promise<void> {
  await addDoc(collection(db, COLLECTION), onlyFourFields(data));
}

// Sửa người dùng có id đã cho
export async function updateUser(id: string, data: UserData): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), onlyFourFields(data));
}

// Xóa người dùng có id đã cho
export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}