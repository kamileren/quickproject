import { ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { TOCItem } from '../components/TOCItem';

export function WelcomePage({ onNavigate }) {
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
                <Button icon={ArrowRight} onClick={() => onNavigate('linear-regression')}>Start Reading</Button>
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
                <div>
                  <div className="text-[10px] font-mono font-bold text-orange-600 mb-4 tracking-widest uppercase">Part I: Foundations</div>
                  <div className="space-y-4">
                    <TOCItem number="01" title="Linear Regression" active onClick={() => onNavigate('linear-regression')} />
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
