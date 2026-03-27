# PreviewMail

PreviewMail is a modern web application designed to help developers and designers **build, manage, and test Email Templates and Layouts** instantly in the browser.

[🇻🇳 Xem Hướng Dẫn Sử Dụng Bằng Tiếng Việt bên dưới](#hướng-dẫn-sử-dụng---tiếng-việt)

---

## 📸 Screenshots

**1. Dashboard (Templates & Layouts List)**  
![Template](./public/docs/template_layouts.png)

**2. Template Editor**

![Template](./public/docs/template_editor.png)

**3. Live Preview (Desktop & Mobile view)**

![Template](./public/docs/template_preview.png)

## ✨ Key Features

1. **Email Templates & Layouts Management**: Decoupled architecture where Layouts wrap Templates.
2. **Handlebars Templating**: Use robust Handlebars logic (`{{variable}}`, `{{#each}}`, `{{#if}}`) in both Subject and Body.
3. **Advanced Code Editor**: Integrated with CodeMirror for HTML and JSON syntax highlighting, linting, and formatting.
4. **Live Preview**: Instantly preview how the email looks on Desktop and Mobile device widths.
5. **Intelligent Mock Data**: Write JSON Mock Data to render templates. The system automatically detects new variables in your HTML and generates a skeleton JSON.
6. **Local First (IndexedDB)**: All data is securely stored in your browser's IndexedDB. No backend database required.
7. **Export & Import**: Easily backup and share your templates with a single JSON file.

---

## 🚀 Getting Started

First, ensure you have Node.js installed. Clone the repository and run:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📖 English User Guide

### 1. Structure overview

- **Templates**: The main content of your email.
- **Layouts**: The wrapper structure (like `<html><body>...</body></html>`). Layouts must include `{{{@content}}}` where the Template should be injected.
- **Mock Data**: A JSON object representing the variables passed to the Handlebars compiler.

### 2. Creating a Template

1. Navigate to the **Templates** tab.
2. Click **New Template**.
3. In the **Editor**, you can set the **Subject**, assign a **Layout**, and write the **HTML code**.
4. Use Handlebars syntax for dynamic data: `Hello {{user.name}}!`.
5. Switch to the **Mock Data** tab and fill in the corresponding JSON: `{"user": {"name": "John"}}`.
6. Press `Ctrl + S` or click **Save** to persist changes.

### 3. Reusing Layouts

1. Navigate to the **Layouts** tab.
2. Click **New Layout**.
3. Write your boilerplate wrapper HTML.
4. **Crucial:** You must place `{{{@content}}}` exactly where you want the Template body to appear.

### 4. Template Library

- Go to the **Template Library** tab (`/library`) to find pre-built, beautifully designed templates.
- Click **Import** to bring them into your own workspace for further editing.

### 5. Export / Import Data

- Click the **Export** button on the Dashboard to download your entire database as `previewmail-export.json`.
- Use the **Import** button to restore or share your workspace.

---

---

# Hướng Dẫn Sử Dụng - Tiếng Việt

PreviewMail là ứng dụng web giúp bạn **quản lý Template Email, Layout Email và Mock Data**, cho phép **preview trực tiếp trong trình duyệt** ngay khi đang viết code.

---

## 📸 Ảnh chụp màn hình (Screenshots)

**1. Màn hình Quản lý (Danh sách Templates / Layouts)**

![Template](./public/docs/template_layouts.png)

**2. Giao diện Chỉnh sửa Template (Template Editor)**

![Template](./public/docs/template_editor.png)

**3. Xem trước trực tiếp (Live Preview - Desktop/Mobile)**

![Template](./public/docs/template_preview.png)

---

## ✨ Tính năng nổi bật

1. **Quản lý tách biệt Template & Layout**: Giúp bạn tái sử dụng cấu trúc HTML vỏ ngoài (Layout) cho nhiều nội dung email (Template) khác nhau.
2. **Hỗ trợ Handlebars mạnh mẽ**: Sử dụng cú pháp `{{biến}}` cho cả Tiêu đề (Subject) và Nội dung (HTML).
3. **Trình soạn thảo Code chuyên nghiệp**: Tích hợp CodeMirror với tính năng highlight cú pháp HTML/JSON, tự động format và báo lỗi (linting).
4. **Live Preview (Desktop & Mobile)**: Xem trước giao diện email hiển thị như thế nào trên màn hình máy tính và điện thoại.
5. **Mock Data thông minh**: Tự động nhận diện các biến Handlebars mới trong mã HTML và tạo sẵn cấu trúc JSON (skeleton) để bạn điền dữ liệu test nhanh chóng.
6. **Lưu trữ Offline (IndexedDB)**: Dữ liệu được lưu an toàn tại local trình duyệt, hoạt động cực mượt, không cần database backend.
7. **Thư viện Template có sẵn**: Cung cấp mục `/library` chứa các mẫu email thiết kế sẵn đẹp mắt, dễ dàng Import.
8. **Export / Import**: Sao lưu (Backup) toàn bộ workspace thành 1 file JSON và khôi phục (Restore) bất cứ khi nào.

---

## 🚀 Cài đặt & Chạy dự án (Dành cho Developer)

Đảm bảo bạn đã cài đặt Node.js. Chạy các lệnh sau trong thư mục `previewemail/previewemail`:

```bash
# Cài đặt thư viện
npm install

# Khởi chạy server development
npm run dev
```

Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000).

