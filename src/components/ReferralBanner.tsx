import { useState } from 'react';
import { Gift, Copy, Check, Users, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReferralBannerProps {
  referralCode?: string;
  onSignUpClick?: () => void;
  isLoggedIn: boolean;
}

export default function ReferralBanner({ referralCode, onSignUpClick, isLoggedIn }: ReferralBannerProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const referralLink = referralCode
    ? `${window.location.origin}?ref=${referralCode}`
    : '';

  function handleCopy() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareOnTwitter() {
    const text = encodeURIComponent(
      `Join me on GHETTO FINANCE - the decentralized P2P marketplace with escrow protection! Get bonus GHETTO tokens when you sign up:`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, '_blank');
  }

  function shareOnWhatsApp() {
    const text = encodeURIComponent(
      `Join me on GHETTO FINANCE - the decentralized P2P marketplace! Get bonus tokens: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  function shareOnTelegram() {
    const text = encodeURIComponent(
      `Join me on GHETTO FINANCE - decentralized P2P marketplace with escrow!`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  }

  if (!isLoggedIn) {
    return (
      <section className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-black/60 to-amber-950/40 p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Gift className="w-8 h-8 text-black" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                {t('referral.earnTitle', 'Earn 250 GHETTO Tokens')}
              </h3>
              <p className="text-gray-300 text-sm md:text-base">
                {t('referral.earnDesc', 'Sign up and complete your profile to earn free tokens. Invite friends and earn 50 GHETTO for each one who joins!')}
              </p>
            </div>
            <button
              onClick={onSignUpClick}
              className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
            >
              {t('referral.signUpNow', 'Sign Up Now')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!referralCode) return null;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-black/60 to-amber-950/40 p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-amber-400" />
            <h3 className="text-lg md:text-xl font-bold text-white">
              {t('referral.inviteTitle', 'Invite Friends, Earn Crypto')}
            </h3>
          </div>
          <p className="text-gray-300 text-sm mb-5">
            {t('referral.inviteDesc', 'Share your link and earn 50 GHETTO tokens for every friend who joins the marketplace.')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5">
              <span className="text-sm text-gray-300 truncate flex-1 font-mono">
                {referralLink}
              </span>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-1.5 rounded-md hover:bg-white/10 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={shareOnTwitter}
                className="px-3 py-2.5 bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/20 transition-colors text-xs font-medium"
              >
                Twitter
              </button>
              <button
                onClick={shareOnWhatsApp}
                className="px-3 py-2.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] rounded-lg hover:bg-[#25D366]/20 transition-colors text-xs font-medium"
              >
                WhatsApp
              </button>
              <button
                onClick={shareOnTelegram}
                className="px-3 py-2.5 bg-[#0088cc]/10 border border-[#0088cc]/30 text-[#0088cc] rounded-lg hover:bg-[#0088cc]/20 transition-colors text-xs font-medium"
              >
                Telegram
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
