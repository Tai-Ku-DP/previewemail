import { useCallback, useEffect, useState } from 'react';
import type { SESSettings } from '@/types';
import { getSESSettings, saveSESSettings, clearSESSettings } from '@/lib/db';

export const useSettings = () => {
  const [settings, setSettings] = useState<SESSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getSESSettings();
        setSettings(data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async (data: SESSettings) => {
    await saveSESSettings(data);
    setSettings(data);
  }, []);

  const clear = useCallback(async () => {
    await clearSESSettings();
    setSettings(null);
  }, []);

  const isConfigured =
    settings !== null &&
    settings.accessKeyId.length > 0 &&
    settings.secretAccessKey.length > 0 &&
    settings.region.length > 0 &&
    settings.fromAddress.length > 0;

  return { settings, isConfigured, isLoading, save, clear };
};
