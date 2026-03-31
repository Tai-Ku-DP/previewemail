# PreviewMail — Project Roadmap & Technical Specification

> Open Source · Free Forever · Self-Hosted · MIT License

---

## Project Overview

PreviewMail là browser-based email template editor, cho developer trải nghiệm như Postmark mà không tốn tiền. Viết Handlebars HTML, inject mock data, preview realtime, quản lý template hoàn toàn local — không cần account, không cần server.

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand · IndexedDB (`idb`) · Deploy trên Vercel

---

## V1 — Current State (Frontend Only)

### ✅ Đã xong

- HTML email editor với CodeMirror (syntax highlighting, fold, line numbers)
- Handlebars template compilation với live preview
- Mock data JSON editor với real-time variable injection
- Template management (CRUD) lưu trong IndexedDB
- Layout 3 panel: Sidebar / Editor / Preview
- Desktop & Mobile preview width toggle (600px / 375px)
- Copy HTML và Download .html

### 🔧 Cần fix trong V1

| #   | Issue                                  | Fix                                                   |
| --- | -------------------------------------- | ----------------------------------------------------- |
| 1   | Sidebar quá rộng, editor bị nhỏ        | Drag-resize hoặc collapse về icon-only                |
| 2   | Không có feedback sau khi save         | Hiện "Saved ✓" 2 giây, dirty dot khi chưa save        |
| 3   | Warning banner AWS SES xấu và vô nghĩa | Bỏ hẳn, thay bằng disabled button + tooltip           |
| 4   | Phải tự nhập mock data thủ công        | Auto-detect `{{variables}}` và auto-fill missing keys |
| 5   | Không có keyboard shortcut             | `Ctrl+S` save, hint trong button tooltips             |

---

## V2 — @previewmail/nestjs Package

### Ý tưởng

Package biến PreviewMail thành **headless email template CMS**. Template lưu trong DB của user, fetch tại runtime — **không cần rebuild lại app khi thay đổi template**.

### Nguyên tắc thiết kế: Không break V1

V2 dùng **feature flag** — nếu user không config `baseUrl` + `apiKey` thì app chạy y chang V1, mọi thứ vẫn lưu IndexedDB như cũ. V2 chỉ kích hoạt khi user chủ động connect vào NestJS backend.

```
Không config  →  V1 mode: lưu IndexedDB, hoạt động offline hoàn toàn
Có config     →  V2 mode: sync lên DB qua API, IndexedDB làm local cache
```

### Flow

```
PreviewMail UI  ──Save──▶  @previewmail/nestjs  ──▶  User's DB
                                   │
                          expose REST API
                                   │
User's App  ──getByAlias──▶  fetch template  ──▶  compile  ──▶  send email
```

### Frontend Integration (V2 mode)

**Settings modal** — user nhập `baseUrl` + `apiKey`, lưu IndexedDB:

```typescript
// lib/config.ts
interface V2Config {
  baseUrl: string; // e.g. https://api.yourapp.com
  apiKey: string; // X-PreviewMail-Key header
}

export function getV2Config(): V2Config | null {
  // đọc từ IndexedDB settings store
  // trả về null nếu chưa config → V1 mode
}
```

**Save logic với feature flag:**

```typescript
// hooks/useSaveTemplate.ts
const saveTemplate = async (template: Template) => {
  const v2Config = await getV2Config();

  if (v2Config) {
    // V2 mode: gọi API + lưu IndexedDB làm cache
    await apiClient.save(template, v2Config);
    await db.save(template);
  } else {
    // V1 mode: chỉ lưu IndexedDB
    await db.save(template);
  }
};
```

**Sync status indicator** trên UI:

- 🟢 `Synced` — đã sync lên server
- 🟡 `Local only` — V1 mode hoặc chưa sync
- 🔴 `Sync failed` — có lỗi kết nối API

### NestJS Package Installation

```typescript
import { PreviewMailModule } from "@previewmail/nestjs";

@Module({
  imports: [
    PreviewMailModule.forRoot({
      apiKey: "pm_xxxxx",
      storage: "mongodb",
      allowedOrigins: ["https://your-previewmail-ui.com"],
    }),
  ],
})
export class AppModule {}
```

