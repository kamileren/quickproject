export function Definition({ number, title, children }) {
  return (
    <div className="my-10 border-l-2 border-stone-900 pl-6 py-2 bg-stone-50/30">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-stone-900 text-sm tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          DEFINITION {number}.
        </span>
        <span className="font-bold italic text-stone-700 text-sm tracking-tight">{title}</span>
      </div>
      <div className="text-stone-700 leading-relaxed italic text-[15px]">{children}</div>
    </div>
  );
}
