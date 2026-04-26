import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  /** Extra classes applied to the inner panel */
  className?: string;
  /** Extra classes applied to the backdrop overlay */
  overlayClassName?: string;
  /** Whether clicking the backdrop closes the modal (default: true) */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape closes the modal (default: true) */
  closeOnEsc?: boolean;
  /** Maximum width class, defaults to max-w-2xl */
  maxWidth?: string;
  /** Show the close button in the header (default: true) */
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  overlayClassName = '',
  closeOnBackdrop = true,
  closeOnEsc = true,
  maxWidth = 'max-w-2xl',
  showClose = true,
}: ModalProps) {
  useEffect(() => {
    if (!closeOnEsc || !isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${overlayClassName}`}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`luxe-glass w-full ${maxWidth} rounded-xl shadow-2xl border border-white/10 ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
            {title && (
              <div className="flex-1">
                {typeof title === 'string' ? (
                  <h2 className="text-lg sm:text-xl luxe-title text-white">{title}</h2>
                ) : title}
              </div>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="ml-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
