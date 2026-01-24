
import React, { useState, useEffect } from 'react';
import { FormData, AppState } from './types';
import { INITIAL_FORM_DATA, LOCAL_STORAGE_KEY, LEVELS, APP_STEPS } from './constants';
import { generateOutline, generateSectionContent } from './services/geminiService';

// Fix TS errors by defining reusable components outside the main App component
// Using React.PropsWithChildren ensures that nested elements are correctly recognized as children by the compiler
const InputIconWrapper = ({ icon, children }: React.PropsWithChildren<{ icon: React.ReactNode }>) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
      {icon}
    </div>
    {children}
  </div>
);

// BlueHeader component extracted for reuse and clarity
const BlueHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="bg-[#007AFF] text-white p-10 rounded-t-[20px] text-center shadow-lg">
    <h2 className="text-4xl font-extrabold mb-3 tracking-tight">{title}</h2>
    <p className="text-white/80 text-lg font-medium">{subtitle}</p>
  </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    return {
      step: parsed?.step || 1,
      formData: parsed?.formData || INITIAL_FORM_DATA,
      generatedSections: parsed?.generatedSections || {},
      isGenerating: false,
      outline: parsed?.outline || null,
      error: null
    };
  });

  // Auto-save state to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      step: state.step,
      formData: state.formData,
      generatedSections: state.generatedSections,
      outline: state.outline
    }));
  }, [state.step, state.formData, state.generatedSections, state.outline]);

  const updateFormData = (updates: Partial<FormData>) => {
    setState(prev => ({ ...prev, formData: { ...prev.formData, ...updates } }));
  };

  const updateSectionContent = (sectionId: string, content: string) => {
    setState(prev => ({
      ...prev,
      generatedSections: { ...prev.generatedSections, [sectionId]: content }
    }));
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      const { title, subject, level, grade, school, location, facilities } = state.formData;
      return !!(title && subject && level && grade && school && location && facilities);
    }
    if (step === 2 && !state.outline) return false;
    return true;
  };

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

  const handleGenerateOutline = async () => {
    if (!validateStep(1)) {
        setState(prev => ({ ...prev, error: "Vui lòng điền đầy đủ các thông tin bắt buộc (*) ở phần trên trước khi tiếp tục." }));
        return;
    }
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const outline = await generateOutline(state.formData);
      setState(prev => ({ ...prev, outline, isGenerating: false }));
      handleNext();
    } catch (err) {
      setState(prev => ({ ...prev, isGenerating: false, error: "Lỗi khi lập dàn ý." }));
    }
  };

  const handleGenerateStepContent = async (sectionTitle: string, sectionId: string, isUltra: boolean = false) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const content = await generateSectionContent(state.formData, sectionTitle, isUltra, state.outline);
      updateSectionContent(sectionId, content);
      setState(prev => ({ ...prev, isGenerating: false }));
    } catch (err) {
      setState(prev => ({ ...prev, isGenerating: false, error: "Lỗi khi tạo nội dung." }));
    }
  };

  const renderSectionWriting = (title: string, subtitle: string, sectionId: string, isUltra: boolean = false) => (
    <div className="bg-white rounded-[20px] shadow-xl overflow-hidden animate-fadeIn">
      <BlueHeader title={title} subtitle={subtitle} />
      <div className="p-8 space-y-6">
        {isUltra && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-4">
             <div className="bg-blue-600 text-white p-2 rounded-lg">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <div>
               <p className="font-bold text-sm uppercase tracking-wider">Chế độ Ultra Mode</p>
               <p className="text-xs opacity-75">Sử dụng mô hình Gemini 3 Pro để tạo nội dung sâu sắc và chuyên nghiệp nhất.</p>
             </div>
          </div>
        )}
        <div className="border border-gray-100 rounded-xl bg-gray-50/50 p-2">
           <textarea 
            className="w-full p-4 min-h-[500px] bg-transparent outline-none font-medium text-gray-700 leading-relaxed resize-none"
            placeholder="Nội dung sẽ được AI soạn thảo tại đây..."
            value={state.generatedSections[sectionId] || ''}
            onChange={(e) => updateSectionContent(sectionId, e.target.value)}
           />
        </div>
        <button 
          onClick={() => handleGenerateStepContent(title, sectionId, isUltra)}
          disabled={state.isGenerating}
          className={`w-full py-5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3 ${state.isGenerating ? 'bg-gray-400' : (isUltra ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#007AFF] hover:bg-blue-600')} shadow-blue-100 active:scale-[0.98]`}
        >
          {state.isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ĐANG XỬ LÝ...
            </>
          ) : (state.generatedSections[sectionId] ? 'VIẾT LẠI VỚI AI' : 'BẮT ĐẦU VIẾT NỘI DUNG')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      {/* Sidebar Navigation */}
      <aside className="w-80 border-r border-gray-200 bg-white p-8 flex flex-col fixed h-screen no-print overflow-y-auto no-scrollbar shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="text-[#007AFF]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight tracking-tighter uppercase">VIẾT SKKN PRO</h1>
            <p className="text-[10px] text-gray-400 font-bold leading-tight mt-0.5 uppercase tracking-wide">Trợ lý viết SKKN được tạo và phát triển bởi thầy Ksor Gé</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          {APP_STEPS.map((step) => {
            const isActive = state.step === step.id;
            const isDone = state.step > step.id;
            return (
              <div 
                key={step.id}
                className={`relative flex items-center p-3 rounded-xl transition-all cursor-pointer group ${isActive ? 'bg-blue-50/50' : ''}`}
                onClick={() => { if(isDone || isActive || validateStep(state.step)) setState(prev => ({ ...prev, step: step.id })) }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#007AFF] rounded-r-full shadow-lg" />
                )}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold uppercase tracking-tight transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{step.label}</h4>
                    <div className={`w-2.5 h-2.5 rounded-full transition-all ${isActive ? 'bg-blue-500 scale-125' : (isDone ? 'bg-green-400' : 'bg-gray-200 group-hover:bg-gray-300')}`} />
                  </div>
                  <p className={`text-[11px] font-semibold mt-0.5 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-300'}`}>{step.sub}</p>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
          {/* Contact Information */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Thông tin liên hệ</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                Zalo: 0383752789
              </div>
              <a href="https://www.facebook.com/kaso.ges.2025" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                Facebook: Kaso Ges
              </a>
            </div>
          </div>

          <button 
            onClick={() => { if(confirm("Làm mới hoàn toàn dữ liệu?")) { localStorage.removeItem(LOCAL_STORAGE_KEY); window.location.reload(); } }}
            className="w-full py-3 text-[10px] font-black text-gray-300 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Làm mới dữ liệu
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-80 p-10 pb-24 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header Action Buttons - Removed API key specific management UI to follow coding guidelines */}
          <div className="flex justify-end mb-8 no-print">
            <button 
              className="bg-white px-6 py-2.5 rounded-full border border-gray-100 text-xs font-bold text-gray-500 shadow-sm hover:shadow-md hover:text-[#007AFF] flex items-center gap-2 transition-all active:scale-95 group"
              onClick={() => alert("Hệ thống trợ lý viết SKKN Pro thông minh sử dụng trí tuệ nhân tạo Gemini.")}
            >
              <svg className="w-4 h-4 text-orange-400 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Hướng dẫn & Trợ giúp
            </button>
          </div>

          {state.error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-5 mb-8 rounded-xl flex items-center gap-4 animate-fadeIn shadow-sm no-print">
               <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
               <p className="text-red-800 text-sm font-bold">{state.error}</p>
            </div>
          )}

          {/* Render content based on current step */}
          {state.step === 1 && (
            <div className="bg-white rounded-[20px] shadow-xl overflow-hidden animate-fadeIn border border-gray-50">
              <BlueHeader title="Thiết lập Thông tin Sáng kiến" subtitle="Cung cấp thông tin chính xác để AI tạo ra bản thảo chất lượng nhất" />
              <div className="p-10 space-y-12">
                {/* 1. MANDATORY INFORMATION */}
                <section>
                   <h3 className="text-xl font-extrabold text-[#004282] uppercase tracking-wider mb-8 flex items-center gap-3">
                     <span className="bg-[#004282] text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md shadow-blue-100">1</span>
                     THÔNG TIN BẮT BUỘC
                   </h3>
                   <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Tên đề tài SKKN <span className="text-red-500">*</span></label>
                        <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}>
                          <input type="text" placeholder='VD: "Ứng dụng AI để nâng cao hiệu quả dạy học môn Toán THPT"' className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.title} onChange={(e) => updateFormData({title: e.target.value})} />
                        </InputIconWrapper>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Môn học <span className="text-red-500">*</span></label>
                          <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}>
                            <input type="text" placeholder="VD: Toán, Ngữ văn..." className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.subject} onChange={(e) => updateFormData({subject: e.target.value})} />
                          </InputIconWrapper>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Cấp học <span className="text-red-500">*</span></label>
                          <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}>
                            <select className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner appearance-none cursor-pointer" value={state.formData.level} onChange={(e) => updateFormData({level: e.target.value})}>
                              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </InputIconWrapper>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Khối lớp <span className="text-red-500">*</span></label>
                          <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}>
                            <input type="text" placeholder="VD: Lớp 12, Khối 6-9" className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.grade} onChange={(e) => updateFormData({grade: e.target.value})} />
                          </InputIconWrapper>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Tên trường / Đơn vị <span className="text-red-500">*</span></label>
                          <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>}>
                            <input type="text" placeholder="VD: Trường THPT Nguyễn Du" className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.school} onChange={(e) => updateFormData({school: e.target.value})} />
                          </InputIconWrapper>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Địa điểm (Huyện, Tỉnh) <span className="text-red-500">*</span></label>
                          <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
                            <input type="text" placeholder="VD: Quận 1, TP.HCM" className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.location} onChange={(e) => updateFormData({location: e.target.value})} />
                          </InputIconWrapper>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Điều kiện CSVC (Tivi, Máy chiếu, WiFi...) <span className="text-red-500">*</span></label>
                        <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}>
                          <input type="text" placeholder="VD: Phòng máy chiếu, Internet ổn định..." className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.facilities} onChange={(e) => updateFormData({facilities: e.target.value})} />
                        </InputIconWrapper>
                      </div>
                   </div>
                </section>

                {/* 2. OPTIONAL SUPPLEMENTARY INFORMATION */}
                <section>
                   <div className="flex items-center gap-4 mb-8">
                      <h3 className="text-xl font-extrabold text-[#004282] uppercase tracking-wider flex items-center gap-3">
                        <span className="bg-[#004282] text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md shadow-blue-100">2</span>
                        THÔNG TIN BỔ SUNG
                      </h3>
                      <span className="bg-blue-50 text-[#007AFF] text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">(Khuyên dùng để tăng chi tiết)</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Sách giáo khoa</label>
                        <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}>
                          <input type="text" placeholder="VD: Kết nối tri thức, Cánh diều..." className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.textbook} onChange={(e) => updateFormData({textbook: e.target.value})} />
                        </InputIconWrapper>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Đối tượng nghiên cứu</label>
                        <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>}>
                          <input type="text" placeholder="VD: 45 HS lớp 12A (thực nghiệm)..." className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.researchObject} onChange={(e) => updateFormData({researchObject: e.target.value})} />
                        </InputIconWrapper>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Thời gian thực hiện</label>
                        <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}>
                          <input type="text" placeholder="VD: Năm học 2024-2025" className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.duration} onChange={(e) => updateFormData({duration: e.target.value})} />
                        </InputIconWrapper>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Ứng dụng AI/Công nghệ</label>
                        <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>}>
                          <input type="text" placeholder="VD: ChatGPT, Canva, Padlet..." className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.aiTech} onChange={(e) => updateFormData({aiTech: e.target.value})} />
                        </InputIconWrapper>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2.5 px-1">Đặc thù / Trọng tâm đề tài</label>
                        <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" /></svg>}>
                          <input type="text" placeholder="VD: Phát triển năng lực tự học, Chuyển đổi số..." className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-semibold text-gray-800 shadow-inner" value={state.formData.focus} onChange={(e) => updateFormData({focus: e.target.value})} />
                        </InputIconWrapper>
                      </div>
                   </div>
                </section>

                {/* 3. REFERENCE MATERIALS */}
                <section>
                   <div className="flex items-center gap-4 mb-8">
                      <h3 className="text-xl font-extrabold text-[#004282] uppercase tracking-wider flex items-center gap-3">
                        <span className="bg-[#004282] text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md shadow-blue-100">3</span>
                        TÀI LIỆU THAM KHẢO
                      </h3>
                      <span className="bg-blue-50 text-[#007AFF] text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">(Tùy chọn - Giúp AI bám sát nội dung)</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="bg-[#F8FAFC] border border-gray-100 p-8 rounded-[24px] flex flex-col items-center shadow-inner">
                         <div className="w-full flex justify-between items-center mb-8">
                            <span className="text-sm font-bold text-gray-800 tracking-tight">Tải lên tài liệu tham khảo:</span>
                            <button className="bg-white border-2 border-blue-100 text-[#007AFF] px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm active:scale-95">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              Tải lên
                            </button>
                         </div>
                         <div className="flex flex-col items-center py-6">
                            <div className="text-gray-200 mb-4">
                              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-widest">Chưa có tài liệu</p>
                         </div>
                         <div className="w-full mt-8 bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-blue-50/50 shadow-sm">
                            <h5 className="text-[10px] font-extrabold text-[#007AFF] uppercase mb-3 flex items-center gap-2 tracking-widest">
                               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1z" /></svg>
                               Gợi ý tài liệu:
                            </h5>
                            <ul className="text-[11px] text-gray-500 space-y-2 ml-5 list-disc font-bold opacity-80">
                               <li>Sách giáo khoa / Sách giáo viên</li>
                               <li>Tài liệu chuyên môn / Đề cương</li>
                               <li>Đề kiểm tra / Bài tập mẫu</li>
                               <li>Văn bản pháp quy / Quy chế</li>
                            </ul>
                         </div>
                      </div>

                      <div className="bg-[#FFFCEB] border border-orange-100 p-8 rounded-[24px] flex flex-col items-center shadow-inner">
                         <div className="w-full flex justify-between items-center mb-8">
                            <span className="text-sm font-bold text-gray-800 tracking-tight">Tải lên mẫu yêu cầu SKKN:</span>
                            <button className="bg-white border-2 border-orange-100 text-orange-400 px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-orange-50 transition-all shadow-sm active:scale-95">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6" /></svg>
                              Tải lên
                            </button>
                         </div>
                         <div className="flex flex-col items-center py-6">
                            <div className="text-orange-200 mb-4">
                              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <p className="text-xs text-orange-300 font-extrabold uppercase tracking-widest">Chưa có mẫu</p>
                         </div>
                         <div className="w-full mt-8 bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-orange-50/50 shadow-sm">
                            <h5 className="text-[10px] font-extrabold text-orange-400 uppercase mb-3 flex items-center gap-2 tracking-widest">
                               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 11a1 1 0 112 0v1a1 1 0 11-2 0v-1z" /></svg>
                               Hướng dẫn:
                            </h5>
                            <ul className="text-[11px] text-gray-500 space-y-2 ml-5 list-disc font-bold opacity-80">
                               <li>File Word/PDF mẫu từ Sở/Phòng GD</li>
                               <li>AI sẽ bám sát cấu trúc đề mục mẫu</li>
                               <li>Nếu không có, AI dùng mẫu chuẩn</li>
                            </ul>
                         </div>
                      </div>
                   </div>
                </section>

                {/* 4. OTHER REQUIREMENTS */}
                <section>
                   <div className="flex items-center gap-4 mb-8">
                      <h3 className="text-xl font-extrabold text-[#004282] uppercase tracking-wider flex items-center gap-3">
                        <span className="bg-[#004282] text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md shadow-blue-100">4</span>
                        YÊU CẦU KHÁC
                      </h3>
                      <span className="bg-purple-50 text-purple-600 text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-purple-100">(Tùy chọn - AI sẽ tuân thủ nghiêm ngặt)</span>
                   </div>
                   <div className="relative">
                      <textarea 
                        rows={6} 
                        placeholder="Nhập các yêu cầu đặc biệt của bạn. Ví dụ:&#10;• Giới hạn SKKN trong 25-30 trang&#10;• Viết ngắn gọn phần cơ sở lý luận (khoảng 3 trang)&#10;• Thêm nhiều bài toán thực tế, ví dụ minh họa&#10;• Tập trung vào giải pháp ứng dụng AI"
                        className="w-full p-8 bg-purple-50/30 border-2 border-purple-100 rounded-[24px] focus:bg-white focus:border-purple-300 outline-none transition-all font-semibold text-gray-700 leading-relaxed shadow-inner italic"
                        value={state.formData.specialRequirements}
                        onChange={(e) => updateFormData({specialRequirements: e.target.value})}
                      />
                      <div className="absolute left-8 bottom-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3z" /></svg>
                        <p className="text-[11px] text-purple-500 font-bold uppercase tracking-tight">AI sẽ phân tích và thực hiện NGHIÊM NGẶT các yêu cầu này.</p>
                      </div>
                   </div>
                </section>

                {/* Initialization Options */}
                <section className="pt-10 border-t border-gray-100">
                   <h4 className="text-lg font-black text-[#004282] mb-8">Tùy chọn khởi tạo</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                      <div 
                        className={`p-8 border-3 rounded-[24px] cursor-pointer transition-all flex items-center gap-6 shadow-sm hover:shadow-md ${state.formData.generationMode === 'ai_auto' ? 'border-[#007AFF] bg-blue-50/50 ring-4 ring-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
                        onClick={() => updateFormData({generationMode: 'ai_auto'})}
                      >
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${state.formData.generationMode === 'ai_auto' ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-400'}`}>
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                         </div>
                         <div className="flex-1">
                            <h5 className={`font-black text-lg ${state.formData.generationMode === 'ai_auto' ? 'text-blue-700' : 'text-gray-700'}`}>AI Lập Dàn Ý Chi Tiết</h5>
                            <p className="text-xs font-bold text-gray-400 mt-1 opacity-80">Hệ thống AI sẽ tự động phân tích và tạo khung sườn chuẩn</p>
                         </div>
                      </div>

                      <div 
                        className={`p-8 border-3 rounded-[24px] cursor-pointer transition-all flex items-center gap-6 shadow-sm hover:shadow-md ${state.formData.generationMode === 'manual' ? 'border-[#007AFF] bg-blue-50/50 ring-4 ring-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
                        onClick={() => updateFormData({generationMode: 'manual'})}
                      >
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${state.formData.generationMode === 'manual' ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-400'}`}>
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 012 2" /></svg>
                         </div>
                         <div className="flex-1">
                            <h5 className={`font-black text-lg ${state.formData.generationMode === 'manual' ? 'text-blue-700' : 'text-gray-700'}`}>Sử Dụng Dàn Ý Có Sẵn</h5>
                            <p className="text-xs font-bold text-gray-400 mt-1 opacity-80">Bạn tự nhập hoặc chọn từ thư viện dàn ý mẫu</p>
                         </div>
                      </div>
                   </div>

                   <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-50 mb-10 flex items-center gap-4">
                      <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-100 animate-pulse">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <p className="text-sm font-bold text-blue-800 leading-relaxed">Hệ thống AI sẽ tự động phân tích đề tài và tạo ra dàn ý chi tiết gồm 6 phần chuẩn Bộ GD&ĐT. Bạn có thể chỉnh sửa lại sau khi tạo xong.</p>
                   </div>

                   <button 
                    onClick={handleGenerateOutline}
                    disabled={state.isGenerating}
                    className={`w-full py-6 rounded-2xl text-white font-black text-xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-4 active:scale-[0.98] ${state.isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-blue-200 hover:from-blue-600 hover:to-blue-700'}`}
                   >
                     {state.isGenerating ? (
                       <>
                         <svg className="animate-spin h-7 w-7 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         ĐANG PHÂN TÍCH VÀ LẬP DÀN Ý...
                       </>
                     ) : (
                       <>
                        🚀 Bắt đầu lập dàn ý ngay
                       </>
                     )}
                   </button>
                   {!validateStep(1) && (
                     <p className="text-center text-red-500 font-bold text-sm mt-6">Vui lòng điền đầy đủ các thông tin bắt buộc (*) ở phần trên trước khi tiếp tục.</p>
                   )}
                </section>
              </div>
            </div>
          )}

          {/* STEP 2: OUTLINE REVIEW */}
          {state.step === 2 && (
            <div className="bg-white rounded-[20px] shadow-xl overflow-hidden animate-fadeIn">
              <BlueHeader title="2. Lập Dàn Ý" subtitle="Khung sườn logic đã được AI tối ưu hóa" />
              <div className="p-10 space-y-8">
                {state.outline ? (
                  <div className="space-y-6">
                    {state.outline.map((sec, i) => (
                      <div key={i} className="group p-6 bg-[#F8FAFC] border-2 border-gray-50 rounded-[24px] hover:border-blue-100 hover:bg-blue-50/20 transition-all">
                        <div className="flex items-center gap-4">
                           <span className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-blue-600 shadow-sm group-hover:scale-110 transition-transform">{i+1}</span>
                           <h4 className="font-extrabold text-gray-800 text-lg uppercase tracking-tight">{sec.title}</h4>
                        </div>
                        <p className="text-xs font-semibold text-gray-400 mt-4 leading-relaxed bg-white/50 p-4 rounded-xl border border-gray-50">{sec.content}</p>
                      </div>
                    ))}
                    <div className="flex gap-4 pt-6">
                      <button onClick={handleGenerateOutline} className="flex-1 py-4.5 bg-white border-2 border-blue-500 text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all uppercase tracking-widest text-sm">Tạo lại dàn ý</button>
                      <button onClick={handleNext} className="flex-2 w-full py-4.5 bg-[#007AFF] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2">Tiếp tục bước tiếp theo ➔</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                     <p className="text-gray-400 font-bold mb-6">Chưa có dàn ý. Vui lòng quay lại bước 1.</p>
                     <button onClick={handlePrev} className="px-10 py-4 bg-gray-100 rounded-2xl font-bold">Quay lại</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DYNAMIC STEPS FOR CONTENT GENERATION */}
          {state.step === 3 && renderSectionWriting("Phần I & II", "Đặt vấn đề & Cơ sở lý luận khoa học", "part12")}
          {state.step === 4 && renderSectionWriting("Phần III", "Thực trạng vấn đề trước khi áp dụng sáng kiến", "part3")}
          {state.step === 5 && renderSectionWriting("Giải pháp 1", "Giải pháp trọng tâm - Phương pháp thực hiện chi tiết", "sol1", true)}
          {state.step === 6 && renderSectionWriting("Giải pháp 2-3", "Các giải pháp tiếp theo hỗ trợ và phối hợp", "sol23", true)}
          {state.step === 7 && renderSectionWriting("Giải pháp 4-5", "Mở rộng & Nâng cao - Ứng dụng CNTT/AI", "sol45", true)}
          {state.step === 8 && renderSectionWriting("Phần V, VI & Phụ lục", "Đánh giá hiệu quả & Kết luận tổng quát", "part56")}

          {/* STEP 9: FINAL PREVIEW AND EXPORT */}
          {state.step === 9 && (
            <div className="bg-white rounded-[20px] shadow-xl overflow-hidden animate-fadeIn">
              <BlueHeader title="Hoàn tất" subtitle="Sáng kiến kinh nghiệm của bạn đã sẵn sàng" />
              <div className="p-10 space-y-12">
                <div className="bg-green-50 border-2 border-green-100 p-8 rounded-[32px] flex items-center gap-6 shadow-sm">
                   <div className="bg-green-500 text-white w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg shadow-green-100">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <div>
                      <h4 className="font-black text-green-900 text-2xl tracking-tight">Thành công rực rỡ!</h4>
                      <p className="text-green-700 font-bold opacity-80 mt-1">Nội dung sáng kiến đã được tối ưu hóa toàn diện bởi AI.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <button onClick={() => window.print()} className="group p-10 bg-white border-3 border-gray-100 rounded-[32px] flex flex-col items-center gap-5 hover:border-[#007AFF] hover:bg-blue-50/30 transition-all shadow-sm active:scale-95">
                     <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-[#007AFF] group-hover:shadow-lg transition-all"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></div>
                     <span className="font-black text-gray-800 text-lg uppercase tracking-wider">In / Lưu PDF</span>
                  </button>
                  <button onClick={() => alert("Tính năng xuất Word đang được hoàn thiện.")} className="group p-10 bg-[#007AFF] border-3 border-[#007AFF] rounded-[32px] flex flex-col items-center gap-5 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95">
                     <div className="w-20 h-20 bg-white/20 rounded-[28px] flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#007AFF] group-hover:shadow-lg transition-all"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                     <span className="font-black text-white text-lg uppercase tracking-wider">Xuất File Word (.docx)</span>
                  </button>
                </div>

                <div className="pt-10 border-t border-gray-100">
                   <h5 className="font-black text-[#004282] uppercase text-xs tracking-[0.2em] mb-8">Xem trước bản thảo đầy đủ</h5>
                   <div className="bg-[#F8FAFC] p-12 rounded-[40px] shadow-inner border border-gray-100 max-h-[800px] overflow-y-auto no-scrollbar prose prose-blue max-w-none">
                      <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-gray-900 uppercase leading-tight mb-4 tracking-tight">{state.formData.title}</h2>
                        <div className="flex items-center justify-center gap-6">
                           <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{state.formData.school}</p>
                           <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                           <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{state.formData.location}</p>
                        </div>
                      </div>
                      <div className="space-y-16">
                        {APP_STEPS.filter(s => s.id >= 3 && s.id <= 8).map(step => {
                          const id = step.id === 3 ? "part12" : step.id === 4 ? "part3" : step.id === 5 ? "sol1" : step.id === 6 ? "sol23" : step.id === 7 ? "sol45" : "part56";
                          const content = state.generatedSections[id];
                          if (!content) return null;
                          return (
                            <div key={id} className="animate-fadeIn">
                               <h3 className="font-black text-[#004282] uppercase text-xl mb-6 border-l-8 border-[#007AFF] pl-6">{step.label}</h3>
                               <div className="text-gray-700 font-semibold leading-[1.8] whitespace-pre-wrap">{content}</div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Global Bottom Navigation */}
          <div className="mt-12 flex justify-between no-print items-center">
            <button 
              onClick={handlePrev}
              disabled={state.step === 1 || state.isGenerating}
              className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all tracking-wider ${state.step === 1 || state.isGenerating ? 'invisible' : 'bg-white text-gray-400 hover:bg-gray-200 border border-gray-100 shadow-sm active:scale-95'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              QUAY LẠI
            </button>
            
            <div className="text-xs font-black text-gray-300 tracking-[0.3em] uppercase">
              BƯỚC {state.step} / {APP_STEPS.length}
            </div>

            {state.step < 9 && state.step !== 1 && (
              <button 
                onClick={handleNext}
                disabled={state.isGenerating}
                className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-200 hover:bg-black active:scale-95 transition-all flex items-center gap-3 tracking-wider"
              >
                TIẾP TỤC
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
