export interface PrintField {
  label: string;
  value: string | number;
}

export interface PrintOptions {
  title: string;
  subtitle?: string;
  fields: PrintField[];
  footer?: string;
  showTimestamp?: boolean;
}

export function printDocument(options: PrintOptions) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.warn('Print window was blocked by the browser');
    return;
  }

  const rows = options.fields
    .map(
      (field) => `
        <div class="row">
          <span class="label">${field.label}</span>
          <span class="value">${field.value}</span>
        </div>
      `
    )
    .join('');

  const footer = options.footer
    ? `<div class="footer"><p>${options.footer}</p></div>`
    : '';

  const timestamp = options.showTimestamp !== false
    ? `<p class="timestamp">Printed on ${new Date().toLocaleString()}</p>`
    : '';

  printWindow.document.write(`
    <html>
      <head>
        <title>${options.title}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            padding: 24px;
            max-width: 600px;
            margin: 0 auto;
            color: #1f2937;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #111827;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            color: #111827;
          }
          .subtitle {
            font-size: 14px;
            color: #6b7280;
            margin: 4px 0 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .label {
            font-weight: 600;
            color: #374151;
          }
          .value {
            color: #111827;
            text-align: right;
            max-width: 60%;
          }
          .footer {
            margin-top: 32px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 16px;
          }
          .timestamp {
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            margin-top: 24px;
          }
          @media print {
            body { padding: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">${options.title}</p>
          ${options.subtitle ? `<p class="subtitle">${options.subtitle}</p>` : ''}
        </div>
        ${rows}
        ${footer}
        ${timestamp}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
