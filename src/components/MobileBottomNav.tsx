import React from 'react';
import { Home, ShoppingCart, Wallet, MessageCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobileBottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  cartItemCount?: number;
  unreadMessages?: number;
}

export function MobileBottomNav({ activeView, onNavigate, cartItemCount = 0, unreadMessages = 0 }: MobileBottomNavProps) {
  const { t } = useTranslation();
  const navItems = [
    { id: 'home', icon: Home, label: t('nav.home') },
    { id: 'cart', icon: ShoppingCart, label: t('nav.cart'), badge: cartItemCount },
    { id: 'wallet', icon: Wallet, label: t('nav.wallet') },
    { id: 'messages', icon: MessageCircle, label: t('nav.messages'), badge: unreadMessages },
    { id: 'profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 luxe-glass-strong border-t border-white/20 ios-safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-lg transition-all ${
                isActive
                  ? 'luxe-text-accent luxe-glow-gold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-luxe-green text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'luxe-text-accent' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
