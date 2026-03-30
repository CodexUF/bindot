import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto py-10 px-4 modal-backdrop bg-carbon-950/40">
      {/* Fixed Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-carbon-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Panel - mx-auto centers it on the screen horizontally */}
      <div className={`relative mx-auto w-full ${sizeClasses[size]} modal-panel`}>
        <div className="card shadow-2xl shadow-black/80 bg-carbon-900 border border-carbon-700 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-carbon-700 bg-carbon-900 shrink-0">
            <h2 className="font-display font-bold text-white text-lg leading-none">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-carbon-800 hover:bg-carbon-700 flex items-center justify-center text-carbon-500 hover:text-white transition-all outline-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Body */}
          <div className="px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  
  return createPortal(modalContent, document.body);
}
