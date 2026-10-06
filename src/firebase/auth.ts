import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './config';
import type { AppUser } from '../types';
import { demoStore } from '../utils/demoStore';

interface LocalAccount extends AppUser {
  password?: string;
}

const STORAGE_USERS_KEY = 'qw_registered_users';
const STORAGE_ACTIVE_USER_KEY = 'qw_active_user';

// Helper to get all locally stored registered accounts
const getStoredAccounts = (): LocalAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as LocalAccount[];
    return list.map((u) => ({
      ...u,
      createdAt: new Date(u.createdAt),
    }));
  } catch {
    return [];
  }
};

// Helper to persist accounts locally
const saveStoredAccounts = (accounts: LocalAccount[]) => {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Failed to save accounts locally:', err);
  }
};

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  companyName: string
): Promise<AppUser> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCompany = companyName.trim();
  const cleanName = name.trim();

  const accounts = getStoredAccounts();
  const existingUser = accounts.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    const err = new Error('Email already registered');
    (err as { code?: string }).code = 'auth/email-already-in-use';
    throw err;
  }

  // All standard self-registered users are created as employees
  const role: 'employee' = 'employee';

  let createdUid = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Attempt real Firebase registration if configured
  try {
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const { user } = credential;
    createdUid = user.uid;

    await updateProfile(user, { displayName: cleanName });

    const userData: AppUser = {
      uid: user.uid,
      name: cleanName,
      email: cleanEmail,
      companyName: cleanCompany,
      role,
      department: 'Procurement Operations',
      status: 'active',
      createdAt: new Date(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        createdAt: serverTimestamp(),
      });
    } catch (fsErr) {
      console.warn('Firestore setDoc notice:', fsErr);
    }

    // Persist locally for seamless session tracking and offline support
    const newAccount: LocalAccount = {
      ...userData,
      password,
    };
    saveStoredAccounts([...accounts, newAccount]);
    demoStore.addUser(userData);
    localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(userData));
    localStorage.removeItem('qw_demo_current_user');
    window.dispatchEvent(new Event('qw_auth_change'));

    return userData;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    const isFirebaseConfigError =
      code === 'auth/invalid-api-key' ||
      code === 'auth/api-key-not-valid' ||
      code === 'auth/network-request-failed' ||
      import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDemoKeyForDevelopment';

    if (isFirebaseConfigError) {
      // Local authenticated user creation
      const localUser: LocalAccount = {
        uid: createdUid,
        name: cleanName,
        email: cleanEmail,
        companyName: cleanCompany,
        role,
        department: 'Procurement Operations',
        status: 'active',
        password,
        createdAt: new Date(),
      };

      saveStoredAccounts([...accounts, localUser]);
      demoStore.addUser(localUser);
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(localUser));
      localStorage.removeItem('qw_demo_current_user');
      window.dispatchEvent(new Event('qw_auth_change'));
      return localUser;
    }
    throw err;
  }
};

export const ADMIN_CREDENTIALS = {
  email: 'admin@quotewise.com',
  password: 'admin123',
};

export const loginUser = async (email: string, password: string) => {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Dedicated Admin Portal authentication
  const isAdminIdMatch = cleanEmail === 'admin@quotewise.com' || cleanEmail === 'admin';
  if (isAdminIdMatch) {
    if (password === 'admin123') {
      const adminUser: AppUser = {
        uid: 'usr-admin-system-root',
        name: 'System Administrator',
        email: 'admin@quotewise.com',
        companyName: 'QuoteWise Enterprise',
        role: 'admin',
        department: 'Platform Governance',
        status: 'active',
        assignedCount: 14,
        createdAt: new Date('2026-01-01T08:00:00Z'),
      };
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(adminUser));
      localStorage.removeItem('qw_demo_current_user');
      window.dispatchEvent(new Event('qw_auth_change'));
      return {
        user: {
          uid: adminUser.uid,
          email: adminUser.email,
          displayName: adminUser.name,
        },
      };
    } else {
      const error = new Error('Invalid email or password');
      (error as { code?: string }).code = 'auth/wrong-password';
      throw error;
    }
  }

  // 2. Try real Firebase authentication
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const profile = await fetchUserProfile(cred.user);
    if (profile) {
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(profile));
    }
    localStorage.removeItem('qw_demo_current_user');
    window.dispatchEvent(new Event('qw_auth_change'));
    return cred;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    const isFirebaseConfigError =
      code === 'auth/invalid-api-key' ||
      code === 'auth/api-key-not-valid' ||
      code === 'auth/network-request-failed' ||
      import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDemoKeyForDevelopment';

    // 3. Check locally registered accounts
    const accounts = getStoredAccounts();
    const match = accounts.find((u) => u.email.toLowerCase() === cleanEmail);

    if (match) {
      if (match.password === password) {
        localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(match));
        localStorage.removeItem('qw_demo_current_user');
        window.dispatchEvent(new Event('qw_auth_change'));
        return {
          user: {
            uid: match.uid,
            email: match.email,
            displayName: match.name,
          },
        };
      } else {
        const error = new Error('Invalid email or password');
        (error as { code?: string }).code = 'auth/wrong-password';
        throw error;
      }
    }

    if (!isFirebaseConfigError) {
      throw err;
    }

    // Unregistered email entered
    const error = new Error('Invalid email or password');
    (error as { code?: string }).code = 'auth/invalid-credential';
    throw error;
  }
};

export const logoutUser = async () => {
  localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
  localStorage.removeItem('qw_demo_current_user');
  window.dispatchEvent(new Event('qw_auth_change'));
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
};

export const resetPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const fetchUserProfile = async (
  user: User | { uid: string; email?: string | null; displayName?: string | null }
): Promise<AppUser | null> => {
  // 1. Check active session
  try {
    const activeRaw = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
    if (activeRaw) {
      const active = JSON.parse(activeRaw) as AppUser;
      if (active.uid === user.uid || (user.email && active.email.toLowerCase() === user.email.toLowerCase())) {
        return {
          ...active,
          createdAt: new Date(active.createdAt),
        };
      }
    }
  } catch {
    // ignore
  }

  // 2. Check local registered accounts
  const accounts = getStoredAccounts();
  const matched = accounts.find(
    (u) => u.uid === user.uid || (user.email && u.email.toLowerCase() === user.email.toLowerCase())
  );
  if (matched) {
    return matched;
  }

  // 3. Check Firestore
  try {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        uid: data.uid,
        name: data.name,
        email: data.email,
        companyName: data.companyName,
        role: data.role,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    }
  } catch (err) {
    console.warn('Firestore fetchUserProfile notice:', err);
  }

  return null;
};
