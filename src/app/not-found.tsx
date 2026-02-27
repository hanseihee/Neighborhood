import { Building2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
        <Building2 size={28} className="text-slate-300" />
      </div>
      <h2 className="text-[20px] font-bold text-slate-900 mb-2">
        페이지를 찾을 수 없습니다
      </h2>
      <p className="text-[14px] text-slate-400 mb-6">
        요청하신 페이지가 존재하지 않습니다
      </p>
      <a
        href="/"
        className="inline-flex px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[14px] font-medium hover:bg-blue-700 transition-colors"
      >
        홈으로 돌아가기
      </a>
    </div>
  );
}
