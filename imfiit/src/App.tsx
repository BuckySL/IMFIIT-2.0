import React, { useEffect, useState } from "react";
import { FitnessTracker, fitnessStyles, VisualBattleEngineTest, SpriteTestComponent } from './components/fitness/FitnessComponents';
import { BattleGameEngine } from './components/fitness/BattleGameEngine';
import { MultiplayerLobby } from './components/battle/MultiplayerLobby';
import { MultiplayerBattle } from './components/battle/MultiplayerBattle';
// import { SmartWorkoutProcessor, smartWorkoutStyles } from './components/fitness/EnhancedOCRSystem';
import SimpleAIBattle from './components/battle/SimpleAIBattle';
import { AITrainerSystem, aiTrainerStyles } from './components/ai/AITrainerSystem';
import ProfileManagement from './components/profile/ProfileManagement';
import SimplePVPSystem from './components/pvp/SimplePVPSystem';
import WalletSystem from './components/web3/WalletSystem';
import CompleteDashboard from './components/dashboard/CompleteDashboard';
import { SimpleBattleRoom } from './components/battle/SimpleBattleRoom';
import OCRProcessor from './components/fitness/OCRProcessor';

/* ======================= TYPE DEFINITIONS ======================= */
export type BodyType =
  | "fit-male"
  | "fit-female"
  | "skinny-male"
  | "skinny-female"
  | "obese-male"
  | "obese-female"
  | "overweight-male"
  | "overweight-female";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface UserStats {
  strength: number;
  endurance: number;
  level: number;
  experience: number;
  totalWorkouts: number;
  weeklyWorkouts: number;
  lastWorkoutDate?: Date | string;
}

export interface UserProfile {
  id: string;
  telegramId: number;
  telegramUser: TelegramUser;
  walletAddress?: string | null;
  bodyType: BodyType;
  stats: UserStats;
  createdAt: Date | string;
  updatedAt: Date | string;
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very-active";
}

interface BMRData {
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very-active";
  bmr: number;
  bodyType: BodyType;
}

/* ======================= PHASE 2 TYPES ======================= */
interface Exercise {
  name: string;
  reps?: number;
  sets?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  confidence: number;
}

interface ExtractedWorkout {
  exercises: Exercise[];
  duration?: number;
  intensity: "low" | "medium" | "high";
  type: "cardio" | "strength" | "flexibility" | "sports" | "other";
  confidence: number;
  rawText: string;
}

interface StatGains {
  strength: number;
  endurance: number;
  experience: number;
  reasoning: string[];
}

// Add at top of App.tsx for testing only
// const getTestUserProfile = (): UserProfile => {
//   const isSecondInstance = localStorage.getItem('isSecondUser');
  
//   if (isSecondInstance) {
//     return {
//       id: 'test_user_002',
//       telegramId: 123456002,
//       telegramUser: { id: 123456002, first_name: 'Bob' },
//       stats: { strength: 60, endurance: 40, level: 1, experience: 0, totalWorkouts: 0, weeklyWorkouts: 0 },
//       bodyType: 'fit-male',
//       // ... other required fields
//     };
//   }
  
//   return {
//     id: 'test_user_001',
//     telegramId: 123456001,
//     telegramUser: { id: 123456001, first_name: 'Alice' },
//     stats: { strength: 50, endurance: 50, level: 1, experience: 0, totalWorkouts: 0, weeklyWorkouts: 0 },
//     bodyType: 'fit-female',
//     // ... other required fields
//   };
// };

// Then in your component where userProfile is set:
// const userProfile = getTestUserProfile();

/* ======================= GLOBAL WINDOW SHIMS ======================= */
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
          impactOccurred: (style: "light" | "medium" | "heavy") => void;
          notificationOccurred: (style: "error" | "success" | "warning") => void;
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
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      selectedAddress: string | null;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

/* ======================= SMALL UTILITIES ======================= */
const ls = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  },
};

