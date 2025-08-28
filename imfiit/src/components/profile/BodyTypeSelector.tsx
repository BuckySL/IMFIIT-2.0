import React, { useState } from 'react';
import type { BodyType } from '../../types/user';

interface BodyTypeSelectorProps {
  onSelect: (bodyType: BodyType, bmrData: BMRData) => void;
  selectedBodyType?: BodyType;
}

interface BMRData {
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  bmr: number;
  bodyType: BodyType;
}

const BodyTypeSelector: React.FC<BodyTypeSelectorProps> = ({ onSelect, selectedBodyType }) => {
  const [step, setStep] = useState(1);
  const [bmrData, setBmrData] = useState<Partial<BMRData>>({});
  const [calculatedBodyType, setCalculatedBodyType] = useState<BodyType | null>(null);

  const bodyTypes = [
    { type: 'fit-male' as BodyType, label: 'Fit Male', emoji: '💪', description: 'Athletic build, well-defined muscles' },
    { type: 'fit-female' as BodyType, label: 'Fit Female', emoji: '🏃‍♀️', description: 'Athletic build, toned physique' },
    { type: 'skinny-male' as BodyType, label: 'Lean Male', emoji: '🧑‍💼', description: 'Slim build, low body fat' },
    { type: 'skinny-female' as BodyType, label: 'Lean Female', emoji: '👩‍💼', description: 'Slim build, low body fat' },
    { type: 'overweight-male' as BodyType, label: 'Heavy Male', emoji: '👨', description: 'Above average weight' },
    { type: 'overweight-female' as BodyType, label: 'Heavy Female', emoji: '👩', description: 'Above average weight' },
    { type: 'obese-male' as BodyType, label: 'Large Male', emoji: '🧔', description: 'High BMI, powerful build' },
    { type: 'obese-female' as BodyType, label: 'Large Female', emoji: '👩‍🦰', description: 'High BMI, powerful build' }
  ];

  const activityLevels = [
    { value: 'sedentary' as const, label: 'Sedentary', multiplier: 1.2, description: 'Little or no exercise' },
    { value: 'light' as const, label: 'Light', multiplier: 1.375, description: 'Light exercise 1-3 days/week' },
    { value: 'moderate' as const, label: 'Moderate', multiplier: 1.55, description: 'Moderate exercise 3-5 days/week' },
    { value: 'active' as const, label: 'Active', multiplier: 1.725, description: 'Hard exercise 6-7 days/week' },
    { value: 'very-active' as const, label: 'Very Active', multiplier: 1.9, description: 'Very hard exercise, physical job' }
  ];

  const calculateBMR = (age: number, weight: number, height: number, gender: 'male' | 'female') => {
    // Mifflin-St Jeor Equation
    const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
    return gender === 'male' ? baseBMR + 5 : baseBMR - 161;
  };

  const calculateBMI = (weight: number, height: number) => {
    return weight / Math.pow(height / 100, 2);
  };

  const determineBodyType = (bmi: number, gender: 'male' | 'female', activityLevel: string): BodyType => {
    const isMale = gender === 'male';
    
    if (activityLevel === 'very-active' || activityLevel === 'active') {
      return isMale ? 'fit-male' : 'fit-female';
    }
    
    if (bmi < 18.5) {
      return isMale ? 'skinny-male' : 'skinny-female';
    } else if (bmi >= 18.5 && bmi < 25) {
      return activityLevel === 'moderate' 
        ? (isMale ? 'fit-male' : 'fit-female')
        : (isMale ? 'skinny-male' : 'skinny-female');
    } else if (bmi >= 25 && bmi < 30) {
      return isMale ? 'overweight-male' : 'overweight-female';
    } else {
      return isMale ? 'obese-male' : 'obese-female';
    }
  };

  const handleBasicInfoSubmit = () => {
    const { age, weight, height, gender, activityLevel } = bmrData;
    
    if (!age || !weight || !height || !gender || !activityLevel) {
      return;
    }

    const bmr = calculateBMR(age, weight, height, gender);
    const bmi = calculateBMI(weight, height);
    const bodyType = determineBodyType(bmi, gender, activityLevel);
    
    const completeBMRData: BMRData = {
      age,
      weight,
      height,
      gender,
      activityLevel,
      bmr,
      bodyType
    };

    setBmrData(completeBMRData);
    setCalculatedBodyType(bodyType);
    setStep(2);
  };

  const handleBodyTypeSelect = (bodyType: BodyType) => {
    const finalData = { ...bmrData, bodyType } as BMRData;
    onSelect(bodyType, finalData);
  };

  if (step === 1) {
    return (
      <div style={{
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '8px',
            background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Profile Setup
          </h2>
          <p style={{
            color: '#d1d5db',
            fontSize: '14px'
          }}>
            Help us calculate your character stats based on your fitness profile
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Gender Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Gender
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['male', 'female'].map((gender) => (
                <button
                  key={gender}
                  onClick={() => setBmrData({ ...bmrData, gender: gender as 'male' | 'female' })}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `2px solid ${bmrData.gender === gender ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)'}`,
                    background: bmrData.gender === gender ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'capitalize'
                  }}
                >
                  {gender === 'male' ? '👨' : '👩'} {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Age Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Age (years)
            </label>
            <input
              type="number"
              value={bmrData.age || ''}
              onChange={(e) => setBmrData({ ...bmrData, age: parseInt(e.target.value) })}
              placeholder="Enter your age"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Height Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Height (cm)
            </label>
            <input
              type="number"
              value={bmrData.height || ''}
              onChange={(e) => setBmrData({ ...bmrData, height: parseInt(e.target.value) })}
              placeholder="Enter your height in cm"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Weight Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Weight (kg)
            </label>
            <input
              type="number"
              value={bmrData.weight || ''}
              onChange={(e) => setBmrData({ ...bmrData, weight: parseInt(e.target.value) })}
              placeholder="Enter your weight in kg"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Activity Level */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Activity Level
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activityLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setBmrData({ ...bmrData, activityLevel: level.value })}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `2px solid ${bmrData.activityLevel === level.value ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)'}`,
                    background: bmrData.activityLevel === level.value ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {level.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                    {level.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBasicInfoSubmit}
            disabled={!bmrData.age || !bmrData.weight || !bmrData.height || !bmrData.gender || !bmrData.activityLevel}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              opacity: (!bmrData.age || !bmrData.weight || !bmrData.height || !bmrData.gender || !bmrData.activityLevel) ? 0.5 : 1
            }}
          >
            Calculate My Character Type
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      border: '1px solid rgba(6, 182, 212, 0.2)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '8px',
          background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Choose Your Fighter
        </h2>
        <p style={{
          color: '#d1d5db',
          fontSize: '14px'
        }}>
          Based on your profile, we recommend: <strong style={{ color: '#06b6d4' }}>
            {bodyTypes.find(bt => bt.type === calculatedBodyType)?.label}
          </strong>
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {bodyTypes.map((bodyType) => (
          <div
            key={bodyType.type}
            onClick={() => handleBodyTypeSelect(bodyType.type)}
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: `2px solid ${
                bodyType.type === calculatedBodyType 
                  ? '#10b981' 
                  : selectedBodyType === bodyType.type 
                    ? '#06b6d4' 
                    : 'rgba(255, 255, 255, 0.2)'
              }`,
              background: bodyType.type === calculatedBodyType
                ? 'rgba(16, 185, 129, 0.2)'
                : selectedBodyType === bodyType.type
                  ? 'rgba(6, 182, 212, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {bodyType.type === calculatedBodyType && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#10b981',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                ✓
              </div>
            )}
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              {bodyType.emoji}
            </div>
            <h3 style={{
              fontWeight: '600',
              marginBottom: '8px',
              fontSize: '16px'
            }}>
              {bodyType.label}
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#d1d5db',
              lineHeight: '1.4'
            }}>
              {bodyType.description}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setStep(1)}
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
      >
        ← Back to Profile Setup
      </button>
    </div>
  );
};

export default BodyTypeSelector;