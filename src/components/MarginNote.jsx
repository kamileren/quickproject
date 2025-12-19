export function MarginNote({ children, className = "" }) {
  return (
    <aside className={`hidden xl:block absolute -right-64 w-56 text-[11px] leading-relaxed text-stone-400 italic border-l border-stone-100 pl-4 py-1 ${className}`}>
      {children}
    </aside>
  );
}
