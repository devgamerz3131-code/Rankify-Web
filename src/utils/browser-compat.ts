/**
 * Cross-browser (Android Chrome / WebView + iOS Safari / Home Screen PWA)
 * feature-detection and safe platform utilities.
 *
 * Every browser API is checked via feature detection before invocation so
 * unsupported devices degrade cleanly without throwing runtime errors.
 */

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOSUA = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports MacIntel with multi-touch support
  const isIPadOS =
    navigator.platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;
  return isIOSUA || isIPadOS;
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isIOSStandalone =
      'standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isMediaStandalone =
      typeof window.matchMedia === 'function' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches);
    return Boolean(isIOSStandalone || isMediaStandalone);
  } catch {
    return false;
  }
}

export function isNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    typeof window.Notification !== 'undefined' &&
    typeof window.Notification.requestPermission === 'function'
  );
}

/**
 * Returns true if the user is on iOS in regular Safari (not added to Home Screen),
 * where Web Push / Notification API is disabled by iOS until installed to Home Screen.
 */
export function isIOSBrowserWithoutPushSupport(): boolean {
  return isIOSDevice() && !isStandalonePWA() && !isNotificationSupported();
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window &&
    Boolean(window.speechSynthesis) &&
    typeof window.speechSynthesis.speak === 'function'
  );
}

export function isWebShareSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    typeof navigator.share === 'function'
  );
}

export function isVibrationSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function'
  );
}

export function triggerSafeHaptic(pattern: number | number[] = 12): void {
  if (!isVibrationSupported()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore on unsupported devices (e.g. iOS Safari)
  }
}

/**
 * Copies text to clipboard using Clipboard API when available, with a safe
 * synchronous textarea fallback for iOS Safari / Android WebViews after async steps.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  try {
    if (
      typeof navigator !== 'undefined' &&
      'clipboard' in navigator &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to DOM execCommand fallback
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/**
 * Safely triggers a Blob download on desktop, Android Chrome, and iOS Safari.
 * Delays revoking the Object URL so mobile browsers have time to start reading the stream.
 */
export function downloadBlobSafe(blob: Blob, filename: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Delay revocation so iOS Safari and Android Chrome download manager can read the blob
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore
      }
    }, 10000);
    return true;
  } catch {
    return false;
  }
}
