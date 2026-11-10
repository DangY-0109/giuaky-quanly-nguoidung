// ===== KẾT NỐI FIREBASE =====
// Import các hàm khởi tạo Firebase (bản modular v9 trở lên)
import { getApp, getApps, initializeApp } from 'firebase/app';
// initializeFirestore để tùy chỉnh kết nối, getFirestore để lấy lại kết nối đã có, Firestore là kiểu dữ liệu
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';

// Thông tin cấu hình của dự án Firebase. Bạn thay các giá trị bên dưới bằng giá trị thật
// lấy từ Firebase Console: Project settings > Your apps > Web app > SDK setup and configuration
const firebaseConfig = {
    apiKey: "AIzaSyB7kfICLMGkp-iMDXBIO1G-vvIbvw8XTNk",
    authDomain: "giuaky-ltdnt.firebaseapp.com",
    projectId: "giuaky-ltdnt",
    storageBucket: "giuaky-ltdnt.firebasestorage.app",
    messagingSenderId: "723922896479",
    appId: "1:723922896479:web:a889e1ad9c2575bdb23dea"
};

// Chỉ khởi tạo Firebase một lần. Khi sửa code, app tự nạp lại (hot reload) nên phải kiểm tra
// xem đã có app chưa, nếu có rồi thì dùng lại, tránh báo lỗi "đã khởi tạo".
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Tạo kết nối Firestore. Tùy chọn experimentalAutoDetectLongPolling giúp kết nối ổn định
// trên cả web lẫn điện thoại (một số mạng chặn kiểu kết nối mặc định)
let db: Firestore;
try {
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch {
  // Nếu Firestore đã được khởi tạo rồi (do hot reload) thì lấy lại kết nối cũ
  db = getFirestore(app);
}

// Xuất ra để các file khác dùng
export { db };