### REST Endpoints

| Method | Endpoint                      | Description                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| GET    | /previewmail/templates        | List templates (metadata only, không có htmlBody) |
| POST   | /previewmail/templates        | Create new template                               |
| PUT    | /previewmail/templates/:id    | Update template + invalidate cache                |
| DELETE | /previewmail/templates/:id    | Delete template + invalidate cache                |
| GET    | /previewmail/templates/:alias | Fetch full template by alias — dùng khi gửi email |

### Dùng trong app

```typescript
// Thay vì hardcode HTML trong code
const template = await previewMailService.getByAlias("welcome-email");
const html = Handlebars.compile(template.htmlBody)({
  fullName: "John",
  ...data,
});

await sesClient.send({
  html,
  subject: template.subject,
  to: user.email,
});
```

Thay đổi template trên UI → push lên DB → **không cần deploy lại app**.

---

## Multi-Database Support

Dùng adapter pattern — user chọn DB khi gọi `forRoot()`.

| Database        | Package                         | Notes                         |
| --------------- | ------------------------------- | ----------------------------- |
| PostgreSQL      | `@previewmail/adapter-postgres` | Recommended default           |
| MySQL / MariaDB | `@previewmail/adapter-mysql`    | Phổ biến trên shared hosting  |
| MongoDB         | `@previewmail/adapter-mongodb`  | Cho team đang dùng Mongo      |
| SQLite          | `@previewmail/adapter-sqlite`   | Zero-config, tốt cho solo dev |
| Turso (LibSQL)  | `@previewmail/adapter-turso`    | Edge-compatible SQLite        |
| Custom          | Implement `IPreviewMailAdapter` | Tự viết adapter               |

### Adapter Interface

Mọi adapter phải implement interface này để core package không phụ thuộc vào DB cụ thể:

```typescript
interface IPreviewMailAdapter {
  findAll(): Promise<Template[]>;
  findByAlias(alias: string): Promise<Template | null>;
  save(template: Template): Promise<Template>;
  delete(id: string): Promise<void>;
}
```

---

## Security Specification

| Area                 | Measure                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| **API Key Auth**     | Mọi request tới `/previewmail/*` phải có header `X-PreviewMail-Key`. Middleware reject 401 nếu sai hoặc thiếu.  |
| **CORS**             | Chỉ cho phép origin mà user whitelist trong `allowedOrigins`. Default: deny all.                                |
| **Rate Limiting**    | Max 60 requests/phút per IP, sliding window. Cấu hình qua `forRoot({ rateLimit: { max, windowMs } })`.          |
| **Input Validation** | Tất cả request body validate với `class-validator`. Max template size: 500KB. Alias: chỉ alphanumeric + dash.   |
| **SQL Injection**    | Adapters bắt buộc dùng parameterized queries — không bao giờ string interpolation.                              |
| **XSS**              | UI render HTML trong `<iframe sandbox="allow-same-origin">` — script không thể execute. Không dùng `innerHTML`. |
| **Secrets**          | `apiKey` lưu IndexedDB phía client — không bao giờ localStorage. Document rõ: treat it like a password.         |
| **Audit Log**        | Optional: `forRoot({ auditLog: true })` log mọi create/update/delete với timestamp và IP vào DB riêng.          |

---

## Release Roadmap

| Phase    | Timeline  | Goal                                                                                                                                          |
| -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **V1.0** | Now       | Stable frontend: editor, preview, mock data, IndexedDB, Copy/Download HTML                                                                    |
| **V1.1** | Tháng 1   | Fix UI: sidebar resize, save feedback, bỏ AWS banner, auto-fill mock data, keyboard shortcuts                                                 |
| **V1.2** | Tháng 2   | Thêm Markdown preview, SVG preview, OG tags preview                                                                                           |
| **V2.0** | Tháng 3–4 | `@previewmail/nestjs` core + **MongoDB adapter** + full security + **Frontend V2 integration (feature flag, Settings modal, sync indicator)** |
| **V2.1** | Tháng 4–5 | PostgreSQL, MySQL, SQLite adapters + custom adapter docs                                                                                      |
| **V2.2** | Tháng 5–6 | Turso adapter + migration CLI (chuyển template giữa các DB)                                                                                   |
| **V3.0** | Tháng 6+  | Optional hosted UI trên previewmail.dev — vẫn free, self-hosted vẫn không cần account                                                         |

