
export interface FormData {
  // Step 1
  title: string;
  subject: string;
  level: string;
  grade: string;
  school: string;
  location: string;
  facilities: string;
  
  // Step 2
  textbook: string;
  researchObject: string;
  duration: string;
  aiTech: string;
  focus: string;
  
  // Step 3
  specialRequirements: string;
  referenceFiles: string[];
  templateFiles: string[];

  // Step 4
  generationMode: 'ai_auto' | 'manual';
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
  generatedSections: Record<string, string>;
  error: string | null;
}
