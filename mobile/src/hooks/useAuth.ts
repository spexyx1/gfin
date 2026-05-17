import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setState(prev => ({ ...prev, profile: null }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setState(prev => ({ ...prev, profile: data as Profile }));
    }
  };

  const signIn = useCallback(async (identifier: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));

    const isEmail = identifier.includes('@');

    if (isEmail) {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
      setState(prev => ({ ...prev, loading: false }));
      if (error) throw error;
    } else {
      const { data, error } = await supabase.rpc('authenticate_user_by_username', {
        p_username: identifier,
        p_password: password,
      });
      setState(prev => ({ ...prev, loading: false }));
      if (error) throw error;
      if (!data) throw new Error('Invalid credentials');
    }
  }, []);

  const signUp = useCallback(async (handle: string, password: string, displayName: string, email?: string) => {
    setState(prev => ({ ...prev, loading: true }));

    const authEmail = email || `${handle.toLowerCase()}@ghetto.finance`;

    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: {
        data: {
          handle,
          display_name: displayName,
        },
      },
    });

    setState(prev => ({ ...prev, loading: false }));
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, session: null, profile: null, loading: false });
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!state.session,
  };
}
