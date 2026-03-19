import { useState } from 'react';
import { Globe, Check, Search, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export function FooterLanguageSelector() {
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
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1.5 group"
        title={`${t('settings.currentLanguage')}: ${currentLang?.nativeName}`}
      >
        <Globe
          className="w-3 h-3 text-gray-300 group-hover:text-white transition-colors"
          style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}}
        />
        <span className="font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-gray-200 transition-all">
          {currentLang?.code.toUpperCase()}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4 z-[101]"
            >
              <div className="luxe-glass-strong border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-cyan-400" style={{filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.5))'}} />
                    <div>
                      <h3 className="text-white font-bold">{t('settings.languageRegion')}</h3>
                      <p className="text-xs text-gray-400">
                        {languages.length} {t('settings.languagesAvailable') || 'languages'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="p-4 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('settings.searchLanguages')}
                      className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
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
                          <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded">
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

                {isChanging && (
                  <div className="p-4 border-t border-white/10 bg-cyan-500/5">
                    <div className="flex items-center justify-center gap-2 text-cyan-400">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">{t('common.loading') || 'Changing language...'}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
