import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import TemplatesPage from '@/pages/TemplatesPage';
import TemplateEditorPage from '@/pages/TemplateEditorPage';
import LayoutEditorPage from '@/pages/LayoutEditorPage';
import HomePage from '@/pages/index';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/:templateId" element={<TemplateEditorPage />} />
        <Route path="/layouts/:layoutId" element={<LayoutEditorPage />} />
        <Route path="*" element={<Navigate to="/templates" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
