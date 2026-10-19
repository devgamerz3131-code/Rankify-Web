import toast from 'react-hot-toast';
import { downloadBlobSafe } from '@/utils/browser-compat';

/**
 * Exports the generated prompt as a clean .txt file download.
 */
export function exportPromptAsTxt(
  promptText: string,
  subject: string,
  chapter: string
): void {
  const safeChapter = chapter.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Rankify_CBSE_${subject}_${safeChapter}_Prompt.txt`;

  const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
  const ok = downloadBlobSafe(blob, filename);
  if (ok) {
    toast.success(`Saved as ${filename}`);
  } else {
    toast.error('Download could not be started on this device.');
  }
}

/**
 * Exports / prints the generated prompt as a formatted PDF study sheet
 * using an in-page print frame so it works on iOS/Android PWAs and browsers
 * without requiring popups.
 */
export function exportPromptAsPdf(
  promptText: string,
  subject: string,
  chapter: string,
  qualityScore: string = 'Excellent'
): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  try {
    const existingFrame = document.getElementById('rankify-print-frame');
    if (existingFrame && existingFrame.parentNode) {
      existingFrame.parentNode.removeChild(existingFrame);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'rankify-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const escapedText = promptText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Rankify Study Prompt - ${subject} (${chapter})</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.65;
              color: #0f172a;
              padding: 32px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 2px solid #7c3aed;
              padding-bottom: 14px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .brand {
              font-size: 20px;
              font-weight: 800;
              color: #7c3aed;
            }
            .meta {
              font-size: 12px;
              color: #64748b;
            }
            .badge {
              display: inline-block;
              background: #f3e8ff;
              color: #6d28d9;
              padding: 4px 10px;
              border-radius: 999px;
              font-size: 12px;
              font-weight: 600;
              margin-right: 8px;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              font-family: 'Inter', sans-serif;
              font-size: 14px;
              line-height: 1.7;
            }
            .footer {
              margin-top: 32px;
              font-size: 11px;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">Rankify AI — CBSE Class 12 PCM Study Sheet</div>
            <div class="meta">${new Date().toLocaleDateString()}</div>
          </div>
          <div style="margin-bottom: 16px;">
            <span class="badge">Subject: ${subject}</span>
            <span class="badge">Chapter: ${chapter}</span>
            <span class="badge">Prompt Quality: ${qualityScore}</span>
          </div>
          <pre>${escapedText}</pre>
          <div class="footer">
            Rankify — Precision Learning for CBSE Students
          </div>
        </body>
      </html>
    `;

    const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!frameDoc || !iframe.contentWindow) {
      exportPromptAsTxt(promptText, subject, chapter);
      return;
    }

    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    window.setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        exportPromptAsTxt(promptText, subject, chapter);
      } finally {
        window.setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 5000);
      }
    }, 250);
  } catch {
    exportPromptAsTxt(promptText, subject, chapter);
  }
}
