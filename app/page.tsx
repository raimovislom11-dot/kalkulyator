'use client';

import { useState } from 'react';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleNumberClick = (num: string) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const result = performCalculation(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(op);
  };

  const performCalculation = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+':
        return prev + current;
      case '-':
        return prev - current;
      case '×':
        return prev * current;
      case '÷':
        return current !== 0 ? prev / current : 0;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const result = performCalculation(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handlePercentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
    setWaitingForOperand(true);
  };

  const handleToggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(value * -1));
  };

  const buttons = [
    { label: 'C', onClick: handleClear, className: 'col-span-1 bg-red-500 hover:bg-red-600' },
    { label: '±', onClick: handleToggleSign, className: 'col-span-1 bg-gray-400 hover:bg-gray-500' },
    { label: '%', onClick: handlePercentage, className: 'col-span-1 bg-gray-400 hover:bg-gray-500' },
    { label: '÷', onClick: () => handleOperation('÷'), className: 'col-span-1 bg-orange-500 hover:bg-orange-600' },
    
    { label: '7', onClick: () => handleNumberClick('7'), className: 'col-span-1' },
    { label: '8', onClick: () => handleNumberClick('8'), className: 'col-span-1' },
    { label: '9', onClick: () => handleNumberClick('9'), className: 'col-span-1' },
    { label: '×', onClick: () => handleOperation('×'), className: 'col-span-1 bg-orange-500 hover:bg-orange-600' },
    
    { label: '4', onClick: () => handleNumberClick('4'), className: 'col-span-1' },
    { label: '5', onClick: () => handleNumberClick('5'), className: 'col-span-1' },
    { label: '6', onClick: () => handleNumberClick('6'), className: 'col-span-1' },
    { label: '-', onClick: () => handleOperation('-'), className: 'col-span-1 bg-orange-500 hover:bg-orange-600' },
    
    { label: '1', onClick: () => handleNumberClick('1'), className: 'col-span-1' },
    { label: '2', onClick: () => handleNumberClick('2'), className: 'col-span-1' },
    { label: '3', onClick: () => handleNumberClick('3'), className: 'col-span-1' },
    { label: '+', onClick: () => handleOperation('+'), className: 'col-span-1 bg-orange-500 hover:bg-orange-600' },
    
    { label: '0', onClick: () => handleNumberClick('0'), className: 'col-span-2' },
    { label: '.', onClick: handleDecimal, className: 'col-span-1' },
    { label: '=', onClick: handleEquals, className: 'col-span-1 bg-green-500 hover:bg-green-600' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-700">
        <h1 className="text-center text-white text-3xl font-bold mb-6">Calculator</h1>
        
        <div className="bg-slate-900 rounded-lg p-4 mb-6 border border-slate-600">
          <div className="text-right text-white text-5xl font-light break-words whitespace-normal">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              className={`${btn.className} py-4 rounded-lg font-semibold text-xl text-white transition-colors active:scale-95 ${
                !btn.className.includes('bg-') 
                  ? 'bg-slate-700 hover:bg-slate-600' 
                  : ''
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
