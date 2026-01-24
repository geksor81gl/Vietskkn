
export const LEVELS = [
  "Tiểu học",
  "THCS",
  "THPT",
  "Cao đẳng",
  "Đại học"
];

export const APP_STEPS = [
  { id: 1, label: "Thông tin", sub: "Thiết lập cơ bản" },
  { id: 2, label: "Lập Dàn Ý", sub: "Xây dựng khung sườn" },
  { id: 3, label: "Phần I & II", sub: "Đặt vấn đề & Lý luận" },
  { id: 4, label: "Phần III", sub: "Thực trạng vấn đề" },
  { id: 5, label: "Giải pháp 1", sub: "Trọng tâm (Ultra)" },
  { id: 6, label: "Giải pháp 2-3", sub: "Tiếp theo (Ultra)" },
  { id: 7, label: "Giải pháp 4-5", sub: "Mở rộng (Ultra)" },
  { id: 8, label: "Phần V, VI", sub: "Hiệu quả & Kết luận" },
  { id: 9, label: "Hoàn tất", sub: "Xuất bản file" }
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
  referenceFiles: [],
  templateFiles: [],
  generationMode: 'ai_auto' as const
};

export const LOCAL_STORAGE_KEY = 'skkn_app_data_v2';
