import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AuthContextType } from '@/models/ChatHubModels';

export const useAuth = (): AuthContextType => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return auth;
};