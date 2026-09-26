import toast from 'react-hot-toast';

/**
 * Exports prompt text as a downloadable .txt file.
 */
export function exportPromptAsTxt(
  promptText: string,
  subject: string,
  chapter: string
): void {
  try {
    const filename = `Rankify_CBSE_${subject}_${chapter.replace(/[^a-zA-Z0-9]/g, '_')}_Study_Prompt.txt`;
    const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Prompt exported as TXT 📄', { duration: 2500 });
  } catch {
    toast.error('Failed to export TXT file');
  }
}

/**
 * Exports prompt as a printable/PDF format via print document preview.
 */
export function exportPromptAsPdf(
  promptText: string,
  subject: string,
  chapter: string,
  qualityScore: string = 'Excellent'
): void {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export printable PDF');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rankify CBSE Class 12 - ${subject} (${chapter})</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 40px;
              color: #1e293b;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 2px solid #7c3aed;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #5b21b6;
              margin: 0;
            }
            .meta {
              font-size: 13px;
              color: #64748b;
              margin-top: 6px;
            }
            .badge {
              display: inline-block;
              background: #ede9fe;
              color: #6d28d9;
              padding: 3px 10px;
              border-radius: 9999px;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              margin-right: 8px;
            }
            .content {
              white-space: pre-wrap;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 13px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 24px;
              line-height: 1.7;
            }
            .footer {
              margin-top: 32px;
              font-size: 11px;
              color: #94a3b8;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Rankify AI • CBSE Class 12 Study Prompt</h1>
            <div class="meta">
              <span class="badge">${subject}</span>
              <span class="badge">${chapter}</span>
              <span class="badge">Quality: ${qualityScore}</span>
              <span>Generated on ${new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <div class="content">${promptText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <div class="footer">
            Generated with Rankify AI Personal Study Coach • Designed for CBSE Board Examination Mastery
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    toast.success('Print / Save as PDF opened 🖨️', { duration: 2500 });
  } catch {
    toast.error('Unable to open printable view');
  }
}
