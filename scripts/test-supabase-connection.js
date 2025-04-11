// Simple script to test basic connectivity to Supabase
// Uses plain JavaScript to avoid any TypeScript compilation issues
const https = require('https');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  process.exit(1);
}

// Extract hostname from URL
const url = new URL(supabaseUrl);
const hostname = url.hostname;

console.log(`Testing connection to Supabase at ${hostname}...`);

// Make a basic HTTPS request to the Supabase domain
const req = https.get({
  hostname: hostname,
  port: 443,
  path: '/',
  method: 'GET',
  timeout: 10000, // 10 second timeout
}, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Connection test successful');
    console.log(`Response length: ${data.length} bytes`);
    
    // Print environment variables for debugging (redacting sensitive portions)
    console.log('\nEnvironment configuration:');
    console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    
    // Only show first few characters of keys
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey.substring(0, 15)}...`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceKey.substring(0, 15)}...`);
  });
});

req.on('error', (e) => {
  console.error(`Connection test failed: ${e.message}`);
  
  if (e.code === 'ENOTFOUND') {
    console.error('DNS resolution failed. The Supabase project may not exist or you may have network connectivity issues.');
  } else if (e.code === 'ETIMEDOUT') {
    console.error('Connection timed out. Check your network settings or firewall configuration.');
  }
  
  // Print environment variables for debugging (redacting sensitive portions)
  console.log('\nEnvironment configuration:');
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  // Only show first few characters of keys
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey.substring(0, 15)}...`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceKey.substring(0, 15)}...`);
});

req.on('timeout', () => {
  console.error('Connection timed out');
  req.destroy();
});
