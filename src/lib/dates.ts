export function toBrazilianDate(value?: string) {
  if (!value) return '';
  const text = String(value);
  const iso = text.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  }
  return text;
}

export function dateParamToIso(value?: string) {
  if (!value) return '';
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text.slice(0, 10))) return text.slice(0, 10);
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return text;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}
