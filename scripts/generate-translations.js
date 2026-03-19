import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'cs', name: 'Czech' },
  { code: 'ro', name: 'Romanian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'el', name: 'Greek' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ru', name: 'Russian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'he', name: 'Hebrew' },
  { code: 'ur', name: 'Urdu' },
  { code: 'fa', name: 'Persian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'tl', name: 'Filipino' },
  { code: 'sw', name: 'Swahili' },
  { code: 'am', name: 'Amharic' },
  { code: 'ha', name: 'Hausa' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'so', name: 'Somali' },
  { code: 'km', name: 'Khmer' },
  { code: 'lo', name: 'Lao' },
  { code: 'my', name: 'Burmese' },
  { code: 'ne', name: 'Nepali' },
  { code: 'si', name: 'Sinhala' },
  { code: 'ps', name: 'Pashto' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'ka', name: 'Georgian' },
  { code: 'hy', name: 'Armenian' },
  { code: 'sq', name: 'Albanian' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'et', name: 'Estonian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'mt', name: 'Maltese' },
  { code: 'ga', name: 'Irish' },
  { code: 'cy', name: 'Welsh' },
  { code: 'eu', name: 'Basque' },
  { code: 'ca', name: 'Catalan' }
];

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const enFilePath = path.join(localesDir, 'en.json');

if (!fs.existsSync(enFilePath)) {
  console.error('English translation file not found at:', enFilePath);
  process.exit(1);
}

const englishTranslations = JSON.parse(fs.readFileSync(enFilePath, 'utf8'));

console.log('Generating translation files for 69 languages...');
console.log('Note: These are placeholder files. For production use, integrate with a translation API like Google Translate, DeepL, or LibreTranslate.\n');

let generatedCount = 0;

for (const lang of SUPPORTED_LANGUAGES) {
  const outputPath = path.join(localesDir, `${lang.code}.json`);

  const translationFile = {
    _meta: {
      language: lang.name,
      code: lang.code,
      note: "This file was auto-generated and contains placeholder translations. Please review and update with proper translations for production use.",
      generatedAt: new Date().toISOString()
    },
    ...englishTranslations
  };

  fs.writeFileSync(outputPath, JSON.stringify(translationFile, null, 2), 'utf8');
  generatedCount++;
  console.log(`✓ Generated ${lang.name} (${lang.code})`);
}

console.log(`\n✓ Successfully generated ${generatedCount} translation files!`);
console.log('\nNext steps:');
console.log('1. Integrate with a translation API for actual translations');
console.log('2. Review and refine machine-translated content');
console.log('3. Have native speakers verify critical translations');
console.log('4. Update the i18n config to load all language files');
