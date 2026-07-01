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
    ? `<div class="footer-msg"><p>${options.footer}</p></div>`
    : '';

  const timestamp = options.showTimestamp !== false
    ? `<p class="timestamp">Imprimé le: ${new Date().toLocaleString('fr-DZ')}</p>`
    : '';

  printWindow.document.write(`
    <html>
      <head>
        <title>${options.title}</title>
        <style>
          @page {
            size: 100mm 100mm;
            margin: 0;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 10px;
            width: 100mm;
            min-height: 100mm;
            padding: 4mm;
            color: #000;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 2mm;
            margin-bottom: 3mm;
          }
          .title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .subtitle {
            font-size: 9px;
            color: #555;
            margin-top: 1mm;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 1.2mm 0;
            border-bottom: 1px dotted #ccc;
          }
          .label {
            font-weight: 600;
            color: #333;
          }
          .value {
            color: #000;
            text-align: right;
            max-width: 55%;
          }
          .footer-msg {
            margin-top: 3mm;
            text-align: center;
            font-size: 9px;
            color: #555;
            border-top: 1px dashed #000;
            padding-top: 2mm;
          }
          .timestamp {
            text-align: center;
            font-size: 8px;
            color: #888;
            margin-top: 2mm;
          }
          @media print {
            body { padding: 4mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${options.title}</div>
          ${options.subtitle ? `<div class="subtitle">${options.subtitle}</div>` : ''}
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
