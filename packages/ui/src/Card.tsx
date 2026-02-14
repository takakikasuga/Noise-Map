import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/** 共通カードコンポーネント */
export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg border bg-white p-6 shadow-sm ${className}`}>
      {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
      {children}
    </div>
  );
}
