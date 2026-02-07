/// <reference types="vite/client" />

// Google Analytics gtag types
interface Window {
  gtag?: (
    command: 'config' | 'event' | 'js' | 'set',
    targetIdOrEventName: string,
    params?: Record<string, any>
  ) => void;
  dataLayer?: any[];
}
