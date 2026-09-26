/**
 * AI App Launcher Service for ChatGPT & Gemini
 * Handles copying generated master prompts to clipboard and opening ChatGPT/Gemini.
 */

import toast from 'react-hot-toast';

export type AITarget = 'chatgpt' | 'gemini';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older environments
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return false;
  }
}

/**
 * Copies prompt to clipboard and launches ChatGPT or Gemini.
 */
export async function launchAIApp(target: AITarget, promptText: string): Promise<void> {
  // 1. Always copy prompt to clipboard first
  const copied = await copyToClipboard(promptText);

  if (copied) {
    toast.success('Master Prompt copied to clipboard!', { icon: '📋' });
  } else {
    toast.error('Please copy prompt manually.');
  }

  // 2. Determine target URL
  let targetUrl = '';
  if (target === 'chatgpt') {
    // ChatGPT web allows prefilled query param 'q'
    const encoded = encodeURIComponent(promptText);
    targetUrl = `https://chatgpt.com/?q=${encoded}`;
  } else if (target === 'gemini') {
    // Gemini web app
    targetUrl = 'https://gemini.google.com/app';
  }

  // 3. Open target URL or App
  try {
    const opened = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      // Pop-up blocked fallback: navigate current window
      window.location.href = targetUrl;
    }
  } catch (e) {
    window.location.href = targetUrl;
  }

  if (target === 'chatgpt') {
    toast('Opening ChatGPT... Paste your copied prompt if not prefilled!', { icon: '🟢' });
  } else {
    toast('Opening Gemini... Paste your copied prompt directly into chat!', { icon: '🔵' });
  }
}
