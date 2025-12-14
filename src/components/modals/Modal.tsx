"use client";
import { useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  size?: "default" | "large";
  children?: React.ReactNode;
};

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  size = "default",
  children,
}: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-md"
      onClick={onClose}
      style={{ backgroundColor: 'color-mix(in oklab, var(--bg) 70%, transparent)' }}
    >
      {/* Backdrop overlay */}
      <div className="absolute inset-0" style={{ backgroundColor: 'color-mix(in oklab, var(--bg) 50%, transparent)' }}></div>

      {/* Modal */}
      <div
        className={`relative w-full ${size === "large" ? "max-w-4xl" : "max-w-md"} panel rounded-2xl shadow-2xl border-2 overflow-hidden animate-scale-in`}
        style={{ 
          borderColor: 'color-mix(in oklab, var(--accent) 30%, var(--border))' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl opacity-20" style={{ backgroundColor: danger ? '#dc2626' : 'var(--accent)' }}></div>
        </div>

        {/* Content */}
        <div className="relative p-6">
          {/* Icon with danger indicator */}
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg relative"
              style={{
                background: danger 
                  ? 'rgba(220, 38, 38, 0.1)'
                  : `linear-gradient(to br, var(--accent), color-mix(in oklab, var(--accent) 70%, #000))`
              }}
            >
              {danger ? (
                <svg className="w-8 h-8" fill="none" stroke="#dc2626" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-center mb-3 font-serif" style={{ color: 'color-mix(in oklab, var(--accent) 95%, var(--text))' }}>
            {title}
          </h3>

          {/* Message */}
          <p className="text-center text-sm mb-6 leading-relaxed" style={{ color: 'color-mix(in oklab, var(--accent) 70%, var(--text))' }}>
            {message}
          </p>

          {/* Children Content */}
          {children}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all border text-sm"
              style={{
                borderColor: 'color-mix(in oklab, var(--accent) 40%, var(--border))',
                color: 'color-mix(in oklab, var(--accent) 80%, var(--text))'
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all shadow-lg text-sm hover:brightness-110 ${danger ? 'border-2' : ''} flex items-center justify-center gap-2`}
              style={danger ? {
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                color: '#dc2626'
              } : {
                background: `linear-gradient(to right, var(--accent), color-mix(in oklab, var(--accent) 80%, #f60))`,
                color: 'white'
              }}
            >
              {danger && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
