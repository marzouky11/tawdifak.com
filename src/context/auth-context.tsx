
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, onIdTokenChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User as AppUser } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: AppUser | null;
  loading: boolean;
  setUserData: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  setUserData: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData({ id: doc.id, ...doc.data() } as AppUser);
        } else {
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
      return () => unsubscribeSnapshot();
    }
  }, [user]);

  // Keeps the server-side session cookie (used by src/middleware.ts to protect
  // /admin routes) in sync with the client's Firebase auth state. This is
  // additive: it never affects `user`/`userData`/`loading` above, and if
  // the request fails for any reason it's swallowed so login/logout on the
  // client is never blocked by it.
  //
  // Traffic note: previously this called /api/session-logout on EVERY page load of
  // every anonymous visitor, and /api/session-login on every page load (and hourly
  // token refresh) of every signed-in user — one serverless call each time. Now:
  //  - login sync runs at most once per 24h per user (the cookie itself lasts 5 days);
  //  - logout sync runs only when a user actually signs out during this visit.
  useEffect(() => {
    const SYNC_KEY = 'tawdifak_session_synced';
    const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
    let hadUser = false;

    const unsubscribeIdToken = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          hadUser = true;
          let alreadySynced = false;
          try {
            const raw = window.localStorage.getItem(SYNC_KEY);
            const saved = raw ? JSON.parse(raw) : null;
            alreadySynced = !!saved && saved.uid === firebaseUser.uid && Date.now() - saved.at < SYNC_INTERVAL_MS;
          } catch {
            // storage unavailable: just sync
          }
          if (alreadySynced) return;

          const idToken = await firebaseUser.getIdToken();
          const res = await fetch('/api/session-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          const body = await res.json().catch(() => null);
          if (body?.status === 'success') {
            try {
              window.localStorage.setItem(SYNC_KEY, JSON.stringify({ uid: firebaseUser.uid, at: Date.now() }));
            } catch {
              // ignore
            }
          }
        } else {
          try {
            window.localStorage.removeItem(SYNC_KEY);
          } catch {
            // ignore
          }
          if (!hadUser) return; // anonymous visitor: nothing to clear
          hadUser = false;
          await fetch('/api/session-logout', { method: 'POST' });
        }
      } catch (error) {
        console.error('Error syncing server session:', error);
      }
    });

    return () => unsubscribeIdToken();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
