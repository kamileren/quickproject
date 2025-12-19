import { ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Term } from '../../components/Term';
import { Definition } from '../../components/Definition';
import { MarginNote } from '../../components/MarginNote';

// --- Tooltip Component for Mathematical Notation ---

const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="border-b border-dotted border-orange-600 cursor-help">
        {children}
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-stone-900 text-white text-xs rounded whitespace-nowrap z-10 pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-stone-900" />
        </span>
      )}
    </span>
  );
};

// --- Simulation Logic: Gradient Descent Visualizer ---

const GradientDescentVisualizer = () => {
  const dataPoints = [
    { x: 1, y: 3.2 },
    { x: 2, y: 5.1 },
    { x: 3, y: 6.8 },
    { x: 4, y: 8.5 },
    { x: 5, y: 10.2 },
    { x: 6, y: 12.1 },
    { x: 7, y: 13.8 },
    { x: 8, y: 15.5 }
  ];

  const [m, setM] = useState(0);
  const [b, setB] = useState(0);
  const [learningRate, setLearningRate] = useState(0.01);
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [lossHistory, setLossHistory] = useState([]);

  const computeLoss = (slope, intercept) => {
    let sum = 0;
    dataPoints.forEach(p => {
      const pred = slope * p.x + intercept;
      sum += Math.pow(pred - p.y, 2);
    });
    return sum / (2 * dataPoints.length);
  };

  const performGradientStep = () => {
    let mGrad = 0;
    let bGrad = 0;

    dataPoints.forEach(p => {
      const pred = m * p.x + b;
      const error = pred - p.y;
      mGrad += error * p.x;
      bGrad += error;
    });

    const newM = m - (learningRate * mGrad / dataPoints.length);
    const newB = b - (learningRate * bGrad / dataPoints.length);

    setM(newM);
    setB(newB);

    const loss = computeLoss(newM, newB);
    setLossHistory(prev => [...prev.slice(-49), loss]);
  };

  useEffect(() => {
    let timer;
    if (isTraining && epoch < 100) {
      timer = setTimeout(() => {
        performGradientStep();
        setEpoch(prev => prev + 1);
      }, 50);
    } else if (epoch >= 100) {
      setIsTraining(false);
    }
    return () => clearTimeout(timer);
  }, [isTraining, epoch, m, b]);

  const reset = () => {
    setM(0);
    setB(0);
    setEpoch(0);
    setIsTraining(false);
    setLossHistory([]);
  };

  const currentLoss = computeLoss(m, b);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Left: Regression Line Fitting */}
        <div className="relative h-64 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden p-4">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Regression line */}
            <line
              x1="0"
              y1={100 - (b * 5)}
              x2="100"
              y2={100 - ((m * 10 + b) * 5)}
              stroke="#EA580C"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />

            {/* Data points */}
            {dataPoints.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x * 11}
                  cy={100 - p.y * 5}
                  r="1.5"
                  fill="#1c1917"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Residual lines */}
                <line
                  x1={p.x * 11}
                  y1={100 - p.y * 5}
                  x2={p.x * 11}
                  y2={100 - (m * p.x + b) * 5}
                  stroke="#dc2626"
                  strokeWidth="0.3"
                  strokeDasharray="1,1"
                  opacity="0.5"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
          </svg>
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-stone-500 border border-stone-200 font-mono text-[9px]">
            DATA FIT
          </div>
        </div>

        {/* Right: Loss Over Time */}
        <div className="relative h-64 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden p-4">
          {lossHistory.length > 1 && (
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={lossHistory.map((loss, i) =>
                  `${(i / Math.max(lossHistory.length - 1, 1)) * 100},${100 - Math.min(loss / Math.max(...lossHistory) * 90, 90)}`
                ).join(' ')}
                fill="none"
                stroke="#EA580C"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-stone-500 border border-stone-200 font-mono text-[9px]">
            LOSS CURVE
          </div>
          {lossHistory.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-xs italic">
              Start training to see loss
            </div>
          )}
        </div>
      </div>

      {/* Controls and metrics */}
      <div className="space-y-3 p-3 bg-white border border-stone-200 rounded">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setIsTraining(!isTraining)}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs uppercase tracking-wider font-bold transition-all duration-200 bg-orange-600 text-white hover:bg-orange-700"
            >
              {isTraining ? <Pause size={14} /> : <Play size={14} />}
              {isTraining ? 'Pause' : 'Train'}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs uppercase tracking-wider font-bold transition-all duration-200 bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-stone-500">Learning Rate α =</span>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              className="w-24"
              disabled={isTraining}
            />
            <span className="text-[10px] font-mono text-orange-600 font-bold w-12">{learningRate.toFixed(3)}</span>
          </div>
        </div>

        {/* Metrics display */}
        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-stone-100">
          <div className="text-center">
            <div className="text-[9px] text-stone-400 uppercase tracking-wider mb-1">Epoch</div>
            <div className="text-sm font-mono font-bold text-stone-900">{epoch}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-stone-400 uppercase tracking-wider mb-1">Slope (m)</div>
            <div className="text-sm font-mono font-bold text-orange-600">{m.toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-stone-400 uppercase tracking-wider mb-1">Intercept (b)</div>
            <div className="text-sm font-mono font-bold text-orange-600">{b.toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-stone-400 uppercase tracking-wider mb-1">Loss (MSE)</div>
            <div className="text-sm font-mono font-bold text-stone-900">{currentLoss.toFixed(3)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Residuals Visualizer ---

const ResidualsVisualizer = () => {
  const [showResiduals, setShowResiduals] = useState(false);
  const points = [
    { x: 15, y: 75, pred: 80 },
    { x: 30, y: 65, pred: 67 },
    { x: 45, y: 55, pred: 54 },
    { x: 60, y: 40, pred: 41 },
    { x: 75, y: 25, pred: 28 },
    { x: 90, y: 15, pred: 15 }
  ];

  const mse = points.reduce((acc, p) => acc + Math.pow(p.pred - p.y, 2), 0) / points.length;
  const mae = points.reduce((acc, p) => acc + Math.abs(p.pred - p.y), 0) / points.length;

  return (
    <div className="space-y-4">
      <div className="relative h-64 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-stone-100" style={{ left: `${i * 10}%` }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-stone-100" style={{ top: `${i * 10}%` }} />
        ))}

        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <line
            x1="0" y1="85%"
            x2="100%" y2="10%"
            stroke="#EA580C"
            strokeWidth="2"
          />
          {showResiduals && points.map((p, i) => (
            <line
              key={i}
              x1={`${p.x}%`} y1={`${p.y}%`}
              x2={`${p.x}%`} y2={`${p.pred}%`}
              stroke="#dc2626"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              className="transition-opacity duration-300"
            />
          ))}
        </svg>

        {points.map((p, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-stone-900 rounded-full border border-white -translate-x-1/2 -translate-y-1/2 shadow-sm"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          />
        ))}
        {showResiduals && points.map((p, i) => (
          <div
            key={`pred-${i}`}
            className="absolute w-1.5 h-1.5 bg-orange-600 rounded-full -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
            style={{ left: `${p.x}%`, top: `${p.pred}%` }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 p-3 bg-white border border-stone-200 rounded">
        <button
          onClick={() => setShowResiduals(!showResiduals)}
          className="flex items-center gap-2 px-4 py-2 rounded text-xs uppercase tracking-wider font-bold transition-all duration-200 bg-orange-600 text-white hover:bg-orange-700"
        >
          {showResiduals ? 'Hide' : 'Show'} Residuals
        </button>
        <div className="flex gap-4 text-[10px] font-mono text-stone-500 italic">
          <div>MSE = <span className="text-orange-600 font-bold">{mse.toFixed(2)}</span></div>
          <div>MAE = <span className="text-orange-600 font-bold">{mae.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
};

// --- Regularization Comparison Visualizer ---

const RegularizationVisualizer = () => {
  const [regType, setRegType] = useState('none');
  const [lambda, setLambda] = useState(0.5);

  const weights = Array.from({ length: 10 }, (_, i) => {
    const base = Math.sin(i * 0.5) * 3;
    if (regType === 'ridge') return base / (1 + lambda);
    if (regType === 'lasso') return Math.abs(base) > lambda ? base - Math.sign(base) * lambda : 0;
    return base;
  });

  return (
    <div className="space-y-4">
      <div className="relative h-48 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden p-4">
        <div className="flex items-end justify-around h-full">
          {weights.map((w, i) => {
            const height = Math.abs(w) * 15;
            const isPositive = w >= 0;
            return (
              <div key={i} className="flex flex-col items-center justify-end h-full">
                <div
                  className={`w-6 transition-all duration-300 ${isPositive ? 'bg-orange-600' : 'bg-blue-600'}`}
                  style={{ height: `${height}%` }}
                />
                <div className="text-[8px] font-mono text-stone-400 mt-1">w{i}</div>
              </div>
            );
          })}
        </div>
        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-stone-500 border border-stone-200 font-mono text-[9px]">
          {regType === 'none' && 'NO REGULARIZATION'}
          {regType === 'ridge' && `L₂ PENALTY λ=${lambda.toFixed(2)}`}
          {regType === 'lasso' && `L₁ PENALTY λ=${lambda.toFixed(2)}`}
        </div>
      </div>

      <div className="space-y-3 p-3 bg-white border border-stone-200 rounded">
        <div className="flex gap-2">
          {['none', 'ridge', 'lasso'].map(type => (
            <button
              key={type}
              onClick={() => setRegType(type)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-bold transition-all duration-200 ${
                regType === type
                  ? 'bg-orange-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              {type === 'none' ? 'Standard' : type}
            </button>
          ))}
        </div>
        {regType !== 'none' && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-stone-500">λ =</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={lambda}
              onChange={(e) => setLambda(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-[10px] font-mono text-orange-600 font-bold w-12">{lambda.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Simulation Logic: Linear Regression Visualizer ---

const LinearRegressionVisualizer = () => {
  const [points, setPoints] = useState([
    { x: 10, y: 80 }, { x: 30, y: 65 }, { x: 50, y: 45 }, { x: 70, y: 30 }, { x: 90, y: 15 }
  ]);
  const [m, setM] = useState(-0.5);
  const [b, setB] = useState(85);
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    let timer;
    if (isTraining) {
      timer = setInterval(() => {
        setEpoch(prev => prev + 1);
        const learningRate = 0.0001;
        let mGradient = 0;
        let bGradient = 0;

        points.forEach(p => {
          const prediction = m * p.x + b;
          const error = prediction - p.y;
          mGradient += error * p.x;
          bGradient += error;
        });

        setM(prevM => prevM - (mGradient / points.length) * learningRate);
        setB(prevB => prevB - (bGradient / points.length) * 0.01);

        if (epoch > 100) setIsTraining(false);
      }, 50);
    }
    return () => clearInterval(timer);
  }, [isTraining, m, b, points, epoch]);

  const reset = () => {
    setM(0);
    setB(50);
    setEpoch(0);
    setIsTraining(false);
  };

  const Button = ({ children, onClick, icon: Icon }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded text-xs uppercase tracking-wider font-bold transition-all duration-200 bg-orange-600 text-white hover:bg-orange-700"
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );

  const SecondaryButton = ({ children, onClick, icon: Icon }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded text-xs uppercase tracking-wider font-bold transition-all duration-200 bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200"
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="relative h-64 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden font-mono text-[10px]">
        {[...Array(10)].map((_, i) => (
          <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-stone-100" style={{ left: `${i * 10}%` }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-stone-100" style={{ top: `${i * 10}%` }} />
        ))}

        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <line
            x1="0" y1={`${b}%`}
            x2="100%" y2={`${m * 100 + b}%`}
            stroke="#EA580C"
            strokeWidth="2"
            className="transition-all duration-75"
          />
        </svg>

        {points.map((p, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-stone-900 rounded-full border border-white -translate-x-1/2 -translate-y-1/2 shadow-sm"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          />
        ))}

        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-stone-500 border border-stone-200 font-mono text-[9px]">
          EPOCH_{epoch.toString().padStart(3, '0')} | MSE: {(m*50+b - 45).toFixed(4)}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 p-3 bg-white border border-stone-200 rounded">
        <div className="flex gap-2">
          <Button onClick={() => setIsTraining(!isTraining)} icon={isTraining ? Pause : Play}>
            {isTraining ? 'Halt' : 'Execute'}
          </Button>
          <SecondaryButton onClick={reset} icon={RotateCcw}>Clear</SecondaryButton>
        </div>
        <div className="flex gap-4 text-[10px] font-mono text-stone-500 italic">
          <div>w₁ (slope) = <span className="text-orange-600 font-bold">{m.toFixed(4)}</span></div>
          <div>w₀ (intercept) = <span className="text-orange-600 font-bold">{b.toFixed(4)}</span></div>
        </div>
      </div>
    </div>
  );
};

// --- Linear Regression Component ---

export function LinearRegression({ onBack }) {
  return (
    <div className="min-h-screen bg-white text-stone-900 selection:bg-orange-100 selection:text-orange-900 font-serif">
      <main className="pt-20 pb-32 px-6">
        <div className="max-w-3xl mx-auto relative">
          <button
            onClick={onBack}
            className="mb-8 text-sm text-stone-500 hover:text-orange-600 transition-colors flex items-center gap-2"
          >
            <ChevronRight size={14} className="rotate-180" />
            Back to Home
          </button>

          <header className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[2px] w-12 bg-stone-900" />
              <div className="text-stone-900 font-mono text-[11px] uppercase tracking-[0.4em] font-bold">Chapter I // Linear Methods</div>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-stone-900 mb-8 leading-[1.05]" style={{ fontFamily: 'Georgia, serif' }}>
              Linear <br />Regression.
            </h1>
            <p className="text-2xl text-stone-500 leading-relaxed font-light italic max-w-2xl">
              A fundamental algorithm in supervised learning for modeling the relationship between input features and continuous targets.
            </p>
          </header>

          <article className="text-lg leading-relaxed text-stone-800">

            <section className="mb-20">
              <h2 className="text-xl font-bold mb-8 uppercase tracking-[0.1em] border-b-2 border-stone-100 pb-2">
                2.1 Core Concepts & Context
              </h2>
              <p className="mb-8">
                Linear regression serves as the foundation for statistical learning. It provides powerful predictive capabilities when data exhibits {' '}
                <Term definition="A relationship where a change in one variable results in a proportional change in the other. In a graph, this appears as a straight line.">linear relationships</Term>.
                Why does it matter? It is <strong>simple</strong>, <strong>interpretable</strong>, and <strong>computationally efficient</strong> even for large datasets.
              </p>
              <MarginNote>
                Regression Problems: Estimating real numbers (e.g., Fish Weight based on length, or Crop Yield based on rainfall).
              </MarginNote>
              <p className="mb-8">
                The algorithm assumes that as the input changes, the output changes at a constant rate. This relationship is represented by a {' '}
                <Term definition="A subspace whose dimension is one less than that of its ambient space. In 3D space, a hyperplane is a 2D flat plane.">hyperplane</Term>
                {' '} in higher dimensions.
              </p>
            </section>

            <section className="mb-20">
              <h2 className="text-xl font-bold mb-8 uppercase tracking-[0.1em] border-b-2 border-stone-100 pb-2">
                2.2 Supervised Learning Framework
              </h2>
              <p className="mb-8">
                In supervised learning, we learn from a labeled dataset: D = {'{'} (x₁, y₁), ..., (xₙ, yₙ) {'}'}.
              </p>
              <Definition number="2.2.1" title="The I.I.D. Assumption">
                Critical requirement: Training data must be <strong>Independently and Identically Distributed</strong>.
                <ol className="list-decimal pl-6 mt-4 space-y-2">
                  <li>
                    <Term definition="Each observation in the sample does not depend on, and is not influenced by, any other observation.">Independent</Term>: {' '}
                    Each example is drawn independently from distribution P(x, y).
                  </li>
                  <li>
                    <Term definition="All variables are drawn from the same probability distribution.">Identical</Term>: {' '}
                    All examples come from the same distribution P(x, y).
                  </li>
                </ol>
              </Definition>
            </section>

            <section className="mb-20">
              <h2 className="text-xl font-bold mb-8 uppercase tracking-[0.1em] border-b-2 border-stone-100 pb-2">
                2.3 Loss Functions & Optimization
              </h2>
              <p className="mb-8">
                A loss function L(<Tooltip text="ŷ (y-hat) represents the predicted value from our model">ŷ</Tooltip>, <Tooltip text="y represents the actual/true value (ground truth)">y</Tooltip>) measures how "close" our prediction is to the ground truth. The goal is to minimize the {' '}
                <Term definition="The average loss over the observed training data, used as a proxy for the actual unknown risk.">Empirical Risk</Term>.
              </p>

              <div className="grid md:grid-cols-3 gap-4 my-10">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">L₂ Loss</div>
                  <div className="font-serif italic mb-2">L₂ = (<Tooltip text="ŷ (y-hat) represents the predicted value from our model">ŷ</Tooltip> - <Tooltip text="y represents the actual/true value (ground truth)">y</Tooltip>)²</div>
                  <div className="text-[11px] text-stone-500 italic">Smooth and {' '}
                    <Term definition="A function that has a derivative at each point in its domain, allowing for optimization via gradients.">differentiable</Term>; sensitive to outliers.
                  </div>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">L₁ Loss</div>
                  <div className="font-serif italic mb-2">L₁ = |<Tooltip text="ŷ (y-hat) represents the predicted value from our model">ŷ</Tooltip> - <Tooltip text="y represents the actual/true value (ground truth)">y</Tooltip>|</div>
                  <div className="text-[11px] text-stone-500 italic">More <Term definition="A statistical method that is not heavily influenced by small changes in the data or outliers.">robust</Term> {' '} to outliers; non-differentiable at zero.</div>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">L∞ Loss</div>
                  <div className="font-serif italic mb-2">L∞ = max |<Tooltip text="ŷ (y-hat) represents the predicted value from our model">ŷ</Tooltip> - <Tooltip text="y represents the actual/true value (ground truth)">y</Tooltip>|</div>
                  <div className="text-[11px] text-stone-500 italic">Controls worst-case error.</div>
                </div>
              </div>
            </section>

            <section className="my-24 p-8 border-2 border-stone-900 rounded-sm">
              <div className="mb-8">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-1">Figure 2.1</h4>
                <p className="text-xs text-stone-500 italic">Numerical Optimization</p>
              </div>
              <LinearRegressionVisualizer />
              <p className="mt-6 text-[11px] leading-relaxed text-stone-500 border-t border-stone-100 pt-4">
                <span className="font-bold">Caption:</span> Simulation of Gradient Descent minimizing the L₂ cost. For {' '}
                <Term definition="A function where any line segment between two points on the graph lies above the graph, ensuring a single global minimum.">convex functions</Term>
                {' '} like Squared Loss, the algorithm is guaranteed to converge.
              </p>
            </section>

            <section className="mb-20">
              <h2 className="text-xl font-bold mb-8 uppercase tracking-[0.1em] border-b-2 border-stone-100 pb-2">
                2.4 Mathematical Formulation
              </h2>
              <p className="mb-8">
                Linear regression models the relationship between features <strong>X</strong> and target <strong>y</strong> through a linear combination of weights.
                The hypothesis function is defined as:
              </p>
              <div className="p-6 bg-stone-50 border-l-4 border-orange-600 rounded my-8">
                <div className="font-serif text-xl text-center mb-2">
                  h<sub>θ</sub>(x) = θ₀ + θ₁x₁ + θ₂x₂ + ... + θₙxₙ
                </div>
                <div className="font-serif text-xl text-center text-stone-600">
                  = θᵀx
                </div>
              </div>
              <MarginNote>
                Matrix Notation: Using <strong>X</strong> ∈ ℝ<sup>m×n</sup> and <strong>θ</strong> ∈ ℝ<sup>n</sup>, predictions are <strong>Xθ</strong>.
              </MarginNote>
              <p className="mb-8">
                The objective is to find optimal parameters <strong>θ</strong> that minimize the{' '}
                <Term definition="The sum of squared differences between predicted and actual values, averaged over all examples.">Mean Squared Error</Term> (MSE):
              </p>
              <div className="p-6 bg-stone-50 border-l-4 border-orange-600 rounded my-8">
                <div className="font-serif text-xl text-center">
                  J(θ) = <sup>1</sup>/<sub>2m</sub> Σ (h<sub>θ</sub>(x<sup>(i)</sup>) - y<sup>(i)</sup>)²
                </div>
              </div>
              <Definition number="2.4.1" title="Normal Equation">
                For problems where computing <strong>X<sup>T</sup>X</strong> is feasible, the closed-form solution provides exact parameters:
                <div className="p-4 bg-white border border-stone-200 rounded my-4">
                  <div className="font-serif text-lg text-center">
                    θ = (X<sup>T</sup>X)<sup>-1</sup>X<sup>T</sup>y
                  </div>
                </div>
                This approach works well for smaller datasets (n {'<'} 10,000 features) but becomes computationally expensive for large-scale problems.
              </Definition>
            </section>

            <section className="mb-20">
              <h2 className="text-xl font-bold mb-8 uppercase tracking-[0.1em] border-b-2 border-stone-100 pb-2">
                2.5 Gradient Descent Algorithm
              </h2>
              <p className="mb-8">
                For large datasets, iterative optimization via{' '}
                <Term definition="An iterative optimization algorithm that moves in the direction of steepest descent to find the minimum of a function.">gradient descent</Term>
                {' '}is more practical. The algorithm updates parameters by moving opposite to the gradient:
              </p>
              <div className="p-6 bg-stone-50 border-l-4 border-orange-600 rounded my-8">
                <div className="font-serif text-xl text-center mb-2">
                  θⱼ := θⱼ - α <sup>∂</sup>/<sub>∂θⱼ</sub> J(θ)
                </div>
                <div className="text-center text-sm text-stone-500 italic mt-3">
                  where α is the <Term definition="A hyperparameter controlling the size of optimization steps. Too large causes divergence; too small causes slow convergence.">learning rate</Term>
                </div>
              </div>
              <MarginNote>
                Batch vs. Stochastic: Batch GD uses all examples per update; SGD uses one. Mini-batch GD balances both.
              </MarginNote>
            </section>

            <section className="my-24 p-8 border-2 border-stone-900 rounded-sm">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-1">Figure 2.2</h4>
                  <p className="text-xs text-stone-500 italic">Gradient Descent Convergence</p>
                </div>
                <div className="bg-stone-900 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">Interactive Lab</div>
              </div>
              <GradientDescentVisualizer />
              <p className="mt-6 text-[11px] leading-relaxed text-stone-500 border-t border-stone-100 pt-4">
                <span className="font-bold">Caption:</span> Watch gradient descent fit a line to data in real-time. The left panel shows the regression line (orange) adjusting to minimize residual errors (red dashed lines).
                The right panel displays the loss curve decreasing over epochs. Experiment with different learning rates to observe convergence behavior—too high causes instability, too low results in slow training.
              </p>
            </section>

            <section className="mb-20">
              <h2 className="text-xl font-bold mb-8 uppercase tracking-[0.1em] border-b-2 border-stone-100 pb-2">
                2.6 Model Evaluation & Residuals
              </h2>
              <p className="mb-8">
                After training, we evaluate model quality by examining{' '}
                <Term definition="The difference between observed values and predicted values from the model. Also called errors.">residuals</Term>
                {' '}(prediction errors). Key metrics include:
              </p>
              <div className="grid md:grid-cols-2 gap-4 my-10">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Mean Squared Error</div>
                  <div className="font-serif italic mb-2">MSE = <sup>1</sup>/<sub>m</sub> Σ (<Tooltip text="ŷ (y-hat) represents the predicted value from our model">ŷ</Tooltip><sup>(i)</sup> - <Tooltip text="y represents the actual/true value (ground truth)">y</Tooltip><sup>(i)</sup>)²</div>
                  <div className="text-[11px] text-stone-500 italic">
                    Penalizes large errors heavily due to squaring.
                  </div>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Mean Absolute Error</div>
                  <div className="font-serif italic mb-2">MAE = <sup>1</sup>/<sub>m</sub> Σ |<Tooltip text="ŷ (y-hat) represents the predicted value from our model">ŷ</Tooltip><sup>(i)</sup> - <Tooltip text="y represents the actual/true value (ground truth)">y</Tooltip><sup>(i)</sup>|</div>
                  <div className="text-[11px] text-stone-500 italic">
                    Less sensitive to outliers than MSE.
                  </div>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">R² Score</div>
                  <div className="font-serif italic mb-2">R² = 1 - <sup>SS<sub>res</sub></sup>/<sub>SS<sub>tot</sub></sub></div>
                  <div className="text-[11px] text-stone-500 italic">
                    Proportion of variance explained by the model (0 to 1).
                  </div>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Root MSE</div>
                  <div className="font-serif italic mb-2">RMSE = √MSE</div>
                  <div className="text-[11px] text-stone-500 italic">
                    Error in same units as target variable.
                  </div>
                </div>
              </div>
              <MarginNote>
                Good Practice: Always visualize residuals to check for patterns indicating model inadequacy.
              </MarginNote>
            </section>

            <section className="my-24 p-8 border-2 border-stone-900 rounded-sm">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-1">Figure 2.3</h4>
                  <p className="text-xs text-stone-500 italic">Residual Analysis</p>
                </div>
                <div className="bg-stone-900 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">Interactive Lab</div>
              </div>
              <ResidualsVisualizer />
              <p className="mt-6 text-[11px] leading-relaxed text-stone-500 border-t border-stone-100 pt-4">
                <span className="font-bold">Caption:</span> Black dots represent actual observations; orange dots show predictions. Red dashed lines illustrate residuals.
                Ideally, residuals should be randomly distributed with no patterns.
              </p>
            </section>

            <section className="mb-20">
              <h2 className="text-xl font-bold mb-8 uppercase tracking-[0.1em] border-b-2 border-stone-100 pb-2">
                2.7 Regularization Techniques
              </h2>
              <p className="mb-8">
                To prevent{' '}
                <Term definition="When a model learns training data too well, including noise, leading to poor generalization on new data.">overfitting</Term>
                , we add penalty terms to the cost function. This constrains model complexity and improves{' '}
                <Term definition="The ability of a model to perform well on unseen data, beyond the training set.">generalization</Term>.
              </p>
              <Definition number="2.7.1" title="Ridge Regression (L₂ Regularization)">
                Adds the squared magnitude of coefficients to the cost function:
                <div className="p-4 bg-white border border-stone-200 rounded my-4">
                  <div className="font-serif text-lg text-center">
                    J(θ) = MSE + λ Σ θⱼ²
                  </div>
                </div>
                Ridge regression shrinks coefficients toward zero but never eliminates them entirely. Useful when all features contribute to prediction.
              </Definition>
              <Definition number="2.7.2" title="Lasso Regression (L₁ Regularization)">
                Adds the absolute magnitude of coefficients:
                <div className="p-4 bg-white border border-stone-200 rounded my-4">
                  <div className="font-serif text-lg text-center">
                    J(θ) = MSE + λ Σ |θⱼ|
                  </div>
                </div>
                Lasso performs{' '}
                <Term definition="Automatically selecting relevant features by setting irrelevant feature weights to exactly zero.">feature selection</Term>
                {' '}by driving some coefficients to exactly zero. Ideal for high-dimensional data with many irrelevant features.
              </Definition>
              <MarginNote>
                Hyperparameter λ: Controls regularization strength. Higher λ means stronger penalty and simpler models.
              </MarginNote>
            </section>

            <section className="my-24 p-8 border-2 border-stone-900 rounded-sm">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-1">Figure 2.4</h4>
                  <p className="text-xs text-stone-500 italic">Regularization Effects</p>
                </div>
                <div className="bg-stone-900 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">Interactive Lab</div>
              </div>
              <RegularizationVisualizer />
              <p className="mt-6 text-[11px] leading-relaxed text-stone-500 border-t border-stone-100 pt-4">
                <span className="font-bold">Caption:</span> Compare weight magnitudes across regularization methods. Notice how Ridge shrinks all weights proportionally,
                while Lasso performs feature selection by eliminating weights entirely.
              </p>
            </section>

            <section className="mb-20">
              <h2 className="text-xl font-bold mb-8 uppercase tracking-[0.1em] border-b-2 border-stone-100 pb-2">
                2.8 Assumptions & Diagnostics
              </h2>
              <p className="mb-8">
                Linear regression relies on several key assumptions. Violations can lead to biased estimates and poor predictions:
              </p>
              <ol className="list-decimal pl-6 space-y-4 mb-8">
                <li>
                  <strong>Linearity:</strong> The relationship between X and y is linear.
                </li>
                <li>
                  <strong>Independence:</strong> Observations are independent of each other.
                </li>
                <li>
                  <strong>Homoscedasticity:</strong>{' '}
                  <Term definition="The property where residuals have constant variance across all levels of the independent variables.">Constant variance</Term>
                  {' '}of residuals across all feature values.
                </li>
                <li>
                  <strong>Normality:</strong> Residuals follow a normal distribution (important for inference, less so for prediction).
                </li>
                <li>
                  <strong>No Multicollinearity:</strong>{' '}
                  <Term definition="When predictor variables are highly correlated with each other, making coefficient estimates unstable.">Features should not be highly correlated</Term>.
                </li>
              </ol>
              <MarginNote>
                Diagnostic Tools: Use residual plots, Q-Q plots, and variance inflation factors (VIF) to validate assumptions.
              </MarginNote>
            </section>

            <section className="mb-20">
              <h2 className="text-xl font-bold mb-8 uppercase tracking-[0.1em] border-b-2 border-stone-100 pb-2">
                2.9 Extensions & Variants
              </h2>
              <p className="mb-8">
                Linear regression forms the basis for many advanced techniques:
              </p>
              <div className="space-y-6">
                <div className="p-5 border-l-4 border-orange-600 bg-stone-50">
                  <h4 className="font-bold mb-2">Polynomial Regression</h4>
                  <p className="text-sm text-stone-600">
                    Extends linear regression by adding polynomial features (x², x³, etc.), enabling modeling of{' '}
                    <Term definition="Relationships that cannot be captured by a straight line, such as curves and complex patterns.">non-linear relationships</Term>
                    {' '}while maintaining linear parameter estimation.
                  </p>
                </div>
                <div className="p-5 border-l-4 border-orange-600 bg-stone-50">
                  <h4 className="font-bold mb-2">Elastic Net</h4>
                  <p className="text-sm text-stone-600">
                    Combines L₁ and L₂ penalties: J(θ) = MSE + λ₁Σ|θⱼ| + λ₂Σθⱼ². Balances feature selection and coefficient shrinkage.
                  </p>
                </div>
                <div className="p-5 border-l-4 border-orange-600 bg-stone-50">
                  <h4 className="font-bold mb-2">Weighted Least Squares</h4>
                  <p className="text-sm text-stone-600">
                    Assigns different weights to observations, useful when some data points are more reliable or when variance is non-constant.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-20 p-6 bg-stone-900 text-stone-100 rounded">
              <h3 className="text-lg font-bold mb-4 uppercase tracking-widest">Key Takeaways</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">→</span>
                  <span>Linear regression provides a simple yet powerful foundation for predictive modeling with interpretable parameters.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">→</span>
                  <span>Choose between closed-form (Normal Equation) and iterative (Gradient Descent) solutions based on dataset size.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">→</span>
                  <span>Regularization (Ridge, Lasso, Elastic Net) prevents overfitting and improves generalization.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">→</span>
                  <span>Always validate model assumptions through residual analysis and diagnostic plots.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">→</span>
                  <span>Extensions like polynomial features enable modeling complex non-linear patterns.</span>
                </li>
              </ul>
            </section>

          </article>
        </div>
      </main>
    </div>
  );
}
