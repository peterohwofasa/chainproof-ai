const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    // MongoDB connection string from .env
    const MONGODB_URI = 'mongodb+srv://gatherdotech_db_user:ulMgjzMySg1QvpXw@cluster0.jpreql8.mongodb.net/chainproof-ai?retryWrites=true&w=majority';
    const mongoUri = MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Simple audit schema for testing
const auditSchema = new mongoose.Schema({}, { strict: false });
const Audit = mongoose.model('Audit', auditSchema);

async function checkAudits() {
  await connectDB();
  
  try {
    const audits = await Audit.find().limit(5);
    console.log('Audits found:', audits.length);
    
    if (audits.length > 0) {
      console.log('Sample audit:');
      console.log(JSON.stringify(audits[0], null, 2));
    } else {
      console.log('No audits found in database');
    }
  } catch (error) {
    console.error('Error fetching audits:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAudits();