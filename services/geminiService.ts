
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, OutlineSection } from "../types";

// Hàm lấy API Key an toàn tuyệt đối cho môi trường trình duyệt (Vercel)
const getApiKey = (): string => {
  try {
    // Ưu tiên key người dùng nhập tay trong localStorage
    const storedKey = localStorage.getItem('user_api_key');
    if (storedKey) return storedKey;

    // Kiểm tra an toàn biến môi trường mà không gây lỗi ReferenceError
    const globalObj = (typeof window !== 'undefined' ? window : globalThis) as any;
    if (globalObj.process?.env?.API_KEY) {
      return globalObj.process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Lỗi khi truy cập API Key:", e);
  }
  return '';
};

export const generateOutline = async (data: FormData): Promise<OutlineSection[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chưa có API Key. Vui lòng nhập key để tiếp tục.");
  
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Dựa trên thông tin sau, hãy lập một dàn ý chi tiết cho Sáng kiến kinh nghiệm (SKKN) chuẩn Bộ GD&ĐT Việt Nam:
    - Tên đề tài: ${data.title}
    - Môn học: ${data.subject}
    - Cấp học: ${data.level} - Khối: ${data.grade}
    - Đơn vị: ${data.school} (${data.location})
    - Công nghệ/AI áp dụng: ${data.aiTech}
    - Trọng tâm: ${data.focus}
    - Yêu cầu đặc biệt: ${data.specialRequirements}

    Hãy tạo dàn ý gồm 6-8 phần chính tùy theo đề tài. Trả về JSON mảng đối tượng {id: string, title: string, content: string, subsections: string[]}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              subsections: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["id", "title", "content"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Lỗi khi tạo dàn ý:", error);
    throw error;
  }
};

export const generateSectionContent = async (
  data: FormData, 
  sectionTitle: string, 
  isUltra: boolean = false,
  outline: OutlineSection[] | null
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chưa có API Key.");

  const ai = new GoogleGenAI({ apiKey });
  
  const context = outline ? `Dàn ý tổng thể: ${outline.map(o => o.title).join(' -> ')}` : '';
  
  const prompt = `
    Bạn là chuyên gia viết Sáng kiến kinh nghiệm (SKKN) giáo dục xuất sắc. 
    Hãy viết chi tiết nội dung cho phần: "${sectionTitle}" của đề tài: "${data.title}".
    
    Thông tin ngữ cảnh:
    - Môn: ${data.subject}, Khối: ${data.grade}, Trường: ${data.school}
    - Trọng tâm: ${data.focus}
    - AI áp dụng: ${data.aiTech}
    - Yêu cầu khác: ${data.specialRequirements}
    - ${context}

    Hướng dẫn viết:
    1. Sử dụng ngôn ngữ sư phạm chuyên nghiệp, chuẩn mực.
    2. Nếu là giải pháp, hãy viết cực kỳ chi tiết các bước thực hiện, ví dụ minh họa và kết quả mong đợi.
    3. Đảm bảo tính thực tiễn và tính mới.
    4. Trình bày đẹp mắt bằng Markdown.
    
    ${isUltra ? "Đây là phần TRỌNG TÂM (Ultra Mode). Hãy viết cực kỳ sâu sắc, phân tích kỹ lưỡng, thêm các tình huống sư phạm giả định và cách xử lý khéo léo." : ""}
  `;

  try {
    const response = await ai.models.generateContent({
      model: isUltra ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: isUltra ? {
        thinkingConfig: { thinkingBudget: 4000 }
      } : {}
    });

    return response.text || "Không có nội dung được tạo.";
  } catch (error) {
    console.error("Lỗi khi tạo nội dung phần:", error);
    throw error;
  }
};
