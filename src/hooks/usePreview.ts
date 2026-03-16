import { useMemo } from 'react';
import { compileTemplate, compileWithLayout, compileSubject } from '@/lib/handlebars';

export const usePreview = (
  htmlBody: string,
  subject: string,
  mockData: Record<string, unknown>,
  layoutHtml?: string,
) => {
  const compiled = useMemo(() => {
    if (!htmlBody) return { result: '', error: null };
    if (layoutHtml) {
      return compileWithLayout(htmlBody, layoutHtml, mockData);
    }
    return compileTemplate(htmlBody, mockData);
  }, [htmlBody, mockData, layoutHtml]);

  const compiledSubject = useMemo(() => {
    if (!subject) return '';
    return compileSubject(subject, mockData);
  }, [subject, mockData]);

  return {
    renderedHtml: compiled.result ?? '',
    compileError: compiled.error,
    compiledSubject,
  };
};
