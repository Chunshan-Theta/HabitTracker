export const locales = ["zh-TW", "en-US"] as const;
export const defaultLocale = "zh-TW";
export type Locale = (typeof locales)[number];
