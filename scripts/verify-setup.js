#!/usr/bin/env node

/**
 * Setup verification script
 * Run with: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 LearningOS Setup Verification\n');

let hasErrors = false;

// Check 1: .env.local exists
console.log('📝 Checking environment variables...');
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  console.log('   → Copy .env.example to .env.local and fill in your values\n');
  hasErrors = true;
} else {
  console.log('✅ .env.local file exists');
  
  // Check required variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'OPENAI_API_KEY',
  ];
  
  const missing = required.filter(key => !envContent.includes(`${key}=`));
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables:`);
    missing.forEach(key => console.log(`   - ${key}`));
    hasErrors = true;
  } else {
    console.log('✅ Required environment variables are set\n');
  }
}

// Check 2: node_modules exists
console.log('📦 Checking dependencies...');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ node_modules not found');
  console.log('   → Run: npm install\n');
  hasErrors = true;
} else {
  console.log('✅ Dependencies installed\n');
}

// Check 3: Required directories
console.log('📁 Checking project structure...');
const requiredDirs = [
  'src/app',
  'src/components',
  'src/lib/firebase',
  'src/lib/ai',
  'src/types',
];

const missingDirs = requiredDirs.filter(dir => 
  !fs.existsSync(path.join(process.cwd(), dir))
);

if (missingDirs.length > 0) {
  console.error('❌ Missing directories:');
  missingDirs.forEach(dir => console.log(`   - ${dir}`));
  hasErrors = true;
} else {
  console.log('✅ Project structure is correct\n');
}

// Summary
console.log('═══════════════════════════════════════\n');
if (hasErrors) {
  console.log('❌ Setup incomplete. Please fix the issues above.\n');
  console.log('Need help? Check SETUP_DAY2.md for detailed instructions.\n');
  process.exit(1);
} else {
  console.log('✅ Setup looks good!\n');
  console.log('Next steps:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Test connections: http://localhost:3000/api/test-connections\n');
  process.exit(0);
}
