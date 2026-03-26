# PreviewMail - User Guide (English)

PreviewMail is a web app that helps you **manage Email Templates, Email Layouts, and Mock Data**, and **preview instantly in your browser**.

---

## Screenshots (placeholders for your images)

**Image 1:** Templates / Layouts list page  
<!-- IMAGE: 1 - Templates / Layouts list page -->

**Image 2:** Template editor page (`/templates/:templateId`)  
<!-- IMAGE: 2 - Template editor page (`/templates/:templateId`) -->

**Image 3:** Preview (desktop/mobile)  
<!-- IMAGE: 3 - Preview (desktop/mobile) -->

**Image 4:** Mock Data editor  
<!-- IMAGE: 4 - Mock Data editor -->

**Image 5:** Layout editor (`/layouts/:layoutId`)  
<!-- IMAGE: 5 - Layout editor (`/layouts/:layoutId`) -->

**Image 6:** Settings (optional / if your build has it)  
<!-- IMAGE: 6 - Settings (optional / if your build has it) -->

---

## What can PreviewMail help the user do? (3 key benefits)

1. **Create/edit Email Templates** (HTML + Subject + Handlebars variables).
2. **Create/edit Email Layouts** (HTML layout with a placeholder for inserting the template content).
3. **Fill Mock Data (JSON) and preview immediately** so you can see the exact rendered result (and compile errors if any).

---

## Quick usage flow

### 1) Open the management pages

- Templates: `/templates`
- Layouts: `/layouts/:layoutId`
- Template Library (pre-designed templates): `/library`

### 2) Create new

- Click `New template` to create a new template.
- Click `New layout` to create a new layout.

### 3) Edit a Template

On `/templates/:templateId`, you can:

- Edit **HTML template** (`{{variable}}`).
- Edit **Subject** (also supports Handlebars variables).
- Choose/change the **Layout** the template uses (if applicable).
- Edit **Mock Data (JSON)** to render variables.
- View **Preview** in the right panel (switch between desktop/mobile).

### 4) Press `Save` to store changes

- Click `Save` (or `Ctrl/Cmd + S`) to save into **IndexedDB** on your browser.
- Your edits reflect instantly in the UI; `Save` makes them persistent for later.

### 5) Export / Import

- `Export` on the Templates/Layouts list downloads: `previewmail-export.json`
- `Import` lets you load templates/layouts back from that JSON file.

---

## How to write templates / layouts

PreviewMail compiles using **Handlebars**:

- Template HTML: variables like `{{variableName}}`
- Layout HTML: include a content placeholder like `{{{@content}}}` (triple braces)

Example idea for a layout:

```html
<!-- Layout HTML -->
<html>
  <body>
    {{{@content}}}
  </body>
</html>
```

---

## What is Mock Data?

- Mock Data is **JSON** you fill in so it matches the variables used by the Template/Layout.
- When the system detects new variables, the JSON can be auto-expanded with a “skeleton” to help you faster.

---

## Preview (desktop / mobile)

- In the Preview panel, you can choose the display size (desktop/mobile).
- The preview is rendered in an `iframe` using the compiled output (`srcDoc`).

---

## Data storage & security

- Templates/Layouts are stored in **IndexedDB** on your device.
- If you have any sending-related settings enabled in your build, they are stored locally (details depend on your configuration).

---

## Development

From `previewemail/previewemail`:

```bash
npm install
npm run dev
```

Then open the app via the Next.js provided URL.

---

# PreviewMail - Hướng dẫn sử dụng

PreviewMail là một web app giúp bạn **quản lý Template email, Layout email và Mock Data**, đồng thời **preview ngay lập tức trong trình duyệt**.

--- 

## Screenshots (chỗ để bạn chèn ảnh)

**Ảnh 1:** Trang danh sách Templates / Layouts  
<!-- IMAGE: 1 - Trang danh sách Templates / Layouts -->

**Ảnh 2:** Trang Template editor (`/templates/:templateId`)  
<!-- IMAGE: 2 - Trang Template editor (`/templates/:templateId`) -->

