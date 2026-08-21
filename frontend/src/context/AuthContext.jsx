import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth.api';
import { usersApi } from '../api/users.api';
import { clearTokens, onSessionExpired, setTokens } from '../lib/apiClient';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if we already hold an access token, fetch the live user
  // record from the backend rather than trusting stale localStorage data.
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        setTokens({ accessToken: session.access_token });
        const me = await usersApi.getMe();
        if (!cancelled) setUser(me);
      } catch (err) {
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restoreSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        clearTokens();
        setUser(null);
        return;
      }
      setTokens({ accessToken: session.access_token });
      try {
        const me = await usersApi.getMe();
        if (!cancelled) setUser(me);
      } catch (err) {
        if (!cancelled) setUser(null);
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => onSessionExpired(() => setUser(null)), []);

  const applyAuthResult = (result) => {
    setTokens(result);
    setUser(result.user);
    return result.user;
  };

  const login = async (identifier, password) => {
    const credentials = identifier.includes('@') ? { email: identifier } : { phone: identifier };
    const { data, error } = await supabase.auth.signInWithPassword({ ...credentials, password });
    if (error) throw error;
    setTokens({ accessToken: data.session.access_token });
    const me = await usersApi.getMe();
    setUser(me);
    return me;
  };

  const register = async (payload) => {
    const credentials = payload.email ? { email: payload.email } : { phone: payload.phone };
    const { data, error } = await supabase.auth.signUp({
      ...credentials,
      password: payload.password,
      options: { data: { name: payload.name, full_name: payload.name, phone: payload.phone || null } },
    });
    if (error) throw error;
    if (!data.session) throw new Error('Account created. Check your email to confirm your account, then sign in.');
    setTokens({ accessToken: data.session.access_token });
    const me = await usersApi.getMe();
    setUser(me);
    return me;
  };

  const loginWithGoogle = async (redirectTo = '/') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    });
    if (error) throw error;
  };

  const verifyOtp = async (payload) => {
    const result = await authApi.verifyOtp(payload);
    if (result.user) applyAuthResult(result);
    return result;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Ignore network errors on logout — we clear local state regardless.
    }
    clearTokens();
    setUser(null);
  };

  const refreshProfile = async () => {
    const me = await usersApi.getMe();
    setUser(me);
    return me;
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      register,
      loginWithGoogle,
      verifyOtp,
      logout,
      refreshProfile,
      requestOtp: authApi.requestOtp,
      forgotPassword: authApi.forgotPassword,
      resetPassword: authApi.resetPassword,
      changePassword: authApi.changePassword,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
