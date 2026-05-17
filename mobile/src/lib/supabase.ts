import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database';

const SUPABASE_URL = 'https://nnlwgwlvdrvwbmzeugfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubHdnd2x2ZHJ2d2JtemV1Z2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODI2MjgsImV4cCI6MjA3NDY1ODYyOH0.7IMMcK-tLMgYWnAZFK6oxXXeTOoRb_3OJl269ySU5uI';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const isSupabaseConfigured = () => true;
