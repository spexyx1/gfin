import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './components/AuthProvider.tsx';
import { CartProvider } from './contexts/CartContext.tsx';
import { ModalProvider } from './contexts/ModalContext.tsx';
import { ProductsProvider } from './contexts/ProductsContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import './i18n';
import './config/reownConfig';
import './lib/supabase.ts';
import { logEnvironmentStatus } from './utils/validateEnv';
import './index.css';

logEnvironmentStatus();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ModalProvider>
            <ProductsProvider>
              <LanguageProvider>
                <App />
              </LanguageProvider>
            </ProductsProvider>
          </ModalProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