/* ======================= TELEGRAM LOGIN ======================= */
interface TelegramLoginProps {
  onLogin: (user: TelegramUser) => void;
  onError: (error: string) => void;
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({ onLogin, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isWebApp, setIsWebApp] = useState(false);

  useEffect(() => {
    try {
      if (window.Telegram?.WebApp) {
        setIsWebApp(true);
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        if (tg.initDataUnsafe?.user) {
          setTelegramUser(tg.initDataUnsafe.user);
          return;
        }
      }
      // Fallback demo user for browser dev
      const mockUser: TelegramUser = {
        id: 123456789,
        first_name: "Demo",
        last_name: "User",
        username: "demouser",
        language_code: "en",
      };
      setTelegramUser(mockUser);
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = async () => {
    if (!telegramUser) {
      onError("No Telegram user data available");
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("medium");
      onLogin(telegramUser);
    } catch {
      onError("Failed to authenticate with Telegram");
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
      language_code: "en",
    };
    onLogin(demoUser);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 24,
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(8px)",
        borderRadius: 16,
        border: "1px solid rgba(6,182,212,0.2)",
        maxWidth: 500,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, #0088cc, #006bb3)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
            fontSize: 32,
          }}
        >
          📱
        </div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 8,
            background: "linear-gradient(to right, #06b6d4, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Connect with Telegram
        </h2>
        <p style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1.5 }}>
          {isWebApp
            ? "Continue with your Telegram account to start playing IM FIIT"
            : "Demo mode — Login to start playing IM FIIT"}
        </p>
      </div>

      {telegramUser && (
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {telegramUser.first_name?.charAt(0) ?? "U"}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {telegramUser.first_name} {telegramUser.last_name || ""}
              </div>
              {telegramUser.username && (
                <div style={{ color: "#9ca3af", fontSize: 14 }}>@{telegramUser.username}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={isLoading || !telegramUser}
        style={{
          width: "100%",
          background: isLoading
            ? "rgba(6,182,212,0.5)"
            : "linear-gradient(to right, #0891b2, #1d4ed8)",
          padding: 16,
          borderRadius: 12,
          border: "none",
          color: "white",
          fontSize: 16,
          fontWeight: 600,
          cursor: isLoading ? "not-allowed" : "pointer",
          transition: "all .3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {isLoading ? (
          <>
            <div
              style={{
                width: 20,
                height: 20,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            Connecting...
          </>
        ) : (
          <>🚀 Start Playing</>
        )}
      </button>

      {!isWebApp && (
        <button
          onClick={handleDemoLogin}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.1)",
            padding: 12,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            fontSize: 14,
            cursor: "pointer",
            transition: "all .3s ease",
          }}
        >
          🎮 Quick Demo Login
        </button>
      )}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
      `}</style>
    </div>
  );
};

/* ======================= WALLET CONNECT ======================= */
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
  address,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState<string | null>(null);

  useEffect(() => {
    void checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkConnection = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[] | unknown;
        if (Array.isArray(accounts) && accounts.length > 0 && typeof accounts[0] === "string") {
          onConnect(accounts[0]);
          setWalletType("MetaMask");
        }
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      onError("MetaMask is not installed. Please install MetaMask to continue.");
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[] | unknown;
      if (Array.isArray(accounts) && accounts.length > 0 && typeof accounts[0] === "string") {
        onConnect(accounts[0]);
        setWalletType("MetaMask");
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === 4001) onError("Please connect to MetaMask.");
        else onError("Failed to connect to MetaMask.");
      } else {
        onError("Failed to connect to MetaMask.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setWalletType(null);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (isConnected && address) {
    return (
      <div
        style={{
          padding: 24,
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          borderRadius: 16,
          border: "1px solid rgba(16,185,129,0.3)",
          maxWidth: 400,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              fontSize: 24,
            }}
          >
            ✅
          </div>
          <h3 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#10b981" }}>
            Wallet Connected
          </h3>
          <p style={{ color: "#d1d5db", fontSize: 14 }}>
            {walletType} • {formatAddress(address)}
          </p>
        </div>
        <button
          onClick={handleDisconnect}
          style={{
            width: "100%",
            background: "rgba(239,68,68,0.1)",
            padding: 12,
            borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
            fontSize: 14,
            cursor: "pointer",
            transition: "all .3s ease",
          }}
        >
          Disconnect Wallet
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(8px)",
        borderRadius: 16,
        border: "1px solid rgba(139,92,246,0.2)",
        maxWidth: 400,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, #8b5cf6, #db2777)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
            fontSize: 24,
          }}
        >
          💰
        </div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 8,
            background: "linear-gradient(to right, #8b5cf6, #db2777)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Connect Wallet
        </h2>
        <p style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1.5 }}>
          Connect your crypto wallet to place bets and earn rewards
        </p>
      </div>

      <button
        onClick={connectMetaMask}
        disabled={isConnecting}
        style={{
          width: "100%",
          background: "linear-gradient(to right, #f6851b, #e2761b)",
          padding: 16,
          borderRadius: 12,
          border: "none",
          color: "white",
          fontSize: 16,
          fontWeight: 600,
          cursor: isConnecting ? "not-allowed" : "pointer",
          transition: "all .3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          opacity: isConnecting ? 0.7 : 1,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            background: "white",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          🦊
        </div>
        {isConnecting ? "Connecting..." : "MetaMask"}
      </button>
    </div>
  );
};

/* ======================= BODY TYPE SELECTOR ======================= */
interface BodyTypeSelectorProps {
  onSelect: (bodyType: BodyType, bmrData: BMRData) => void;
  selectedBodyType?: BodyType;
}

const BodyTypeSelector: React.FC<BodyTypeSelectorProps> = ({ onSelect, selectedBodyType }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [bmrData, setBmrData] = useState<Partial<BMRData>>({});
  const [calculatedBodyType, setCalculatedBodyType] = useState<BodyType | null>(null);

  const bodyTypes: { type: BodyType; label: string; emoji: string; description: string }[] = [
    { type: "fit-male", label: "Fit Male", emoji: "💪", description: "Athletic build, well-defined muscles" },
    { type: "fit-female", label: "Fit Female", emoji: "🏃‍♀️", description: "Athletic build, toned physique" },
    { type: "skinny-male", label: "Lean Male", emoji: "🧑‍💼", description: "Slim build, low body fat" },
    { type: "skinny-female", label: "Lean Female", emoji: "👩‍💼", description: "Slim build, low body fat" },
    { type: "overweight-male", label: "Heavy Male", emoji: "👨", description: "Above average weight" },
    { type: "overweight-female", label: "Heavy Female", emoji: "👩", description: "Above average weight" },
    { type: "obese-male", label: "Large Male", emoji: "🧔", description: "High BMI, powerful build" },
    { type: "obese-female", label: "Large Female", emoji: "👩‍🦰", description: "High BMI, powerful build" },
  ];

  const activityLevels = [
    { value: "sedentary" as const, label: "Sedentary", description: "Little or no exercise" },
    { value: "light" as const, label: "Light", description: "Light exercise 1–3 days/week" },
    { value: "moderate" as const, label: "Moderate", description: "Moderate exercise 3–5 days/week" },
    { value: "active" as const, label: "Active", description: "Hard exercise 6–7 days/week" },
    { value: "very-active" as const, label: "Very Active", description: "Very hard exercise, physical job" },
  ];

  const calculateBMR = (age: number, weight: number, height: number, gender: "male" | "female") => {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return gender === "male" ? base + 5 : base - 161;
  };

  const calculateBMI = (weight: number, height: number) => weight / Math.pow(height / 100, 2);

  const determineBodyType = (
    bmi: number,
    gender: "male" | "female",
    activityLevel: BMRData["activityLevel"]
  ): BodyType => {
    const isMale = gender === "male";
    if (activityLevel === "very-active" || activityLevel === "active") return isMale ? "fit-male" : "fit-female";
    if (bmi < 18.5) return isMale ? "skinny-male" : "skinny-female";
    if (bmi < 25)
      return activityLevel === "moderate"
        ? isMale
          ? "fit-male"
          : "fit-female"
        : isMale
        ? "skinny-male"
        : "skinny-female";
    if (bmi < 30) return isMale ? "overweight-male" : "overweight-female";
    return isMale ? "obese-male" : "obese-female";
  };

  const handleBasicInfoSubmit = () => {
    const { age, weight, height, gender, activityLevel } = bmrData;
    if (!age || !weight || !height || !gender || !activityLevel) return;

    const bmr = calculateBMR(age, weight, height, gender);
    const bmi = calculateBMI(weight, height);
    const bodyType = determineBodyType(bmi, gender, activityLevel);

    const complete: BMRData = { age, weight, height, gender, activityLevel, bmr, bodyType };
    setBmrData(complete);
    setCalculatedBodyType(bodyType);
    setStep(2);
  };

  const handleBodyTypeSelect = (bodyType: BodyType) => {
    const finalData = { ...(bmrData as BMRData), bodyType };
    onSelect(bodyType, finalData);
  };

  if (step === 1) {
    return (
      <div
        style={{
          padding: 24,
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          borderRadius: 16,
          border: "1px solid rgba(6,182,212,0.2)",
          maxWidth: 500,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 8,
              background: "linear-gradient(to right, #06b6d4, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Profile Setup
          </h2>
          <p style={{ color: "#d1d5db", fontSize: 14 }}>
            Help us calculate your character stats based on your fitness profile
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Gender */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Gender</label>
            <div style={{ display: "flex", gap: 12 }}>
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setBmrData({ ...bmrData, gender: g })}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    border: `2px solid ${bmrData.gender === g ? "#06b6d4" : "rgba(255,255,255,0.2)"}`,
                    background: bmrData.gender === g ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.05)",
                    color: "white",
                    cursor: "pointer",
                    transition: "all .3s ease",
                    textTransform: "capitalize",
                  }}
                >
                  {g === "male" ? "👨" : "👩"} {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Age (years)</label>
            <input
              type="number"
              value={bmrData.age ?? ""}
              onChange={(e) => setBmrData({ ...bmrData, age: Number(e.target.value) || undefined })}
              placeholder="Enter your age"
              style={inputStyle}
            />
          </div>

          {/* Height */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Height (cm)</label>
            <input
              type="number"
              value={bmrData.height ?? ""}
              onChange={(e) => setBmrData({ ...bmrData, height: Number(e.target.value) || undefined })}
              placeholder="Enter your height in cm"
              style={inputStyle}
            />
          </div>

          {/* Weight */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Weight (kg)</label>
            <input
              type="number"
              value={bmrData.weight ?? ""}
              onChange={(e) => setBmrData({ ...bmrData, weight: Number(e.target.value) || undefined })}
              placeholder="Enter your weight in kg"
              style={inputStyle}
            />
          </div>

          {/* Activity */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Activity Level</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activityLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setBmrData({ ...bmrData, activityLevel: level.value })}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: `2px solid ${
                      bmrData.activityLevel === level.value ? "#06b6d4" : "rgba(255,255,255,0.2)"
                    }`,
                    background:
                      bmrData.activityLevel === level.value ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.05)",
                    color: "white",
                    cursor: "pointer",
                    transition: "all .3s ease",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{level.label}</div>
                  <div style={{ fontSize: 12, color: "#d1d5db" }}>{level.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBasicInfoSubmit}
            disabled={!bmrData.age || !bmrData.weight || !bmrData.height || !bmrData.gender || !bmrData.activityLevel}
            style={{
              width: "100%",
              background: "linear-gradient(to right, #06b6d4, #8b5cf6)",
              padding: 16,
              borderRadius: 12,
              border: "none",
              color: "white",
              fontSize: 16,
              fontWeight: 600,
              cursor:
                !bmrData.age || !bmrData.weight || !bmrData.height || !bmrData.gender || !bmrData.activityLevel
                  ? "not-allowed"
                  : "pointer",
              transition: "all .3s ease",
              opacity:
                !bmrData.age || !bmrData.weight || !bmrData.height || !bmrData.gender || !bmrData.activityLevel
                  ? 0.5
                  : 1,
            }}
          >
            Calculate My Character Type
          </button>
        </div>
      </div>
    );
  }

  // step 2: show recommended & allow manual override
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 24,
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(8px)",
        borderRadius: 16,
        border: "1px solid rgba(6,182,212,0.2)",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 8,
            background: "linear-gradient(to right, #06b6d4, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Choose Your Fighter
        </h2>
        <p style={{ color: "#d1d5db", fontSize: 14 }}>
          Based on your profile, we recommend:{" "}
          <strong style={{ color: "#06b6d4" }}>
            {bodyTypes.find((bt) => bt.type === calculatedBodyType)?.label ?? "—"}
          </strong>
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {bodyTypes.map((bt) => {
          const isRecommended = bt.type === calculatedBodyType;
          const isSelected = selectedBodyType === bt.type;
          return (
            <div
              key={bt.type}
              onClick={() => handleBodyTypeSelect(bt.type)}
              style={{
                padding: 20,
                borderRadius: 12,
                border: `2px solid ${
                  isRecommended ? "#10b981" : isSelected ? "#06b6d4" : "rgba(255,255,255,0.2)"
                }`,
                background: isRecommended
                  ? "rgba(16,185,129,0.2)"
                  : isSelected
                  ? "rgba(6,182,212,0.2)"
                  : "rgba(255,255,255,0.05)",
                cursor: "pointer",
                transition: "all .3s ease",
                textAlign: "center",
                position: "relative",
              }}
            >
              {isRecommended && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "#10b981",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "white",
                  }}
                >
                  ✓
                </div>
              )}
              <div style={{ fontSize: 48, marginBottom: 12 }}>{bt.emoji}</div>
              <h3 style={{ fontWeight: 600, marginBottom: 8, fontSize: 16 }}>{bt.label}</h3>
              <p style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.4 }}>{bt.description}</p>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setStep(1)}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.1)",
          padding: 12,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white",
          fontSize: 14,
          cursor: "pointer",
          transition: "all .3s ease",
        }}
      >
        ← Back to Profile Setup
      </button>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  fontSize: 16,
};

/* ======================= MAIN APP ======================= */
/** includes 'workout' and 'spriteTest' */
type AppScreen =
  | "landing"
  | "auth"
  | "profile-setup"
  | "dashboard"
  | "workout"
  | "battle"
  | "multiplayer"
  |"ai-battle"
  | "spriteTest"
  | "profile"          
  | "pvp"             
  | "wallet"          
  | "leaderboard";    

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("landing");
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    const savedUser = ls.get<TelegramUser>("imfiit_user");
    const savedWallet = localStorage.getItem("imfiit_wallet");
    if (savedUser) {
      setTelegramUser(savedUser);
      if (savedWallet) {
        setWalletAddress(savedWallet);
        const savedProfile = ls.get<UserProfile>(`imfiit_profile_${savedUser.id}`);
        if (savedProfile) setUserProfile(savedProfile);
        setCurrentScreen(savedProfile ? "dashboard" : "profile-setup");
      } else {
        setCurrentScreen("auth");
      }
    }
  };

  const handleTelegramLogin = (user: TelegramUser) => {
    setTelegramUser(user);
    ls.set("imfiit_user", user);
    setCurrentScreen("auth");
  };

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    localStorage.setItem("imfiit_wallet", address);
    if (!telegramUser) {
      setCurrentScreen("auth");
      return;
    }
    const savedProfile = ls.get<UserProfile>(`imfiit_profile_${telegramUser.id}`);
    setCurrentScreen(savedProfile ? "dashboard" : "profile-setup");
    if (savedProfile) setUserProfile(savedProfile);
  };

  const handleSkipWallet = () => {
    if (!telegramUser) {
      setCurrentScreen("auth");
      return;
    }
    const savedProfile = ls.get<UserProfile>(`imfiit_profile_${telegramUser.id}`);
    if (savedProfile) {
      setUserProfile(savedProfile);
      setCurrentScreen("dashboard");
    } else {
      setCurrentScreen("profile-setup");
    }
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(null);
    localStorage.removeItem("imfiit_wallet");
  };

  const handleProfileSetup = (bodyType: BodyType, bmrData: BMRData) => {
    if (!telegramUser) return;
    const base = Math.floor(50 + bmrData.bmr / 100);
    const profile: UserProfile = {
      id: `user_${telegramUser.id}`,
      telegramId: telegramUser.id,
      telegramUser,
      walletAddress,
      bodyType,
      stats: {
        strength: base,
        endurance: base,
        level: 1,
        experience: 0,
        totalWorkouts: 0,
        weeklyWorkouts: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      age: bmrData.age,
      height: bmrData.height,
      weight: bmrData.weight,
      gender: bmrData.gender,
      activityLevel: bmrData.activityLevel,
    };
    setUserProfile(profile);
    ls.set(`imfiit_profile_${telegramUser.id}`, profile);
    setCurrentScreen("dashboard");
  };

  const handleAuthError = (error: string) => {
    console.error("Auth error:", error);
    alert(error);
  };

  /* ---------------- LANDING ---------------- */
  const LandingPage = () => (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)",
        color: "white",
        overflow: "hidden",
        position: "relative",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ADD THIS STYLE TAG at the beginning of your JSX */}
      <style>{fitnessStyles}</style>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      />
      <div style={{ position: "relative", zIndex: 10 }}>
        <header
          style={{
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 48 }}>🏋️</div>
            <span
              style={{
                fontSize: 32,
                fontWeight: "bold",
                background: "linear-gradient(to right, #06b6d4, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              IM FIIT
            </span>
          </div>
        </header>

        <section style={{ padding: "64px 24px", textAlign: "center" }}>
          <div
            style={{
              transition: "all 1s ease",
              transform: isVisible ? "translateY(0)" : "translateY(40px)",
              opacity: isVisible ? 1 : 0,
            }}
          >
            <h1
              style={{
                fontSize: 60,
                fontWeight: "bold",
                marginBottom: 24,
                background: "linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.1,
              }}
            >
              GET FIIT
            </h1>
            <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 16, color: "#67e8f9" }}>
              Earn While You Burn
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "#d1d5db",
                marginBottom: 48,
                maxWidth: 400,
                margin: "0 auto 48px auto",
                lineHeight: 1.6,
              }}
            >
              The first Web3 fitness game where your workouts earn real rewards. Track progress,
              compete with friends, and get paid to stay healthy.
            </p>

            <button
              onClick={() => setCurrentScreen("auth")}
              style={{
                background: "linear-gradient(to right, #0891b2, #1d4ed8)",
                padding: "16px 32px",
                borderRadius: 12,
                border: "none",
                color: "white",
                fontSize: 18,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .3s ease",
              }}
              onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(6,182,212,0.3)";
              }}
              onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              🚀 Start Your Journey
            </button>
          </div>
        </section>

        <section style={{ padding: "48px 24px" }}>
          <h3
            style={{
              fontSize: 36,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 32,
              background: "linear-gradient(to right, #06b6d4, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Why IM FIIT?
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            {[
              { emoji: "🎯", title: "Smart Goals", desc: "AI-powered goals that adapt to your progress" },
              { emoji: "🏆", title: "Earn Rewards", desc: "Crypto rewards for workouts & challenges" },
              { emoji: "👥", title: "Community", desc: "Join challenges with friends" },
              { emoji: "⚡", title: "Real-time Tracking", desc: "Track workouts, steps, progress" },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                  padding: 20,
                  borderRadius: 16,
                  border: "1px solid rgba(6,182,212,0.2)",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.emoji}</div>
                <h4 style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{f.title}</h4>
                <p style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  /* ---------------- AUTH ---------------- */
  const AuthScreen = () => (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)",
        color: "white",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <button
          onClick={() => setCurrentScreen("landing")}
          style={{
            background: "none",
            border: "none",
            color: "#06b6d4",
            fontSize: 16,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          ← Back to Home
        </button>
        <h1
          style={{
            fontSize: 32,
            fontWeight: "bold",
            marginBottom: 8,
            background: "linear-gradient(to right, #06b6d4, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Get Started
        </h1>
        <p style={{ color: "#d1d5db", fontSize: 16 }}>Connect your accounts to start playing</p>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", width: "100%" }}>
        {!telegramUser ? (
          <TelegramLogin onLogin={handleTelegramLogin} onError={handleAuthError} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                background: "rgba(16,185,129,0.1)",
                padding: 16,
                borderRadius: 12,
                border: "1px solid rgba(16,185,129,0.3)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              <div style={{ color: "#10b981", fontWeight: 600 }}>Telegram Connected</div>
              <div style={{ color: "#d1d5db", fontSize: 14 }}>Welcome, {telegramUser.first_name}!</div>
            </div>

            <WalletConnect
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
              onError={handleAuthError}
              isConnected={!!walletAddress}
              address={walletAddress || undefined}
            />

            <div
              style={{
                textAlign: "center",
                padding: 16,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <p style={{ color: "#d1d5db", fontSize: 14, marginBottom: 12 }}>Want to try the game first?</p>
              <button
                onClick={handleSkipWallet}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#06b6d4",
                  padding: "12px 24px",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all .3s ease",
                }}
                onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                }}
                onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
              >
                Skip for Now (Demo Mode)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ---------------- PROFILE SETUP ---------------- */
  const ProfileSetupScreen = () => (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)",
        color: "white",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: "bold",
            marginBottom: 8,
            background: "linear-gradient(to right, #06b6d4, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Create Your Fighter
        </h1>
        <p style={{ color: "#d1d5db", fontSize: 16 }}>
          Set up your profile to determine your character's stats
        </p>
      </div>

      <BodyTypeSelector onSelect={handleProfileSetup} />
    </div>
  );

const WorkoutScreen = () => {
  // Add state for workout screen tabs
  const [workoutTab, setWorkoutTab] = useState<'upload' | 'trainers'>('upload');
  const [showTrainerResponse, setShowTrainerResponse] = useState(false);
  const [lastTrainerResponse, setLastTrainerResponse] = useState<any>(null);

  // ✅ ADD THIS MISSING FUNCTION
  const handleStatsUpdate = (newStats: { strength: number; endurance: number; experience: number }) => {
  if (!userProfile) {
    console.warn('❌ No user profile found for stats update');
    return;
  }

  console.log('🎯 Updating user stats:', newStats);

  try {
    // Calculate new totals with safety checks
    const currentStats = userProfile.stats || {
      strength: 50,
      endurance: 50,
      experience: 0,
      level: 1,
      totalWorkouts: 0,
      weeklyWorkouts: 0
    };

    const updatedStats = {
      strength: Math.max(0, (currentStats.strength || 50) + (newStats.strength || 0)),
      endurance: Math.max(0, (currentStats.endurance || 50) + (newStats.endurance || 0)),
      experience: Math.max(0, (currentStats.experience || 0) + (newStats.experience || 0)),
      totalWorkouts: (currentStats.totalWorkouts || 0) + 1,
      weeklyWorkouts: (currentStats.weeklyWorkouts || 0) + 1,
      lastWorkoutDate: new Date().toISOString()
    };

    // Calculate new level based on experience
    updatedStats.level = Math.floor(Math.sqrt(updatedStats.experience / 100)) + 1;

    // Create updated profile
    const updatedProfile: UserProfile = {
      ...userProfile,
      stats: updatedStats,
      updatedAt: new Date().toISOString(),
    };

    // Update state
    setUserProfile(updatedProfile);
    
    // Save to localStorage with error handling
    try {
      ls.set(`imfiit_profile_${userProfile.telegramId}`, updatedProfile);
      console.log('💾 Profile saved successfully');
    } catch (storageError) {
      console.error('❌ Failed to save to localStorage:', storageError);
    }

    console.log('✅ Stats updated successfully:', {
      gained: newStats,
      newTotals: updatedStats,
      newLevel: updatedStats.level
    });

  } catch (error) {
    console.error('❌ Error updating stats:', error);
    // Show user-friendly error
    setTimeout(() => {
      alert('⚠️ Error updating stats. Please try again.');
    }, 500);
  }
};

const calculateWorkoutStats = () => {
  if (!userProfile) return { thisWeekWorkouts: 0, totalCalories: 0 };

  try {
    const workoutHistory = JSON.parse(
      localStorage.getItem(`imfiit_workouts_${userProfile.telegramId}`) || '[]'
    );

    // Calculate this week's workouts
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeekWorkouts = workoutHistory.filter(
      (workout: any) => new Date(workout.timestamp) > oneWeekAgo
    ).length;

    // Calculate total calories (estimate)
    const totalCalories = workoutHistory.reduce(
      (total: number, workout: any) => {
        const calories = workout.extractedWorkout?.calories || 
                        (workout.extractedWorkout?.duration || 30) * 8; // 8 calories per minute estimate
        return total + calories;
      }, 0
    );

    return { thisWeekWorkouts, totalCalories };
  } catch (error) {
    console.error('Error calculating workout stats:', error);
    return { thisWeekWorkouts: 0, totalCalories: 0 };
  }
};

  // Enhanced workout saved handler with AI trainer integration
const handleWorkoutSaved = async (workoutData: any) => {
  if (!userProfile) {
    console.warn('❌ No user profile found for workout save');
    return;
  }

  console.log('💾 Saving workout data:', workoutData);

  try {
    // Get existing workout history
    const existingHistory = JSON.parse(
      localStorage.getItem(`imfiit_workouts_${userProfile.telegramId}`) || '[]'
    );

    // Create workout entry
    const workoutEntry = {
      id: workoutData.id || `workout_${Date.now()}`,
      userId: userProfile.id,
      timestamp: workoutData.timestamp || new Date().toISOString(),
      extractedWorkout: workoutData.extractedWorkout,
      appSource: workoutData.appSource || 'OCR Scanner',
      verified: workoutData.verified || false,
      statsGain: workoutData.statsGain || { strength: 0, endurance: 0, experience: 0 },
      confidence: workoutData.extractedWorkout?.confidence || 0.85
    };

    // Add to history (keep latest 50 workouts)
    const updatedHistory = [workoutEntry, ...existingHistory].slice(0, 50);

    // Save to localStorage
    localStorage.setItem(
      `imfiit_workouts_${userProfile.telegramId}`,
      JSON.stringify(updatedHistory)
    );

    console.log('✅ Workout saved successfully');

    // Show trainer response if available
    if (workoutData.trainerResponse) {
      setLastTrainerResponse(workoutData.trainerResponse);
      setShowTrainerResponse(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowTrainerResponse(false);
      }, 5000);
    }

  } catch (error) {
    console.error('❌ Error saving workout:', error);
  }
};

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white'
    }}>
      {/* <style>{enhancedOCRStyles}</style> */}
      <style>{aiTrainerStyles}</style>
      <style>{workoutScreenStyles}</style>
{/* <style>{smartWorkoutStyles}</style> */}
      {/* Header */}
      <div className="workout-screen-header">
        <button 
          onClick={() => setCurrentScreen("dashboard")} 
          className="back-button"
        >
          ← Back to Dashboard
        </button>
        
        <h1 className="workout-screen-title">
          🏋️‍♂️ Workout Center
        </h1>
        
        <div className="workout-stats-summary">
          <div className="stat-item">
            💪 {userProfile?.stats?.strength || 0}
          </div>
          <div className="stat-item">
            🏃 {userProfile?.stats?.endurance || 0}
          </div>
          <div className="stat-item">
            ⭐ Level {userProfile?.stats?.level || 1}
          </div>
        </div>
      </div>

      {/* Trainer Response Modal */}
      {showTrainerResponse && lastTrainerResponse && (
        <div className="trainer-response-modal">
          <div className="trainer-response-content">
            <div className="trainer-response-header">
              <span className="trainer-avatar">{lastTrainerResponse.trainerAvatar}</span>
              <span className="trainer-name">{lastTrainerResponse.trainerName}</span>
            </div>
            <div className="trainer-message">
              {lastTrainerResponse.message}
            </div>
            <button 
              onClick={() => setShowTrainerResponse(false)}
              className="close-response-btn"
            >
              Thanks! ✨
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="workout-tabs">
        <button 
          className={`workout-tab ${workoutTab === 'upload' ? 'active' : ''}`}
          onClick={() => setWorkoutTab('upload')}
        >
          📱 Upload Workout
        </button>
        <button 
          className={`workout-tab ${workoutTab === 'trainers' ? 'active' : ''}`}
          onClick={() => setWorkoutTab('trainers')}
        >
          🤖 AI Trainers
        </button>
      </div>

      {/* Content */}
      <div className="workout-content">
        {workoutTab === 'upload' && (
          <div className="workout-upload-section">
            <div className="section-header">
              <h2>📸 Upload Your Workout Screenshot</h2>
              <p>Take a photo of your fitness app results to gain experience and level up!</p>
            </div>
            
<OCRProcessor
  onProcessingComplete={(result) => {
    if (result.success) {
      console.log('App detected:', result.appName);
      console.log('Confidence:', result.confidence);
      console.log('Dynamic stats:', result.stats);
      
      // Update user stats with DYNAMIC values
      handleStatsUpdate({
        strength: result.stats.strength,
        endurance: result.stats.endurance,
        experience: result.stats.experience
      });
      
      // Save workout data
      handleWorkoutSaved({
        id: `workout_${Date.now()}`,
        timestamp: result.timestamp,
        extractedWorkout: {
          appName: result.appName,
          confidence: result.confidence,
          rawText: result.extractedText
        },
        statsGain: result.stats,
        verified: true
      });
      
      // Show detailed feedback
      alert(`Workout Processed!
App: ${result.appName}
Confidence: ${Math.round(result.confidence * 100)}%

Stats Gained:
💪 +${result.stats.strength} Strength
🏃 +${result.stats.endurance} Endurance  
⭐ +${result.stats.experience} Experience

Reasoning:
${result.stats.reasoning.join('\n')}`);
    }
  }}
  onError={(error) => {
    console.error('OCR Error:', error);
    alert(`Upload Failed: ${error}`);
  }}
  userProfile={userProfile}
/>
            
            {/* Quick Stats after workout upload */}
            {userProfile?.stats && (
              <div className="quick-stats-panel">
                <h3>🎯 Your Current Stats</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">💪</div>
                    <div className="stat-value">{userProfile.stats.strength}</div>
                    <div className="stat-label">Strength</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🏃</div>
                    <div className="stat-value">{userProfile.stats.endurance}</div>
                    <div className="stat-label">Endurance</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-value">{userProfile.stats.experience}</div>
                    <div className="stat-label">Experience</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-value">{userProfile.stats.level}</div>
                    <div className="stat-label">Level</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {workoutTab === 'trainers' && (
          <div className="ai-trainers-section">
            <div className="section-header">
              <h2>🤖 Your AI Fitness Coaches</h2>
              <p>Get personalized advice, motivation, and workout analysis from your AI trainers!</p>
            </div>
            
            <AITrainerSystem 
              userId={userProfile?.id || 'demo-user'}
              socket={undefined} // You can add socket connection later
              onWorkoutRecommendation={(recommendation) => {
                console.log('Got workout recommendation:', recommendation);
                // You could show a notification or modal here
                setCurrentScreen("dashboard"); // Navigate to apply recommendation
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// const ocrModel = new OCRModel();
// const result = await ocrModel.analyzeScreenshot(imageData);

const workoutScreenStyles = `
.workout-screen-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(20px);
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.back-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.workout-screen-title {
  font-size: 2em;
  font-weight: bold;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  flex: 1;
  text-align: center;
}

.workout-stats-summary {
  display: flex;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.trainer-response-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.5s ease;
}

.trainer-response-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.5s ease;
}

.trainer-response-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.trainer-avatar {
  font-size: 3em;
}

.trainer-name {
  font-size: 1.5em;
  font-weight: bold;
  color: #ffeaa7;
}

.trainer-message {
  font-size: 1.2em;
  line-height: 1.6;
  margin-bottom: 25px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.close-response-btn {
  background: linear-gradient(135deg, #ffeaa7, #fab1a0);
  color: #2d3436;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-response-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 234, 167, 0.4);
}

.workout-tabs {
  display: flex;
  gap: 4px;
  margin: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.workout-tab {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.workout-tab.active {
  background: rgba(255, 255, 255, 0.2);
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.workout-tab:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.workout-content {
  padding: 0 20px 40px 20px;
}

.section-header {
  text-align: center;
  margin-bottom: 30px;
}

.section-header h2 {
  font-size: 2em;
  margin: 0 0 10px 0;
  color: #ffeaa7;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.section-header p {
  font-size: 1.1em;
  opacity: 0.9;
  margin: 0;
  line-height: 1.5;
}

.quick-stats-panel {
  margin-top: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.quick-stats-panel h3 {
  text-align: center;
  margin: 0 0 25px 0;
  font-size: 1.5em;
  color: #ffeaa7;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 2.5em;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 8px;
  color: #ffeaa7;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(50px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@media (max-width: 768px) {
  .workout-screen-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .workout-screen-title {
    text-align: left;
    font-size: 1.5em;
  }
  
  .workout-stats-summary {
    align-self: stretch;
    justify-content: center;
  }
  
  .workout-tabs {
    margin: 16px;
  }
  
  .workout-tab {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .trainer-response-content {
    margin: 20px;
    padding: 25px;
  }
  
  .trainer-message {
    font-size: 1.1em;
  }
}
`;

const BattleScreen = () => {
  if (!userProfile) return null;

  return (
    <SimpleBattleRoom
      userProfile={userProfile}
      onBattleEnd={(result) => {
        console.log('Battle ended:', result);
        
        if (result.winner === userProfile.id) {
          const newStats = {
            strength: userProfile.stats.strength + result.winnerRewards.strength,
            endurance: userProfile.stats.endurance + result.winnerRewards.endurance,
            experience: userProfile.stats.experience + result.winnerRewards.experience
          };
          
          const updatedProfile = {
            ...userProfile,
            stats: { ...userProfile.stats, ...newStats },
            updatedAt: new Date().toISOString(),
          };

          setUserProfile(updatedProfile);
          ls.set(`imfiit_profile_${userProfile.telegramId}`, updatedProfile);
          
          alert(`You won! +${result.winnerRewards.tokens} tokens!`);
        } else {
          alert('You lost this battle. Better luck next time!');
        }
        
        setCurrentScreen("dashboard");
      }}
      onBack={() => setCurrentScreen("dashboard")}
    />
  );
};

const MultiplayerScreen = () => {
  if (!userProfile) return null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)",
      color: "white",
    }}>
      <MultiplayerLobby 
        userProfile={userProfile} 
        onBackToDashboard={() => setCurrentScreen("dashboard")} 
      />
    </div>
  );
};

const AIBattleScreen = () => {
  if (!userProfile) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div>User profile not found. Please return to dashboard.</div>
          <button 
            onClick={() => setCurrentScreen("dashboard")}
            style={{
              marginTop: 16,
              padding: "12px 24px",
              background: "#06b6d4",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleBattleEnd = (result: any) => {
    console.log('🤖 AI Battle ended with result:', result);
    
    // Update user stats based on AI battle results
    if (result.winner === 'player') {
      const aiRewards = result.aiOpponent?.rewards || { experience: 50, coins: 25 };
      
      const newStats = {
        strength: userProfile.stats.strength + Math.floor(Math.random() * 3) + 1,
        endurance: userProfile.stats.endurance + Math.floor(Math.random() * 3) + 1,
        experience: userProfile.stats.experience + aiRewards.experience
      };

      const updatedProfile = {
        ...userProfile,
        stats: {
          ...userProfile.stats,
          ...newStats,
          level: Math.floor(Math.sqrt(newStats.experience / 100)) + 1,
        },
        updatedAt: new Date().toISOString(),
      };

      setUserProfile(updatedProfile);
      ls.set(`imfiit_profile_${userProfile.telegramId}`, updatedProfile);
      
      console.log('✅ User stats updated after AI victory:', updatedProfile.stats);
    }
    
    // Return to dashboard after showing results
    setTimeout(() => {
      setCurrentScreen("dashboard");
    }, 3000);
  };

  return (
    <SimpleAIBattle
      userProfile={userProfile}
      onBattleEnd={handleBattleEnd}
      onBack={() => setCurrentScreen("dashboard")}
    />
  );
};

  /* ---------------- DASHBOARD ---------------- */
const DashboardScreen = () => {
  // Calculate workout stats safely with consistent localStorage keys
  const [workoutStats, setWorkoutStats] = useState({
    thisWeekWorkouts: 0,
    totalCalories: 0
  });

  useEffect(() => {
    // Load workout history and calculate stats
    if (userProfile?.telegramId) {
      // Use consistent key pattern: imfiit_workouts_${telegramId}
      const saved = localStorage.getItem(`imfiit_workouts_${userProfile.telegramId}`);
      if (saved) {
        try {
          const workoutHistory = JSON.parse(saved);
          
          // Calculate this week's workouts
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          const thisWeek = workoutHistory.filter((workout: any) => {
            const workoutDate = new Date(workout.timestamp || workout.date || Date.now());
            return workoutDate > oneWeekAgo;
          }).length;
          
          // Calculate total calories with better fallbacks
          const totalCals = workoutHistory.reduce((sum: number, workout: any) => {
            const calories = 
              workout.extractedWorkout?.calories || 
              workout.calories || 
              workout.parsed?.calories || 
              (workout.extractedWorkout?.duration || workout.duration || 30) * 8; // 8 cal/min estimate
            return sum + calories;
          }, 0);
          
          setWorkoutStats({
            thisWeekWorkouts: thisWeek,
            totalCalories: totalCals
          });
        } catch (error) {
          console.error('Error loading workout stats:', error);
          // Set default values on error
          setWorkoutStats({
            thisWeekWorkouts: 0,
            totalCalories: 0
          });
        }
      }
    }
  }, [userProfile?.telegramId]); // Use telegramId for consistency

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)",
        color: "white",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
            padding: 20,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 16,
            backdropFilter: "blur(8px)",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: "bold",
                background: "linear-gradient(to right, #06b6d4, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Welcome, {telegramUser?.first_name}!
            </h1>
            <p style={{ color: "#d1d5db", fontSize: 14 }}>
              Ready to battle? Your character: {userProfile?.bodyType.replace("-", " ").toUpperCase()}
            </p>
          </div>
          <button
            onClick={() => {
              // Enhanced logout with confirmation
              if (confirm("Are you sure you want to logout?")) {
                ls.clear();
                setTelegramUser(null);
                setWalletAddress(null);
                setUserProfile(null);
                setCurrentScreen("landing");
              }
            }}
            style={{
              background: "rgba(239,68,68,0.2)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </header>

        {/* Enhanced Stats Grid with Loading States */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <StatCard 
            label="Strength" 
            icon="💪" 
            color="#06b6d4" 
            value={userProfile?.stats.strength ?? 0} 
          />
          <StatCard 
            label="Endurance" 
            icon="🏃" 
            color="#10b981" 
            value={userProfile?.stats.endurance ?? 0} 
          />
          <StatCard 
            label="Level" 
            icon="⭐" 
            color="#8b5cf6" 
            value={userProfile?.stats.level ?? 1} 
          />
          <StatCard 
            label="Experience" 
            icon="🎯" 
            color="#f59e0b" 
            value={userProfile?.stats.experience ?? 0} 
          />
          <StatCard 
            label="This Week" 
            icon="📅" 
            color="#ef4444" 
            value={workoutStats.thisWeekWorkouts} 
          />
          <StatCard 
            label="Total Calories" 
            icon="🔥" 
            color="#f97316" 
            value={workoutStats.totalCalories} 
          />
        </div>

        {/* Action Buttons Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
          <PrimaryButton bg="linear-gradient(to right, #10b981, #059669)" onClick={() => setCurrentScreen("workout")}>
            📱 Smart Workout Scan
          </PrimaryButton>

          <PrimaryButton bg="linear-gradient(to right, #ef4444, #dc2626)" onClick={() => setCurrentScreen("pvp")}>
            ⚔️ PVP Battles
          </PrimaryButton>

          <PrimaryButton bg="linear-gradient(to right, #06b6d4, #0891b2)" onClick={() => setCurrentScreen("profile")}>
            👤 My Profile
          </PrimaryButton>

          <PrimaryButton bg="linear-gradient(to right, #8b5cf6, #7c3aed)" onClick={() => setCurrentScreen("leaderboard")}>
            🏆 Leaderboards
          </PrimaryButton>

          <PrimaryButton bg="linear-gradient(to right, #f59e0b, #d97706)" onClick={() => setCurrentScreen("wallet")}>
            💰 Web3 Wallet
          </PrimaryButton>

          <PrimaryButton bg="linear-gradient(to right, #8b5cf6, #7c3aed)" onClick={() => setCurrentScreen("ai-battle")}>
            🤖 AI Training Battle
          </PrimaryButton>

          <PrimaryButton bg="linear-gradient(to right, #ff6b6b, #ee5a24)" onClick={() => setCurrentScreen("spriteTest")}>
            🎮 Test Sprites
          </PrimaryButton>
        </div>

        {/* Status Panel with Database Connection Status */}
        <div
          style={{
            marginTop: 32,
            padding: 20,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <h3 style={{ marginBottom: 12, color: "#06b6d4" }}>System Status</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 12 }}>
            <span style={{ color: "#10b981" }}>Frontend: ✅ Online</span>
            <span style={{ color: "#f59e0b" }}>Backend: ⚠️ DB Disconnected</span>
            <span style={{ color: "#06b6d4" }}>Socket.IO: ✅ Ready</span>
          </div>
          <p style={{ color: "#d1d5db", fontSize: 14 }}>
            Real-time multiplayer battles are live! Upload workouts to level up your fighter.
          </p>
        </div>
      </div>
    </div>
  );
};

const ProfileScreen = () => {
  if (!userProfile) return null;
  
  return (
    <ProfileManagement 
      userProfile={userProfile}
      onUpdateProfile={(updates) => {
        setUserProfile(updates);
        ls.set(`imfiit_profile_${telegramUser?.id}`, updates);
      }}
      onBack={() => setCurrentScreen("dashboard")}
    />
  );
};

const PVPScreen = () => {
  if (!userProfile) return null;
  
  return (
    <SimplePVPSystem 
      userProfile={userProfile}
      onStartBattle={(battleId, opponent) => {
        console.log('Starting battle:', battleId, 'vs', opponent);
        setCurrentScreen("battle"); // Navigate to battle screen
      }}
      onBack={() => setCurrentScreen("dashboard")}
    />
  );
};

const WalletScreen = () => {
  return (
    <WalletSystem 
      userProfile={userProfile}
      onBack={() => setCurrentScreen("dashboard")}
    />
  );
};

const LeaderboardScreen = () => {
  if (!userProfile) return null;
  
  return (
    <LeaderboardSystem 
      userProfile={userProfile}
      onChallenge={(userId) => {
        console.log('Challenging user:', userId);
        setCurrentScreen("pvp"); // Go to PVP screen
      }}
      onSendMessage={(userId) => {
        console.log('Messaging user:', userId);
        // Add messaging logic later
      }}
      onBack={() => setCurrentScreen("dashboard")}
    />
  );
};

  /* ---------------- ROUTER ---------------- */
  switch (currentScreen) {
    case "auth":
      return <AuthScreen />;
    case "profile-setup":
      return <ProfileSetupScreen />;
    case "dashboard":
      return <DashboardScreen />;
    case "workout":
  return <WorkoutScreen />;
  return (
    <div style={{ minHeight: '100vh' }}>
      <button
        onClick={() => setCurrentScreen("dashboard")}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'none',
          border: 'none',
          color: '#06b6d4',
          fontSize: 16,
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        ← Back to Dashboard
      </button>

      <EnhancedFitnessTracker
        userProfile={{
          id: userProfile?.id || 'demo',
          userId: userProfile?.id || 'demo',
          age: 25, // Add age to your user profile
          submissionHistory: {
            sha256Hashes: [],
            phashHistory: [],
            textSigHistory: [],
            sessionHistory: []
          }
        }}
        onStatsUpdate={(newStats) => {
          // Update your user stats
          setUserProfile(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              strength: (prev.stats.strength || 50) + newStats.strength,
              endurance: (prev.stats.endurance || 50) + newStats.endurance,
              experience: (prev.stats.experience || 0) + newStats.experience
            }
          }));
        }}
      />
    </div>
  );
    case "battle":
      return <BattleScreen />;
    case "spriteTest":
      return <SpriteTestComponent />;
      case "multiplayer":  // Add this
    return <MultiplayerScreen />;
    case "ai-battle":
   return <AIBattleScreen />;
    case "profile":
    return <ProfileScreen />;
  case "pvp":
    return <PVPScreen />;
  case "wallet":
    return <WalletScreen />;
  case "leaderboard":
    return <LeaderboardScreen />;
    
  default:
    return <LandingPage />;
  }
}

/* ======================= SMALL PRESENTATION COMPONENTS ======================= */
const StatCard: React.FC<{ label: string; icon: string; color: string; value: number }> = ({
  label,
  icon,
  color,
  value,
}) => (
  <div
    style={{
      background: "rgba(255,255,255,0.1)",
      padding: 20,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.15)",
    }}
  >
    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 14, color: "#d1d5db" }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: "bold", color }}>{value.toFixed(2)}</div>
  </div>
);

const PrimaryButton: React.FC<{
  bg: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ bg, children, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: bg,
      padding: 20,
      borderRadius: 12,
      border: "none",
      color: "white",
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all .3s ease",
    }}
    onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(1.02)";
      e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.25)";
    }}
    onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {children}
  </button>
);