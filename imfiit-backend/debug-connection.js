// debug-connection.js - Test if connectDatabase works
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 DEBUG Connection Test Started');
console.log('📍 MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('📍 MONGODB_URI value:', process.env.MONGODB_URI);

const testConnectionFunction = async () => {
  try {
    console.log('🔗 Testing connectDatabase function...');
    
    if (!process.env.MONGODB_URI) {
      console.log('⚠️ No MONGODB_URI provided, running without database');
      return false;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name || 'default'}`);
    
    // Test AI Trainer import
    try {
      const { default: AITrainerService } = await import('./src/services/AITrainerService.js');
      console.log('✅ AITrainerService imported successfully');
      await AITrainerService.initializeTrainers();
      console.log('🤖 AI Trainers initialized successfully!');
    } catch (aiError) {
      console.log('⚠️ AI Trainers initialization failed:', aiError.message);
      console.log('📋 AI Error details:', aiError);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('📋 Full error:', error);
    return false;
  }
};

testConnectionFunction().then((result) => {
  console.log('🎯 Connection test result:', result ? 'SUCCESS' : 'FAILED');
  process.exit(0);
});