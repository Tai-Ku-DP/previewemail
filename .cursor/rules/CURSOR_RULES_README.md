# Cursor Rules — Email Template Editor

## Cách sử dụng

Copy toàn bộ thư mục `.cursor/` vào **root của project** của bạn:

```
your-project/
  .cursor/
    rules/
      core.mdc               ← Always apply: tech stack, architecture, coding standards
      indexeddb.mdc          ← Apply khi làm việc với db.ts và stores
      handlebars-preview.mdc ← Apply khi làm việc với preview và mock data
      ui-components.mdc      ← Apply khi làm việc với components và pages
      aws-ses.mdc            ← Apply khi làm việc với SES integration
  src/
  package.json
  ...
```

## Mô tả từng file

| File | alwaysApply | Mục đích |
|------|-------------|----------|
| `core.mdc` | ✅ Yes | Tech stack, project structure, coding standards |
| `indexeddb.mdc` | ❌ Glob-based | Mọi thứ liên quan đến persistence với IndexedDB |
| `handlebars-preview.mdc` | ❌ Glob-based | Compile Handlebars, render preview iframe, mock data |
| `ui-components.mdc` | ❌ Glob-based | Layout 3-panel, CodeMirror editor, Tailwind conventions |
| `aws-ses.mdc` | ❌ Glob-based | Send test email qua AWS SES SDK v3 |

## Tech Stack được định nghĩa

- **React 18 + TypeScript** (strict)
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Zustand** (state management)
- **idb** (IndexedDB wrapper)
- **handlebars** (template rendering)
- **@uiw/react-codemirror** (code editor)
- **@aws-sdk/client-sesv2** (send test)
- **sonner** (toast notifications)
- **pnpm** (package manager)
