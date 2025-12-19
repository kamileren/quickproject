import { ChevronRight } from 'lucide-react';

export function TOCItem({ number, title, active = false, status = "Ready", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center justify-between py-2 border-b border-stone-100 cursor-pointer transition-all ${active ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
    >
      <div className="flex items-center gap-6">
        <span className="font-mono text-xs font-bold">{number}</span>
        <span className={`text-lg font-bold tracking-tight ${active ? 'underline decoration-orange-300 decoration-2 underline-offset-4' : ''}`} style={{ fontFamily: 'Georgia, serif' }}>
          {title}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[9px] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          {active ? 'Read Now' : status}
        </span>
        <ChevronRight size={14} className={active ? 'text-orange-600' : 'text-stone-200'} />
      </div>
    </div>
  );
}