---

## 📖 Hướng Dẫn Sử Dụng Chi Tiết

### 1. Hiểu về Cấu trúc

- **Template**: Là phần nội dung chính yếu của Email (ví dụ: Xin chào bạn, mã OTP của bạn là...).
- **Layout**: Là khung HTML bao bọc bên ngoài (chứa thẻ `<html>`, `<body>`, các định dạng CSS chung, Header, Footer). Layout **BẮT BUỘC** phải có chuỗi `{{{@content}}}` để đánh dấu vị trí chèn nội dung của Template vào.
- **Mock Data**: Dữ liệu JSON ảo dùng để truyền giá trị thực tế vào các biến `{{...}}` khi Preview.

### 2. Cách tạo một Template mới

1. Mở trang quản trị chính (tab **Templates**).
2. Nhấn nút **New Template**.
3. Tại trang Editor, bạn có thể:
   - Viết **Tiêu đề (Subject)**.
   - Chọn **Layout** áp dụng cho Template này.
   - Viết mã **HTML** ở khung Editor. Sử dụng Handlebars để chèn biến, ví dụ: `Xin chào {{user.name}}!`.
4. Chuyển sang phần **Mock Data** và nhập JSON tương ứng: `{"user": {"name": "Nguyễn Văn A"}}`. (Hệ thống sẽ tự động tạo khung JSON cho bạn nếu phát hiện biến mới).
5. Nhìn sang bảng **Preview** để xem kết quả trực tiếp.
6. Nhấn nút **Save** (hoặc `Ctrl/Cmd + S`) để lưu thay đổi.

### 3. Cách tạo và dùng Layout

1. Chuyển sang tab **Layouts** từ menu chính.
2. Nhấn **New Layout**.
3. Viết khung HTML chuẩn của một Email.
4. **Quan trọng:** Bạn hãy đặt biến `{{{@content}}}` ở nơi bạn muốn nội dung Template xuất hiện.
   _Ví dụ:_

   ```html
   <html>
     <body style="background: #f0f0f0;">
       <!-- Header chung -->
       <div class="header">My Logo</div>

       <!-- Nội dung template sẽ được chèn vào đây -->
       {{{@content}}}

       <!-- Footer chung -->
       <div class="footer">Unsubscribe here</div>
     </body>
   </html>
   ```

### 4. Sử dụng Template Library

- Truy cập vào **Template Library** trên thanh menu (`/library`).
- Bạn sẽ thấy nhiều giao diện được dựng sẵn. Nhấn **Import** vào mẫu bất kỳ. Mẫu đó sẽ được copy về kho Template cá nhân của bạn để thoải mái chỉnh sửa.

### 5. Export và Import (Sao lưu Dữ liệu)

- Không sợ mất dữ liệu khi đổi máy tính. Hãy vào tab quản lý (Dashboard), nhấn **Export**. Trình duyệt sẽ tải về máy file `previewmail-export.json` chứa toàn bộ Templates và Layouts.
- Dùng nút **Import** để tải tệp JSON đó lên khi bạn dùng máy tính khác hoặc lỡ đổi trình duyệt.

---

_Được xây dựng với Next.js, React, TailwindCSS, và Handlebars._
