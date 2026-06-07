export const getAdminIntlLocale = (language: string) => (
  language.startsWith('vi') ? 'vi-VN' : 'en-US'
);

export const formatAdminNumber = (value: number, language: string) => (
  new Intl.NumberFormat(getAdminIntlLocale(language)).format(value)
);

export const formatAdminCurrency = (value: number, language: string) => (
  new Intl.NumberFormat(getAdminIntlLocale(language), {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
);

export const formatAdminCompactNumber = (value: number, language: string) => (
  new Intl.NumberFormat(getAdminIntlLocale(language), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
);

export const compareAdminText = (left: string, right: string, language: string) => (
  left.localeCompare(right, getAdminIntlLocale(language))
);

export const formatAdminMonthShort = (value: Date, language: string) => (
  value.toLocaleString(getAdminIntlLocale(language), { month: 'short' })
);
