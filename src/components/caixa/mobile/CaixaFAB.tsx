import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';

interface CaixaFABProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export default function CaixaFAB({ onAddIncome, onAddExpense }: CaixaFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAddIncome = () => {
    setIsOpen(false);
    setTimeout(onAddIncome, 200);
  };

  const handleAddExpense = () => {
    setIsOpen(false);
    setTimeout(onAddExpense, 200);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={handleToggle}
        />
      )}

      {/* Sub-buttons */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-3">
        {/* Entrada Button */}
        <div
          className={`transition-all duration-300 ${
            isOpen
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
          }`}
        >
          <button
            onClick={handleAddIncome}
            className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg px-4 py-3 transition-transform hover:scale-105 active:scale-95 min-w-[140px]"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold text-sm">Nova Entrada</span>
          </button>
        </div>

        {/* Saída Button */}
        <div
          className={`transition-all duration-300 delay-75 ${
            isOpen
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
          }`}
        >
          <button
            onClick={handleAddExpense}
            className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg px-4 py-3 transition-transform hover:scale-105 active:scale-95 min-w-[140px]"
          >
            <TrendingDown className="w-5 h-5" />
            <span className="font-semibold text-sm">Nova Saída</span>
          </button>
        </div>
      </div>

      {/* Main FAB */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-4 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'rotate-45' : 'rotate-0'
        } hover:scale-110 active:scale-95`}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
}
