import React, { useState, useEffect } from 'react';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  onError: (error: string) => void;
  isConnected?: boolean;
  address?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  onError,
  isConnected = false,
  address
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is already connected
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          onConnect(accounts[0]);
          setWalletType('MetaMask');
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      onError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        onConnect(accounts[0]);
        setWalletType('MetaMask');
        
        // Haptic feedback if available
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      }
    } catch (error: any) {
      if (error.code === 4001) {
        onError('Please connect to MetaMask.');
      } else {
        onError('Failed to connect to MetaMask');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWalletConnect = async () => {
    // For now, show as coming soon
    onError('WalletConnect integration coming soon!');
  };

  const connectTrustWallet = async () => {
    // Trust Wallet uses the same interface as MetaMask
    if (!window.ethereum) {
      onError('Trust Wallet is not detected. Please open this in Trust Wallet browser.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        onConnect(accounts[0]);
        setWalletType('Trust Wallet');
      }
    } catch (error) {
      onError('Failed to connect to Trust Wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setWalletType(null);
    
    // Haptic feedback if available
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div style={{
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            fontSize: '24px'
          }}>
            ✅
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#10b981'
          }}>
            Wallet Connected
          </h3>
          <p style={{
            color: '#d1d5db',
            fontSize: '14px'
          }}>
            {walletType} • {formatAddress(address)}
          </p>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ color: '#d1d5db', fontSize: '14px' }}>Status:</span>
            <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>Ready to Play</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#d1d5db', fontSize: '14px' }}>Network:</span>
            <span style={{ color: '#06b6d4', fontSize: '14px', fontWeight: '600' }}>Ethereum</span>
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
          }}
        >
          Disconnect Wallet
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #8b5cf6, #db2777)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          fontSize: '24px'
        }}>
          💰
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '8px',
          background: 'linear-gradient(to right, #8b5cf6, #db2777)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Connect Wallet
        </h2>
        <p style={{
          color: '#d1d5db',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          Connect your crypto wallet to place bets and earn rewards
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={connectMetaMask}
          disabled={isConnecting}
          style={{
            width: '100%',
            background: 'linear-gradient(to right, #f6851b, #e2761b)',
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            opacity: isConnecting ? 0.7 : 1
          }}
          onMouseOver={(e) => {
            if (!isConnecting) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(246, 133, 27, 0.3)';
            }
          }}
          onMouseOut={(e) => {
            if (!isConnecting) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            background: 'white',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🦊
          </div>
          {isConnecting ? 'Connecting...' : 'MetaMask'}
        </button>

        <button
          onClick={connectTrustWallet}
          disabled={isConnecting}
          style={{
            width: '100%',
            background: 'linear-gradient(to right, #3375bb, #1e3a8a)',
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            opacity: isConnecting ? 0.7 : 1
          }}
          onMouseOver={(e) => {
            if (!isConnecting) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(51, 117, 187, 0.3)';
            }
          }}
          onMouseOut={(e) => {
            if (!isConnecting) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            background: 'white',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🛡️
          </div>
          Trust Wallet
        </button>

        <button
          onClick={connectWalletConnect}
          disabled={isConnecting}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #3b99fc, #9c44ff)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}>
            🔗
          </div>
          WalletConnect
        </button>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <div style={{ fontSize: '16px' }}>ℹ️</div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#60a5fa' }}>
            Why connect a wallet?
          </span>
        </div>
        <ul style={{
          fontSize: '12px',
          color: '#d1d5db',
          lineHeight: '1.4',
          paddingLeft: '16px',
          margin: 0
        }}>
          <li>Place bets in PvP battles</li>
          <li>Earn crypto rewards for winning</li>
          <li>Participate in tournaments</li>
          <li>Secure ownership of your achievements</li>
        </ul>
      </div>
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      selectedAddress: string | null;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export default WalletConnect;