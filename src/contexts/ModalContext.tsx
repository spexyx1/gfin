import React, { createContext, useContext, useState, useCallback } from 'react';

export type ModalName =
  | 'auth'
  | 'userProfile'
  | 'cart'
  | 'buyNow'
  | 'makeOffer'
  | 'messages'
  | 'orders'
  | 'sellerDashboard'
  | 'wallet'
  | 'siteMaster'
  | 'profileSetup'
  | 'socialHub'
  | 'faq'
  | 'legal'
  | 'contact'
  | 'security'
  | 'advancedSearch'
  | 'reportListing'
  | 'securityAudit'
  | 'documentation'
  | 'prohibitedItems';

interface ModalContextType {
  openModal: (name: ModalName, data?: unknown) => void;
  closeModal: (name: ModalName) => void;
  toggleModal: (name: ModalName) => void;
  closeAll: () => void;
  isOpen: (name: ModalName) => boolean;
  getData: <T = unknown>(name: ModalName) => T | undefined;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  }
  const [modals, setModals] = useState<Record<string, boolean>>({});
  const [modalData, setModalData] = useState<Record<string, unknown>>({});

  const openModal = useCallback((name: ModalName, data?: unknown) => {
    setModals(prev => ({ ...prev, [name]: true }));
    if (data !== undefined) {
      setModalData(prev => ({ ...prev, [name]: data }));
    }
  }, []);

  const closeModal = useCallback((name: ModalName) => {
    setModals(prev => ({ ...prev, [name]: false }));
    setModalData(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const toggleModal = useCallback((name: ModalName) => {
    setModals(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const closeAll = useCallback(() => {
    setModals({});
    setModalData({});
  }, []);

  const isOpen = useCallback((name: ModalName) => modals[name] ?? false, [modals]);

  const getData = useCallback(<T = unknown>(name: ModalName): T | undefined =>
    modalData[name] as T | undefined,
  [modalData]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, toggleModal, closeAll, isOpen, getData }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  }
  )
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
