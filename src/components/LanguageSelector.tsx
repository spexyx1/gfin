import { useState } from 'react';
import { Globe, Check, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';

export function LanguageSelector() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const currentLang = languages.find(l => l.code === currentLanguage);

  const filteredLanguages = languages.filter(lang =>
    lang.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) {
      setIsOpen(false);
      return;
    }

    try {
      setIsChanging(true);
      await changeLanguage(languageCode);
      setIsOpen(false);
      setSearchQuery('');
    } catch (error) {
      logger.error('Failed to change language', 'LanguageSelector', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-white font-medium">{t('settings.languageRegion')}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {t('settings.currentLanguage')}: {currentLang?.nativeName} - {currentLang?.englishName}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-all duration-200"
        >
          <span className="text-cyan-400">{t('settings.selectLanguage')}</span>
        </button>
      </div>

      {isOpen && (
        <div className="luxe-glass-strong border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('settings.searchLanguages')}
                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isChanging}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors ${
                  lang.code === currentLanguage ? 'bg-cyan-500/10' : ''
                } ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div>
                    <div className="text-white font-medium">{lang.nativeName}</div>
                    <div className="text-sm text-gray-400">{lang.englishName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lang.direction === 'rtl' && (
                    <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                      RTL
                    </span>
                  )}
                  {lang.code === currentLanguage && (
                    <Check className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              {t('search.noResults')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
