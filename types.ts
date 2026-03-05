
export interface FormData {
  // Step 1: Thông tin cơ bản
  title: string;
  subject: string;
  level: string;
  grade: string;
  school: string;
  location: string;
  facilities: string;
  
  // Step 2: Thông tin bổ sung
  textbook: string;
  researchObject: string;
  duration: string;
  aiTech: string;
  focus: string;
  
  // Step 3: Tài liệu & Yêu cầu
  specialRequirements: string;
  
  // Step 4: Tùy chọn
  generationMode: 'ai_outline' | 'manual_outline';
}

export interface OutlineSection {
  id: string;
  title: string;
  content: string;
  subsections?: string[];
}

export interface AppState {
  step: number;
  formData: FormData;
  isGenerating: boolean;
  outline: OutlineSection[] | null;
  stepContents: Record<number, string>; // Lưu nội dung đã tạo cho từng bước
  error: string | null;
  isRegenerating?: boolean; // Thêm trạng thái tạo lại
}
