const escapeCsvCell = value => {
  const text = value == null ? '' : String(value);
  const startsWithFormula = /^[\t\r ]*[=+@]/.test(text)
    || (/^[\t\r ]*-/.test(text) && !/^[\t\r ]*-\d+(?:\.\d+)?$/.test(text));
  const safeText = startsWithFormula ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

export const createCsvContent = rows => `\uFEFF${rows
  .map(row => row.map(escapeCsvCell).join(','))
  .join('\r\n')}`;

export const downloadCsv = (filename, rows) => {
  const blob = new Blob([createCsvContent(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
};
