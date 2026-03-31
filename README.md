# PreviewMail 💌

PreviewMail is a modern, headless **Email Template CMS** designed for Next.js and NestJS. It allows developers and designers to build, manage, test, and store Email Templates and Layouts instantly in the browser, while natively syncing with your backend database.

🔗 **Live Demo**: [https://previewmail.vercel.app](https://previewmail.vercel.app)

[🇻🇳 Xem Hướng Dẫn Sử Dụng Bằng Tiếng Việt bên dưới](#hướng-dẫn-sử-dụng---tiếng-việt)

---

## 📸 Screenshots

**1. Dashboard (Templates & Layouts List)**  
![Dashboard](./public/docs/template_layouts.png)

**2. Template Editor**  
![Template Editor](./public/docs/template_editor.png)

**3. Live Preview (Desktop & Mobile view)**  
![Live Preview](./public/docs/template_preview.png)

---

## ✨ Key Features

1. **Headless CMS Architecture**: Manage templates via the Next.js UI, and fetch them directly in your NestJS backend using our official SDK packages.
2. **Email Templates & Layouts Management**: Decoupled architecture where Layouts logically wrap around Templates using `{{{@content}}}`.
3. **Handlebars Templating**: Real-time rendering of robust Handlebars logic (`{{variable}}`, `{{#each}}`, `{{#if}}`) in both Subject and Body.
4. **AWS SES Test Emails**: One-click test email sending right from the editor using AWS SES integration.
5. **Intelligent Mock Data**: Write JSON Mock Data to render templates. The system automatically detects new variables in your HTML and generates a skeleton JSON.
6. **Local Cache & DB Sync**: Works entirely offline initially via IndexedDB, but seamlessly synchronizes with MongoDB (or custom adapters) via secure API backend.
7. **Export & Import**: Easily backup and share your templates with a single JSON file.

---

## 📦 Official Packages

We provide official NPM packages for seamless backend integration:

- `@previewmail/nestjs`: The core NestJS module to securely validate, cache, and serve templates via REST API.
- `@previewmail/adapter-mongodb`: The official MongoDB schema adapter for rapid persistence out-of-the-box.

---

## 🚀 Getting Started

### Option A — Use the Hosted Version (Recommended)

No setup needed. Just open [https://previewmail.vercel.app](https://previewmail.vercel.app) in your browser and start building templates immediately.

> Works fully offline via IndexedDB. Connect to your own backend anytime via **Settings → API Workspace**.

---

### Option B — Self-Host on Your Own Server

Prefer to keep everything in-house? Clone the repo and host it yourself.

```bash
git clone https://github.com/your-username/previewmail.git
cd previewmail
npm install
npm run build
npm run start
```

Or deploy to your own Vercel / server with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/previewmail)

> The UI is a standard Next.js app — it runs anywhere Node.js is supported (VPS, Docker, Railway, Render, etc.).

---

### NestJS Backend Integration

Install the packages in your NestJS project:

```bash
npm install @previewmail/nestjs @previewmail/adapter-mongodb mongoose
```

Register the module in your `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PreviewMailModule } from '@previewmail/nestjs';
import { MongoDBAdapter } from '@previewmail/adapter-mongodb';

@Module({
  imports: [
    PreviewMailModule.forRoot({
      apiKey: 'my-secure-api-key', // Protects the Sync endpoints from unauthorized access
      allowedOrigins: ['http://localhost:3000'], // The URL of your Next.js Editor UI
      storage: new MongoDBAdapter('mongodb://localhost:27017/previewmail'),
    }),
  ],
})
export class AppModule {}
```

**Connect the UI to your backend:**

Open your PreviewMail UI → click the **Settings (⚙️) icon** in the Header → go to **API Workspace** tab:
- Enable **API Synchronization**
- Enter your **Server Host** (e.g. `http://localhost:3001`)
- Enter your **API Key**

From this point, every template you save will automatically sync to your MongoDB. ✅

---

### Fetching Templates in Your App

Once synced, fetch and compile templates at runtime — no rebuild needed when content changes.

```typescript
import { PreviewMailService } from '@previewmail/nestjs';
import Handlebars from 'handlebars';

// Fetch template by alias
const template = await previewMailService.getByAlias('welcome-email');

// Compile with real data
const html = Handlebars.compile(template.htmlBody)({
  fullName: 'John Doe',
  organizationName: 'Acme Corp',
});

// Send via AWS SES or any provider
await sesClient.send({
  to: user.email,
  subject: Handlebars.compile(template.subject)({ organizationName: 'Acme Corp' }),
  html,
});
```

> 📸 _Screenshot: Fetching and sending a template from NestJS_
> <!-- TODO: Add screenshot of NestJS app fetching template and sending email -->

---

### Integration Architecture

> 📸 _Diagram: How PreviewMail UI, NestJS package, and your database connect_
> <!-- TODO: Add architecture diagram image here -->

```
┌─────────────────────┐        ┌──────────────────────────┐        ┌─────────────┐
│  PreviewMail UI      │──sync─▶│  @previewmail/nestjs     │──save─▶│  MongoDB    │
│  (browser / server) │        │  REST API + LRU Cache    │        │  (your DB)  │
└─────────────────────┘        └──────────────────────────┘        └─────────────┘
                                          │
                                    getByAlias()
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │  Your NestJS App     │
                               │  compile → send email│
                               └──────────────────────┘
```

---

## 🗄️ Supported Databases

| Database | Adapter Package | Status |
|----------|----------------|--------|
| MongoDB | `@previewmail/adapter-mongodb` | ✅ Available |
| PostgreSQL | `@previewmail/adapter-postgres` | 🔜 Coming soon |
| MySQL | `@previewmail/adapter-mysql` | 🔜 Coming soon |
| SQLite | `@previewmail/adapter-sqlite` | 🔜 Coming soon |
| Custom | Implement `IPreviewMailAdapter` | ✅ Supported |

---

## 🤝 Contributing

PreviewMail is fully open source and free forever (MIT License).

```bash
# Clone and run locally
git clone https://github.com/your-username/previewmail.git
cd previewmail
npm install
npm run dev
```

PRs are welcome! Please read the contributing guide before submitting.

---

---

# Hướng Dẫn Sử Dụng - Tiếng Việt 🇻🇳

PreviewMail là hệ thống **Headless CMS quản lý Email Template** dành cho lập trình viên. Khác với các editor truyền thống, PreviewMail cung cấp cả giao diện web (Next.js) để thiết kế trực quan, lẫn bộ công cụ thư viện backend (NestJS) để ứng dụng của bạn tự động lấy template từ Database ra và gửi đi.

🔗 **Xem Demo**: [https://previewmail.vercel.app](https://previewmail.vercel.app)

---

## ✨ Tính năng nổi bật

1. **Kiến trúc Headless CMS**: Tách biệt UI với Backend. Dữ liệu được lưu thẳng vào MongoDB của bạn. Việc thay đổi nội dung email qua UI có hiệu lực ngay lập tức mà không cần deploy lại code!
2. **Quản lý tách biệt Template & Layout**: Giúp bạn tái sử dụng bộ khung (Header, Footer, CSS tĩnh) cho nhiều nội dung email (Template) khác nhau dễ dàng.
3. **Gửi test email bằng AWS SES**: Được tích hợp sẵn SDK AWS SESv2. Bạn có thể chèn credentials vào màn hình Settings và gửi email test trực tiếp sau khi code xong.
4. **Hỗ trợ Handlebars mạnh mẽ**: Sử dụng cú pháp Handlebars (`{{user.name}}`) cho cả Tiêu đề và Nội dung HTML.
5. **Trình soạn thảo Code chuyên nghiệp**: Tích hợp CodeMirror với tính năng highlight cú pháp HTML/JSON, tự động format bằng Prettier nội bộ.
6. **Mock Data thông minh**: Chặn đứng việc phải tưởng tượng biến `{{user}}` trông thế nào. Tự động nhận diện biến từ HTML và tạo sẵn cấu trúc JSON (skeleton).
7. **Đồng bộ Database & Offline Support**: Hỗ trợ fallback lưu tạm vào trình duyệt (IndexedDB) nếu Backend tạm thời mất kết nối. Khi online trở lại, tự động sync.

---

## 🚀 Hướng dẫn tích hợp Backend

### Lựa chọn A — Dùng bản Hosted (Khuyên dùng)

Không cần cài đặt gì. Truy cập thẳng [https://previewmail.vercel.app](https://previewmail.vercel.app) và bắt đầu viết template ngay.

> Hoạt động offline hoàn toàn qua IndexedDB. Kết nối backend bất cứ lúc nào qua **Settings → API Workspace**.

---

### Lựa chọn B — Tự Host trên Server của bạn

Muốn kiểm soát hoàn toàn? Clone repo về và tự deploy.

```bash
git clone https://github.com/your-username/previewmail.git
cd previewmail
npm install
npm run build
npm run start
```

> UI là ứng dụng Next.js tiêu chuẩn — chạy được trên mọi nơi có Node.js (VPS, Docker, Railway, Render, v.v.).

---

### Bước 1: Cài đặt NestJS Backend

Đừng mất công viết lại các API CRUD từ đầu! Cài đặt ngay 2 package chính thức:

```bash
npm install @previewmail/nestjs @previewmail/adapter-mongodb mongoose
```

Khai báo Module vào file `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PreviewMailModule } from '@previewmail/nestjs';
import { MongoDBAdapter } from '@previewmail/adapter-mongodb';

@Module({
  imports: [
    PreviewMailModule.forRoot({
      apiKey: 'nhap-api-key-bi-mat-cua-ban', // Bảo mật API
      allowedOrigins: ['http://localhost:3000'], // URL của PreviewMail UI
      storage: new MongoDBAdapter('mongodb://localhost:27017/my_database'),
    }),
  ],
})
export class AppModule {}
```

> 📸 _Hình minh họa: Cấu hình PreviewMailModule trong NestJS_
> <!-- TODO: Add screenshot of NestJS module setup -->

---

### Bước 2: Kết nối UI với Backend

Mở PreviewMail UI → bấm **icon Settings (⚙️)** trên Header → chọn tab **API Workspace**:
- Bật **Enable API Synchronization**
- Điền **Server Host** (ví dụ: `http://localhost:3001`)
- Điền **API Key** bí mật

> 📸 _Hình minh họa: Màn hình Settings → API Workspace_
> <!-- TODO: Add screenshot of Settings modal API Workspace tab -->

Kể từ giờ, toàn bộ template sẽ tự động đồng bộ lên MongoDB của bạn! ✅

---

### Bước 3: Lấy Template trong App và Gửi Email

```typescript
// Lấy template theo alias
const template = await previewMailService.getByAlias('chao-mung');

// Compile với dữ liệu thực
const html = Handlebars.compile(template.htmlBody)({
  fullName: 'Nguyễn Văn A',
  organizationName: 'Công ty ABC',
});

// Gửi qua AWS SES
await sesClient.send({
  to: user.email,
  subject: Handlebars.compile(template.subject)({ organizationName: 'Công ty ABC' }),
  html,
});
```

> 📸 _Hình minh họa: Kết quả email nhận được sau khi gửi_
> <!-- TODO: Add screenshot of received test email -->

---

_Được xây dựng với tình yêu bằng Next.js, NestJS, TailwindCSS, Mongoose và Handlebars._
