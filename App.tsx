import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PenLine, 
  Layout, 
  FileText, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCw, 
  Download, 
  Key, 
  Phone, 
  Facebook,
  Info,
  Settings,
  AlertCircle,
  Sparkles,
  Cpu,
  ShieldCheck,
  FileSearch
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { FormData, AppState } from './types';
import { INITIAL_FORM_DATA, LOCAL_STORAGE_KEY, LEVELS, APP_STEPS } from './constants';
import { generateOutline, generateSectionContent } from './services/geminiService';
import { exportToWord } from './services/exportService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const App: React.FC = () => {
  // Safe API Key retrieval
  const [apiKey, setApiKey] = useState(() => {
    try {
      const storedKey = localStorage.getItem('user_api_key');
      if (storedKey) return storedKey;
      const g = (typeof window !== 'undefined' ? window : globalThis) as any;
      return g.process?.env?.API_KEY || '';
    } catch {
      return '';
    }
  });

  const [showKeyPrompt, setShowKeyPrompt] = useState(!apiKey);
  const [tempKey, setTempKey] = useState('');

  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return {
        step: parsed?.step || 1,
        formData: { ...INITIAL_FORM_DATA, ...(parsed?.formData || {}) },
        isGenerating: false,
        isRegenerating: false,
        outline: parsed?.outline || null,
        stepContents: parsed?.stepContents || {},
        error: null
      };
    } catch {
      return { step: 1, formData: INITIAL_FORM_DATA as any, isGenerating: false, outline: null, stepContents: {}, error: null };
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      step: state.step,
      formData: state.formData,
      outline: state.outline,
      stepContents: state.stepContents
    }));
  }, [state.step, state.formData, state.outline, state.stepContents]);

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('user_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
      setShowKeyPrompt(false);
      window.location.reload();
    }
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setState(prev => ({ ...prev, formData: { ...prev.formData, ...updates } as any }));
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      const { title, subject, level, grade, school, location, facilities } = state.formData;
      return !!(title && subject && level && grade && school && location && facilities);
    }
    return true;
  };

  const triggerGeneration = useCallback(async (stepId: number, isRegen = false) => {
    if (!validateStep(1)) {
      setState(prev => ({ ...prev, step: 1, error: "Vui lòng hoàn thành thông tin bắt buộc trước." }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: !isRegen, isRegenerating: isRegen, error: null }));
    try {
      let content = "";
      if (stepId === 2) {
        const outlineResult = await generateOutline(state.formData);
        setState(prev => ({ ...prev, outline: outlineResult }));
        content = outlineResult.map((s, i) => `### ${i + 1}. ${s.title}\n${s.content}`).join('\n\n');
      } else if (stepId >= 3 && stepId <= 8) {
        const stepInfo = APP_STEPS.find(s => s.id === stepId);
        const isUltra = stepId >= 5 && stepId <= 7;
        
        // Thu thập nội dung các bước trước đó để tránh lặp lại
        const previousContent = Object.entries(state.stepContents)
          .filter(([id]) => parseInt(id) < stepId)
          .map(([id, text]) => `[Phần ${id}]: ${text.substring(0, 500)}...`) // Chỉ lấy một phần để tránh quá tải token
          .join('\n\n');

        content = await generateSectionContent(state.formData, stepInfo?.label || "", isUltra, state.outline, previousContent);
      } else if (stepId === 9) {
        content = "# Hoàn tất!\nSáng kiến kinh nghiệm của bạn đã sẵn sàng. Chúc mừng bạn đã hoàn thành!";
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        isRegenerating: false,
        stepContents: { ...prev.stepContents, [stepId]: content }
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isGenerating: false, isRegenerating: false, error: err.message || "Lỗi khi tạo nội dung." }));
    }
  }, [state.formData, state.outline, state.stepContents]);

  useEffect(() => {
    if (state.step > 1 && !state.stepContents[state.step] && !state.isGenerating) {
      triggerGeneration(state.step);
    }
  }, [state.step, state.stepContents, state.isGenerating, triggerGeneration]);

  const handleNext = () => {
    if (validateStep(state.step)) {
      setState(prev => ({ ...prev, step: Math.min(prev.step + 1, APP_STEPS.length), error: null }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setState(prev => ({ ...prev, error: "Vui lòng điền đầy đủ các thông tin bắt buộc (*) ở phần trên trước khi tiếp tục." }));
    }
  };

  const handlePrev = () => {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1), error: null }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegenerate = () => {
    triggerGeneration(state.step, true);
  };

  const handleDownload = async () => {
    const currentStepLabel = APP_STEPS.find(s => s.id === state.step)?.label || "No_Title";
    const currentContent = state.stepContents[state.step];
    if (currentContent) {
      await exportToWord(state.formData, currentStepLabel, currentContent);
    }
  };

  const currentStepInfo = useMemo(() => APP_STEPS.find(s => s.id === state.step), [state.step]);

  if (showKeyPrompt) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-[9999]">
        <div className="scanline" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-[32px] shadow-2xl max-w-lg w-full text-center space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-brand" />
          <div className="w-20 h-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center mx-auto">
            <Key className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kích hoạt SKKN PRO</h2>
            <p className="text-slate-500 font-medium">Hệ thống AI chuyên sâu dành cho giáo viên. Vui lòng nhập API Key để bắt đầu.</p>
          </div>
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="Dán API Key tại đây..." 
              className="tech-input text-center text-lg font-mono"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
            />
            <a href="https://aistudio.google.com/app/api-keys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand font-bold hover:underline uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> Lấy API Key miễn phí
            </a>
          </div>
          <button 
            onClick={handleSaveKey}
            disabled={!tempKey.trim()}
            className="tech-button-primary w-full py-5 text-lg uppercase tracking-widest"
          >
            Bắt đầu ngay
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-[320px] bg-white border-r border-border fixed h-screen flex flex-col no-print z-50">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">SKKN PRO</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Core v5.1</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-1 py-4">
          {APP_STEPS.map((step) => {
            const isActive = state.step === step.id;
            const isCompleted = state.stepContents[step.id] || step.id < state.step;
            
            return (
              <div 
                key={step.id} 
                className={cn(
                  "sidebar-item",
                  isActive && "sidebar-item-active",
                  !isActive && isCompleted && "opacity-80"
                )}
                onClick={() => { if(step.id < state.step || validateStep(state.step)) setState(prev => ({ ...prev, step: step.id })) }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className={cn(
                    "text-sm font-bold transition-colors",
                    isActive ? "text-brand" : "text-slate-600"
                  )}>{step.label}</h4>
                  {isCompleted && !isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
                <p className={cn(
                  "text-[11px] font-medium transition-colors",
                  isActive ? "text-brand/60" : "text-slate-400"
                )}>{step.sub}</p>
              </div>
            );
          })}
        </nav>

        <div className="p-8 pt-6 border-t border-border bg-slate-50/50">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Hỗ trợ kỹ thuật</h5>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <Phone className="w-4 h-4 text-brand" />
              0383752789
            </div>
            <a href="https://www.facebook.com/kaso.ges.2025" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xs font-bold text-slate-600 hover:text-brand transition-colors">
              <Facebook className="w-4 h-4 text-brand" />
              Thầy Ksor Gé
            </a>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200/50">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center">Powered by Ksor Gé AI</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[320px] p-8 md:p-12 min-h-screen relative">
        <div className="max-w-5xl mx-auto">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-8 no-print">
            <div className="flex items-center gap-2 text-slate-400">
              <Layout className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Workspace / {currentStepInfo?.label}</span>
            </div>
            <button 
              onClick={() => setShowKeyPrompt(true)}
              className="tech-button-secondary py-2 px-4 text-[10px] uppercase tracking-widest"
            >
              <Settings className="w-3.5 h-3.5" />
              Cấu hình AI
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={state.step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="tech-card overflow-hidden"
            >
              {/* Step Header */}
              <div className="bg-slate-900 p-10 md:p-14 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/20 border border-brand/30 rounded-full text-brand text-[10px] font-black uppercase tracking-widest mb-6">
                    <Zap className="w-3 h-3" /> Step {state.step} of {APP_STEPS.length}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter uppercase">
                    {state.step === 1 ? 'Khởi tạo Dự án SKKN' : currentStepInfo?.label}
                  </h2>
                  <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
                    {state.step === 1 
                      ? 'Cung cấp dữ liệu đầu vào chính xác để hệ thống AI phân tích và lập luận khoa học, không đạo văn. Tiết kiệm 80-90% thời gian viết SKKN.' 
                      : currentStepInfo?.sub}
                  </p>
                </div>
              </div>

              {/* Step Content */}
              <div className="p-8 md:p-14">
                {state.step === 1 ? (
                  <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200/60">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Không đạo văn</h4>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">AI tạo nội dung mới 100%, đối chiếu ngữ cảnh thực tế.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Tiết kiệm 90%</h4>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Hoàn thành bản thảo SKKN chuyên sâu chỉ trong vài phút.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                          <FileSearch className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Lập luận khoa học</h4>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Cấu trúc chuẩn sư phạm, dẫn chứng thực tế thuyết phục.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
                            <Info className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Thông tin cơ bản</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên đề tài SKKN *</label>
                            <input type="text" placeholder='VD: Ứng dụng AI trong dạy học Toán...' className="tech-input" value={state.formData.title} onChange={(e) => updateFormData({title: e.target.value})} />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Môn học *</label>
                              <input type="text" placeholder="Toán, Lý..." className="tech-input" value={state.formData.subject} onChange={(e) => updateFormData({subject: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khối lớp *</label>
                              <input type="text" placeholder="Lớp 10..." className="tech-input" value={state.formData.grade} onChange={(e) => updateFormData({grade: e.target.value})} />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cấp học *</label>
                            <select className="tech-input appearance-none" value={state.formData.level} onChange={(e) => updateFormData({level: e.target.value})}>
                              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
                            <Layout className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Bối cảnh & Công nghệ</h3>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trường / Đơn vị *</label>
                              <input type="text" placeholder="THPT..." className="tech-input" value={state.formData.school} onChange={(e) => updateFormData({school: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa điểm *</label>
                              <input type="text" placeholder="Huyện, Tỉnh..." className="tech-input" value={state.formData.location} onChange={(e) => updateFormData({location: e.target.value})} />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cơ sở vật chất *</label>
                            <textarea placeholder="Tivi, Máy chiếu, Internet..." className="tech-input min-h-[100px] resize-none" value={state.formData.facilities} onChange={(e) => updateFormData({facilities: e.target.value})} />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Công nghệ / AI áp dụng</label>
                            <input type="text" placeholder="ChatGPT, Canva, Quizizz..." className="tech-input" value={state.formData.aiTech} onChange={(e) => updateFormData({aiTech: e.target.value})} />
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="pt-6 border-t border-border">
                      <button 
                        onClick={handleNext} 
                        className="tech-button-primary w-full py-6 text-xl uppercase tracking-widest"
                      >
                        Phân tích & Lập dàn ý khoa học
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      {state.error && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold"
                        >
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          {state.error}
                        </motion.div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[600px] flex flex-col">
                    <AnimatePresence mode="wait">
                      {state.isGenerating ? (
                        <motion.div 
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-8"
                        >
                          <div className="relative w-32 h-32 mx-auto">
                            <div className="absolute inset-0 border-4 border-brand/10 rounded-full" />
                            <div className="absolute inset-0 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-brand">
                              <Sparkles className="w-12 h-12 animate-pulse" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">AI Core đang xử lý...</h3>
                            <p className="text-slate-500 font-medium text-lg max-w-lg mx-auto leading-relaxed">
                              Hệ thống đang lập luận khoa học, kiểm tra đạo văn và tối ưu hóa nội dung dựa trên dữ liệu bối cảnh.
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="content"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-10 flex-1 flex flex-col"
                        >
                          <div className="bg-slate-50 border border-border rounded-3xl p-8 md:p-12 flex-1 min-h-[500px] relative group overflow-hidden">
                            {state.isRegenerating && (
                              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl">
                                <div className="flex flex-col items-center gap-4">
                                  <RefreshCw className="w-10 h-10 text-brand animate-spin" />
                                  <span className="text-sm font-black text-brand uppercase tracking-widest">Đang tạo lại...</span>
                                </div>
                              </div>
                            )}
                            <div className="markdown-body">
                              <ReactMarkdown>
                                {state.stepContents[state.step] || "Đang khởi tạo nội dung..."}
                              </ReactMarkdown>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print mt-auto">
                            <button 
                              onClick={handleRegenerate}
                              disabled={state.isRegenerating}
                              className="tech-button-secondary py-4"
                            >
                              <RefreshCw className={cn("w-4 h-4", state.isRegenerating && "animate-spin")} />
                              Tạo lại nội dung
                            </button>
                            <button 
                              onClick={handleDownload}
                              className="tech-button-secondary py-4 text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                            >
                              <Download className="w-4 h-4" />
                              Xuất bản Word
                            </button>
                            <button 
                              onClick={handleNext}
                              disabled={state.step === APP_STEPS.length}
                              className="tech-button-primary py-4"
                            >
                              Tiếp tục bước kế
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-center no-print">
                            <button 
                              onClick={handlePrev} 
                              className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand transition-colors"
                            >
                              <ChevronLeft className="w-3 h-3" /> Quay lại bước trước
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer Info */}
          <div className="mt-16 text-center no-print">
            <div className="inline-flex flex-col items-center gap-2">
              <div className="h-px w-12 bg-brand/20 mb-2" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 SKKN PRO SYSTEM</p>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                <Sparkles className="w-3 h-3 text-brand" />
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Phát triển bởi Thầy Ksor Gé</p>
              </div>
              <p className="text-[9px] font-bold text-slate-400 mt-1">Chuyên gia Giải pháp Công nghệ Giáo dục</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
