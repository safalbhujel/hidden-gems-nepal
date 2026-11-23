'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyOtpProps {
  otp: string;
  onCopySuccess?: () => void;
}

export function CopyOtp({ otp, onCopySuccess }: CopyOtpProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!otp) return;
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      if (onCopySuccess) onCopySuccess();
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyCode}
      disabled={!otp}
      className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>✓ Code copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Copy verification code</span>
        </>
      )}
    </button>
  );
}

export default CopyOtp;
