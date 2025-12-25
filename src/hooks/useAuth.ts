import { useState, useEffect, createContext, useContext } from 'react';
import { AuthUser } from '../types';
import { supabase, requireSupabase, handleSupabaseError } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Supabase user to AuthUser
  const convertToAuthUser = async (supabaseUser: User): Promise<AuthUser> => {
    try {
      const supabaseClient = requireSupabase();
      
      // Fetch user profile from profiles table
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // If no profile exists, create one
      if (!profile) {
        const username = supabaseUser.user_metadata?.username ||
                        supabaseUser.email?.split('@')[0] ||
                        `user_${Date.now()}`;

        // Extract real email (filter out placeholder emails)
        const realEmail = supabaseUser.email && !supabaseUser.email.includes('@placeholder.ghetto.finance')
          ? supabaseUser.email
          : null;

        const { data: newProfile, error: createError } = await supabaseClient
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            username,
            email: realEmail,
            display_name: supabaseUser.user_metadata?.display_name || username,
            bio: '',
            is_seller: false,
            verified: false,
            stealth_mode: false,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return {
          id: supabaseUser.id,
          username,
          email: realEmail || undefined,
          name: supabaseUser.user_metadata?.display_name || username,
          isSeller: false,
          verified: false,
          createdAt: new Date(supabaseUser.created_at),
          lastLogin: new Date(),
        };
      }

      return {
        id: profile.id,
        username: profile.username,
        email: profile.email || undefined,
        name: profile.display_name,
        avatar: profile.avatar,
        walletAddress: profile.wallet_address,
        isSeller: profile.is_seller,
        verified: profile.verified,
        createdAt: new Date(profile.created_at),
        lastLogin: new Date(),
      };
    } catch (error) {
      logger.error('Error converting user', 'useAuth', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Error getting session', 'useAuth', error);
          setUser(null);
        } else if (session?.user) {
          const authUser = await convertToAuthUser(session.user);
          setUser(authUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        logger.error('Error in getInitialSession', 'useAuth', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Use async block to avoid deadlocks
        (async () => {
          try {
            if (event === 'SIGNED_IN' && session?.user) {
              const authUser = await convertToAuthUser(session.user);
              setUser(authUser);
              setIsLoading(false);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setIsLoading(false);
            }
          } catch (error) {
            logger.error('Error in auth state change', 'useAuth', error);
            setUser(null);
            setIsLoading(false);
          }
        })();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const supabaseClient = requireSupabase();

      // Call database function to get auth email from username
      const { data: authResult, error: lookupError } = await supabaseClient
        .rpc('authenticate_user_by_username', { username_input: username });

      if (lookupError || !authResult?.success) {
        setIsLoading(false);
        throw new Error(authResult?.message || 'Invalid username or password');
      }

      // Use standard Supabase auth with the returned email
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: authResult.auth_email,
        password,
      });

      if (error) {
        logger.error('Login error', 'useAuth', error);
        setIsLoading(false);
        throw new Error('Invalid username or password');
      }

      // User will be set by onAuthStateChange, which will also set isLoading to false
      // Don't set loading to false here to avoid race condition
    } catch (error) {
      setIsLoading(false);
      handleSupabaseError(error);
      throw error;
    }
  };

  const signup = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const supabaseClient = requireSupabase();

      // Clean username (remove @ if provided)
      const cleanUsername = username.startsWith('@') ? username.substring(1).toLowerCase() : username.toLowerCase();

      // Validate username format
      if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
        setIsLoading(false);
        throw new Error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      }

      // Validate password
      if (password.length < 6) {
        setIsLoading(false);
        throw new Error('Password must be at least 6 characters');
      }

      // Check if username is already taken
      const { data: isAvailable } = await supabaseClient
        .rpc('check_username_available', { username_input: cleanUsername });

      if (!isAvailable) {
        setIsLoading(false);
        throw new Error('Username already taken');
      }

      // Generate placeholder email for auth
      const placeholderEmail = `${cleanUsername}@placeholder.ghetto.finance`;

      // Use standard Supabase signup with placeholder email
      const { data, error } = await supabaseClient.auth.signUp({
        email: placeholderEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanUsername,
          },
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        logger.error('Signup error', 'useAuth', error);
        setIsLoading(false);
        throw new Error(error.message || 'Failed to create account');
      }

      if (!data.user) {
        setIsLoading(false);
        throw new Error('Failed to create account');
      }

      // Profile will be created automatically by trigger
      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Convert and set user (auto-login)
      const authUser = await convertToAuthUser(data.user);
      setUser(authUser);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      handleSupabaseError(error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const supabaseClient = requireSupabase();
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        logger.error('Logout error', 'useAuth', error);
      }

      setUser(null);
    } catch (error) {
      logger.error('Logout failed', 'useAuth', error);
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();

      // Map AuthUser fields to database fields
      const profileUpdates: any = {};

      if (updates.username) profileUpdates.username = updates.username;
      if (updates.name) profileUpdates.display_name = updates.name;
      if (updates.avatar) profileUpdates.avatar = updates.avatar;
      if (updates.walletAddress) profileUpdates.wallet_address = updates.walletAddress;
      if (updates.isSeller !== undefined) profileUpdates.is_seller = updates.isSeller;
      if (updates.verified !== undefined) profileUpdates.verified = updates.verified;

      const { data, error } = await supabaseClient
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local user state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    } catch (error) {
      handleSupabaseError(error);
    } finally {
      setIsLoading(false);
    }
  };


  return {
    user,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
  };
}