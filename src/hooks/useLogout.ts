import { useDisconnect } from 'wagmi';
import api from '../lib/axios';

const useLogout = () => {
  const { disconnect } = useDisconnect();
  
  const handleLogout = async (disconnectWallet: boolean = true) => {
    try {
      await api.post('/auth/logout');
      if (disconnectWallet) {
        disconnect();
      }
    } catch (error) {
      console.error('Logout error:', error);
      if (disconnectWallet) {
        disconnect(); // Still disconnect wallet even if logout API fails
      }
    }
  };

  return { handleLogout };
};

export default useLogout; 