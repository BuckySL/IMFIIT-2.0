// ============================================================================
// WEB3 WALLET INTEGRATION SYSTEM
// File: src/components/web3/WalletSystem.tsx
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Coins, Gift, TrendingUp, ExternalLink, Copy, RefreshCw, Zap, Star } from 'lucide-react';

// Types
interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue: number;
  icon: string;
}

interface NFTAsset {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface Transaction {
  hash: string;
  type: 'reward' | 'battle_win' | 'workout' | 'purchase' | 'transfer';
  amount: string;
  token: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  description: string;
}

interface WalletSystemProps {
  userProfile: any;
  onBack: () => void;
}

// Mock Web3 Provider (replace with real Web3 integration)
const MockWeb3Provider = {
  async connectWallet(): Promise<{ address: string; network: string }> {
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock wallet address
    return {
      address: '0x742d35cc6634C0532925a3b8D0c9c6e3947f8000',
      network: 'polygon'
    };
  },

  async getBalance(address: string): Promise<TokenBalance[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        symbol: 'FIIT',
        name: 'IM FIIT Token',
        balance: '2450.75',
        decimals: 18,
        usdValue: 245.08,
        icon: '🏋️'
      },
      {
        symbol: 'MATIC',
        name: 'Polygon',
        balance: '12.34',
        decimals: 18,
        usdValue: 8.64,
        icon: '🔷'
      }
    ];
  },

  async getNFTs(address: string): Promise<NFTAsset[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        id: 'fiit_fighter_001',
        name: 'Elite Gym Fighter',
        description: 'A legendary fighter with maximum strength stats',
        image: '🥇',
        collection: 'FIIT Fighters',
        rarity: 'legendary',
        attributes: [
          { trait_type: 'Strength', value: '95' },
          { trait_type: 'Endurance', value: '88' },
          { trait_type: 'Rarity', value: 'Legendary' }
        ]
      },
      {
        id: 'fiit_equipment_001',
        name: 'Diamond Dumbbells',
        description: 'Rare training equipment that boosts workout rewards',
        image: '💎',
        collection: 'FIIT Equipment',
        rarity: 'epic',
        attributes: [
          { trait_type: 'Boost', value: '+25% XP' },
          { trait_type: 'Rarity', value: 'Epic' }
        ]
      }
    ];
  },

  async getTransactions(address: string): Promise<Transaction[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        hash: '0xabc123...',
        type: 'workout',
        amount: '25.5',
        token: 'FIIT',
        timestamp: new Date(Date.now() - 3600000),
        status: 'confirmed',
        description: 'Workout completion reward'
      },
      {
        hash: '0xdef456...',
        type: 'battle_win',
        amount: '50.0',
        token: 'FIIT',
        timestamp: new Date(Date.now() - 7200000),
        status: 'confirmed',
        description: 'Battle victory reward'
      },
      {
        hash: '0xghi789...',
        type: 'reward',
        amount: '100.0',
        token: 'FIIT',
        timestamp: new Date(Date.now() - 86400000),
        status: 'confirmed',
        description: 'Weekly challenge completion'
      }
    ];
  }
};

