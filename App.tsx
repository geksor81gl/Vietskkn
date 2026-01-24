
import React, { useState, useEffect } from 'react';
import { FormData, AppState } from './types';
import { INITIAL_FORM_DATA, LOCAL_STORAGE_KEY, LEVELS, APP_STEPS } from './constants';
import { generateOutline } from './services/geminiService';

const App: React.FC = () => {
  // Safe API Key retrieval to prevent Vercel white screen
  const [apiKey, setApiKey] = useState(() => {
    try {
      const g = (typeof window !== 'undefined' ? window : globalThis) as any;
      const envKey = g.process?.env?.API_KEY || '';
      return envKey || localStorage.getItem('user_api_key') || '';
    } catch {
      return localStorage.getItem('user_api_key') || '';
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
      <div className="fixed inset-0 bg-[#007AFF] flex items-center justify-center p-4 z-50">
        <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-lg w-full text-center space-y-8 animate-fadeIn">
          <div className="w-20 h-20 bg-blue-50 text-[#007AFF] rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Kích hoạt SKKN PRO</h2>
            <p className="text-gray-500 font-medium leading-relaxed">Vui lòng nhập API Key để bắt đầu sử dụng trợ lý thông minh được phát triển bởi thầy Ksor Gé.</p>
          </div>
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="Dán API Key tại đây..." 
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-mono text-center"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
            />
            <a href="https://aistudio.google.com/app/api-keys" target="_blank" rel="noopener noreferrer" className="block text-xs text-[#007AFF] font-bold hover:underline uppercase tracking-widest">Lấy API Key miễn phí tại đây</a>
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
      <aside className="w-[340px] bg-white border-r border-gray-100 fixed h-screen p-10 flex flex-col no-print overflow-y-auto no-scrollbar shadow-sm">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-[#007AFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <h1 className="text-3xl font-black text-[#007AFF] tracking-tighter">SKKN PRO</h1>
          </div>
          <p className="text-xs text-gray-400 font-bold leading-relaxed uppercase tracking-tight">Trợ lý viết SKKN được tạo và phát triển bởi thầy Ksor Gé</p>
        </div>

        <nav className="flex-1 space-y-6">
          {APP_STEPS.map((step) => (
            <div 
              key={step.id} 
              className={`relative flex items-center p-3 rounded-xl transition-all cursor-pointer group ${state.step === step.id ? 'bg-blue-50/30' : ''}`}
              onClick={() => { if(step.id < state.step || validateStep(state.step)) setState(prev => ({ ...prev, step: step.id })) }}
            >
              {state.step === step.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#007AFF] rounded-r-full" />}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-bold uppercase transition-colors ${state.step === step.id ? 'text-[#007AFF]' : 'text-gray-400'}`}>{step.label}</h4>
                  <div className={`w-2 h-2 rounded-full transition-all ${state.step === step.id ? 'bg-[#007AFF] scale-125' : 'bg-gray-200 group-hover:bg-gray-300'}`} />
                </div>
                <p className={`text-[11px] font-semibold mt-0.5 transition-colors ${state.step === step.id ? 'text-blue-300' : 'text-gray-300'}`}>{step.sub}</p>
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-12 pt-8 border-t border-gray-50 space-y-6">
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-50">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Thông tin liên hệ</h5>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                Zalo: 0383752789
              </div>
              <a href="https://www.facebook.com/kaso.ges.2025" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors group">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                </div>
                Facebook: Kaso Ges
              </a>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('user_api_key'); window.location.reload(); }} className="w-full text-center text-[10px] font-black text-gray-300 hover:text-[#007AFF] uppercase transition-colors tracking-widest">Thay đổi API Key</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[340px] p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto pb-20">
          {/* Header Action */}
          <div className="flex justify-end mb-8 no-print">
            <button 
              onClick={() => { localStorage.removeItem('user_api_key'); window.location.reload(); }}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-[#007AFF] uppercase shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Lấy API key để sử dụng app
            </button>
          </div>

          <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-50">
            {/* Step Header */}
            <div className="bg-[#007AFF] p-12 text-center text-white relative">
              <h2 className="text-4xl font-black mb-3 tracking-tighter uppercase">Thiết lập Thông tin Sáng kiến</h2>
              <p className="text-white/80 font-medium text-lg">Cung cấp thông tin chính xác để AI tạo ra bản thảo chất lượng nhất</p>
            </div>

            {/* Form Content */}
            <div className="p-12 space-y-16">
              {state.step === 1 && (
                <div className="space-y-12 animate-fadeIn">
                  <section className="space-y-8">
                    <h3 className="text-xl font-black text-[#004282] uppercase tracking-tight flex items-center gap-4">1. THÔNG TIN BẮT BUỘC</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tên đề tài SKKN <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#007AFF] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div>
                          <input type="text" placeholder='VD: "Ứng dụng AI để nâng cao hiệu quả dạy học môn Toán THPT"' className="w-full pl-14 pr-6 py-4.5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none transition-all" value={state.formData.title} onChange={(e) => updateFormData({title: e.target.value})} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Môn học <span className="text-red-500">*</span></label>
                          <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></svg></div>
                            <input type="text" placeholder="VD: Toán, Ngữ văn, Tiếng Anh..." className="w-full pl-14 pr-6 py-4.5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none transition-all" value={state.formData.subject} onChange={(e) => updateFormData({subject: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Cấp học <span className="text-red-500">*</span></label>
                          <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                            <select className="w-full pl-14 pr-6 py-4.5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none appearance-none transition-all cursor-pointer" value={state.formData.level} onChange={(e) => updateFormData({level: e.target.value})}>
                              <option value="">Chọn cấp...</option>
                              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Khối lớp <span className="text-red-500">*</span></label>
                          <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
                            <input type="text" placeholder="VD: Lớp 12, Khối 6-9" className="w-full pl-14 pr-6 py-4.5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none transition-all" value={state.formData.grade} onChange={(e) => updateFormData({grade: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Tên trường / Đơn vị <span className="text-red-500">*</span></label>
                          <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                            <input type="text" placeholder="VD: Trường THPT Nguyễn Du" className="w-full pl-14 pr-6 py-4.5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none transition-all" value={state.formData.school} onChange={(e) => updateFormData({school: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Địa điểm (Huyện, Tỉnh) <span className="text-red-500">*</span></label>
                          <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                            <input type="text" placeholder="VD: Quận 1, TP.HCM" className="w-full pl-14 pr-6 py-4.5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none transition-all" value={state.formData.location} onChange={(e) => updateFormData({location: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Điều kiện CSVC (Tivi, Máy chiếu, WiFi...) <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <div className="absolute left-5 top-7 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                          <textarea placeholder="VD: Phòng máy chiếu, Tivi thông minh, Internet ổn định..." className="w-full pl-14 pr-6 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none transition-all min-h-[100px]" value={state.formData.facilities} onChange={(e) => updateFormData({facilities: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-black text-[#004282] uppercase tracking-tight">2. THÔNG TIN BỔ SUNG</h3>
                      <span className="bg-blue-50 text-[#007AFF] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">Khuyên dùng để tăng chi tiết</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Sách giáo khoa</label>
                        <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></svg></div>
                          <input type="text" placeholder="VD: Kết nối tri thức, Cánh diều..." className="w-full pl-14 pr-6 py-4.5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none transition-all" value={state.formData.textbook} onChange={(e) => updateFormData({textbook: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Đối tượng nghiên cứu</label>
                        <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                          <input type="text" placeholder="VD: 45 HS lớp 12A (thực nghiệm)..." className="w-full pl-14 pr-6 py-4.5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none transition-all" value={state.formData.researchObject} onChange={(e) => updateFormData({researchObject: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Thời gian thực hiện</label>
                        <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                          <input type="text" placeholder="VD: Năm học 2024-2025" className="w-full pl-14 pr-6 py-4.5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none transition-all" value={state.formData.duration} onChange={(e) => updateFormData({duration: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Ứng dụng AI/Công nghệ</label>
                        <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>
                          <input type="text" placeholder="VD: Sử dụng ChatGPT, Canva, Padlet..." className="w-full pl-14 pr-6 py-4.5 bg-[#F8FAFC] border-2 border-transparent focus:border-[#007AFF] focus:bg-white rounded-2xl font-semibold outline-none transition-all" value={state.formData.aiTech} onChange={(e) => updateFormData({aiTech: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-black text-[#004282] uppercase tracking-tight">3. TÀI LIỆU THAM KHẢO</h3>
                      <span className="bg-blue-50 text-[#007AFF] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">Tùy chọn - Giúp AI bám sát nội dung</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-10 border-2 border-dashed border-gray-100 bg-[#F8FAFC] rounded-[32px] text-center space-y-4 hover:border-[#007AFF] transition-all cursor-pointer group">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-gray-300 group-hover:text-[#007AFF] transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                        <div>
                          <p className="font-bold text-gray-700">Tải lên tài liệu tham khảo</p>
                          <p className="text-xs text-gray-400 mt-1">Gợi ý: SGK, Tài liệu chuyên môn, Văn bản quy phạm...</p>
                        </div>
                      </div>
                      <div className="p-10 border-2 border-dashed border-[#FEE2E2] bg-[#FFFBFB] rounded-[32px] text-center space-y-4 hover:border-[#F87171] transition-all cursor-pointer group">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-red-100 group-hover:text-red-400 transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                        <div>
                          <p className="font-bold text-gray-700">Tải lên mẫu yêu cầu SKKN</p>
                          <p className="text-xs text-gray-400 mt-1">Upload mẫu Word/PDF từ Sở/Phòng để AI bám sát cấu trúc</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-black text-[#004282] uppercase tracking-tight">4. YÊU CẦU KHÁC</h3>
                      <span className="bg-purple-50 text-purple-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">Tùy chọn - AI sẽ tuân thủ nghiêm ngặt</span>
                    </div>
                    <div className="p-8 border-2 border-purple-50 bg-[#FDFBFF] rounded-[32px] space-y-4">
                      <textarea placeholder='Nhập các yêu cầu đặc biệt của bạn. Ví dụ:
- Giới hạn SKKN trong 25-30 trang
- Viết ngắn gọn phần cơ sở lý luận (khoảng 3 trang)
- Thêm nhiều bài toán thực tế, ví dụ minh họa
- Tập trung vào giải pháp ứng dụng AI...' className="w-full bg-transparent outline-none font-semibold text-gray-700 min-h-[160px] resize-none leading-relaxed" value={state.formData.specialRequirements} onChange={(e) => updateFormData({specialRequirements: e.target.value})} />
                      <div className="flex items-center gap-2 text-purple-400 text-[10px] font-bold uppercase tracking-wide">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        AI sẽ phân tích và thực hiện NGHIÊM NGẶT các yêu cầu bạn đưa ra trong suốt quá trình viết SKKN.
                      </div>
                    </div>
                  </section>

                  <section className="space-y-8 pt-6">
                    <h3 className="text-xl font-black text-[#004282] uppercase tracking-tight">Tùy chọn khởi tạo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className={`relative p-8 border-2 rounded-[32px] cursor-pointer transition-all ${state.formData.generationMode === 'ai_outline' ? 'border-[#007AFF] bg-blue-50/50' : 'border-gray-50 bg-gray-50/30'}`}>
                        <input type="radio" className="absolute top-8 right-8 w-6 h-6 text-[#007AFF]" checked={state.formData.generationMode === 'ai_outline'} onChange={() => updateFormData({generationMode: 'ai_outline'})} />
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${state.formData.generationMode === 'ai_outline' ? 'bg-[#007AFF] text-white' : 'bg-white text-gray-400'}`}><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.022.547l-2.387 2.387a2 2 0 000 2.828l2.828 2.828a2 2 0 002.828 0l2.387-2.387zM2 10V5a2 2 0 012-2h5M14 3h5a2 2 0 012 2v5M2 14v5a2 2 0 002 2h5" /></svg></div>
                          <div>
                            <h4 className="font-black text-gray-900 uppercase text-sm">AI Lập Dàn Ý Chi Tiết</h4>
                            <p className="text-xs text-gray-400 font-medium mt-1">Hệ thống AI tự động phân tích và tạo dàn ý 6 phần chuẩn Bộ GD&ĐT.</p>
                          </div>
                        </div>
                      </label>
                      <label className={`relative p-8 border-2 rounded-[32px] cursor-pointer transition-all ${state.formData.generationMode === 'manual_outline' ? 'border-[#007AFF] bg-blue-50/50' : 'border-gray-50 bg-gray-50/30'}`}>
                        <input type="radio" className="absolute top-8 right-8 w-6 h-6 text-[#007AFF]" checked={state.formData.generationMode === 'manual_outline'} onChange={() => updateFormData({generationMode: 'manual_outline'})} />
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${state.formData.generationMode === 'manual_outline' ? 'bg-[#007AFF] text-white' : 'bg-white text-gray-400'}`}><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></svg></div>
                          <div>
                            <h4 className="font-black text-gray-900 uppercase text-sm">Sử Dụng Dàn Ý Có Sẵn</h4>
                            <p className="text-xs text-gray-400 font-medium mt-1">Sử dụng dàn ý đã được bạn chuẩn bị trước hoặc từ mẫu hệ thống.</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </section>

                  <div className="pt-10 space-y-6">
                    <button 
                      onClick={handleNext} 
                      className="w-full py-6 bg-[#007AFF] text-white font-black text-xl rounded-3xl shadow-2xl shadow-blue-100 hover:bg-blue-600 active:scale-[0.98] transition-all uppercase tracking-widest"
                    >
                      🚀 Bắt đầu lập dàn ý ngay
                    </button>
                    {state.error && <p className="text-red-500 text-sm font-bold text-center animate-bounce">{state.error}</p>}
                  </div>
                </div>
              )}

              {state.step > 1 && (
                <div className="p-10 text-center space-y-8 animate-fadeIn">
                   <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#007AFF] mb-6">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                   </div>
                   <h3 className="text-2xl font-black text-gray-900">Tính năng đang được mở rộng</h3>
                   <p className="text-gray-500 font-medium max-w-md mx-auto">Trợ lý SKKN PRO của thầy Ksor Gé đang xử lý dữ liệu và tạo dàn ý cho bạn. Vui lòng quay lại bước 1 để chỉnh sửa thông tin nếu cần.</p>
                   <button onClick={handlePrev} className="px-10 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-xs">Quay lại</button>
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
