// src/components/battle/BattleEffects.tsx
import React, { useState, useEffect } from 'react';

// ============================================================================
// DAMAGE POPUP COMPONENT
// ============================================================================

interface DamagePopupProps {
  damage: number;
  critical: boolean;
  blocked: boolean;
  position: 'left' | 'right';
  onComplete: () => void;
}

export const DamagePopup: React.FC<DamagePopupProps> = ({
  damage,
  critical,
  blocked,
  position,
  onComplete
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '40%',
        left: position === 'left' ? '25%' : '75%',
        transform: 'translate(-50%, -50%)',
        fontSize: critical ? 32 : 24,
        fontWeight: 'bold',
        color: critical ? '#fbbf24' : blocked ? '#94a3b8' : '#ef4444',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        animation: 'damageFloat 1.5s ease-out forwards',
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      {blocked ? `${damage} BLOCKED!` : critical ? `${damage} CRIT!` : `-${damage}`}
      
      <style jsx>{`
        @keyframes damageFloat {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -80%) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -120%) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// SCREEN SHAKE COMPONENT
// ============================================================================

interface ScreenShakeProps {
  intensity: 'light' | 'medium' | 'heavy';
  duration: number;
  children: React.ReactNode;
  isShaking: boolean;
}

export const ScreenShake: React.FC<ScreenShakeProps> = ({
  intensity,
  duration,
  children,
  isShaking
}) => {
  const shakeClass = isShaking ? `shake-${intensity}` : '';

  return (
    <div className={shakeClass} style={{ width: '100%', height: '100%' }}>
      {children}
      
      <style jsx>{`
        .shake-light {
          animation: shake-light ${duration}ms ease-in-out;
        }
        .shake-medium {
          animation: shake-medium ${duration}ms ease-in-out;
        }
        .shake-heavy {
          animation: shake-heavy ${duration}ms ease-in-out;
        }

        @keyframes shake-light {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }

        @keyframes shake-medium {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        @keyframes shake-heavy {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// BATTLE FLASH EFFECT
// ============================================================================

interface BattleFlashProps {
  type: 'hit' | 'critical' | 'special';
  isActive: boolean;
}

export const BattleFlash: React.FC<BattleFlashProps> = ({ type, isActive }) => {
  const colors = {
    hit: 'rgba(239, 68, 68, 0.3)',
    critical: 'rgba(251, 191, 36, 0.4)',
    special: 'rgba(139, 92, 246, 0.4)'
  };

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: colors[type],
        zIndex: 999,
        animation: 'battleFlash 0.3s ease-out',
        pointerEvents: 'none'
      }}
    >
      <style jsx>{`
        @keyframes battleFlash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// ENHANCED CHARACTER SPRITE WITH EFFECTS
// ============================================================================

interface EnhancedCharacterSpriteProps {
  bodyType: string;
  currentAnimation: string;
  scale?: number;
  isFlipped?: boolean;
  isShaking?: boolean;
  glowEffect?: 'none' | 'power' | 'critical' | 'damage';
  style?: React.CSSProperties;
}

export const EnhancedCharacterSprite: React.FC<EnhancedCharacterSpriteProps> = ({
  bodyType,
  currentAnimation,
  scale = 1.5,
  isFlipped = false,
  isShaking = false,
  glowEffect = 'none',
  style = {}
}) => {
  const [animationKey, setAnimationKey] = useState(0);

  // Force re-render on animation change for visual feedback
  useEffect(() => {
    if (currentAnimation !== 'idle') {
      setAnimationKey(prev => prev + 1);
    }
  }, [currentAnimation]);

  const glowStyles = {
    none: {},
    power: { 
      filter: 'drop-shadow(0 0 10px #06b6d4) drop-shadow(0 0 20px #06b6d4)',
      animation: 'powerGlow 1s ease-in-out infinite alternate'
    },
    critical: { 
      filter: 'drop-shadow(0 0 15px #fbbf24) drop-shadow(0 0 30px #fbbf24)',
      animation: 'criticalGlow 0.5s ease-in-out 3'
    },
    damage: { 
      filter: 'drop-shadow(0 0 8px #ef4444)',
      animation: 'damageGlow 0.3s ease-in-out 2'
    }
  };

  const shakeStyle = isShaking ? {
    animation: 'characterShake 0.5s ease-in-out'
  } : {};

  return (
    <div
      key={animationKey}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 150 * scale,
        height: 150 * scale,
        ...style,
        ...shakeStyle
      }}
    >
      <img
        src={`/assets/${bodyType}/idle.png`} // We'll use idle for now, can be enhanced later
        alt={`${bodyType} ${currentAnimation}`}
        style={{
          width: 'auto',
          height: 120 * scale,
          maxWidth: 150 * scale,
          transform: isFlipped ? 'scaleX(-1)' : 'none',
          transition: 'all 0.3s ease',
          ...glowStyles[glowEffect]
        }}
        onError={(e) => {
          // Fallback to emoji if image fails
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling.style.display = 'block';
        }}
      />
      
      {/* Emoji fallback */}
      <div
        style={{
          display: 'none',
          width: 120 * scale,
          height: 120 * scale,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: '50%',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48 * scale,
          color: 'white'
        }}
      >
        {bodyType.includes('fit') ? '💪' :
         bodyType.includes('skinny') ? '🏃' :
         bodyType.includes('overweight') || bodyType.includes('obese') ? '🏋️' : '👤'}
      </div>

      {/* Animation indicator */}
      {currentAnimation !== 'idle' && (
        <div
          style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 10,
            textTransform: 'uppercase',
            fontWeight: 'bold',
            animation: 'actionPulse 0.5s ease-in-out'
          }}
        >
          {currentAnimation}
        </div>
      )}

      <style jsx>{`
        @keyframes powerGlow {
          0% { filter: drop-shadow(0 0 10px #06b6d4); }
          100% { filter: drop-shadow(0 0 20px #06b6d4) drop-shadow(0 0 30px #06b6d4); }
        }

        @keyframes criticalGlow {
          0%, 100% { filter: drop-shadow(0 0 15px #fbbf24); }
          50% { filter: drop-shadow(0 0 25px #fbbf24) drop-shadow(0 0 35px #fbbf24); }
        }

        @keyframes damageGlow {
          0%, 100% { filter: drop-shadow(0 0 8px #ef4444); }
          50% { filter: drop-shadow(0 0 15px #ef4444); }
        }

        @keyframes characterShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        @keyframes actionPulse {
          0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
          100% { opacity: 1; transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// BATTLE EFFECTS MANAGER HOOK
// ============================================================================

export interface BattleEffect {
  id: string;
  type: 'damage' | 'flash' | 'shake' | 'glow';
  target: 'player' | 'opponent' | 'screen';
  data: any;
  duration: number;
}

export const useBattleEffects = () => {
  const [activeEffects, setActiveEffects] = useState<BattleEffect[]>([]);

  const addEffect = (effect: Omit<BattleEffect, 'id'>) => {
    const newEffect: BattleEffect = {
      ...effect,
      id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setActiveEffects(prev => [...prev, newEffect]);

    // Auto-remove after duration
    setTimeout(() => {
      setActiveEffects(prev => prev.filter(e => e.id !== newEffect.id));
    }, effect.duration);

    return newEffect.id;
  };

  const removeEffect = (effectId: string) => {
    setActiveEffects(prev => prev.filter(e => e.id !== effectId));
  };

  const clearAllEffects = () => {
    setActiveEffects([]);
  };

  // Helper functions for common effects
  const showDamage = (damage: number, target: 'player' | 'opponent', critical = false, blocked = false) => {
    return addEffect({
      type: 'damage',
      target,
      data: { damage, critical, blocked },
      duration: 1500
    });
  };

  const showFlash = (flashType: 'hit' | 'critical' | 'special') => {
    return addEffect({
      type: 'flash',
      target: 'screen',
      data: { flashType },
      duration: 300
    });
  };

  const shakeScreen = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    return addEffect({
      type: 'shake',
      target: 'screen',
      data: { intensity },
      duration: 500
    });
  };

  const glowCharacter = (target: 'player' | 'opponent', glowType: 'power' | 'critical' | 'damage') => {
    return addEffect({
      type: 'glow',
      target,
      data: { glowType },
      duration: 1000
    });
  };

  return {
    activeEffects,
    addEffect,
    removeEffect,
    clearAllEffects,
    showDamage,
    showFlash,
    shakeScreen,
    glowCharacter
  };
};