
import React, { useState, useEffect } from 'react';
import { FormData, AppState } from './types';
import { INITIAL_FORM_DATA, LOCAL_STORAGE_KEY, LEVELS, APP_STEPS } from './constants';
import { generateOutline, generateSectionContent } from './services/geminiService';

const InputIconWrapper = ({ icon, children }: React.PropsWithChildren<{ icon: React.ReactNode }>) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
      {icon}
    </div>
    {children}
  </div>
);

const BlueHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="bg-[#007AFF] text-white p-10 rounded-t-[20px] text-center shadow-lg">
    <h2 className="text-4xl font-extrabold mb-3 tracking-tight">{title}</h2>
    <p className="text-white/80 text-lg font-medium">{subtitle}</p>
  </div>
);

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('user_api_key') || '');
  const [showKeyPrompt, setShowKeyPrompt] = useState(!apiKey);
  const [tempKey, setTempKey] = useState('');

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

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      step: state.step,
      formData: state.formData,
      generatedSections: state.generatedSections,
      outline: state.outline
    }));
  }, [state.step, state.formData, state.generatedSections, state.outline]);

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('user_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
      setShowKeyPrompt(false);
    }
  };

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
    } catch (err: any) {
      setState(prev => ({ ...prev, isGenerating: false, error: err.message || "Lỗi khi lập dàn ý." }));
    }
  };

  const handleGenerateStepContent = async (sectionTitle: string, sectionId: string, isUltra: boolean = false) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const content = await generateSectionContent(state.formData, sectionTitle, isUltra, state.outline);
      updateSectionContent(sectionId, content);
      setState(prev => ({ ...prev, isGenerating: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isGenerating: false, error: err.message || "Lỗi khi tạo nội dung." }));
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
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (state.generatedSections[sectionId] ? 'VIẾT LẠI VỚI AI' : 'BẮT ĐẦU VIẾT NỘI DUNG')}
        </button>
      </div>
    </div>
  );

  if (showKeyPrompt) {
    return (
      <div className="fixed inset-0 bg-[#007AFF] flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl text-center space-y-8 animate-fadeIn">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-[#007AFF] mx-auto">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Kích hoạt VIẾT SKKN PRO</h2>
            <p className="text-gray-500 font-medium leading-relaxed">Vui lòng nhập API Key để bắt đầu sử dụng trợ lý thông minh.</p>
          </div>
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="Dán API Key của bạn tại đây..." 
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none transition-all font-mono text-center"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
            />
            <a 
              href="https://aistudio.google.com/app/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#007AFF] hover:underline flex items-center justify-center gap-1 uppercase tracking-widest"
            >
              Lấy API Key miễn phí tại đây
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
          <button 
            onClick={handleSaveKey}
            disabled={!tempKey.trim()}
            className="w-full py-5 bg-[#007AFF] text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all disabled:opacity-50 uppercase tracking-widest"
          >
            Bắt đầu sử dụng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      <aside className="w-80 border-r border-gray-200 bg-white p-8 flex flex-col fixed h-screen no-print overflow-y-auto no-scrollbar shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="text-[#007AFF]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight tracking-tighter uppercase">VIẾT SKKN PRO</h1>
            <p className="text-[10px] text-gray-400 font-bold leading-tight mt-0.5 uppercase tracking-wide">Trợ lý viết SKKN được tạo và phát triển bởi thầy Ksor Gé</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          {APP_STEPS.map((step) => (
            <div 
              key={step.id}
              className={`relative flex items-center p-3 rounded-xl transition-all cursor-pointer group ${state.step === step.id ? 'bg-blue-50/50' : ''}`}
              onClick={() => { if(state.step > step.id || validateStep(state.step)) setState(prev => ({ ...prev, step: step.id })) }}
            >
              {state.step === step.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#007AFF] rounded-r-full shadow-lg" />}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-bold uppercase tracking-tight transition-colors ${state.step === step.id ? 'text-blue-600' : 'text-gray-500'}`}>{step.label}</h4>
                  <div className={`w-2.5 h-2.5 rounded-full transition-all ${state.step === step.id ? 'bg-blue-500 scale-125' : (state.step > step.id ? 'bg-green-400' : 'bg-gray-200 group-hover:bg-gray-300')}`} />
                </div>
                <p className={`text-[11px] font-semibold mt-0.5 transition-colors ${state.step === step.id ? 'text-blue-400' : 'text-gray-300'}`}>{step.sub}</p>
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
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
          <button onClick={() => { localStorage.removeItem('user_api_key'); window.location.reload(); }} className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-[#007AFF] uppercase flex items-center justify-center gap-2">Thay đổi API Key</button>
          <button onClick={() => { if(confirm("Làm mới hoàn toàn dữ liệu?")) { localStorage.removeItem(LOCAL_STORAGE_KEY); window.location.reload(); } }} className="w-full py-2 text-[10px] font-black text-gray-300 hover:text-red-500 uppercase flex items-center justify-center gap-2 tracking-widest leading-none">Làm mới dữ liệu</button>
        </div>
      </aside>

      <main className="flex-1 ml-80 p-10 pb-24 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {state.error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-5 mb-8 rounded-xl flex items-center gap-4 animate-fadeIn shadow-sm">
               <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
               <p className="text-red-800 text-sm font-bold">{state.error}</p>
            </div>
          )}

          {state.step === 1 && (
            <div className="bg-white rounded-[20px] shadow-xl overflow-hidden animate-fadeIn border border-gray-50">
              <BlueHeader title="Thiết lập Thông tin Sáng kiến" subtitle="Cung cấp thông tin chính xác để AI tạo ra bản thảo chất lượng nhất" />
              <div className="p-10 space-y-12">
                <section>
                   <h3 className="text-xl font-extrabold text-[#004282] uppercase mb-8 flex items-center gap-3"><span className="bg-[#004282] text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg">1</span> THÔNG TIN BẮT BUỘC</h3>
                   <div className="space-y-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2.5">Tên đề tài SKKN <span className="text-red-500">*</span></label>
                      <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}>
                        <input type="text" placeholder='VD: "Ứng dụng AI để nâng cao hiệu quả dạy học môn Toán THPT"' className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border border-gray-200 rounded-2xl focus:bg-white focus:border-[#007AFF] outline-none font-semibold text-gray-800 shadow-inner" value={state.formData.title} onChange={(e) => updateFormData({title: e.target.value})} />
                      </InputIconWrapper>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <InputIconWrapper icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></svg>}><input type="text" placeholder="Môn học *" className="w-full pl-12 pr-4 py-4.5 bg-[#F8FAFC] border rounded-2xl outline-none font-semibold" value={state.formData.subject} onChange={(e) => updateFormData({subject: e.target.value})} /></InputIconWrapper>
                        <select className="w-full px-6 py-4.5 bg-[#F8FAFC] border rounded-2xl font-semibold outline-none" value={state.formData.level} onChange={(e) => updateFormData({level: e.target.value})}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select>
                        <input type="text" placeholder="Khối lớp *" className="w-full px-6 py-4.5 bg-[#F8FAFC] border rounded-2xl font-semibold outline-none" value={state.formData.grade} onChange={(e) => updateFormData({grade: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <input type="text" placeholder="Tên trường / Đơn vị *" className="w-full px-6 py-4.5 bg-[#F8FAFC] border rounded-2xl font-semibold" value={state.formData.school} onChange={(e) => updateFormData({school: e.target.value})} />
                        <input type="text" placeholder="Địa điểm (Huyện, Tỉnh) *" className="w-full px-6 py-4.5 bg-[#F8FAFC] border rounded-2xl font-semibold" value={state.formData.location} onChange={(e) => updateFormData({location: e.target.value})} />
                      </div>
                      <textarea placeholder="Điều kiện CSVC (Tivi, Máy chiếu, WiFi...) *" className="w-full px-6 py-4.5 bg-[#F8FAFC] border rounded-2xl font-semibold outline-none min-h-[100px]" value={state.formData.facilities} onChange={(e) => updateFormData({facilities: e.target.value})} />
                   </div>
                </section>
                <button 
                  onClick={handleGenerateOutline} 
                  disabled={state.isGenerating} 
                  className={`w-full py-6 rounded-2xl text-white font-black text-xl shadow-xl transition-all ${state.isGenerating ? 'bg-gray-400' : 'bg-[#007AFF] hover:bg-blue-600'}`}
                >
                  {state.isGenerating ? 'ĐANG XỬ LÝ...' : '🚀 Bắt đầu lập dàn ý ngay'}
                </button>
              </div>
            </div>
          )}

          {state.step === 2 && (
            <div className="bg-white rounded-[20px] shadow-xl p-10 space-y-8">
              <h2 className="text-3xl font-black text-[#004282] uppercase">2. Dàn ý chi tiết</h2>
              <div className="space-y-4">
                {state.outline?.map((sec, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-blue-600 mb-2 uppercase text-sm">Phần {i+1}: {sec.title}</h4>
                    <p className="text-gray-600 text-sm italic">{sec.content}</p>
                  </div>
                ))}
              </div>
              <button onClick={handleNext} className="w-full py-5 bg-[#007AFF] text-white font-black rounded-2xl uppercase tracking-widest">Tiếp tục ➔</button>
            </div>
          )}

          {state.step >= 3 && state.step <= 8 && renderSectionWriting(APP_STEPS[state.step-1].label, APP_STEPS[state.step-1].sub, `part${state.step}`, state.step >= 5 && state.step <= 7)}

          {state.step === 9 && (
            <div className="bg-white rounded-[20px] shadow-xl p-10 text-center space-y-10">
              <div className="bg-green-50 p-10 rounded-[40px] border-2 border-green-100">
                <h3 className="text-3xl font-black text-green-900 mb-2 uppercase">Hoàn tất sáng kiến!</h3>
                <p className="text-green-700 font-bold">Nội dung đã được lưu vào hệ thống. Bạn có thể in hoặc xuất file.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => window.print()} className="py-6 bg-white border-4 border-gray-100 rounded-3xl font-black text-gray-500 uppercase tracking-widest hover:border-[#007AFF] hover:text-[#007AFF] transition-all">In / Lưu PDF</button>
                <button className="py-6 bg-[#007AFF] text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-blue-100">Xuất file Word</button>
              </div>
            </div>
          )}

          {state.step > 1 && state.step < 9 && (
            <div className="mt-12 flex justify-between items-center">
              <button onClick={handlePrev} className="px-8 py-4 bg-white border border-gray-100 rounded-2xl font-black text-gray-400">QUAY LẠI</button>
              <div className="text-xs font-black text-gray-300 uppercase tracking-[0.3em]">BƯỚC {state.step} / 9</div>
              {state.step < 9 && <button onClick={handleNext} className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase">Tiếp tục</button>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
