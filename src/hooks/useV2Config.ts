import { useState, useEffect, useCallback } from 'react';
import type { V2Config } from '@/types';
import { getV2Config, saveV2Config, clearV2Config } from '@/lib/config';
import { useTemplateStore } from '@/stores/templateStore';

export function useV2Config() {
  const [config, setConfig] = useState<V2Config | null>(null);

  useEffect(() => {
    getV2Config().then(setConfig);
  }, []);

  const save = useCallback(async (newConfig: V2Config) => {
    await saveV2Config(newConfig);
    setConfig(newConfig);
    await useTemplateStore.getState().loadTemplates();
  }, []);

  const clear = useCallback(async () => {
    await clearV2Config();
    setConfig(null);
    await useTemplateStore.getState().loadTemplates();
  }, []);

  return { config, save, clear };
}
