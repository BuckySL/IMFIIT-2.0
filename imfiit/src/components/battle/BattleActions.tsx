// src/components/battle/BattleActions.tsx
import React, { useState } from 'react';

// ============================================================================
// ENHANCED BATTLE ACTION BUTTON
// ============================================================================

interface BattleActionButtonProps {
  action: 'punch' | 'kick' | 'special' | 'block';
  damage: number;
  energyCost: number;
  isDisabled?: boolean;
  currentEnergy?: number;
  onAction: (action: string) => void;
}

export const BattleActionButton: React.FC<BattleActionButtonProps> = ({
  action,
  damage,
  energyCost,
  isDisabled = false,
  currentEnergy = 100,
  onAction
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const actionConfig = {
    punch: {
      icon: '👊',
      label: 'PUNCH',
      description: 'Quick attack',
      gradient: 'linear-gradient(45deg, #ef4444, #dc2626)',
      shadowColor: 'rgba(239, 68, 68, 0.3)'
    },
    kick: {
      icon: '🦵',
      label: 'KICK',
      description: 'Powerful strike',
      gradient: 'linear-gradient(45deg, #f59e0b, #d97706)',
      shadowColor: 'rgba(245, 158, 11, 0.3)'
    },
    special: {
      icon: '⚡',
      label: 'SPECIAL',
      description: 'Ultimate move',
      gradient: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
      shadowColor: 'rgba(139, 92, 246, 0.3)'
    },
    block: {
      icon: '🛡️',
      label: 'BLOCK',
      description: 'Defensive stance',
      gradient: 'linear-gradient(45deg, #10b981, #059669)',
      shadowColor: 'rgba(16, 185, 129, 0.3)'
    }
  };

  const config = actionConfig[action];
  const canUse = currentEnergy >= energyCost && !isDisabled;

  const handleClick = () => {
    if (!canUse) return;
    
    setIsPressed(true);
    onAction(action);
    
    // Reset pressed state
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!canUse}
      style={{
        background: canUse ? config.gradient : 'rgba(100, 100, 100, 0.5)',
        color: 'white',
        border: 'none',
        borderRadius: 12,
        padding: '20px 16px',
        fontSize: 16,
        fontWeight: 'bold',
        cursor: canUse ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s ease',
        boxShadow: canUse ? `0 4px 12px ${config.shadowColor}` : 'none',
        transform: isPressed ? 'translateY(2px) scale(0.95)' : 'translateY(0) scale(1)',
        opacity: canUse ? 1 : 0.6,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 100
      }}
      onMouseOver={(e) => {
        if (canUse) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = `0 8px 20px ${config.shadowColor}`;
        }
      }}
      onMouseOut={(e) => {
        if (canUse && !isPressed) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = `0 4px 12px ${config.shadowColor}`;
        }
      }}
    >
      {/* Action Icon */}
      <div style={{ 
        fontSize: 28, 
        marginBottom: 6,
        animation: action === 'special' ? 'specialPulse 2s ease-in-out infinite' : 'none'
      }}>
        {config.icon}
      </div>

      {/* Action Label */}
      <div style={{ marginBottom: 4 }}>
        {config.label}
      </div>

      {/* Damage/Energy Info */}
      <div style={{ 
        fontSize: 11, 
        opacity: 0.9,
        lineHeight: 1.2
      }}>
        {action === 'block' ? 'Reduce damage' : `${damage} damage`}
        <br />
        <span style={{ color: currentEnergy >= energyCost ? '#4ade80' : '#f87171' }}>
          {energyCost} energy
        </span>
      </div>

      {/* Energy requirement indicator */}
      {!canUse && currentEnergy < energyCost && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 4,
          background: 'rgba(239, 68, 68, 0.9)',
          borderRadius: 12,
          padding: '2px 6px',
          fontSize: 10,
          fontWeight: 'bold'
        }}>
          Need {energyCost - currentEnergy} energy
        </div>
      )}

      {/* Special move glow effect */}
      {action === 'special' && canUse && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: 'specialShine 3s ease-in-out infinite',
          pointerEvents: 'none'
        }} />
      )}

      <style jsx>{`
        @keyframes specialPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes specialShine {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </button>
  );
};

// ============================================================================
// BATTLE ACTIONS PANEL
// ============================================================================

interface BattleActionsPanelProps {
  isMyTurn: boolean;
  currentEnergy: number;
  maxEnergy: number;
  isActionInProgress?: boolean;
  onAction: (action: string) => void;
}

export const BattleActionsPanel: React.FC<BattleActionsPanelProps> = ({
  isMyTurn,
  currentEnergy,
  maxEnergy,
  isActionInProgress = false,
  onAction
}) => {
  if (!isMyTurn) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        margin: '20px 0'
      }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div style={{ fontSize: 16, fontWeight: 'bold' }}>
            Waiting for opponent...
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            They're choosing their move
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: '20px 0' }}>
      {/* Energy Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: 8,
          fontSize: 14,
          color: '#d1d5db'
        }}>
          <span>Your Energy</span>
          <span>{currentEnergy}/{maxEnergy}</span>
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 10,
          height: 12,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            width: `${(currentEnergy / maxEnergy) * 100}%`,
            height: '100%',
            background: currentEnergy > 50 
              ? 'linear-gradient(90deg, #3b82f6, #06b6d4)' 
              : currentEnergy > 25 
              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
              : 'linear-gradient(90deg, #ef4444, #dc2626)',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12
      }}>
        <BattleActionButton
          action="punch"
          damage={15}
          energyCost={10}
          currentEnergy={currentEnergy}
          isDisabled={isActionInProgress}
          onAction={onAction}
        />
        
        <BattleActionButton
          action="kick"
          damage={22}
          energyCost={15}
          currentEnergy={currentEnergy}
          isDisabled={isActionInProgress}
          onAction={onAction}
        />
        
        <BattleActionButton
          action="special"
          damage={35}
          energyCost={25}
          currentEnergy={currentEnergy}
          isDisabled={isActionInProgress}
          onAction={onAction}
        />
        
        <BattleActionButton
          action="block"
          damage={0}
          energyCost={5}
          currentEnergy={currentEnergy}
          isDisabled={isActionInProgress}
          onAction={onAction}
        />
      </div>

      {/* Turn Timer */}
      <div style={{
        textAlign: 'center',
        marginTop: 16,
        color: '#fbbf24',
        fontSize: 14
      }}>
        <div style={{ marginBottom: 4 }}>⏰ Your Turn</div>
        <div style={{ 
          fontSize: 20, 
          fontWeight: 'bold',
          animation: 'timerPulse 1s ease-in-out infinite'
        }}>
          Choose your move!
        </div>
      </div>

      <style jsx>{`
        @keyframes timerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// BATTLE STATUS DISPLAY
// ============================================================================

interface BattleStatusProps {
  currentTurn: string;
  myId: string;
  turnTimeLeft: number;
  maxTurnTime?: number;
}

export const BattleStatus: React.FC<BattleStatusProps> = ({
  currentTurn,
  myId,
  turnTimeLeft,
  maxTurnTime = 30
}) => {
  const isMyTurn = currentTurn === myId;
  const timePercentage = (turnTimeLeft / maxTurnTime) * 100;
  
  const getTimerColor = () => {
    if (timePercentage > 60) return '#4ade80';
    if (timePercentage > 30) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: 12,
      padding: 16,
      textAlign: 'center',
      margin: '16px 0',
      border: isMyTurn ? '2px solid #06b6d4' : '2px solid rgba(255,255,255,0.1)'
    }}>
      {/* Turn Indicator */}
      <div style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: isMyTurn ? '#06b6d4' : '#9ca3af',
        marginBottom: 8
      }}>
        {isMyTurn ? '🎯 YOUR TURN' : '⏳ OPPONENT TURN'}
      </div>

      {/* Timer Display */}
      <div style={{
        fontSize: 28,
        fontWeight: 'bold',
        color: getTimerColor(),
        marginBottom: 8,
        animation: timePercentage < 30 ? 'urgentPulse 0.5s ease-in-out infinite' : 'none'
      }}>
        {turnTimeLeft}s
      </div>

      {/* Timer Bar */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        height: 8,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${timePercentage}%`,
          height: '100%',
          background: getTimerColor(),
          transition: 'width 1s linear, background-color 0.3s ease'
        }} />
      </div>

      <style jsx>{`
        @keyframes urgentPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};