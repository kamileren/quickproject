import { ArrowRight, Library, ChevronRight } from 'lucide-react';

// --- UI Components ---

const Button = ({ children, onClick, variant = 'primary', icon: Icon, className = '' }) => {
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

// --- TOC Item Component ---

function TOCItem({ number, title, active = false, status = "Ready", onClick }) {
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

// --- Main App Component ---

export default function App() {
  return (
    <div className="min-h-screen bg-white text-stone-900 selection:bg-orange-100 selection:text-orange-900 font-serif">

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-24">
            <div className="text-orange-600 font-mono text-[10px] uppercase tracking-[0.5em] font-bold mb-6">Volume I // First Edition</div>
            <h1 className="text-7xl md:text-8xl font-bold text-stone-900 mb-10 leading-[0.9]" style={{ fontFamily: 'Georgia, serif' }}>
              The Book of <br />
              <span className="italic">Machine Learning.</span>
            </h1>
            <div className="max-w-xl mx-auto">
              <p className="text-xl text-stone-500 leading-relaxed font-light italic mb-10">
                A comprehensive exploration of the mathematical structures, statistical frameworks, and computational paradigms that define the modern era of intelligence.
              </p>
              <div className="flex justify-center gap-4">
                <Button icon={ArrowRight}>Start Reading</Button>
                <Button variant="outline" icon={Library}>Browse Index</Button>
              </div>
            </div>
          </header>

          {/* Preface & TOC */}
          <div className="grid md:grid-cols-12 gap-16">
            <div className="md:col-span-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-900 mb-6 border-b border-stone-200 pb-2">Preface</h3>
              <p className="text-sm leading-7 text-stone-500 italic">
                "This volume aims to bridge the gap between abstract statistical theory and the practical implementation of adaptive systems. We begin with the assumption that all learning is, at its core, an optimization problem bounded by the laws of probability."
              </p>
            </div>

            <div className="md:col-span-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-900 mb-6 border-b border-stone-200 pb-2">Table of Contents</h3>

              <div className="space-y-10">
                {/* Part 1 */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-orange-600 mb-4 tracking-widest uppercase">Part I: Foundations</div>
                  <div className="space-y-4">
                    <TOCItem number="01" title="Probability & Information Theory" status="Locked" />
                    <TOCItem number="02" title="Linear Methods for Regression" active />
                    <TOCItem number="03" title="Classification & Logistic Models" />
                  </div>
                </div>

                {/* Part 2 */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-stone-300 mb-4 tracking-widest uppercase">Part II: Deep Architectures</div>
                  <div className="space-y-4 opacity-50">
                    <TOCItem number="04" title="Neural Network Foundations" />
                    <TOCItem number="05" title="Convolutional Structures" />
                    <TOCItem number="06" title="Recurrent Systems" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
