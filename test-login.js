import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing authentication...');
  
  // First test the RPC call
  console.log('\n1. Testing authenticate_user_by_handle RPC:');
  const { data: authResult, error: rpcError } = await supabase
    .rpc('authenticate_user_by_handle', { handle_input: 'demo' });
  
  if (rpcError) {
    console.error('RPC Error:', rpcError);
    return;
  }
  
  console.log('RPC Result:', authResult);
  
  if (authResult && authResult.success) {
    console.log('\n2. Testing signInWithPassword:');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authResult.auth_email,
      password: 'demo123',
    });
    
    if (error) {
      console.error('Auth Error:', error);
    } else {
      console.log('Login successful!');
      console.log('User ID:', data.user.id);
    }
  }
}

testLogin().catch(console.error);
