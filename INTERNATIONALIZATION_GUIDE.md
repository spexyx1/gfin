# Internationalization (i18n) Guide

## Overview

GHETTO FINANCE now supports **70 languages** with a comprehensive internationalization system. Users can select their preferred language from the settings panel, and the choice persists across devices when logged in.

## Features

- **70 Supported Languages**: Comprehensive global coverage including major world languages
- **RTL Support**: Full right-to-left layout support for Arabic, Hebrew, Urdu, Persian, Kurdish, and Pashto
- **Auto-Generated Translations**: Machine-translated placeholder files for all languages (requires review for production)
- **Persistent Preferences**: Language choice saved to database and synced across devices
- **Smart Fallbacks**: Falls back to browser language → localStorage → English
- **Dynamic Loading**: Language files loaded on-demand to optimize bundle size

## Supported Languages (70 Total)

### European Languages (21)
English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Czech, Romanian, Swedish, Danish, Norwegian, Finnish, Greek, Turkish, Russian, Ukrainian, Bulgarian, Serbian, Croatian

### Middle Eastern & Central Asian (7)
Arabic (RTL), Hebrew (RTL), Urdu (RTL), Persian (RTL), Kurdish (RTL), Pashto (RTL), Azerbaijani

### South Asian (7)
Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi

### East Asian (5)
Chinese (Simplified), Chinese (Traditional), Japanese, Korean, Vietnamese

### Southeast Asian (5)
Thai, Indonesian, Malay, Filipino, Khmer

### African (6)
Swahili, Amharic, Hausa, Yoruba, Zulu, Afrikaans

### Other (19)
Somali, Lao, Burmese, Nepali, Sinhala, Kazakh, Uzbek, Georgian, Armenian, Albanian, Macedonian, Slovak, Slovenian, Lithuanian, Latvian, Estonian, Icelandic, Maltese, Irish, Welsh, Basque, Catalan

## How to Use

### For Users

1. Navigate to **Dashboard → Settings**
2. Find the **Language & Region** section at the top
3. Click **Select Language**
4. Search or scroll to find your language
5. Click on your preferred language
6. The interface will immediately update

### For Developers

#### Using Translations in Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

#### Translation Keys Structure

Translation keys are organized by namespace:

```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel"
  },
  "auth": {
    "login": "Login",
    "signup": "Create Account"
  },
  "dashboard": {
    "title": "Dashboard",
    "overview": "Overview"
  }
}
```

#### Adding New Translation Keys

1. Add the key to `/src/i18n/locales/en.json` (master file)
2. Run the translation generation script:
   ```bash
   node scripts/generate-translations.js
   ```
3. This will add the English text to all 69 other language files
4. For production, replace auto-generated translations with professional translations

## RTL (Right-to-Left) Support

The following languages automatically trigger RTL layout:
- Arabic (ar)
- Hebrew (he)
- Urdu (ur)
- Persian (fa)
- Kurdish (ku)
- Pashto (ps)

When an RTL language is selected:
- `document.documentElement.dir` is set to `'rtl'`
- CSS automatically mirrors the layout
- Navigation, forms, and all UI elements flip horizontally

## Database Schema

Language preference is stored in the `profiles` table:

```sql
ALTER TABLE profiles
ADD COLUMN preferred_language text DEFAULT 'en';
```

This enables:
- Cross-device synchronization
- Analytics on language usage
- Persistent preferences for authenticated users

## File Structure

```
src/
├── i18n/
│   ├── index.ts                 # i18n initialization
│   ├── languages.ts             # Language definitions
│   └── locales/
│       ├── en.json              # English (master)
│       ├── es.json              # Spanish
│       ├── fr.json              # French
│       └── ... (70 total files)
├── contexts/
│   └── LanguageContext.tsx      # Language state management
└── components/
    └── LanguageSelector.tsx     # Language picker UI

scripts/
└── generate-translations.js     # Auto-translation generator
```

## Translation Priority

1. **User's Database Preference** (if logged in)
2. **localStorage** (`i18nextLng` key)
3. **Browser Language** (from `navigator.language`)
4. **English (Fallback)**

## Best Practices

### 1. Always Use Translation Keys
❌ **Bad:**
```typescript
<button>Save Changes</button>
```