**Ảnh 3:** Preview (desktop/mobile)  
<!-- IMAGE: 3 - Preview (desktop/mobile) -->

**Ảnh 4:** Mock Data editor  
<!-- IMAGE: 4 - Mock Data editor -->

**Ảnh 5:** Layout editor (`/layouts/:layoutId`)  
<!-- IMAGE: 5 - Layout editor (`/layouts/:layoutId`) -->

**Ảnh 6:** Settings (tuỳ chọn / nếu bản build của bạn còn có)  
<!-- IMAGE: 6 - Settings (optional / if your build has it) -->

--- 

## PreviewMail giúp người dùng làm gì? (3 ý chính)

1. **Tạo/chỉnh sửa** Template email (HTML + Subject + biến Handlebars).
2. **Tạo/chỉnh sửa** Layout email (HTML layout có chỗ chèn nội dung template).
3. **Điền Mock Data (JSON) và preview ngay** để thấy đúng kết quả render (kèm hiển thị lỗi compile nếu có).

--- 

## Luồng sử dụng nhanh

### 1) Mở trang quản lý

- Danh sách Templates: `/templates`
- Layouts: `/layouts/:layoutId`
- Thư viện Template có sẵn: `/library`

### 2) Tạo mới

- Nhấn `New template` để tạo template mới.
- Nhấn `New layout` để tạo layout mới.

### 3) Chỉnh sửa Template

Trên trang `/templates/:templateId`, bạn có thể:

- Sửa **HTML template** (các biến dạng `{{variable}}`).
- Sửa **Subject** (cũng có thể dùng biến Handlebars).
- Chọn/đổi **Layout** mà template sẽ dùng (nếu template có layout).
- Sửa **Mock Data (JSON)** để render biến.
- Xem **Preview** ở panel bên phải (có thể đổi desktop/mobile).

### 4) Nhấn `Save` để lưu

- Bấm `Save` (hoặc `Ctrl/Cmd + S`) để lưu vào **IndexedDB** trên trình duyệt.
- Thay đổi trong editor/panel preview được phản ánh ngay trong UI; `Save` giúp dữ liệu bền vững cho lần mở sau.

### 5) Export / Import

- Export ở trang danh sách Templates/Layouts sẽ tải file: `previewmail-export.json`
- Import dùng file JSON export trước đó để nạp lại templates/layouts.

--- 

## Template / Layout viết như thế nào?

PreviewMail dùng **Handlebars** để compile:

- Template HTML: dùng biến dạng `{{variableName}}`.
- Layout HTML: cần có chỗ chèn nội dung template bằng `{{{@content}}}` (triple braces).

Ví dụ layout (ý tưởng):

```html
<!-- Layout HTML -->
<html>
  <body>
    {{{@content}}}
  </body>
</html>
```

--- 

## Mock Data là gì?

- Mock Data là **JSON** bạn điền vào để khớp với các biến trong Template/Layout.
- Nếu hệ thống phát hiện template dùng thêm biến, phần JSON có thể được tự mở rộng “skeleton” để bạn nhanh hơn khi build dữ liệu mẫu.

--- 

## Preview desktop / mobile

- Trong panel Preview, bạn có thể chọn kích thước hiển thị (ví dụ desktop/mobile).
- Preview được render bằng `iframe` theo nội dung compile (`srcDoc`).

--- 

## Lưu trữ dữ liệu & bảo mật

- Templates/Layouts được lưu trong **IndexedDB** trên trình duyệt (mỗi thiết bị có dữ liệu riêng).
- Nếu bản của bạn còn tính năng `Settings`, dữ liệu liên quan sẽ được lưu cục bộ (tùy theo cấu hình).

--- 

## Ghi chú chạy dự án (development)

Từ thư mục `previewemail/previewemail`:

```bash
npm install
npm run dev
```

Sau đó mở app trên trình duyệt theo địa chỉ Next.js cung cấp.