---

## Repository Structure (Monorepo)

```
previewmail/                     ← Next.js UI ở root (Vercel deploy từ đây)
  src/
    app/                         # Next.js App Router
    components/
    hooks/
    lib/
      db.ts                      # IndexedDB (V1)
      config.ts                  # getV2Config() — feature flag
      apiClient.ts               # gọi NestJS API (V2 mode)
    stores/
    types/
  packages/
    nestjs/                      # @previewmail/nestjs core
    adapter-mongodb/             # @previewmail/adapter-mongodb (V2.0)
    adapter-postgres/            # @previewmail/adapter-postgres (V2.1)
    adapter-mysql/               # @previewmail/adapter-mysql (V2.1)
    adapter-sqlite/              # @previewmail/adapter-sqlite (V2.1)
    adapter-turso/               # @previewmail/adapter-turso (V2.2)
  examples/
    nestjs-app/                  # Example app để test integration
  docs/                          # Documentation site
  pnpm-workspace.yaml
  package.json                   # root — npm workspaces config
  .gitignore                     # bao gồm packages/*/dist, packages/*/node_modules
  LICENSE
  README.md
```

---

## Performance — @previewmail/nestjs

### Caching (quan trọng nhất)

Template thay đổi rất ít nhưng được đọc rất nhiều — mỗi lần app gửi email là 1 lần `getByAlias`. Không cache là lãng phí hoàn toàn.

```typescript
PreviewMailModule.forRoot({
  apiKey: "pm_xxx",
  storage: "mongodb",
  cache: {
    ttl: 60_000, // 1 phút
    max: 500, // tối đa 500 template trong memory
  },
});
```

Flow:

```
getByAlias('welcome')
  ├── Cache hit?  → trả về ngay (< 1ms)
  └── Cache miss? → query DB → lưu cache → trả về
```

> Khi user save template mới từ UI → **invalidate cache** của alias đó ngay lập tức.

### Connection Pooling

Mỗi adapter phải config connection pool — không để mỗi request mở connection mới:

| Database   | Default pool size | Recommended                        |
| ---------- | ----------------- | ---------------------------------- |
| MongoDB    | 5                 | 5–10                               |
| PostgreSQL | 10                | 10–20 tùy load                     |
| MySQL      | 10                | 10–20                              |
| SQLite     | 1                 | 1 (không support concurrent write) |

### Lazy Compilation

Package **không compile** Handlebars — chỉ trả raw `htmlBody` + `subject`. App tự compile với data thật. Tùy chọn dùng helper:

```typescript
// App tự compile — recommended
const template = await previewMailService.getByAlias("welcome");
const html = Handlebars.compile(template.htmlBody)(data);

// Hoặc dùng helper built-in nếu muốn
const html = await previewMailService.render("welcome", data);
```

### findAll() chỉ trả metadata

Không load `htmlBody` trong list view — chỉ trả những gì cần thiết:

```typescript
// findAll() trả về
{
  (id, name, alias, subject, updatedAt);
}

// findByAlias() mới trả full
{
  (id, name, alias, subject, htmlBody, textBody, updatedAt);
}
```

### Không làm

- ❌ Query DB trên mọi request nếu không có cache
- ❌ Load `htmlBody` trong `findAll()`
- ❌ Sync Handlebars compile trên template cực lớn — offload sang worker thread nếu cần

---

## Open Source Guidelines

**License:** MIT — free to use, modify, distribute. Commercial use allowed.

**Contributing:**

- Mọi PR thêm adapter mới phải có test suite đầy đủ
- Security issues báo qua private email — không mở public issue
- Breaking changes cần RFC (Request for Comments) issue trước
- Community adapters phải pass bộ standard adapter tests

---

_PreviewMail · Open Source · MIT License · github.com/your-org/previewmail_
