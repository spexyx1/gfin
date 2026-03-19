export interface Language {
  code: string;
  nativeName: string;
  englishName: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', direction: 'ltr' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', direction: 'ltr' },
  { code: 'fr', nativeName: 'Français', englishName: 'French', direction: 'ltr' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', direction: 'ltr' },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian', direction: 'ltr' },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese', direction: 'ltr' },
  { code: 'nl', nativeName: 'Nederlands', englishName: 'Dutch', direction: 'ltr' },
  { code: 'pl', nativeName: 'Polski', englishName: 'Polish', direction: 'ltr' },
  { code: 'cs', nativeName: 'Čeština', englishName: 'Czech', direction: 'ltr' },
  { code: 'ro', nativeName: 'Română', englishName: 'Romanian', direction: 'ltr' },
  { code: 'sv', nativeName: 'Svenska', englishName: 'Swedish', direction: 'ltr' },
  { code: 'da', nativeName: 'Dansk', englishName: 'Danish', direction: 'ltr' },
  { code: 'no', nativeName: 'Norsk', englishName: 'Norwegian', direction: 'ltr' },
  { code: 'fi', nativeName: 'Suomi', englishName: 'Finnish', direction: 'ltr' },
  { code: 'el', nativeName: 'Ελληνικά', englishName: 'Greek', direction: 'ltr' },
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish', direction: 'ltr' },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian', direction: 'ltr' },
  { code: 'uk', nativeName: 'Українська', englishName: 'Ukrainian', direction: 'ltr' },
  { code: 'bg', nativeName: 'Български', englishName: 'Bulgarian', direction: 'ltr' },
  { code: 'sr', nativeName: 'Српски', englishName: 'Serbian', direction: 'ltr' },
  { code: 'hr', nativeName: 'Hrvatski', englishName: 'Croatian', direction: 'ltr' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', direction: 'rtl' },
  { code: 'he', nativeName: 'עברית', englishName: 'Hebrew', direction: 'rtl' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', direction: 'rtl' },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Persian', direction: 'rtl' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', direction: 'ltr' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', direction: 'ltr' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', direction: 'ltr' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', direction: 'ltr' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', direction: 'ltr' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', direction: 'ltr' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', direction: 'ltr' },
  { code: 'zh', nativeName: '简体中文', englishName: 'Chinese (Simplified)', direction: 'ltr' },
  { code: 'zh-TW', nativeName: '繁體中文', englishName: 'Chinese (Traditional)', direction: 'ltr' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese', direction: 'ltr' },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean', direction: 'ltr' },
  { code: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese', direction: 'ltr' },
  { code: 'th', nativeName: 'ไทย', englishName: 'Thai', direction: 'ltr' },
  { code: 'id', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', direction: 'ltr' },
  { code: 'ms', nativeName: 'Bahasa Melayu', englishName: 'Malay', direction: 'ltr' },
  { code: 'tl', nativeName: 'Filipino', englishName: 'Filipino', direction: 'ltr' },
  { code: 'sw', nativeName: 'Kiswahili', englishName: 'Swahili', direction: 'ltr' },
  { code: 'am', nativeName: 'አማርኛ', englishName: 'Amharic', direction: 'ltr' },
  { code: 'ha', nativeName: 'Hausa', englishName: 'Hausa', direction: 'ltr' },
  { code: 'yo', nativeName: 'Yorùbá', englishName: 'Yoruba', direction: 'ltr' },
  { code: 'zu', nativeName: 'isiZulu', englishName: 'Zulu', direction: 'ltr' },
  { code: 'af', nativeName: 'Afrikaans', englishName: 'Afrikaans', direction: 'ltr' },
  { code: 'so', nativeName: 'Soomaali', englishName: 'Somali', direction: 'ltr' },
  { code: 'km', nativeName: 'ភាសាខ្មែរ', englishName: 'Khmer', direction: 'ltr' },
  { code: 'lo', nativeName: 'ລາວ', englishName: 'Lao', direction: 'ltr' },
  { code: 'my', nativeName: 'မြန်မာ', englishName: 'Burmese', direction: 'ltr' },
  { code: 'ne', nativeName: 'नेपाली', englishName: 'Nepali', direction: 'ltr' },
  { code: 'si', nativeName: 'සිංහල', englishName: 'Sinhala', direction: 'ltr' },
  { code: 'ps', nativeName: 'پښتو', englishName: 'Pashto', direction: 'rtl' },
  { code: 'ku', nativeName: 'کوردی', englishName: 'Kurdish', direction: 'rtl' },
  { code: 'az', nativeName: 'Azərbaycan', englishName: 'Azerbaijani', direction: 'ltr' },
  { code: 'kk', nativeName: 'Қазақ', englishName: 'Kazakh', direction: 'ltr' },
  { code: 'uz', nativeName: 'Oʻzbek', englishName: 'Uzbek', direction: 'ltr' },
  { code: 'ka', nativeName: 'ქართული', englishName: 'Georgian', direction: 'ltr' },
  { code: 'hy', nativeName: 'Հայերեն', englishName: 'Armenian', direction: 'ltr' },
  { code: 'sq', nativeName: 'Shqip', englishName: 'Albanian', direction: 'ltr' },
  { code: 'mk', nativeName: 'Македонски', englishName: 'Macedonian', direction: 'ltr' },
  { code: 'sk', nativeName: 'Slovenčina', englishName: 'Slovak', direction: 'ltr' },
  { code: 'sl', nativeName: 'Slovenščina', englishName: 'Slovenian', direction: 'ltr' },
  { code: 'lt', nativeName: 'Lietuvių', englishName: 'Lithuanian', direction: 'ltr' },
  { code: 'lv', nativeName: 'Latviešu', englishName: 'Latvian', direction: 'ltr' },
  { code: 'et', nativeName: 'Eesti', englishName: 'Estonian', direction: 'ltr' },
  { code: 'is', nativeName: 'Íslenska', englishName: 'Icelandic', direction: 'ltr' },
  { code: 'mt', nativeName: 'Malti', englishName: 'Maltese', direction: 'ltr' },
  { code: 'ga', nativeName: 'Gaeilge', englishName: 'Irish', direction: 'ltr' },
  { code: 'cy', nativeName: 'Cymraeg', englishName: 'Welsh', direction: 'ltr' },
  { code: 'eu', nativeName: 'Euskara', englishName: 'Basque', direction: 'ltr' },
  { code: 'ca', nativeName: 'Català', englishName: 'Catalan', direction: 'ltr' },
];

export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const isRTLLanguage = (code: string): boolean => {
  const language = getLanguageByCode(code);
  return language?.direction === 'rtl';
};
