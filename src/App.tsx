import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import TemplatesPage from '@/views/TemplatesPage';
import TemplateEditorPage from '@/views/TemplateEditorPage';
import LayoutEditorPage from "@/views/LayoutEditorPage";
import TemplateLibraryPage from "@/views/TemplateLibraryPage";
import HomePage from "@/views/index";
import { AppInit } from "@/components/AppInit";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/templates", element: <TemplatesPage /> },
  { path: "/library", element: <TemplateLibraryPage /> },
  { path: "/templates/:templateId", element: <TemplateEditorPage /> },
  { path: "/layouts/:layoutId", element: <LayoutEditorPage /> },
  { path: "*", element: <Navigate to="/templates" replace /> },
]);

export default function App() {
  return (
    <>
      <AppInit />
      <RouterProvider router={router} />
    </>
  );
}
