import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Eye, Copy, X, Search, FileCode2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { predefinedTemplates, type PredefinedTemplate } from "@/lib/predefinedTemplates";
import { Logo } from "@/components/Logo";
import { useTemplates } from "@/hooks/useTemplates";
import { useLayouts } from "@/hooks/useLayouts";
import { compileTemplate, compileWithLayout } from "@/lib/handlebars";

function wrapIframeSrcDoc(html: string): string {
  const safe = html ?? "";
  const style = `<style>html,body{margin:0 !important;padding:0 !important;}</style>`;

  if (!safe.trim()) return safe;

  if (/<html[\s>]/i.test(safe)) {
    if (/<head[\s>]/i.test(safe)) {
      return safe.replace(/<head([^>]*)>/i, `<head$1>${style}`);
    }
    return safe.replace(/<html([^>]*)>/i, `<html$1><head>${style}</head>`);
  }

  if (/<body[\s>]/i.test(safe)) {
    return safe.replace(/<body([^>]*)>/i, `<body$1>${style}`);
  }

  return `<!doctype html><html><head>${style}</head><body>${safe}</body></html>`;
}

export default function TemplateLibraryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<PredefinedTemplate | null>(null);
  const { createTemplate, updateTemplate } = useTemplates();
  const { createLayout, updateLayout } = useLayouts();

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return predefinedTemplates;
    return predefinedTemplates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [search]);

  const handleUseTemplate = useCallback(async (pt: PredefinedTemplate) => {
    try {
      let layoutId = undefined;
      if (pt.layoutHtmlBody) {
        const layout = await createLayout(`${pt.name} Layout`, `imported-layout-${Date.now()}`);
        await updateLayout(layout.id, { htmlBody: pt.layoutHtmlBody, textBody: "" });
        layoutId = layout.id;
      }
      
      const template = await createTemplate(pt.name, `imported-template-${Date.now()}`);
      await updateTemplate(template.id, {
        htmlBody: pt.htmlBody,
        subject: pt.subject,
        mockData: pt.mockData,
        layoutId,
      });
      toast.success("Template imported successfully");
      navigate(`/templates/${template.id}`);
    } catch {
      toast.error("Failed to import template");
    }
  }, [createTemplate, updateTemplate, createLayout, updateLayout, navigate]);

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Toaster
        theme="system"
        position="bottom-right"
        toastOptions={{
          style: {
            fontSize: "13px",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-subtle)",
            color: "var(--color-fg)",
          },
        }}
      />

      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <button
            onClick={() => navigate("/templates")}
            className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
            aria-label="Back to templates"
          >
            ← Templates
          </button>
          <span className="text-fg-faint">/</span>
          <span className="text-[13px] font-medium text-fg-secondary">
            Template Library
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-fg">Template Library</h1>
            <p className="mt-1 text-sm text-fg-muted">Choose a pre-designed template to get started quickly.</p>
          </div>
          <div className="w-full sm:w-[300px] relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library..."
              className="h-9 w-full rounded-md border border-border bg-bg pl-8 pr-3 text-xs text-fg placeholder:text-fg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10 pr-2">
          {filteredTemplates.map((t) => (
            <div key={t.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-bg transition-all hover:shadow-md hover:border-fg-muted/30">
              <div className="h-48 w-full bg-[#f8fafc] dark:bg-[#121215] border-b border-border relative overflow-hidden pointer-events-none flex justify-center pt-6 group-hover:bg-[#f1f5f9] dark:group-hover:bg-[#1a1a1f] transition-colors">
                <div 
                  className="origin-top bg-white border border-border/30 shadow-sm rounded-t-md overflow-hidden transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-md"
                  style={{ width: "600px", height: "800px", transform: "scale(0.40)" }}
                >
                  <iframe
                    srcDoc={wrapIframeSrcDoc(
                      t.layoutHtmlBody
                        ? compileWithLayout(t.htmlBody, t.layoutHtmlBody, t.mockData || {}).result ?? ""
                        : compileTemplate(t.htmlBody, t.mockData || {}).result ?? ""
                    )}
                    className="w-full h-full border-0 bg-white"
                    scrolling="no"
                    tabIndex={-1}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
              
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[15px] font-semibold text-fg">{t.name}</h3>
                <p className="mt-1.5 flex-1 text-[13px] text-fg-muted line-clamp-2 leading-relaxed">{t.description}</p>
                
                <div className="mt-5 flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTemplate(t)}
                    className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-bg px-3 text-[12px] font-medium text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => void handleUseTemplate(t)}
                    className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-fg px-3 text-[12px] font-medium text-bg transition-opacity hover:opacity-90"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-16 text-center text-fg-muted text-sm">
              <FileCode2 className="mx-auto h-12 w-12 text-fg-muted/20 mb-4" />
              No templates found matching "{search}"
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 md:p-12 animate-in fade-in duration-200" onClick={() => setPreviewTemplate(null)}>
          <div 
            className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-bg shadow-2xl scale-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 bg-bg-subtle">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-fg">{previewTemplate.name}</h2>
                <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-medium text-fg-muted uppercase tracking-wider">Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void handleUseTemplate(previewTemplate)}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md bg-fg px-3 text-[12px] font-medium text-bg transition-opacity hover:opacity-90 mr-2"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Use Template
                </button>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden bg-white">
              <iframe
                srcDoc={wrapIframeSrcDoc(
                  previewTemplate.layoutHtmlBody 
                  ? compileWithLayout(previewTemplate.htmlBody, previewTemplate.layoutHtmlBody, previewTemplate.mockData || {}).result ?? ""
                  : compileTemplate(previewTemplate.htmlBody, previewTemplate.mockData).result ?? ""
                )}
                className="h-full w-full border-0"
                title={`${previewTemplate.name} Preview`}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
