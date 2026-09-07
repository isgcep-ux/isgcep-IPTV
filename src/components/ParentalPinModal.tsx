import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  Unlock, 
  X, 
  KeyRound, 
  ShieldAlert, 
  RotateCcw, 
  Check, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

interface ParentalPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPin: string;
  onUpdatePin: (newPin: string) => void;
  title?: string;
  subtitle?: string;
}

export const ParentalPinModal: React.FC<ParentalPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPin,
  onUpdatePin,
  title = 'Ebeveyn Kilidi (+18)',
  subtitle = 'Yetişkin içeriklerine erişmek için 4 haneli PIN kodunuzu girin.',
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [newPinStage, setNewPinStage] = useState<'old' | 'new' | 'confirm'>('old');
  const [tempNewPin, setTempNewPin] = useState<string>('');
  const [showNumbers, setShowNumbers] = useState<boolean>(false);

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setIsError(false);
      setErrorMessage('');
      setIsChangingPin(false);
      setNewPinStage('old');
      setTempNewPin('');
    }
  }, [isOpen]);

  const handleDigit = useCallback((digit: string) => {
    if (pinInput.length >= 4) return;
    const next = pinInput + digit;
    setPinInput(next);
    setIsError(false);
    setErrorMessage('');

    if (next.length === 4) {
      // Process PIN entry
      if (!isChangingPin) {
        if (next === currentPin) {
          onSuccess();
          onClose();
        } else {
          setIsError(true);
          setErrorMessage('Hatalı PIN kodu! Lütfen tekrar deneyin.');
          setTimeout(() => {
            setPinInput('');
          }, 600);
        }
      } else {
        // Change PIN Flow
        if (newPinStage === 'old') {
          if (next === currentPin) {
            setNewPinStage('new');
            setPinInput('');
          } else {
            setIsError(true);
            setErrorMessage('Mevcut PIN hatalı!');
            setTimeout(() => setPinInput(''), 600);
          }
        } else if (newPinStage === 'new') {
          setTempNewPin(next);
          setNewPinStage('confirm');
          setPinInput('');
        } else if (newPinStage === 'confirm') {
          if (next === tempNewPin) {
            onUpdatePin(next);
            setIsChangingPin(false);
            onSuccess();
            onClose();
          } else {
            setIsError(true);
            setErrorMessage('Yeni PIN kodları eşleşmedi!');
            setNewPinStage('new');
            setTempNewPin('');
            setTimeout(() => setPinInput(''), 600);
          }
        }
      }
    }
  }, [pinInput, isChangingPin, currentPin, newPinStage, tempNewPin, onSuccess, onClose, onUpdatePin]);

  const handleDelete = useCallback(() => {
    setPinInput(prev => prev.slice(0, -1));
    setIsError(false);
  }, []);

  const handleClear = useCallback(() => {
    setPinInput('');
    setIsError(false);
  }, []);

  // Keyboard & TV Remote event listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape' || e.keyCode === 461) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleDelete, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30 mb-3 text-white">
          {isChangingPin ? <KeyRound className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
        </div>

        <h3 className="text-lg font-bold text-white text-center">
          {isChangingPin 
            ? (newPinStage === 'old' ? 'Mevcut PIN Kodunu Girin' : newPinStage === 'new' ? 'Yeni 4 Haneli PIN Girin' : 'Yeni PIN Kodunu Doğrulayın')
            : title}
        </h3>
        <p className="text-xs text-slate-400 text-center mt-1 max-w-[260px]">
          {isChangingPin 
            ? 'Yeni belirleyeceğiniz PIN kodu ile yetişkin içeriklerini kilitleyebilirsiniz.'
            : subtitle}
        </p>

        {/* PIN Dots Display */}
        <div className={`flex items-center justify-center gap-4 my-6 ${isError ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pinInput.length > index;
            const digitChar = pinInput[index];

            return (
              <div
                key={index}
                className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-lg font-mono font-bold transition-all duration-150 ${
                  isError
                    ? 'border-red-500 bg-red-500/20 text-red-300'
                    : isFilled
                    ? 'border-red-500 bg-red-600/20 text-red-400 shadow-md shadow-red-500/20 scale-105'
                    : 'border-slate-700 bg-slate-800/50 text-slate-500'
                }`}
              >
                {isFilled ? (showNumbers ? digitChar : '●') : ''}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold mb-3">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Numeric Keypad (TV Remote & Touch friendly) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-red-600 text-lg font-bold text-slate-100 border border-slate-700/60 shadow-sm flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              {num}
            </button>
          ))}

          {/* Clear / Delete */}
          <button
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-400 hover:text-white border border-slate-700/60 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="Temizle"
          >
            TEMİZLE
          </button>

          {/* Zero */}
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-red-600 text-lg font-bold text-slate-100 border border-slate-700/60 shadow-sm flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleDelete}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-400 hover:text-white border border-slate-700/60 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="Sil"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Options Footer */}
        <div className="w-full flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
          <button
            onClick={() => setShowNumbers(prev => !prev)}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {showNumbers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            <span>{showNumbers ? 'PIN Gizle' : 'PIN Göster'}</span>
          </button>

          <button
            onClick={() => {
              setIsChangingPin(prev => !prev);
              setNewPinStage('old');
              setPinInput('');
              setIsError(false);
              setErrorMessage('');
            }}
            className="text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer"
          >
            {isChangingPin ? 'Vazgeç' : 'PIN Değiştir'}
          </button>
        </div>

        {/* Default PIN Helper text */}
        <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-slate-500" />
          <span>Varsayılan Ebeveyn PIN Kodu: <strong className="text-slate-400 font-mono">0000</strong></span>
        </div>
      </div>
    </div>
  );
};
