import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import TemplatesPage from '@/views/TemplatesPage';
import TemplateEditorPage from '@/views/TemplateEditorPage';
import LayoutEditorPage from "@/views/LayoutEditorPage";
import TemplateLibraryPage from "@/views/TemplateLibraryPage";
import HomePage from "@/views/index";
import { AppInit } from "@/components/AppInit";

export default function App() {
  return (
    <>
      <AppInit />
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/library" element={<TemplateLibraryPage />} />
        <Route path="/templates/:templateId" element={<TemplateEditorPage />} />
        <Route path="/layouts/:layoutId" element={<LayoutEditorPage />} />
        <Route path="*" element={<Navigate to="/templates" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
