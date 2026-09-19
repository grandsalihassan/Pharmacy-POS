import React, { useState } from 'react';
import { Calculator as CalcIcon, X, Delete } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    setDisplay((prev) => (prev === '0' ? digit : prev + digit));
  };

  const handleOperator = (op: string) => {
    setEquation(`${display} ${op} `);
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleCalculate = () => {
    try {
      const fullExpr = equation + display;
      // safe eval of simple math
      const sanitized = fullExpr.replace(/[^0-9+\-*/.]/g, '');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      setDisplay(String(result));
      setEquation('');
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-xs w-full overflow-hidden text-white font-mono animate-in fade-in zoom-in-95">
        <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400">
            <CalcIcon className="w-3.5 h-3.5" />
            <span className="font-bold text-slate-200">POS Quick Calculator</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 bg-slate-950/80">
          <div className="text-right text-slate-400 text-xs h-5 truncate">{equation}</div>
          <div className="text-right text-3xl font-bold text-emerald-400 overflow-x-auto py-1">
            {display}
          </div>
        </div>

        <div className="p-3 grid grid-cols-4 gap-2 bg-slate-900 text-sm font-bold">
          <button onClick={handleClear} className="col-span-2 p-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded">
            C
          </button>
          <button onClick={() => setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center">
            <Delete className="w-4 h-4" />
          </button>
          <button onClick={() => handleOperator('/')} className="p-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 rounded">
            ÷
          </button>

          {['7', '8', '9'].map((d) => (
            <button key={d} onClick={() => handleDigit(d)} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded">
              {d}
            </button>
          ))}
          <button onClick={() => handleOperator('*')} className="p-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 rounded">
            ×
          </button>

          {['4', '5', '6'].map((d) => (
            <button key={d} onClick={() => handleDigit(d)} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded">
              {d}
            </button>
          ))}
          <button onClick={() => handleOperator('-')} className="p-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 rounded">
            -
          </button>

          {['1', '2', '3'].map((d) => (
            <button key={d} onClick={() => handleDigit(d)} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded">
              {d}
            </button>
          ))}
          <button onClick={() => handleOperator('+')} className="p-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 rounded">
            +
          </button>

          <button onClick={() => handleDigit('0')} className="col-span-2 p-2.5 bg-slate-800 hover:bg-slate-700 rounded">
            0
          </button>
          <button onClick={() => handleDigit('.')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded">
            .
          </button>
          <button onClick={handleCalculate} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded">
            =
          </button>
        </div>
      </div>
    </div>
  );
};
