import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import type { SESSettings } from '@/types';
import { sendTestEmail } from '@/lib/ses';

interface SendTestModalProps {
  open: boolean;
  onClose: () => void;
  settings: SESSettings;
  compiledHtml: string;
  compiledSubject: string;
  textBody: string;
}

export const SendTestModal = ({
  open,
  onClose,
  settings,
  compiledHtml,
  compiledSubject,
  textBody,
}: SendTestModalProps) => {
  const [to, setTo] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!to.trim()) {
        toast.error('Recipient email is required');
        return;
      }
      setSending(true);
      try {
        await sendTestEmail({
          to: to.trim(),
          subject: compiledSubject,
          html: compiledHtml,
          text: textBody,
          settings,
        });
        toast.success(`Test email sent to ${to.trim()}`);
        onClose();
        setTo('');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send test email';
        toast.error(msg);
      } finally {
        setSending(false);
      }
    },
    [to, compiledHtml, compiledSubject, textBody, settings, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-fg">Send Test Email</h2>
            <p className="mt-0.5 text-xs text-fg-muted">Preview your template in a real inbox</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-5">
          <div className="space-y-2 rounded-lg border border-border bg-bg-subtle px-3 py-2.5">
            <div className="flex items-center gap-3 text-[13px]">
              <span className="w-14 shrink-0 text-fg-muted">From</span>
              <span className="truncate text-fg">{settings.fromAddress}</span>
            </div>
            <div className="flex items-center gap-3 text-[13px]">
              <span className="w-14 shrink-0 text-fg-muted">Subject</span>
              <span className="truncate text-fg">{compiledSubject || '(empty)'}</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-fg">
              Recipient
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="test@example.com"
              className="h-9 w-full rounded-md border border-border bg-bg px-3 text-[13px] text-fg placeholder:text-fg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              required
              autoFocus
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className={clsx(
                'inline-flex h-9 items-center rounded-md bg-fg px-4 text-[13px] font-medium text-bg transition-opacity hover:opacity-90',
                sending && 'opacity-50',
              )}
            >
              {sending ? 'Sending...' : 'Send email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
