import { useEffect } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';

export const useLayouts = () => {
  const {
    layouts,
    selectedLayoutId,
    isLoading,
    loadLayouts,
    selectLayout,
    createLayout,
    updateLayout,
    deleteLayout,
    getSelectedLayout,
    getLayoutById,
  } = useLayoutStore();

  useEffect(() => {
    void loadLayouts();
  }, [loadLayouts]);

  return {
    layouts,
    selectedLayoutId,
    selectedLayout: getSelectedLayout(),
    isLoading,
    selectLayout,
    createLayout,
    updateLayout,
    deleteLayout,
    getLayoutById,
  };
};
