export default function Loading() {
  return (
    <div className="text-center py-24">
      <div className="w-8 h-8 border-[2.5px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[14px] text-slate-400">로딩 중...</p>
    </div>
  );
}
