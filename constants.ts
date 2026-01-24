
export const LEVELS = [
  "Tiểu học",
  "THCS",
  "THPT",
  "Cao đẳng",
  "Đại học"
];

export const APP_STEPS = [
  { id: 1, label: "Thông tin", sub: "Thiết lập thông tin cơ bản" },
  { id: 2, label: "Lập Dàn Ý", sub: "Xây dựng khung sườn cho SKKN" },
  { id: 3, label: "Phần I & II", sub: "Đặt vấn đề & Cơ sở lý luận" },
  { id: 4, label: "Phần III", sub: "Thực trạng vấn đề" },
  { id: 5, label: "Giải pháp 1", sub: "Giải pháp trọng tâm (Ultra Mode)" },
  { id: 6, label: "Giải pháp 2-3", sub: "Các giải pháp tiếp theo (Ultra Mode)" },
  { id: 7, label: "Giải pháp 4-5", sub: "Mở rộng & Nâng cao (Ultra Mode)" },
  { id: 8, label: "Phần V, VI & Phụ lục", sub: "Hiệu quả & Kết luận" },
  { id: 9, label: "Hoàn tất", sub: "Đã xong" }
];

export const INITIAL_FORM_DATA = {
  title: '',
  subject: '',
  level: 'THPT',
  grade: '',
  school: '',
  location: '',
  facilities: '',
  textbook: '',
  researchObject: '',
  duration: '',
  aiTech: '',
  focus: '',
  specialRequirements: '',
  generationMode: 'ai_outline'
};

export const LOCAL_STORAGE_KEY = 'skkn_pro_v5_data';
