// Facebook Pixel helper
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (window.fbq) {
    window.fbq('track', eventName, params);
  }
};
