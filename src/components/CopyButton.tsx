'use client';

import { useState } from 'react';
import { toast } from './Toast';

interface Props {
  value: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

export function CopyButton({ value, label = 'Copiar', className = '', compact = false }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement('textarea');
        el.value = value;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      toast('Copiado para a área de transferência');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast('Não foi possível copiar automaticamente', 'error');
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`btn-ghost ${compact ? 'btn-sm' : ''} ${className}`}
      title={value}
    >
      <span aria-hidden>{copied ? '✓' : '⧉'}</span>
      {copied ? 'Copiado' : label}
    </button>
  );
}
