import React, { useState, useEffect } from 'react';
import { FormData, AppState } from './types';
import { INITIAL_FORM_DATA, LOCAL_STORAGE_KEY, LEVELS, APP_STEPS } from './constants';
import { generateOutline } from './services/geminiService';

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
        outline: parsed?.outline || null,
        error: null
      };
    } catch {
      return { step: 1, formData: INITIAL_FORM_DATA as any, isGenerating: false, outline: null, error: null };
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      step: state.step,
      formData: state.formData,
      outline: state.outline
    }));
  }, [state.step, state.formData, state.outline]);

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

  if (showKeyPrompt) {
    return (
      <div className="fixed inset-0 bg-[#007AFF] flex items-center justify-center p-4 z-[9999]">
        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl max-w-lg w-full text-center space-y-8 animate-fadeIn">
          <div className="w-20 h-20 bg-blue-50 text-[#007AFF] rounded-3xl flex items-center justify-center mx-auto">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Kích hoạt SKKN PRO</h2>
            <p className="text-gray-500 font-medium">Vui lòng nhập API Key để bắt đầu sử dụng trợ lý thông minh được phát triển bởi thầy Ksor Gé.</p>
          </div>
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="Dán API Key tại đây..." 
              className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-mono text-center text-lg"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              <a href="https://aistudio.google.com/app/api-keys" target="_blank" rel="noopener noreferrer" className="text-sm text-[#007AFF] font-bold hover:underline uppercase tracking-widest">Lấy API Key miễn phí tại đây</a>
            </div>
          </div>
          <button 
            onClick={handleSaveKey}
            disabled={!tempKey.trim()}
            className="w-full py-5 bg-[#007AFF] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all disabled:opacity-50 uppercase tracking-widest"
          >
            Bắt đầu ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-[340px] bg-white border-r border-gray-100 fixed h-screen flex flex-col no-print">
        <div className="p-10 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="text-[#007AFF]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h1 className="text-3xl font-black text-[#007AFF] tracking-tighter uppercase">SKKN PRO</h1>
          </div>
          <p className="text-[11px] text-gray-400 font-bold leading-relaxed uppercase tracking-tight">Trợ lý viết SKKN được phát triển bởi thầy Ksor Gé</p>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-1 py-4">
          {APP_STEPS.map((step) => (
            <div 
              key={step.id} 
              className={`relative flex flex-col p-4 rounded-xl transition-all cursor-pointer ${state.step === step.id ? 'bg-blue-50/40 sidebar-item-active' : 'hover:bg-gray-50/50'}`}
              onClick={() => { if(step.id < state.step || validateStep(state.step)) setState(prev => ({ ...prev, step: step.id })) }}
            >
              <h4 className={`text-sm font-bold transition-colors ${state.step === step.id ? 'text-[#007AFF]' : 'text-gray-500'}`}>{step.label}</h4>
              <p className={`text-[11px] font-medium mt-0.5 transition-colors ${state.step === step.id ? 'text-blue-400' : 'text-gray-300'}`}>{step.sub}</p>
              {state.step === step.id && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#007AFF] rounded-full" />}
            </div>
          ))}
        </nav>

        <div className="p-10 pt-6 border-t border-gray-50 bg-white">
          <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Thông tin liên hệ</h5>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
              <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center text-blue-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              Zalo: 0383752789
            </div>
            <a href="https://www.facebook.com/kaso.ges.2025" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold text-gray-700 hover:text-[#007AFF] transition-colors">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
              </div>
              Facebook: Kaso Ges
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[340px] p-8 md:p-12 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {/* Top-right Button */}
          <div className="flex justify-end mb-6 no-print">
            <button 
              onClick={() => setShowKeyPrompt(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-[#007AFF] shadow-sm hover:shadow-md transition-all uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              Lấy API key để sử dụng app
            </button>
          </div>

          <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 overflow-hidden border border-gray-50 animate-fadeIn">
            {/* Header Area */}
            <div className="bg-[#007AFF] p-12 md:p-16 text-center text-white">
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter uppercase">Thiết lập Thông tin Sáng kiến</h2>
              <p className="text-white/80 font-medium text-lg md:text-xl max-w-2xl mx-auto">Cung cấp thông tin chính xác để AI tạo ra bản thảo chất lượng nhất</p>
            </div>

            {/* Form Area */}
            <div className="p-8 md:p-16 space-y-16">
              {state.step === 1 && (
                <div className="space-y-16">
                  {/* Section 1 */}
                  <section className="space-y-8">
                    <h3 className="text-xl font-black text-[#004282] uppercase tracking-tight flex items-center gap-4">1. THÔNG TIN BẮT BUỘC</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tên đề tài SKKN <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div>
                          <input type="text" placeholder='VD: "Ứng dụng AI để nâng cao hiệu quả dạy học môn Toán THPT"' className="w-full pl-16 pr-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-[24px] font-semibold outline-none transition-all text-gray-700 shadow-inner" value={state.formData.title} onChange={(e) => updateFormData({title: e.target.value})} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Môn học <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></svg></div>
                            <input type="text" placeholder="VD: Toán, Ngữ văn..." className="w-full pl-16 pr-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-[24px] font-semibold outline-none transition-all text-gray-700" value={state.formData.subject} onChange={(e) => updateFormData({subject: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Cấp học <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                            <select className="w-full pl-16 pr-10 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-[24px] font-semibold outline-none transition-all text-gray-700 appearance-none cursor-pointer" value={state.formData.level} onChange={(e) => updateFormData({level: e.target.value})}>
                              <option value="">Chọn cấp...</option>
                              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Khối lớp <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
                            <input type="text" placeholder="VD: Lớp 12, Khối 6-9" className="w-full pl-16 pr-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-[24px] font-semibold outline-none transition-all text-gray-700" value={state.formData.grade} onChange={(e) => updateFormData({grade: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Tên trường / Đơn vị <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                            <input type="text" placeholder="VD: Trường THPT Nguyễn Du" className="w-full pl-16 pr-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-[24px] font-semibold outline-none transition-all text-gray-700" value={state.formData.school} onChange={(e) => updateFormData({school: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Địa điểm (Huyện, Tỉnh) <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                            <input type="text" placeholder="VD: Quận 1, TP.HCM" className="w-full pl-16 pr-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-[24px] font-semibold outline-none transition-all text-gray-700" value={state.formData.location} onChange={(e) => updateFormData({location: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Điều kiện CSVC (Tivi, Máy chiếu, WiFi...) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute left-6 top-7 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                          <textarea placeholder="VD: Phòng máy chiếu, Tivi thông minh, Internet ổn định..." className="w-full pl-16 pr-8 py-6 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-[24px] font-semibold outline-none transition-all text-gray-700 min-h-[120px]" value={state.formData.facilities} onChange={(e) => updateFormData({facilities: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Section 2 */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-black text-[#004282] uppercase tracking-tight">2. THÔNG TIN BỔ SUNG</h3>
                      <span className="bg-blue-50 text-[#007AFF] text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-blue-100">Khuyên dùng để tăng chi tiết</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Sách giáo khoa</label>
                        <div className="relative">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">VD: </div>
                          <input type="text" placeholder="Kết nối tri thức, Cánh diều..." className="w-full pl-16 pr-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-[24px] font-semibold outline-none transition-all" value={state.formData.textbook} onChange={(e) => updateFormData({textbook: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Đối tượng nghiên cứu</label>
                        <div className="relative">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">VD: </div>
                          <input type="text" placeholder="45 HS lớp 12A (thực nghiệm)..." className="w-full pl-16 pr-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-[24px] font-semibold outline-none transition-all" value={state.formData.researchObject} onChange={(e) => updateFormData({researchObject: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Section 3 */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-black text-[#004282] uppercase tracking-tight">3. TÀI LIỆU THAM KHẢO</h3>
                      <span className="bg-blue-50 text-[#007AFF] text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-blue-100">Tùy chọn - Giúp AI bám sát nội dung</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="border-2 border-dashed border-gray-100 bg-[#F8FAFC] p-10 rounded-[32px] text-center space-y-4 hover:border-[#007AFF] transition-all group cursor-pointer">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-gray-300 shadow-sm group-hover:text-[#007AFF] transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                        <p className="font-bold text-gray-600">Tải lên tài liệu PDF/Word để AI tham khảo</p>
                        <p className="text-[11px] text-gray-400">SGK, Bài tập, Tài liệu chuyên môn...</p>
                      </div>
                      <div className="border-2 border-dashed border-[#FEE2E2] bg-[#FFFBFB] p-10 rounded-[32px] text-center space-y-4 hover:border-[#F87171] transition-all group cursor-pointer">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-red-100 shadow-sm group-hover:text-red-400 transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                        <p className="font-bold text-gray-600">Tải lên mẫu yêu cầu SKKN</p>
                        <p className="text-[11px] text-gray-400">Mẫu chuẩn của Sở/Phòng GD&ĐT</p>
                      </div>
                    </div>
                  </section>

                  {/* Section 4 */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-black text-[#004282] uppercase tracking-tight">4. YÊU CẦU KHÁC</h3>
                      <span className="bg-purple-50 text-purple-600 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-purple-100">Tùy chọn - AI sẽ tuân thủ nghiêm ngặt</span>
                    </div>
                    <div className="p-10 bg-purple-50/20 border-2 border-purple-100 rounded-[32px] space-y-4">
                      <textarea placeholder='Nhập các yêu cầu đặc biệt của bạn. Ví dụ:
- Giới hạn SKKN trong 25-30 trang
- Viết ngắn gọn phần cơ sở lý luận (khoảng 3 trang)
- Thêm biểu đồ, số liệu thống kê...' className="w-full bg-transparent font-semibold text-gray-700 outline-none min-h-[140px] leading-relaxed" value={state.formData.specialRequirements} onChange={(e) => updateFormData({specialRequirements: e.target.value})} />
                      <div className="flex items-center gap-2 text-purple-400 text-[10px] font-bold uppercase">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        AI sẽ thực hiện nghiêm ngặt các yêu cầu này
                      </div>
                    </div>
                  </section>

                  {/* Launch Area */}
                  <div className="pt-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 border-2 border-[#007AFF] bg-blue-50/50 rounded-[32px] flex items-center gap-6">
                        <div className="w-12 h-12 bg-[#007AFF] text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.022.547l-2.387 2.387a2 2 0 000 2.828l2.828 2.828a2 2 0 002.828 0l2.387-2.387z" /></svg></div>
                        <h4 className="font-black text-[#004282] uppercase text-sm leading-tight">AI Lập Dàn Ý<br/>Chi Tiết</h4>
                      </div>
                      <div className="p-8 border-2 border-gray-50 bg-gray-50/30 rounded-[32px] flex items-center gap-6 opacity-60">
                         <div className="w-12 h-12 bg-white text-gray-300 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></svg></div>
                         <h4 className="font-black text-gray-400 uppercase text-sm leading-tight">Sử Dụng Dàn Ý<br/>Có Sẵn</h4>
                      </div>
                    </div>

                    <button 
                      onClick={handleNext} 
                      className="w-full py-7 bg-[#007AFF] text-white font-black text-2xl rounded-[32px] shadow-2xl shadow-blue-100 hover:bg-blue-600 active:scale-[0.98] transition-all uppercase tracking-widest flex items-center justify-center gap-4"
                    >
                      🚀 Bắt đầu lập dàn ý ngay
                    </button>
                    {state.error && <p className="text-red-500 text-sm font-black text-center animate-bounce">{state.error}</p>}
                  </div>
                </div>
              )}

              {state.step > 1 && (
                <div className="py-24 text-center space-y-8 animate-fadeIn">
                   <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#007AFF] mb-8">
                      <svg className="w-16 h-16 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.022.547l-2.387 2.387a2 2 0 000 2.828l2.828 2.828a2 2 0 002.828 0l2.387-2.387z" /></svg>
                   </div>
                   <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Đang xử lý dữ liệu...</h3>
                   <p className="text-gray-500 font-medium text-lg max-w-lg mx-auto leading-relaxed">Tính năng trợ lý viết thông minh đang được khởi tạo bởi thầy Ksor Gé. Bạn có thể quay lại bước 1 để chỉnh sửa thông tin.</p>
                   <button onClick={handlePrev} className="px-12 py-5 bg-gray-100 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors">Quay lại</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;