const WalletSystem: React.FC<WalletSystemProps> = ({
  userProfile,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'wallet' | 'tokens' | 'nfts' | 'transactions'>('wallet');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [nftAssets, setNftAssets] = useState<NFTAsset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalUsdValue, setTotalUsdValue] = useState(0);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('imfiit_wallet_connected');
    const savedAddress = localStorage.getItem('imfiit_wallet_address');
    
    if (savedWallet === 'true' && savedAddress) {
      setWalletConnected(true);
      setWalletAddress(savedAddress);
      setNetworkName('Polygon');
      loadWalletData(savedAddress);
    }
  }, []);

  const connectWallet = async () => {
    setConnecting(true);
    
    try {
      // In real implementation, check if MetaMask is installed
      if (!(window as any).ethereum) {
        alert('Please install MetaMask to continue');
        return;
      }

      const { address, network } = await MockWeb3Provider.connectWallet();
      
      setWalletAddress(address);
      setNetworkName(network);
      setWalletConnected(true);
      
      // Save to localStorage
      localStorage.setItem('imfiit_wallet_connected', 'true');
      localStorage.setItem('imfiit_wallet_address', address);
      
      // Load wallet data
      await loadWalletData(address);
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setNetworkName('');
    setTokenBalances([]);
    setNftAssets([]);
    setTransactions([]);
    setTotalUsdValue(0);
    
    localStorage.removeItem('imfiit_wallet_connected');
    localStorage.removeItem('imfiit_wallet_address');
  };

  const loadWalletData = async (address: string) => {
    setLoading(true);
    
    try {
      const [tokens, nfts, txs] = await Promise.all([
        MockWeb3Provider.getBalance(address),
        MockWeb3Provider.getNFTs(address),
        MockWeb3Provider.getTransactions(address)
      ]);
      
      setTokenBalances(tokens);
      setNftAssets(nfts);
      setTransactions(txs);
      
      // Calculate total USD value
      const total = tokens.reduce((sum, token) => sum + token.usdValue, 0);
      setTotalUsdValue(total);
      
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = useCallback(() => {
    navigator.clipboard.writeText(walletAddress);
    // You could add a toast notification here
    alert('Address copied to clipboard!');
  }, [walletAddress]);

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#fbbf24';
      case 'epic': return '#8b5cf6';
      case 'rare': return '#06b6d4';
      default: return '#9ca3af';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'workout': return '💪';
      case 'battle_win': return '⚔️';
      case 'reward': return '🎁';
      case 'purchase': return '🛒';
      case 'transfer': return '↔️';
      default: return '💰';
    }
  };

  const refreshData = () => {
    if (walletConnected && walletAddress) {
      loadWalletData(walletAddress);
    }
  };

  return (
    <div className="wallet-system">
      <style>{`
        .wallet-system {
          min-height: 100vh;
          background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .wallet-header {
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .back-button {
          background: none;
          border: none;
          color: #06b6d4;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          transition: color 0.3s ease;
        }

        .back-button:hover {
          color: #0891b2;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title h1 {
          font-size: 2em;
          margin: 0;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .wallet-status {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .connect-button {
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .connect-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(6, 182, 212, 0.3);
        }

        .connect-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .wallet-info {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
        }

        .wallet-address {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #d1d5db;
        }

        .copy-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          transition: color 0.3s ease;
        }

        .copy-button:hover {
          color: white;
        }

        .disconnect-button {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .disconnect-button:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0 24px;
          overflow-x: auto;
        }

        .tab-button {
          background: none;
          border: none;
          color: #9ca3af;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 2px solid transparent;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          white-space: nowrap;
        }

        .tab-button:hover {
          color: white;
        }

        .tab-button.active {
          color: #06b6d4;
          border-bottom-color: #06b6d4;
        }

        .tab-content {
          padding: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .balance-card {
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          color: white;
        }

        .balance-title {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 8px;
        }

        .balance-amount {
          font-size: 2.5em;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .balance-usd {
          font-size: 14px;
          opacity: 0.8;
        }

        .stats-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-title {
          font-size: 18px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .refresh-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          transition: all 0.3s ease;
        }

        .refresh-button:hover {
          color: white;
          transform: rotate(180deg);
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #06b6d4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .token-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .token-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .token-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .token-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .token-icon {
          font-size: 2em;
          line-height: 1;
        }

        .token-details h3 {
          font-size: 16px;
          margin: 0 0 4px 0;
        }

        .token-symbol {
          font-size: 14px;
          color: #9ca3af;
        }

        .token-balance {
          text-align: right;
        }

        .balance-amount-token {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .balance-usd-token {
          font-size: 14px;
          color: #9ca3af;
        }

        .nft-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .nft-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .nft-card:hover {
          transform: translateY(-4px);
          border-color: #06b6d4;
        }

        .nft-image {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4em;
          background: linear-gradient(135deg, #1f2937, #374151);
          position: relative;
        }

        .rarity-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .nft-content {
          padding: 20px;
        }

        .nft-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .nft-collection {
          font-size: 14px;
          color: #06b6d4;
          margin-bottom: 12px;
        }

        .nft-description {
          font-size: 14px;
          color: #d1d5db;
          line-height: 1.4;
          margin-bottom: 16px;
        }

        .nft-attributes {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .attribute-badge {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 4px 8px;
          font-size: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .transaction-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .transaction-icon {
          font-size: 1.5em;
        }

        .transaction-details h4 {
          font-size: 16px;
          margin: 0 0 4px 0;
        }

        .transaction-meta {
          font-size: 14px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-confirmed {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .status-pending {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .status-failed {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .transaction-amount {
          text-align: right;
        }

        .amount-value {
          font-size: 16px;
          font-weight: 600;
          color: #10b981;
        }

        .amount-token {
          font-size: 14px;
          color: #9ca3af;
        }

        .hash-link {
          color: #06b6d4;
          text-decoration: none;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }

        .hash-link:hover {
          text-decoration: underline;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #9ca3af;
        }

        .empty-icon {
          font-size: 4em;
          margin-bottom: 16px;
        }

        .connect-prompt {
          text-align: center;
          padding: 80px 20px;
        }

        .connect-illustration {
          font-size: 5em;
          margin-bottom: 24px;
        }

        .connect-title {
          font-size: 24px;
          margin-bottom: 12px;
        }

        .connect-description {
          color: #9ca3af;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .wallet-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }

          .nft-grid {
            grid-template-columns: 1fr;
          }

          .transaction-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .transaction-amount {
            align-self: stretch;
            text-align: left;
          }
        }
      `}</style>

      <div className="wallet-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        
        <div className="header-content">
          <div className="header-title">
            <Wallet size={32} />
            <h1>Web3 Wallet</h1>
          </div>
          
          <div className="wallet-status">
            {walletConnected ? (
              <div className="wallet-info">
                <div className="status-indicator"></div>
                <div className="wallet-address">{formatAddress(walletAddress)}</div>
                <button className="copy-button" onClick={copyAddress}>
                  <Copy size={16} />
                </button>
                <button className="disconnect-button" onClick={disconnectWallet}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                className="connect-button" 
                onClick={connectWallet}
                disabled={connecting}
              >
                <Wallet size={20} />
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>

      {walletConnected ? (
        <>
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'wallet' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallet')}
            >
              <Wallet size={20} />
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'tokens' ? 'active' : ''}`}
              onClick={() => setActiveTab('tokens')}
            >
              <Coins size={20} />
              Tokens
            </button>
            <button 
              className={`tab-button ${activeTab === 'nfts' ? 'active' : ''}`}
              onClick={() => setActiveTab('nfts')}
            >
              <Star size={20} />
              NFTs
            </button>
            <button 
              className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <TrendingUp size={20} />
              Transactions
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'wallet' && (
              <div>
                <div className="overview-grid">
                  <div className="balance-card">
                    <div className="balance-title">Total Portfolio Value</div>
                    <div className="balance-amount">${totalUsdValue.toFixed(2)}</div>
                    <div className="balance-usd">USD</div>
                  </div>

                  <div className="stats-card">
                    <div className="card-title">
                      Recent Activity
                      <button className="refresh-button" onClick={refreshData}>
                        <RefreshCw size={16} />
                      </button>
                    </div>
                    
                    {loading ? (
                      <div className="loading-spinner">
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <div>
                        <p>✨ +25.5 FIIT from workout completion</p>
                        <p>⚔️ +50.0 FIIT from battle victory</p>
                        <p>🎁 +100.0 FIIT from weekly challenge</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="stats-card">
                  <div className="card-title">Token Balances</div>
                  <div className="token-list">
                    {tokenBalances.map((token) => (
                      <div key={token.symbol} className="token-item">
                        <div className="token-info">
                          <div className="token-icon">{token.icon}</div>
                          <div className="token-details">
                            <h3>{token.name}</h3>
                            <div className="token-symbol">{token.symbol}</div>
                          </div>
                        </div>
                        <div className="token-balance">
                          <div className="balance-amount-token">{token.balance}</div>
                          <div className="balance-usd-token">${token.usdValue.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tokens' && (
              <div className="stats-card">
                <div className="card-title">
                  Token Holdings
                  <button className="refresh-button" onClick={refreshData}>
                    <RefreshCw size={16} />
                  </button>
                </div>
                
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div className="token-list">
                    {tokenBalances.map((token) => (
                      <div key={token.symbol} className="token-item">
                        <div className="token-info">
                          <div className="token-icon">{token.icon}</div>
                          <div className="token-details">
                            <h3>{token.name}</h3>
                            <div className="token-symbol">{token.symbol}</div>
                          </div>
                        </div>
                        <div className="token-balance">
                          <div className="balance-amount-token">{token.balance} {token.symbol}</div>
                          <div className="balance-usd-token">${token.usdValue.toFixed(2)} USD</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'nfts' && (
              <div>
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                  </div>
                ) : nftAssets.length > 0 ? (
                  <div className="nft-grid">
                    {nftAssets.map((nft) => (
                      <div key={nft.id} className="nft-card">
                        <div className="nft-image">
                          {nft.image}
                          <div 
                            className="rarity-badge"
                            style={{ 
                              backgroundColor: getRarityColor(nft.rarity),
                              color: nft.rarity === 'legendary' ? '#1f2937' : 'white'
                            }}
                          >
                            {nft.rarity}
                          </div>
                        </div>
                        <div className="nft-content">
                          <h3 className="nft-title">{nft.name}</h3>
                          <div className="nft-collection">{nft.collection}</div>
                          <p className="nft-description">{nft.description}</p>
                          <div className="nft-attributes">
                            {nft.attributes.map((attr, index) => (
                              <div key={index} className="attribute-badge">
                                {attr.trait_type}: {attr.value}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🎨</div>
                    <h3>No NFTs found</h3>
                    <p>Complete challenges and battles to earn unique NFTs!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="stats-card">
                <div className="card-title">
                  Transaction History
                  <button className="refresh-button" onClick={refreshData}>
                    <RefreshCw size={16} />
                  </button>
                </div>
                
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div className="transactions-list">
                    {transactions.map((tx) => (
                      <div key={tx.hash} className="transaction-item">
                        <div className="transaction-info">
                          <div className="transaction-icon">
                            {getTransactionIcon(tx.type)}
                          </div>
                          <div className="transaction-details">
                            <h4>{tx.description}</h4>
                            <div className="transaction-meta">
                              <span className={`status-badge status-${tx.status}`}>
                                {tx.status}
                              </span>
                              <span>{tx.timestamp.toLocaleDateString()}</span>
                              <a 
                                href={`https://polygonscan.com/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hash-link"
                              >
                                {formatAddress(tx.hash)} <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="transaction-amount">
                          <div className="amount-value">+{tx.amount}</div>
                          <div className="amount-token">{tx.token}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="tab-content">
          <div className="connect-prompt">
            <div className="connect-illustration">🔗</div>
            <h2 className="connect-title">Connect Your Web3 Wallet</h2>
            <p className="connect-description">
              Connect your wallet to earn FIIT tokens, collect NFTs, and participate in the Web3 fitness ecosystem.
              Your workout achievements will be rewarded with real crypto rewards!
            </p>
            <button 
              className="connect-button" 
              onClick={connectWallet}
              disabled={connecting}
            >
              <Wallet size={20} />
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletSystem;