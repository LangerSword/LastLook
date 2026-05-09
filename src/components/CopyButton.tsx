import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea'); ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const baseCls = "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium font-mono rounded-md border transition-all duration-200 cursor-pointer";
  const lightCls = "bg-surface-muted text-ink-secondary hover:text-ink border-edge";

  return (
    <button onClick={handleCopy} className={`${baseCls} ${lightCls} ${className}`}>
      {copied ? <><Check className="w-3 h-3 text-ok" /> copied</> : <><Copy className="w-3 h-3" /> copy</>}
    </button>
  );
}
