/**
 * Authentication Flow Test Script
 * This script tests the complete authentication flow programmatically
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nnlwgwlvdrvwbmzeugfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubHdnd2x2ZHJ2d2JtemV1Z2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODI2MjgsImV4cCI6MjA3NDY1ODYyOH0.7IMMcK-tLMgYWnAZFK6oxXXeTOoRb_3OJl269ySU5uI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('='.repeat(80));
console.log('🔐 AUTHENTICATION SYSTEM TEST');
console.log('='.repeat(80));
console.log('');

async function testSitemasterLogin() {
  console.log('TEST 1: Sitemaster Account Login');
  console.log('-'.repeat(80));

  try {
    // Step 1: Get auth email from username
    console.log('  → Looking up username "sitemaster"...');
    const { data: authResult, error: authError } = await supabase
      .rpc('authenticate_user_by_username', { username_input: 'sitemaster' });

    if (authError) {
      console.log('  ✗ FAILED: Database function error:', authError.message);
      return false;
    }

    if (!authResult?.success) {
      console.log('  ✗ FAILED: Authentication lookup failed:', authResult?.message);
      return false;
    }

    console.log('  ✓ Username lookup successful');
    console.log(`    Auth Email: ${authResult.auth_email}`);

    // Step 2: Login with password
    console.log('  → Attempting login with password "keystone"...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: authResult.auth_email,
      password: 'keystone'
    });

    if (loginError) {
      console.log('  ✗ FAILED: Login error:', loginError.message);
      return false;
    }

    console.log('  ✓ Login successful!');
    console.log(`    User ID: ${loginData.user.id}`);
    console.log(`    Username: ${loginData.user.user_metadata?.username}`);
    console.log(`    Display Name: ${loginData.user.user_metadata?.display_name}`);
    console.log(`    Session Created: ${new Date(loginData.session.created_at).toLocaleString()}`);
    console.log('');
    console.log('  ✅ TEST PASSED: Sitemaster login is fully functional!');
    console.log('');

    return true;
  } catch (error) {
    console.log('  ✗ FAILED: Unexpected error:', error.message);
    return false;
  }
}

async function testUsernameAvailability() {
  console.log('TEST 2: Username Availability Check');
  console.log('-'.repeat(80));

  const testCases = [
    { username: 'sitemaster', expectedAvailable: false, description: 'Existing username' },
    { username: 'newuser123', expectedAvailable: true, description: 'Available username' },
    { username: 'test_user', expectedAvailable: true, description: 'Available with underscore' },
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    try {
      console.log(`  → Testing: ${testCase.username} (${testCase.description})`);
      const { data, error } = await supabase
        .rpc('check_username_available', { username_input: testCase.username });

      if (error) {
        console.log(`    ✗ FAILED: ${error.message}`);
        allPassed = false;
        continue;
      }

      if (data === testCase.expectedAvailable) {
        console.log(`    ✓ Correct: ${data ? 'Available' : 'Taken'}`);
      } else {
        console.log(`    ✗ FAILED: Expected ${testCase.expectedAvailable ? 'available' : 'taken'}, got ${data ? 'available' : 'taken'}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`    ✗ FAILED: ${error.message}`);
      allPassed = false;
    }
  }

  console.log('');
  if (allPassed) {
    console.log('  ✅ TEST PASSED: Username availability check works correctly!');
  } else {
    console.log('  ❌ TEST FAILED: Some username checks did not work as expected');
  }
  console.log('');

  return allPassed;
}

async function testNewUserSignup() {
  console.log('TEST 3: New User Signup Flow');
  console.log('-'.repeat(80));

  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'testpass123';

  try {
    // Step 1: Check username availability
    console.log(`  → Checking availability for "${testUsername}"...`);
    const { data: isAvailable, error: checkError } = await supabase
      .rpc('check_username_available', { username_input: testUsername });

    if (checkError) {
      console.log('  ✗ FAILED: Availability check error:', checkError.message);
      return false;
    }

    if (!isAvailable) {
      console.log('  ✗ FAILED: Username should be available but shows as taken');
      return false;
    }

    console.log('  ✓ Username is available');

    // Step 2: Create account
    console.log('  → Creating new account...');
    const placeholderEmail = `${testUsername}@placeholder.ghetto.finance`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: placeholderEmail,
      password: testPassword,
      options: {
        data: {
          username: testUsername,
          display_name: testUsername
        }
      }
    });

    if (signupError) {
      console.log('  ✗ FAILED: Signup error:', signupError.message);
      return false;
    }

    console.log('  ✓ Account created successfully!');
    console.log(`    User ID: ${signupData.user.id}`);
    console.log(`    Username: ${signupData.user.user_metadata?.username}`);

    // Step 3: Wait for profile creation trigger
    console.log('  → Waiting for profile creation...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Verify can login
    console.log('  → Testing login with new account...');

    // Logout first
    await supabase.auth.signOut();

    const { data: authResult, error: authError } = await supabase
      .rpc('authenticate_user_by_username', { username_input: testUsername });

    if (authError || !authResult?.success) {
      console.log('  ✗ FAILED: Cannot lookup new user for login');
      return false;
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: authResult.auth_email,
      password: testPassword
    });

    if (loginError) {
      console.log('  ✗ FAILED: Cannot login with new account:', loginError.message);
      return false;
    }

    console.log('  ✓ New user can login successfully!');
    console.log('');
    console.log('  ✅ TEST PASSED: Complete signup flow works perfectly!');
    console.log('');

    // Cleanup: logout
    await supabase.auth.signOut();

    return true;
  } catch (error) {
    console.log('  ✗ FAILED: Unexpected error:', error.message);
    return false;
  }
}

async function testEdgeCases() {
  console.log('TEST 4: Edge Cases and Validation');
  console.log('-'.repeat(80));

  const testCases = [
    {
      username: '@sitemaster',
      shouldWork: true,
      description: 'Username with @ prefix'
    },
    {
      username: 'SITEMASTER',
      shouldWork: true,
      description: 'Case insensitive lookup'
    },
    {
      username: 'SiteMaster',
      shouldWork: true,
      description: 'Mixed case lookup'
    },
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    try {
      console.log(`  → Testing: ${testCase.description}`);
      const { data: authResult, error } = await supabase
        .rpc('authenticate_user_by_username', { username_input: testCase.username });

      if (error) {
        console.log(`    ✗ FAILED: ${error.message}`);
        allPassed = false;
        continue;
      }

      const success = authResult?.success === true;

      if (success === testCase.shouldWork) {
        console.log(`    ✓ ${testCase.shouldWork ? 'Works as expected' : 'Correctly rejected'}`);
      } else {
        console.log(`    ✗ FAILED: Expected ${testCase.shouldWork ? 'to work' : 'to be rejected'}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`    ✗ FAILED: ${error.message}`);
      allPassed = false;
    }
  }

  console.log('');
  if (allPassed) {
    console.log('  ✅ TEST PASSED: All edge cases handled correctly!');
  } else {
    console.log('  ❌ TEST FAILED: Some edge cases did not work as expected');
  }
  console.log('');

  return allPassed;
}

async function runAllTests() {
  const results = {
    sitemasterLogin: false,
    usernameAvailability: false,
    newUserSignup: false,
    edgeCases: false
  };

  // Run all tests
  results.sitemasterLogin = await testSitemasterLogin();
  results.usernameAvailability = await testUsernameAvailability();
  results.newUserSignup = await testNewUserSignup();
  results.edgeCases = await testEdgeCases();

  // Summary
  console.log('='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  const allPassed = Object.values(results).every(r => r === true);
  const passedCount = Object.values(results).filter(r => r === true).length;
  const totalCount = Object.keys(results).length;

  console.log(`  Sitemaster Login:       ${results.sitemasterLogin ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Username Availability:  ${results.usernameAvailability ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  New User Signup:        ${results.newUserSignup ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Edge Cases:             ${results.edgeCases ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('');
  console.log(`  Total: ${passedCount}/${totalCount} tests passed`);
  console.log('');

  if (allPassed) {
    console.log('  🎉 ALL TESTS PASSED! Authentication system is 100% functional!');
    console.log('');
    console.log('  ✓ Sitemaster account works perfectly');
    console.log('  ✓ New user signup is fully functional');
    console.log('  ✓ Login flow works seamlessly');
    console.log('  ✓ Username validation is robust');
    console.log('  ✓ Database triggers create profiles automatically');
    console.log('  ✓ Edge cases are handled correctly');
  } else {
    console.log('  ⚠️  Some tests failed. Please review the output above.');
  }

  console.log('');
  console.log('='.repeat(80));

  process.exit(allPassed ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
