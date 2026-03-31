import { useState, useEffect, useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import { X, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { clsx } from "clsx";
import type { SESSettings, V2Config } from "@/types";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: SESSettings | null;
  onSave: (settings: SESSettings) => Promise<void>;
  onClear: () => Promise<void>;
  v2Config?: V2Config | null;
  onSaveV2Config?: (config: V2Config) => Promise<void>;
  onClearV2Config?: () => Promise<void>;
}

const EMPTY: SESSettings = {
  accessKeyId: "",
  secretAccessKey: "",
  region: "us-east-1",
  fromAddress: "",
};

const REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-south-1",
];

export const SettingsModal = ({
  open,
  onClose,
  settings,
  onSave,
  onClear,
  v2Config,
  onSaveV2Config,
  onClearV2Config,
}: SettingsModalProps) => {
  const [form, setForm] = useState<SESSettings>(settings ?? EMPTY);
  const [v2Form, setV2Form] = useState<V2Config>(
    v2Config ?? { baseUrl: "", apiKey: "" },
  );
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"api" | "ses">("api");

  useEffect(() => {
    if (open) {
      setForm(settings ?? EMPTY);
      setV2Form(v2Config ?? { baseUrl: "", apiKey: "" });
    }
  }, [open, settings, v2Config]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void (async () => {
        setSaving(true);
        try {
          if (tab === "ses") {
            if (
              !form.accessKeyId ||
              !form.secretAccessKey ||
              !form.region ||
              !form.fromAddress
            ) {
              toast.error("All AWS fields are required");
              setSaving(false);
              return;
            }
            await onSave(form);
            toast.success("AWS SES credentials saved");
          } else {
            if (!v2Form.baseUrl || !v2Form.apiKey) {
              toast.error("All API Sync fields are required");
              setSaving(false);
              return;
            }
            if (onSaveV2Config) await onSaveV2Config(v2Form);
            toast.success("PreviewMail API settings saved. Syncing...");
          }
          onClose();
        } catch {
          toast.error("Failed to save settings");
        } finally {
          setSaving(false);
        }
      })();
    },
    [form, v2Form, tab, onSave, onSaveV2Config, onClose],
  );

  const handleClear = useCallback(async () => {
    try {
      if (tab === "ses") {
        await onClear();
        setForm(EMPTY);
        toast.success("AWS Credentials cleared");
      } else {
        if (onClearV2Config) await onClearV2Config();
        setV2Form({ baseUrl: "", apiKey: "" });
        toast.success("PreviewMail API settings cleared (V1 fallback)");
      }
      onClose();
    } catch {
      toast.error("Failed to clear settings");
    }
  }, [onClear, onClearV2Config, tab, onClose]);

  const update = (field: keyof SESSettings, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const updateV2 = (field: keyof V2Config, value: string) =>
    setV2Form((f) => ({ ...f, [field]: value }));

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
            <h2 className="text-sm font-semibold text-fg">Settings</h2>
            <div className="mt-1 flex items-center gap-3">
              <button
                className={clsx(
                  "text-xs transition-colors",
                  tab === "api"
                    ? "text-fg font-medium"
                    : "text-fg-muted hover:text-fg-secondary",
                )}
                onClick={() => setTab("api")}
              >
                PreviewMail API (V2)
              </button>
              <button
                className={clsx(
                  "text-xs transition-colors",
                  tab === "ses"
                    ? "text-fg font-medium"
                    : "text-fg-muted hover:text-fg-secondary",
                )}
                onClick={() => setTab("ses")}
              >
                AWS SES (V1)
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 px-6 py-5"
        >
          <div className="flex items-start gap-2.5 rounded-lg border border-accent/20 bg-accent-subtle px-3 py-2.5">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <p className="text-[12px] leading-relaxed text-fg-secondary">
              {tab === "ses"
                ? "Credentials are stored locally in IndexedDB. They never leave your device."
                : "Enter your PreviewMail headless CMS configuration. This syncs your templates to a remote Database."}
            </p>
          </div>

          {tab === "ses" ? (
            <>
              <Field
                label="Access Key ID"
                value={form.accessKeyId}
                onChange={(v) => update("accessKeyId", v)}
                placeholder="AKIAIOSFODNN7EXAMPLE"
              />
              <Field
                label="Secret Access Key"
                value={form.secretAccessKey}
                onChange={(v) => update("secretAccessKey", v)}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                type="password"
              />
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-fg">
                  Region
                </label>
                <select
                  value={form.region}
                  onChange={(e) => update("region", e.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-bg px-3 text-[13px] text-fg transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="From Address (verified)"
                value={form.fromAddress}
                onChange={(v) => update("fromAddress", v)}
                placeholder="noreply@yourdomain.com"
                type="email"
              />
            </>
          ) : (
            <>
              <Field
                label="Base URL"
                value={v2Form.baseUrl}
                onChange={(v) => updateV2("baseUrl", v)}
                placeholder="http://localhost:3001"
              />
              <Field
                label="API Key"
                value={v2Form.apiKey}
                onChange={(v) => updateV2("apiKey", v)}
                placeholder="Configured PreviewMail API Key"
                type="password"
              />
            </>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            {(tab === "ses" ? settings : v2Config) ? (
              <button
                type="button"
                onClick={() => void handleClear()}
                className="text-[13px] font-medium text-danger transition-colors hover:text-danger-hover"
              >
                Clear settings
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
                  "inline-flex h-9 items-center rounded-md bg-fg px-4 text-[13px] font-medium text-bg transition-opacity hover:opacity-90",
                  saving && "opacity-50",
                )}
              >
                {saving ? "Saving..." : "Save credentials"}
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
  type = "text",
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
      <Input
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