✅ **Good:**
```typescript
<button>{t('settings.saveChanges')}</button>
```

### 2. Keep Keys Organized
Use dot notation to namespace translations:
- `common.*` - Shared across all pages
- `auth.*` - Authentication related
- `dashboard.*` - Dashboard specific
- `errors.*` - Error messages
- `validation.*` - Form validation

### 3. Don't Translate User-Generated Content
Only translate UI elements, not:
- Product titles
- Product descriptions
- User messages
- User profiles/bios
- Comments/posts

### 4. Handle Pluralization
Use i18next's pluralization feature for dynamic counts:
```typescript
{t('items', { count: 5 })} // "5 items"
{t('items', { count: 1 })} // "1 item"
```

### 5. Test with Long Translations
German and Finnish often have very long words. Ensure your UI doesn't break:
- Use `truncate` or `overflow-ellipsis` where needed
- Test buttons and navigation with long text
- Allow text wrapping in content areas

## Localization Beyond Text

### Dates
Use `date-fns` with locale support:
```typescript
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

format(new Date(), 'PPP', { locale: de })
```

### Numbers
Use `Intl.NumberFormat` for locale-specific number formatting:
```typescript
new Intl.NumberFormat('de-DE').format(1234.56) // "1.234,56"
new Intl.NumberFormat('en-US').format(1234.56) // "1,234.56"
```

### Currency
Use `Intl.NumberFormat` with currency:
```typescript
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(99.99)
```

## Performance Considerations

- **Lazy Loading**: Language files are loaded on-demand
- **Code Splitting**: Each locale file is a separate chunk
- **Caching**: Loaded translations are cached in memory
- **Bundle Size**: Base bundle includes only English

## Production Checklist

Before going live with multiple languages:

- [ ] Review all auto-generated translations
- [ ] Hire native speakers for critical languages
- [ ] Test all RTL languages thoroughly
- [ ] Verify all UI components support long text
- [ ] Test date/number formatting for each locale
- [ ] Ensure error messages are translated
- [ ] Test keyboard navigation in RTL mode
- [ ] Verify mobile experience in all languages
- [ ] Check accessibility with screen readers
- [ ] Document any language-specific quirks

## API for Translation Services

To replace auto-generated translations with professional ones, integrate a translation API:

### Supported Services
- **Google Translate API**: Best for quick, automated translations
- **DeepL API**: Higher quality, supports fewer languages
- **Microsoft Translator**: Good balance of quality and coverage
- **LibreTranslate**: Open-source, self-hosted option

### Example Integration
```javascript
// In generate-translations.js
const translateText = async (text, targetLanguage) => {
  const response = await fetch('https://api-endpoint', {
    method: 'POST',
    body: JSON.stringify({ text, target: targetLanguage }),
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  return response.json();
};
```

## Troubleshooting

### Language Not Updating
1. Check browser console for errors
2. Clear localStorage: `localStorage.removeItem('i18nextLng')`
3. Verify language file exists in `/src/i18n/locales/`
4. Check database `preferred_language` column

### RTL Layout Issues
1. Verify `document.documentElement.dir` is set
2. Check CSS logical properties are used
3. Test with browser DevTools RTL emulation
4. Look for hardcoded `left`/`right` CSS properties

### Missing Translations
1. Check if key exists in `en.json`
2. Verify translation file was generated
3. Look for console warnings from i18next
4. Use fallback: `t('key', 'Default Text')`

## Future Enhancements

- [ ] Add language auto-detection based on IP geolocation
- [ ] Implement translation crowdsourcing for community corrections
- [ ] Add dialect support (e.g., Brazilian Portuguese vs European Portuguese)
- [ ] Create translation management dashboard for admins
- [ ] Add voice input in multiple languages
- [ ] Integrate professional translation review workflow

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [RTL Styling Guide](https://rtlstyling.com/)
- [CLDR - Unicode Locale Data](https://cldr.unicode.org/)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

## Support

For translation issues or to contribute translations, please:
1. Check existing issues in the repository
2. Test with the English (en) locale first
3. Provide the language code and specific key
4. Include screenshots if it's a UI issue

---

**Status**: ✅ Core system implemented, placeholder translations generated
**Next Steps**: Professional translation review and quality assurance
