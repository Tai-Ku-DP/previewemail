import { useState, useCallback, useRef, useEffect } from 'react';

const DEBOUNCE_MS = 300;

export const useMockData = (initialData: Record<string, unknown> = {}) => {
  const [mockData, setMockData] = useState<Record<string, unknown>>(initialData);
  const [parseError, setParseError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const updateFromJson = useCallback((json: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON';
      setParseError(msg);
      return;
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setParseError('Mock data must be a JSON object');
      return;
    }

    setParseError(null);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setMockData(parsed as Record<string, unknown>);
    }, DEBOUNCE_MS);
  }, []);

  const reset = useCallback((data: Record<string, unknown>) => {
    clearTimeout(timerRef.current);
    setMockData(data);
    setParseError(null);
  }, []);

  return {
    mockData,
    parseError,
    updateFromJson,
    reset,
  };
};
