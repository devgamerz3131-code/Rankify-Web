import toast from 'react-hot-toast';

/**
 * Triggers lightweight tactile haptic feedback on supported mobile devices.
 */
export function triggerHapticFeedback(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([15, 30]);
    } catch {
      // Safe fallback for browsers blocking vibration
    }
  }
}

/**
 * Safely opens an external URL in a new tab without using window.open,
 * complying with iFrame security constraints and sandbox rules.
 */
export function openExternalUrl(url: string): void {
  if (typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies the prompt to clipboard and opens ChatGPT (app or web).
 */
export async function openChatGPT(promptText: string): Promise<void> {
  triggerHapticFeedback();
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(promptText);
    }
  } catch {
    // Clipboard write fallback handled gracefully
  }

  toast.success('Prompt copied! Continuing with ChatGPT...', {
    icon: '🚀',
    duration: 3000,
  });

  // Try opening ChatGPT app via intent/deep link or web fallback
  const queryParam = promptText.length < 1000 ? `?q=${encodeURIComponent(promptText)}` : '';
  const webUrl = `https://chatgpt.com${queryParam}`;

  openExternalUrl(webUrl);
}

/**
 * Copies the prompt to clipboard and opens Gemini (app or web).
 */
export async function openGemini(promptText: string): Promise<void> {
  triggerHapticFeedback();
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(promptText);
    }
  } catch {
    // Clipboard write fallback handled gracefully
  }

  toast.success('Prompt copied! Continuing with Gemini...', {
    icon: '✨',
    duration: 3000,
  });

  const webUrl = 'https://gemini.google.com/app';
  openExternalUrl(webUrl);
}

/**
 * Shares the prompt using Web Share API or falls back to clipboard copy.
 */
export async function sharePrompt(
  promptText: string,
  subject: string,
  chapter: string
): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `CBSE Class 12 ${subject} - ${chapter} Study Prompt`,
        text: promptText,
      });
      return;
    } catch {
      // User cancelled share or unsupported
    }
  }

  // Fallback to clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(promptText);
      toast.success('Prompt copied to clipboard for sharing!', {
        icon: '📋',
      });
    }
  } catch {
    toast.error('Unable to share prompt');
  }
}
