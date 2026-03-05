
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
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
  outline: OutlineSection[] | null,
  previousContent: string = ""
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chưa có API Key.");

  const ai = new GoogleGenAI({ apiKey });
  
  const context = outline ? `Dàn ý tổng thể: ${outline.map(o => o.title).join(' -> ')}` : '';
  
  const systemInstruction = `
    Bạn là một chuyên gia khoa học giáo dục và cố vấn viết Sáng kiến kinh nghiệm (SKKN) cấp cao.
    Nhiệm vụ của bạn là viết nội dung chuyên sâu, khoa học và thực tiễn cho các giáo viên.

    QUY TẮC QUAN TRỌNG:
    1. KHÔNG ĐẠO VĂN: Viết nội dung mới hoàn toàn, không sử dụng các câu văn sáo rỗng hoặc rập khuôn.
    2. TÍNH KHOA HỌC: Sử dụng thuật ngữ sư phạm hiện đại, dẫn chứng logic, lập luận sắc bén.
    3. KHÔNG LẶP LẠI: Kiểm tra phần "Nội dung đã viết trước đó" để đảm bảo không lặp lại ý tưởng, câu chữ hoặc cấu trúc đã trình bày.
    4. TÍNH THỰC TIỄN: Các giải pháp phải cụ thể, có thể áp dụng ngay vào lớp học Việt Nam.
    5. ĐỊNH DẠNG: Sử dụng Markdown (Heading, Bold, List, Table) để trình bày chuyên nghiệp.
  `;

  const prompt = `
    Đề tài: "${data.title}"
    Phần cần viết: "${sectionTitle}"
    
    Thông tin ngữ cảnh:
    - Môn: ${data.subject}, Khối: ${data.grade}, Trường: ${data.school}
    - Trọng tâm: ${data.focus}
    - Công nghệ/AI áp dụng: ${data.aiTech}
    - Yêu cầu đặc biệt: ${data.specialRequirements}
    - ${context}

    Nội dung đã viết ở các phần trước (TUYỆT ĐỐI KHÔNG LẶP LẠI CÁC Ý NÀY):
    ---
    ${previousContent || "Chưa có nội dung trước đó."}
    ---

    Yêu cầu cụ thể cho phần "${sectionTitle}":
    - Viết sâu sắc, phân tích kỹ lưỡng các khía cạnh.
    - ${isUltra ? "Đây là phần TRỌNG TÂM. Hãy trình bày chi tiết các bước thực hiện, các tình huống sư phạm thực tế, cách giải quyết và minh chứng cụ thể." : "Viết súc tích nhưng đầy đủ các ý chính theo chuẩn SKKN."}
    - Đảm bảo văn phong trang trọng, chuyên nghiệp của một nhà giáo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: isUltra ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: isUltra ? { thinkingLevel: ThinkingLevel.HIGH } : undefined
      }
    });

    return response.text || "Không có nội dung được tạo.";
  } catch (error) {
    console.error("Lỗi khi tạo nội dung phần:", error);
    throw error;
  }
};
