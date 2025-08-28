import React, { useEffect, useState } from 'react';
import type { TelegramUser } from '../../types/user';

// Telegram WebApp API types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          auth_date: number;
          hash: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (style: 'error' | 'success' | 'warning') => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
      };
    };
  }
}

interface TelegramLoginProps {
  onLogin: (user: TelegramUser) => void;
  onError: (error: string) => void;
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({ onLogin, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isWebApp, setIsWebApp] = useState(false);

  useEffect(() => {
    // Check if running in Telegram WebApp
    if (window.Telegram?.WebApp) {
      setIsWebApp(true);
      const tg = window.Telegram.WebApp;
      
      // Initialize Telegram WebApp
      tg.ready();
      tg.expand();
      
      // Get user data if available
      const user = tg.initDataUnsafe.user;
      if (user) {
        setTelegramUser(user);
        console.log('Telegram user detected:', user);
      }
    } else {
      console.log('Not running in Telegram WebApp - using mock data for development');
      // Mock user for development
      const mockUser: TelegramUser = {
        id: 123456789,
        first_name: "Demo",
        last_name: "User",
        username: "demouser",
        language_code: "en"
      };
      setTelegramUser(mockUser);
    }
  }, []);

  const handleLogin = async () => {
    if (!telegramUser) {
      onError('No Telegram user data available');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call to verify user
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Haptic feedback if available
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
      
      onLogin(telegramUser);
    } catch (error) {
      onError('Failed to authenticate with Telegram');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser: TelegramUser = {
      id: Date.now(),
      first_name: "Demo",
      last_name: "Player",
      username: "demo_player",
      language_code: "en"
    };
    onLogin(demoUser);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '24px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      border: '1px solid rgba(6, 182, 212, 0.2)',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #0088cc, #006bb3)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          fontSize: '32px'
        }}>
          📱
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '8px',
          background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Connect with Telegram
        </h2>
        <p style={{
          color: '#d1d5db',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          {isWebApp 
            ? 'Continue with your Telegram account to start playing IM FIIT'
            : 'Demo mode - Login to start playing IM FIIT'
          }
        </p>
      </div>

      {telegramUser && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              {telegramUser.first_name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>
                {telegramUser.first_name} {telegramUser.last_name || ''}
              </div>
              {telegramUser.username && (
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                  @{telegramUser.username}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={isLoading || !telegramUser}
        style={{
          width: '100%',
          background: isLoading 
            ? 'rgba(6, 182, 212, 0.5)' 
            : 'linear-gradient(to right, #0891b2, #1d4ed8)',
          padding: '16px',
          borderRadius: '12px',
          border: 'none',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(6, 182, 212, 0.3)';
          }
        }}
        onMouseOut={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isLoading ? (
          <>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Connecting...
          </>
        ) : (
          <>
            🚀 Start Playing
          </>
        )}
      </button>

      {!isWebApp && (
        <button
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          🎮 Quick Demo Login
        </button>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TelegramLogin;