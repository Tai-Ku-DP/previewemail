import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { clsx } from 'clsx';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SettingsModal } from '@/components/SettingsModal';
import { SendTestModal } from '@/components/SendTestModal';
import { LayoutStarterPicker } from '@/components/LayoutStarterPicker';
import { TemplateList } from '@/templates/TemplateList';
import { EditorPanel } from '@/editor/EditorPanel';
import { PreviewPanel } from '@/preview/PreviewPanel';
import { useTemplates } from '@/hooks/useTemplates';
import { useLayouts } from '@/hooks/useLayouts';
import { useMockData } from '@/hooks/useMockData';
import { usePreview } from '@/hooks/usePreview';
import { useSettings } from '@/hooks/useSettings';
import { useEditorStore } from '@/stores/editorStore';
import { formatHtml, formatJson } from '@/lib/formatter';
import type { Layout } from '@/types';
import type { StarterLayout } from '@/lib/starterLayouts';

export default function HomePage() {
  const {
    templates,
    selectedTemplate,
    selectTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplates();

  const {
    layouts,
    selectedLayout,
    selectLayout,
    createLayout,
    updateLayout,
    deleteLayout,
    getLayoutById,
  } = useLayouts();

  const sidebarTab = useEditorStore((s) => s.sidebarTab);
  const sidebarCollapsed = useEditorStore((s) => s.sidebarCollapsed);
  const editorMaximized = useEditorStore((s) => s.editorMaximized);
  const toggleRightPanel = useEditorStore((s) => s.toggleRightPanel);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setDirty = useEditorStore((s) => s.setDirty);
  const editorSplit = useEditorStore((s) => s.editorSplit);
  const setEditorSplit = useEditorStore((s) => s.setEditorSplit);
  const { settings, isConfigured, save: saveSettings, clear: clearSettings } = useSettings();

  // Template editing state
  const [htmlBody, setHtmlBody] = useState('');
  const [textBody, setTextBody] = useState('');
  const [subject, setSubject] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateLayoutId, setTemplateLayoutId] = useState<string | null>(null);
  const [mockDataJson, setMockDataJson] = useState('{}');

  // Layout editing state
  const [layoutHtmlBody, setLayoutHtmlBody] = useState('');
  const [layoutTextBody, setLayoutTextBody] = useState('');
  const [layoutName, setLayoutName] = useState('');

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sendTestOpen, setSendTestOpen] = useState(false);
  const [layoutPickerOpen, setLayoutPickerOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const splitRef = useRef<HTMLDivElement | null>(null);

  const { mockData, parseError, updateFromJson, reset } = useMockData();

  const activeLayout: Layout | undefined = useMemo(() => {
    if (templateLayoutId) return getLayoutById(templateLayoutId);
    return undefined;
  }, [templateLayoutId, getLayoutById]);

  const { renderedHtml, compileError, compiledSubject } = usePreview(
    htmlBody,
    subject,
    mockData,
    activeLayout?.htmlBody,
  );

  // Sync template state when selection changes
  useEffect(() => {
    if (selectedTemplate) {
      setHtmlBody(selectedTemplate.htmlBody);
      setTextBody(selectedTemplate.textBody);
      setSubject(selectedTemplate.subject);
      setTemplateName(selectedTemplate.name);
      setTemplateLayoutId(selectedTemplate.layoutId);
      const json = JSON.stringify(selectedTemplate.mockData, null, 2);
      setMockDataJson(json);
      reset(selectedTemplate.mockData);
    }
  }, [selectedTemplate, reset]);

  // Sync layout state when selection changes
  useEffect(() => {
    if (selectedLayout) {
      setLayoutHtmlBody(selectedLayout.htmlBody);
      setLayoutTextBody(selectedLayout.textBody);
      setLayoutName(selectedLayout.name);
    }
  }, [selectedLayout]);

  const handleMockDataChange = useCallback(
    (value: string) => {
      setMockDataJson(value);
      updateFromJson(value);
      setDirty(true);
    },
    [updateFromJson, setDirty],
  );

  // ── Template actions ──

  const handleCreateTemplate = useCallback(async () => {
    try {
      const template = await createTemplate(
        'Untitled Template',
        `template-${Date.now()}`,
      );
      selectTemplate(template.id);
      toast.success('Template created');
    } catch {
      toast.error('Failed to create template');
    }
  }, [createTemplate, selectTemplate]);

  const handleSaveTemplate = useCallback(async () => {
    if (!selectedTemplate) return;
    try {
      await updateTemplate(selectedTemplate.id, {
        name: templateName,
        htmlBody,
        textBody,
        subject,
        layoutId: templateLayoutId,
        mockData,
      });
      toast.success('Template saved');
      setDirty(false);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
    } catch {
      toast.error('Failed to save template');
    }
  }, [
    selectedTemplate,
    templateName,
    htmlBody,
    textBody,
    subject,
    templateLayoutId,
    mockData,
    updateTemplate,
    setDirty,
  ]);

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      try {
        await deleteTemplate(id);
        toast.success('Template deleted');
      } catch {
        toast.error('Failed to delete template');
      }
    },
    [deleteTemplate],
  );

  // ── Layout actions ──

  const handleCreateLayoutFromStarter = useCallback(async (starter: StarterLayout) => {
    setLayoutPickerOpen(false);
    try {
      const layout = await createLayout(
        starter.name === 'Blank' ? 'Untitled Layout' : `${starter.name} Layout`,
        `layout-${Date.now()}`,
      );
      await updateLayout(layout.id, {
        htmlBody: starter.htmlBody,
        textBody: starter.textBody,
      });
      selectLayout(layout.id);
      setLayoutHtmlBody(starter.htmlBody);
      setLayoutTextBody(starter.textBody);
      toast.success('Layout created');
    } catch {
      toast.error('Failed to create layout');
    }
  }, [createLayout, updateLayout, selectLayout]);

  const handleSaveLayout = useCallback(async () => {
    if (!selectedLayout) return;
    try {
      await updateLayout(selectedLayout.id, {
        name: layoutName,
        htmlBody: layoutHtmlBody,
        textBody: layoutTextBody,
      });
      toast.success('Layout saved');
      setDirty(false);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
    } catch {
      toast.error('Failed to save layout');
    }
  }, [selectedLayout, layoutName, layoutHtmlBody, layoutTextBody, updateLayout, setDirty]);

  const handleDeleteLayout = useCallback(
    async (id: string) => {
      try {
        await deleteLayout(id);
        toast.success('Layout deleted');
      } catch {
        toast.error('Failed to delete layout');
      }
    },
    [deleteLayout],
  );

  // ── Common actions ──

  const handleSave = useCallback(async () => {
    if (sidebarTab === 'templates') {
      await handleSaveTemplate();
    } else {
      await handleSaveLayout();
    }
  }, [sidebarTab, handleSaveTemplate, handleSaveLayout]);

  const handleSendTest = useCallback(() => {
    if (!isConfigured) {
      return;
    }
    if (!renderedHtml) {
      toast.error('Template body is empty');
      return;
    }
    setSendTestOpen(true);
  }, [isConfigured, renderedHtml]);

  const formatInProgress = useRef(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useEditorStore.getState().editorMaximized) {
        e.preventDefault();
        useEditorStore.getState().setEditorMaximized(false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        toggleRightPanel();
      }
      if (e.shiftKey && e.altKey && e.key === 'F') {
        e.preventDefault();
        if (formatInProgress.current) return;
        formatInProgress.current = true;

        const editorTab = useEditorStore.getState().editorTab;
        const rightTab = useEditorStore.getState().rightPanelTab;

        if (rightTab === 'mockdata') {
          try {
            const formatted = formatJson(mockDataJson);
            handleMockDataChange(formatted);
            toast.success('JSON formatted');
          } catch {
            toast.error('Cannot format invalid JSON');
          }
          formatInProgress.current = false;
        } else if (editorTab === 'html') {
          const body = sidebarTab === 'templates' ? htmlBody : layoutHtmlBody;
          const setter = sidebarTab === 'templates' ? setHtmlBody : setLayoutHtmlBody;
          void formatHtml(body)
            .then((formatted) => {
              setter(formatted);
              toast.success('HTML formatted');
            })
            .catch(() => toast.error('Format failed — check Handlebars syntax'))
            .finally(() => { formatInProgress.current = false; });
        } else {
          formatInProgress.current = false;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, toggleRightPanel, sidebarTab, htmlBody, layoutHtmlBody, mockDataJson, handleMockDataChange]);

  const isEditingTemplate = sidebarTab === 'templates' && selectedTemplate;
  const isEditingLayout = sidebarTab === 'layouts' && selectedLayout;
  const hasSelection = isEditingTemplate || isEditingLayout;

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Toaster
        theme="system"
        position="bottom-right"
        toastOptions={{
          style: {
            fontSize: '13px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-fg)',
          },
        }}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
        onClear={clearSettings}
      />

      <LayoutStarterPicker
        open={layoutPickerOpen}
        onClose={() => setLayoutPickerOpen(false)}
        onSelect={(starter) => void handleCreateLayoutFromStarter(starter)}
      />

      {settings && (
        <SendTestModal
          open={sendTestOpen}
          onClose={() => setSendTestOpen(false)}
          settings={settings}
          compiledHtml={renderedHtml}
          compiledSubject={compiledSubject}
          textBody={textBody}
        />
      )}

      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="shrink-0 text-sm font-semibold tracking-tight text-fg">
            PreviewMail
          </span>

          {isEditingTemplate && (
            <>
              <svg className="h-4 w-4 shrink-0 text-fg-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 6l6 6-6 6" />
              </svg>
              <input
                type="text"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setDirty(true);
                }}
                className="h-7 w-40 shrink-0 rounded-md border border-transparent bg-transparent px-1.5 text-[13px] font-medium text-fg transition-colors hover:border-border focus:border-border focus:bg-bg-subtle"
                aria-label="Template name"
              />
              <span className="text-fg-faint">&middot;</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setDirty(true);
                }}
                placeholder="Subject line {{variables}}"
                className="h-7 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-[13px] text-fg-secondary placeholder:text-fg-muted transition-colors hover:border-border focus:border-border focus:bg-bg-subtle"
                aria-label="Email subject"
              />
            </>
          )}

          {isEditingLayout && (
            <>
              <svg className="h-4 w-4 shrink-0 text-fg-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 6l6 6-6 6" />
              </svg>
              <span className="inline-flex h-5 items-center rounded bg-bg-muted px-1.5 text-[10px] font-medium text-fg-muted">LAYOUT</span>
              <input
                type="text"
                value={layoutName}
                onChange={(e) => {
                  setLayoutName(e.target.value);
                  setDirty(true);
                }}
                className="h-7 w-48 shrink-0 rounded-md border border-transparent bg-transparent px-1.5 text-[13px] font-medium text-fg transition-colors hover:border-border focus:border-border focus:bg-bg-subtle"
                aria-label="Layout name"
              />
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Layout selector for templates */}
          {isEditingTemplate && (
            <select
              value={templateLayoutId ?? ''}
              onChange={(e) => setTemplateLayoutId(e.target.value || null)}
              className="h-8 rounded-md border border-border bg-bg px-2 pr-7 text-[12px] text-fg-secondary transition-colors hover:bg-bg-subtle"
              aria-label="Select layout"
            >
              <option value="">No layout</option>
              {layouts.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}

          {isEditingTemplate && (
            <button
              onClick={handleSendTest}
              disabled={!isConfigured}
              className={clsx(
                'inline-flex h-8 items-center rounded-md border border-border px-3 text-[13px] font-medium transition-colors',
                isConfigured
                  ? 'text-fg-secondary hover:bg-bg-subtle hover:text-fg'
                  : 'cursor-not-allowed text-fg-muted opacity-60',
              )}
              aria-label="Send test email"
              title={
                isConfigured
                  ? 'Send test email'
                  : 'Configure AWS SES in Settings to enable sending tests'
              }
            >
              Send Test
            </button>
          )}

          {hasSelection && (
            <button
              onClick={() => void handleSave()}
              className="inline-flex h-8 items-center rounded-md bg-fg px-3.5 text-[13px] font-medium text-bg transition-opacity hover:opacity-90"
              aria-label="Save"
              title="Save (Ctrl+S / Cmd+S)"
            >
              {justSaved && !isDirty ? 'Saved ✓' : 'Save'}
            </button>
          )}

          <div className="ml-1 flex items-center gap-0.5">
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
              aria-label="Settings"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 3-panel layout */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside
          className={clsx(
            'shrink-0 border-r border-border bg-bg transition-[width] duration-150',
            sidebarCollapsed ? 'w-[64px]' : 'w-[208px]',
          )}
        >
          <TemplateList
            templates={templates}
            layouts={layouts}
            selectedTemplateId={selectedTemplate?.id ?? null}
            selectedLayoutId={selectedLayout?.id ?? null}
            onSelectTemplate={(id) => { selectTemplate(id); selectLayout(null); }}
            onSelectLayout={(id) => { selectLayout(id); selectTemplate(null); }}
            onCreateTemplate={() => void handleCreateTemplate()}
            onCreateLayout={() => setLayoutPickerOpen(true)}
            onDeleteTemplate={(id) => void handleDeleteTemplate(id)}
            onDeleteLayout={(id) => void handleDeleteLayout(id)}
          />
        </aside>

        {/* Template editor */}
        {isEditingTemplate && (
          <div className="flex min-w-0 flex-1" ref={splitRef}>
            <div
              className={clsx(
                'flex flex-col border-r border-border',
                editorMaximized && 'w-full border-r-0',
              )}
              style={!editorMaximized ? { flexBasis: `${editorSplit * 100}%` } : undefined}
            >
              <EditorPanel
                htmlBody={htmlBody}
                textBody={textBody}
                onHtmlChange={setHtmlBody}
                onTextChange={setTextBody}
              />
            </div>
            {!editorMaximized && (
              <>
                <div
                  className="flex w-[6px] cursor-col-resize items-stretch justify-center bg-transparent hover:bg-bg-subtle"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const container = splitRef.current;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    const startX = e.clientX;
                    const startSplit = editorSplit;

                    const onMove = (moveEvent: MouseEvent) => {
                      const delta = moveEvent.clientX - startX;
                      const ratio = startSplit + delta / rect.width;
                      setEditorSplit(ratio);
                    };

                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };

                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  aria-label="Resize editor and preview panels"
                >
                  <div className="my-4 h-full w-[2px] rounded-full bg-border" />
                </div>
                <div
                  className="flex flex-col"
                  style={{ flexBasis: `${(1 - editorSplit) * 100}%` }}
                >
                <PreviewPanel
                  compiledHtml={renderedHtml}
                  compiledSubject={compiledSubject}
                  compileError={compileError}
                  mockDataJson={mockDataJson}
                  htmlBody={htmlBody}
                  onMockDataChange={handleMockDataChange}
                  mockDataError={parseError}
                />
                </div>
              </>
            )}
          </div>
        )}

        {/* Layout editor */}
        {isEditingLayout && (
          <div className="flex min-w-0 flex-1" ref={splitRef}>
            <div
              className={clsx(
                'flex flex-col border-r border-border',
                editorMaximized && 'w-full border-r-0',
              )}
              style={!editorMaximized ? { flexBasis: `${editorSplit * 100}%` } : undefined}
            >
              <EditorPanel
                htmlBody={layoutHtmlBody}
                textBody={layoutTextBody}
                onHtmlChange={setLayoutHtmlBody}
                onTextChange={setLayoutTextBody}
              />
            </div>
            {!editorMaximized && (
              <>
                <div
                  className="flex w-[6px] cursor-col-resize items-stretch justify-center bg-transparent hover:bg-bg-subtle"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const container = splitRef.current;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    const startX = e.clientX;
                    const startSplit = editorSplit;

                    const onMove = (moveEvent: MouseEvent) => {
                      const delta = moveEvent.clientX - startX;
                      const ratio = startSplit + delta / rect.width;
                      setEditorSplit(ratio);
                    };

                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };

                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  aria-label="Resize editor and preview panels"
                >
                  <div className="my-4 h-full w-[2px] rounded-full bg-border" />
                </div>
                <div
                  className="flex flex-col"
                  style={{ flexBasis: `${(1 - editorSplit) * 100}%` }}
                >
                  <LayoutPreview htmlBody={layoutHtmlBody} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasSelection && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-bg-subtle">
                {sidebarTab === 'templates' ? (
                  <svg className="h-6 w-6 text-fg-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-fg-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" />
                  </svg>
                )}
              </div>
              <p className="text-[13px] font-medium text-fg">
                {sidebarTab === 'templates' ? 'No template selected' : 'No layout selected'}
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                {sidebarTab === 'templates'
                  ? 'Select a template or create a new one.'
                  : 'Layouts wrap templates. Use {{{@content}}} as the injection point.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-fg-muted">
                <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px]">⌘S</kbd>
                <span>save</span>
                <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px]">⌘/</kbd>
                <span>toggle panel</span>
                <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px]">⇧⌥F</kbd>
                <span>format</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simplified preview for layouts.
 * Shows the layout HTML with {{{@content}}} replaced by a visual placeholder.
 */
function LayoutPreview({ htmlBody }: { htmlBody: string }) {
  const previewWidth = useEditorStore((s) => s.previewWidth);

  const previewHtml = useMemo(() => {
    const placeholder = `
      <div style="border:2px dashed #d4d4d8;border-radius:8px;padding:32px;margin:16px 0;text-align:center;color:#a1a1aa;font-family:sans-serif;font-size:14px;">
        <div style="margin-bottom:8px;font-size:20px;">📄</div>
        Template content will be injected here
        <div style="margin-top:4px;font-size:11px;opacity:0.7;">{{{@content}}}</div>
      </div>
    `;
    return htmlBody.replace(/\{\{\{@content\}\}\}/g, placeholder);
  }, [htmlBody]);

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex h-10 items-center border-b border-border px-3">
        <span className="text-[13px] font-medium text-fg">Layout Preview</span>
        <span className="ml-2 rounded bg-bg-muted px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">
          {'{{{@content}}}'}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-bg-subtle p-4">
        <div
          className="mx-auto overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-all"
          style={{ width: previewWidth, maxWidth: '100%' }}
        >
          <iframe
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            title="Layout Preview"
            className="h-[600px] w-full border-0"
            style={{ width: previewWidth }}
          />
        </div>
      </div>
    </div>
  );
}
