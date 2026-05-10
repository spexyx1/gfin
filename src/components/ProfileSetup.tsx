import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, AtSign, MapPin, Globe, Camera, Store, Palette } from 'lucide-react';
import { useSocialSystem } from '../hooks/useSocialSystem';
import { useAuth } from '../hooks/useAuth';

interface ProfileSetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSetup({ isOpen, onClose }: ProfileSetupProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    handle: '',
    displayName: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
    coverImage: '',
    storeEnabled: false,
    storeName: '',
    storeDescription: '',
    storeTheme: 'cyberpunk' as const,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { createUserProfile, updateUserProfile, getUserProfile } = useSocialSystem();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const existingProfile = getUserProfile(user.id);
      
      if (existingProfile) {
        // Update existing profile
        await updateUserProfile({
          ...formData,
          storeSettings: {
            ...existingProfile.storeSettings,
            isEnabled: formData.storeEnabled,
            storeName: formData.storeName,
            storeDescription: formData.storeDescription,
            storeTheme: formData.storeTheme,
          }
        });
      } else {
        // Create new profile
        await createUserProfile({
          ...formData,
          storeSettings: {
            isEnabled: formData.storeEnabled,
            storeName: formData.storeName,
            storeDescription: formData.storeDescription,
            storeTheme: formData.storeTheme,
            featuredProducts: [],
            storeCategories: [],
          }
        });
      }

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const validateHandle = (handle: string) => {
    const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanHandle.length < 3) return 'Handle must be at least 3 characters';
    if (cleanHandle.length > 20) return 'Handle must be less than 20 characters';
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="luxe-glass-strong rounded-3xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-black text-white uppercase">
            {step === 1 ? t('profile.editProfile') : step === 2 ? 'Store Setup' : 'Complete Setup'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:luxe-glass rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= stepNum ? 'bg-luxe-gold text-black' : 'luxe-glass text-gray-400'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-luxe-gold' : 'luxe-glass'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Basic Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-black mb-2 uppercase">@ Handle *</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => {
                      const cleanHandle = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      setFormData({ ...formData, handle: cleanHandle });
                      setError(validateHandle(cleanHandle));
                    }}
                    className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500"
                    placeholder="your_handle"
                    required
                  />
                </div>
                <p className="text-gray-500 text-sm mt-1">This will be your unique @handle for tagging</p>
              </div>

              <div>
                <label className="block text-white font-black mb-2 uppercase">Display Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500"
                    placeholder="Your display name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-black mb-2 uppercase">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500 resize-none"
                  placeholder="Tell others about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-black mb-2 uppercase">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500"
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-black mb-2 uppercase">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500"
                      placeholder="https://your-website.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Store Setup */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="storeEnabled"
                  checked={formData.storeEnabled}
                  onChange={(e) => setFormData({ ...formData, storeEnabled: e.target.checked })}
                  className="w-5 h-5 text-luxe-gold luxe-glass border-gray-600 rounded focus:ring-luxe-gold"
                />
                <label htmlFor="storeEnabled" className="text-white font-black uppercase">
                  Enable Store Page
                </label>
              </div>

              {formData.storeEnabled && (
                <>
                  <div>
                    <label className="block text-white font-black mb-2 uppercase">Store Name</label>
                    <div className="relative">
                      <Store className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500"
                        placeholder="Your store name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-black mb-2 uppercase">Store Description</label>
                    <textarea
                      value={formData.storeDescription}
                      onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500 resize-none"
                      placeholder="Describe what you sell..."
                    />
                  </div>

                  <div>
                    <label className="block text-white font-black mb-2 uppercase">Store Theme</label>
                    <div className="relative">
                      <Palette className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <select
                        value={formData.storeTheme}
                        onChange={(e) => setFormData({ ...formData, storeTheme: e.target.value as any })}
                        className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white"
                      >
                        <option value="cyberpunk">Cyberpunk</option>
                        <option value="dark">Dark</option>
                        <option value="neon">Neon</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-black text-white mb-4 uppercase">Profile Preview</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-luxe-gold rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <p className="text-white font-black">@{formData.handle}</p>
                      <p className="text-gray-400">{formData.displayName}</p>
                    </div>
                  </div>
                  {formData.bio && (
                    <p className="text-gray-300 text-sm">{formData.bio}</p>
                  )}
                  {formData.location && (
                    <p className="text-gray-400 text-sm">📍 {formData.location}</p>
                  )}
                  {formData.storeEnabled && (
                    <div className="mt-4 p-3 luxe-glass rounded-lg">
                      <p className="text-luxe-gold font-black">🏪 {formData.storeName}</p>
                      <p className="text-gray-400 text-sm">{formData.storeDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm font-bold">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 luxe-glass hover:bg-gray-600 text-white rounded-xl transition-colors font-medium"
              >
                Back
              </button>
            )}
            
            <div className="ml-auto">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!formData.handle || !formData.displayName || error)}
                  className="px-6 py-3 bg-luxe-gold hover:bg-luxe-gold/80 disabled:luxe-glass text-black rounded-xl transition-colors font-black uppercase"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-luxe-gold hover:bg-luxe-gold/80 disabled:luxe-glass text-black rounded-xl transition-colors font-black uppercase"
                >
                  {isLoading ? t('common.loading') : t('profile.editProfile')}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}