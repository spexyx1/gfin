import { useEffect } from 'react';
import { getAppKit } from '../config/reownConfig';

interface ReownProviderProps {
  children: React.ReactNode;
}

export const ReownProvider = ({ children }: ReownProviderProps) => {
  useEffect(() => {
    getAppKit();
  }, []);

  return <>{children}</>;
};
