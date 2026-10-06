import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { fetchUserProfile } from '../firebase/auth';
import type { AppUser } from '../types';

export interface SimpleAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  currentUser: User | SimpleAuthUser | null;
  userProfile: AppUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | SimpleAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkLocalSession = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem('qw_active_user');
      if (stored) {
        const parsed = JSON.parse(stored) as AppUser;
        setCurrentUser({
          uid: parsed.uid,
          email: parsed.email,
          displayName: parsed.name,
        });
        setUserProfile({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        });
        setLoading(false);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (currentUser) {
      const profile = await fetchUserProfile(currentUser);
      if (profile) {
        setUserProfile(profile);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    // 1. Check local session storage first
    const hasSession = checkLocalSession();
    if (hasSession) {
      setLoading(false);
    }

    // 2. Listen to custom event for immediate login/logout state changes
    const handleAuthChange = () => {
      const found = checkLocalSession();
      if (!found && !auth.currentUser) {
        setCurrentUser(null);
        setUserProfile(null);
      }
    };
    window.addEventListener('qw_auth_change', handleAuthChange);

    // 3. Setup Firebase Auth state listener
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          const profile = await fetchUserProfile(user);
          setUserProfile(profile);
        } else {
          // If no Firebase user, only clear if no local active session exists
          const activeStored = localStorage.getItem('qw_active_user');
          if (!activeStored) {
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('qw_auth_change', handleAuthChange);
      unsubscribe();
    };
  }, [checkLocalSession]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
