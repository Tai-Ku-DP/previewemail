import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import type { SESSettings } from '@/types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: SESSettings | null;
  onSave: (settings: SESSettings) => Promise<void>;
  onClear: () => Promise<void>;
}

const EMPTY: SESSettings = {
  accessKeyId: '',
  secretAccessKey: '',
  region: 'us-east-1',
  fromAddress: '',
};

const REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-south-1',
];

export const SettingsModal = ({
  open,
  onClose,
  settings,
  onSave,
  onClear,
}: SettingsModalProps) => {
  const [form, setForm] = useState<SESSettings>(settings ?? EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(settings ?? EMPTY);
  }, [open, settings]);

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
      if (!form.accessKeyId || !form.secretAccessKey || !form.region || !form.fromAddress) {
        toast.error('All fields are required');
        return;
      }
      setSaving(true);
      try {
        await onSave(form);
        toast.success('AWS SES credentials saved');
        onClose();
      } catch {
        toast.error('Failed to save credentials');
      } finally {
        setSaving(false);
      }
    },
    [form, onSave, onClose],
  );

  const handleClear = useCallback(async () => {
    try {
      await onClear();
      setForm(EMPTY);
      toast.success('Credentials cleared');
      onClose();
    } catch {
      toast.error('Failed to clear credentials');
    }
  }, [onClear, onClose]);

  const update = (field: keyof SESSettings, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-in rounded-xl border border-border bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-fg">AWS SES Settings</h2>
            <p className="mt-0.5 text-xs text-fg-muted">Configure your email sending credentials</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
            aria-label="Close settings"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-5">
          <div className="flex items-start gap-2.5 rounded-lg border border-accent/20 bg-accent-subtle px-3 py-2.5">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="text-[12px] leading-relaxed text-fg-secondary">
              Credentials are stored locally in IndexedDB. They never leave your device.
            </p>
          </div>

          <Field
            label="Access Key ID"
            value={form.accessKeyId}
            onChange={(v) => update('accessKeyId', v)}
            placeholder="AKIAIOSFODNN7EXAMPLE"
          />
          <Field
            label="Secret Access Key"
            value={form.secretAccessKey}
            onChange={(v) => update('secretAccessKey', v)}
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            type="password"
          />
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-fg">
              Region
            </label>
            <select
              value={form.region}
              onChange={(e) => update('region', e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-bg px-3 text-[13px] text-fg transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <Field
            label="From Address (verified)"
            value={form.fromAddress}
            onChange={(v) => update('fromAddress', v)}
            placeholder="noreply@yourdomain.com"
            type="email"
          />

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            {settings ? (
              <button
                type="button"
                onClick={() => void handleClear()}
                className="text-[13px] font-medium text-danger transition-colors hover:text-danger-hover"
              >
                Clear credentials
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={clsx(
                  'inline-flex h-9 items-center rounded-md bg-fg px-4 text-[13px] font-medium text-bg transition-opacity hover:opacity-90',
                  saving && 'opacity-50',
                )}
              >
                {saving ? 'Saving...' : 'Save credentials'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-fg">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-border bg-bg px-3 text-[13px] text-fg placeholder:text-fg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        required
      />
    </div>
  );
}
