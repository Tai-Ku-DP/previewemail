import { useEffect } from 'react';
import { useTemplateStore } from '@/stores/templateStore';

export const useTemplates = () => {
  const {
    templates,
    selectedTemplateId,
    isLoading,
    loadTemplates,
    selectTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getSelectedTemplate,
  } = useTemplateStore();

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    selectedTemplateId,
    selectedTemplate: getSelectedTemplate(),
    isLoading,
    selectTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
