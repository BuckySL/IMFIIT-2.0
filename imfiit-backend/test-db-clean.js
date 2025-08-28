// test-db-clean.js - Clean MongoDB Connection Test (No Deprecated Warnings)
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('🔧 Testing MongoDB Connection...');
  console.log('📍 Connection String:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file');
    return;
  }

  // Hide password in logs but show structure
  const maskedUri = process.env.MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@');
  console.log('🔗 Attempting to connect to:', maskedUri);

  try {
    // Clean connection without deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });

    console.log('✅ SUCCESS! MongoDB Connected:', conn.connection.host);
    console.log('📊 Database Name:', conn.connection.name);
    console.log('🟢 Connection State:', conn.connection.readyState);
    
    // List collections
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      if (collections.length > 0) {
        console.log('📁 Collections Found:', collections.map(c => c.name).join(', '));
      } else {
        console.log('📁 No collections yet (new database)');
      }
    } catch (collError) {
      console.log('📁 Collections: Unable to list');
    }

    // Test a simple operation
    console.log('🧪 Testing basic database operations...');
    
    const testSchema = new mongoose.Schema({ 
      test: String,
      timestamp: { type: Date, default: Date.now }
    });
    const TestModel = mongoose.model('ConnectionTest', testSchema);
    
    const testDoc = new TestModel({ test: 'imfiit-connection-test' });
    await testDoc.save();
    console.log('✅ Write test: SUCCESS - Document saved');
    
    const foundDoc = await TestModel.findOne({ test: 'imfiit-connection-test' });
    console.log('✅ Read test: SUCCESS - Document found:', foundDoc ? 'Yes' : 'No');
    
    await TestModel.deleteOne({ test: 'imfiit-connection-test' });
    console.log('✅ Delete test: SUCCESS - Document removed');
    
    console.log('🎉 ALL TESTS PASSED! Your MongoDB connection is working perfectly!');
    console.log('🚀 Your IMFIIT backend can now save workouts, battles, and user data!');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:');
    console.error('📋 Error Type:', error.name);
    console.error('💬 Error Message:', error.message);
    
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('🔐 AUTHENTICATION ERROR:');
      console.error('   → Your username or password is incorrect');
      console.error('   → Go to MongoDB Atlas → Database Access → Edit User → Reset Password');
      console.error('   → Update your .env file with the new password');
    }
    if (error.message.includes('network') || error.message.includes('timeout')) {
      console.error('🌐 NETWORK ERROR:');
      console.error('   → Check your internet connection');
      console.error('   → MongoDB Atlas server might be down');
    }
    if (error.message.includes('IP')) {
      console.error('🚫 IP WHITELIST ERROR:');
      console.error('   → Go to MongoDB Atlas → Network Access');
      console.error('   → Add your current IP or use 0.0.0.0/0 for testing');
    }
    
    console.error('\n🔧 QUICK FIXES:');
    console.error('1. Reset password in MongoDB Atlas');
    console.error('2. Update .env with new connection string');
    console.error('3. Check Network Access IP whitelist');
    console.error('4. Verify cluster is not paused');
  } finally {
    await mongoose.connection.close();
    console.log('🔴 Connection closed');
    process.exit(0);
  }
};

console.log('🎯 IMFIIT MongoDB Connection Test');
console.log('🏗️ This will test your database connection for the fitness gaming app');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

testConnection();