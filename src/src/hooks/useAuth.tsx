import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSubscribed: boolean;  // Added this to fix the error
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: any }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check active session and subscribe to auth changes
  useEffect(() => {
    // Initialize with current session
    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // If user is logged in, check subscription status
      if (session?.user) {
        checkSubscriptionStatus(session.user.id);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check for active session
  const checkSession = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      // If user is logged in, check subscription status
      if (session?.user) {
        await checkSubscriptionStatus(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has an active subscription
  const checkSubscriptionStatus = async (userId: string) => {
    try {
      // Query the payments table to check for active subscription
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'subscription')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      // User is subscribed if there's at least one active subscription
      setIsSubscribed(data && data.length > 0);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsSubscribed(false);
    }
  };

  // Sign up a new user
  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // If auth signup successful, create user profile in the users table
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: email,
              username: username,
              points: 0,
              streak_count: 0,
              last_active_date: new Date().toISOString(),
            },
          ]);

        if (profileError) throw profileError;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error during sign up:', error);
      return { success: false, error };
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update last active date in user profile
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_active_date: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error during login:', error);
      return { success: false, error };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'econquiz://reset-password',
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error during password reset:', error);
      return { success: false, error };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isSubscribed,  // Include this in the context value
    login,
    signUp,
    resetPassword,
    logout,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;