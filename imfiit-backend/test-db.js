// test-db.js - Quick MongoDB Connection Test
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('🔧 Testing MongoDB Connection...');
  console.log('📍 Connection String:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file');
    console.log('📝 Current .env variables:', Object.keys(process.env).filter(key => key.includes('MONGO')));
    return;
  }

  // Hide password in logs but show structure
  const maskedUri = process.env.MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@');
  console.log('🔗 Attempting to connect to:', maskedUri);

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });

    console.log('✅ SUCCESS! MongoDB Connected:', conn.connection.host);
    console.log('📊 Database Name:', conn.connection.name);
    console.log('🟢 Connection State:', conn.connection.readyState);
    
    // List collections
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📁 Collections Found:', collections.map(c => c.name).join(', '));
    } catch (collError) {
      console.log('📁 Collections: Unable to list (permissions?)');
    }

    // Test a simple operation
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    console.log('🧪 Testing basic operations...');
    const testDoc = new TestModel({ test: 'connection-test' });
    await testDoc.save();
    console.log('✅ Write test: SUCCESS');
    
    await TestModel.deleteOne({ test: 'connection-test' });
    console.log('✅ Delete test: SUCCESS');
    
    console.log('🎉 ALL TESTS PASSED! Your MongoDB connection is working perfectly!');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:');
    console.error('📋 Error Type:', error.name);
    console.error('💬 Error Message:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('🔐 AUTHENTICATION ERROR: Check your username/password');
    }
    if (error.message.includes('network')) {
      console.error('🌐 NETWORK ERROR: Check your internet connection');
    }
    if (error.message.includes('timeout')) {
      console.error('⏰ TIMEOUT ERROR: Database server might be down');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔴 Connection closed');
    process.exit(0);
  }
};

testConnection();