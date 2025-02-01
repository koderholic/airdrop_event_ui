import { useAccount, useConnect, useSignTypedData } from 'wagmi';
import { Button, Space } from 'antd';
import { useEffect } from 'react';
import api from '../lib/axios';
import useLogout from '../hooks/useLogout';

export function NavBar() {
  const { address, status } = useAccount();
  const { connectors, connect } = useConnect();
  const { signTypedDataAsync } = useSignTypedData();
  const { handleLogout } = useLogout();

  useEffect(() => {
    const connectWallet = async () => {
      if (address) {
        const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
        
        const message = {
          walletAddress: address,
          timestamp: timestamp,
        };

        const domain = {
            name: 'Avalanche Airdrop App',
            version: '1',
            chainId: 1, 
          };
        
        const types = {
            SignIn: [
                { name: 'walletAddress', type: 'address' },
                { name: 'timestamp', type: 'uint256' },
            ],
        };
        // Request signature
        const signature = await signTypedDataAsync({
            domain,
            types,
            primaryType: 'SignIn',
            message,
        });

        // Call login endpoint with address, signature, and metadata
        await api.post('/auth/login', {
            walletAddress: address,
            signature,
            timestamp,
        });
        
      }
    };

    connectWallet();
  }, [address]);
  

  const handleConnect = async (connector: any) => {
    try {
      connect({ connector });
    } catch (error) {
      console.error('Connection error:', error);
      handleLogout(); // Disconnect if signature or login fails
    }
  };

  return (
    <div style={{ 
      padding: '1rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderBottom: '1px solid #eaeaea'
    }}>
      <h1>Airdrop App</h1>
      <Space>
        {status === 'connected' ? (
          <>
            <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <Button onClick={() => handleLogout(true)}>Disconnect</Button>
          </>
        ) : (
          connectors.map((connector) => (
            connector.id === 'injected' && (
              <Button
                key={connector.uid}
                onClick={() => handleConnect(connector)}
                type="primary"
              >
                Connect Wallet
              </Button>
            )
          ))
        )}
      </Space>
    </div>
  );
} 