// scripts/generate-test-passwords.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const logger = require('../src/utils/logger');

async function generatePasswordHash(password, saltRounds = 10) {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error(`Error generating hash: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('Generating test password hashes...');
  
  try {
    const adminHash = await generatePasswordHash('admin123');
    const staffHash = await generatePasswordHash('staff123');
    
    console.log('\nUse these hashes in your users array:');
    console.log('===================================');
    console.log(`Admin user hash for 'admin123': ${adminHash}`);
    console.log(`Staff user hash for 'staff123': ${staffHash}`);
    console.log('\nExample user array:');
    console.log(`
const users = [
  {
    id: 1,
    username: 'admin',
    passwordHash: '${adminHash}',
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: 2,
    username: 'staff',
    passwordHash: '${staffHash}',
    role: 'staff',
    name: 'Staff User'
  }
];
    `);
  } catch (error) {
    console.error('Failed to generate password hashes:', error);
  }
}

main().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});