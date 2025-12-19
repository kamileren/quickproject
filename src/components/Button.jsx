export const Button = ({ children, onClick, variant = 'primary', icon: Icon, className = '' }) => {
  const variants = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700',
    secondary: 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200',
    outline: 'border border-stone-300 text-stone-600 hover:bg-stone-50',
    ghost: 'text-stone-500 hover:text-stone-900 font-bold'
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded text-xs uppercase tracking-wider font-bold transition-all duration-200 ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
};
