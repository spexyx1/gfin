import { useState, useCallback } from 'react';

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
  | 'reportListing';

interface ModalState {
  [key: string]: boolean;
}

interface ModalData {
  [key: string]: any;
}

export function useModalManager() {
  const [modals, setModals] = useState<ModalState>({});
  const [modalData, setModalData] = useState<ModalData>({});

  const openModal = useCallback((name: ModalName, data?: any) => {
    setModals(prev => ({ ...prev, [name]: true }));
    if (data !== undefined) {
      setModalData(prev => ({ ...prev, [name]: data }));
    }
  }, []);

  const closeModal = useCallback((name: ModalName) => {
    setModals(prev => ({ ...prev, [name]: false }));
    setModalData(prev => {
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const toggleModal = useCallback((name: ModalName) => {
    setModals(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const isOpen = useCallback((name: ModalName) => {
    return modals[name] || false;
  }, [modals]);

  const getData = useCallback((name: ModalName) => {
    return modalData[name];
  }, [modalData]);

  const closeAll = useCallback(() => {
    setModals({});
    setModalData({});
  }, []);

  return {
    openModal,
    closeModal,
    toggleModal,
    isOpen,
    getData,
    closeAll,
  };
}
