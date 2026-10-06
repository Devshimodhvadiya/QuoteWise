import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import type { Requirement, Vendor, Quotation, Comparison, AppUser } from '../types';
import { demoStore } from '../utils/demoStore';

export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return import.meta.env.VITE_FIREBASE_API_KEY === 'AIzaSyDemoKeyForDevelopment';
};

// ===========================
// Helpers
// ===========================
const toDate = (v: unknown): Date => {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
};

// ===========================
// Users
// ===========================
export const getUser = async (uid: string): Promise<AppUser | null> => {
  if (isDemoMode() || uid.startsWith('usr-') || uid.startsWith('demo-')) {
    return demoStore.getUser(uid);
  }
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: d.uid,
      name: d.name,
      email: d.email,
      companyName: d.companyName,
      role: d.role,
      department: d.department,
      status: d.status,
      assignedCount: d.assignedCount,
      createdAt: toDate(d.createdAt),
    };
  } catch (err) {
    console.warn('Firestore getUser fallback:', err);
    return demoStore.getUser(uid);
  }
};

export const getCompanyUsers = async (companyName: string): Promise<AppUser[]> => {
  if (!companyName || !companyName.trim()) return [];
  const clean = companyName.trim();
  if (isDemoMode()) {
    return demoStore.getUsers(clean);
  }
  try {
    const q = query(collection(db, 'users'), where('companyName', '==', clean));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: data.uid,
        name: data.name,
        email: data.email,
        companyName: data.companyName,
        role: data.role,
        department: data.department,
        status: data.status,
        assignedCount: data.assignedCount,
        createdAt: toDate(data.createdAt),
      };
    });
  } catch (err) {
    console.warn('Firestore getCompanyUsers fallback:', err);
    return demoStore.getUsers(clean);
  }
};

export const subscribeCompanyUsers = (
  companyName: string,
  onUpdate: (users: AppUser[]) => void
): Unsubscribe => {
  if (!companyName || !companyName.trim()) {
    onUpdate([]);
    return () => {};
  }
  const clean = companyName.trim();

  // If in demo mode or fallback
  if (isDemoMode()) {
    onUpdate(demoStore.getUsers(clean));
    const handleUpdate = () => {
      onUpdate(demoStore.getUsers(clean));
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleUpdate);
      window.addEventListener('qw_users_updated', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleUpdate);
        window.removeEventListener('qw_users_updated', handleUpdate);
      }
    };
  }

  // Real-time Firestore snapshot listener
  try {
    const q =
      clean.toLowerCase() === 'all'
        ? query(collection(db, 'users'))
        : query(collection(db, 'users'), where('companyName', '==', clean));
    const unsubscribeFirestore = onSnapshot(
      q,
      (snap) => {
        const users = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: data.uid,
            name: data.name,
            email: data.email,
            companyName: data.companyName,
            role: data.role,
            department: data.department,
            status: data.status,
            assignedCount: data.assignedCount,
            createdAt: toDate(data.createdAt),
          };
        });
        onUpdate(users);
      },
      (err) => {
        console.warn('Firestore real-time listener error, falling back:', err);
        onUpdate(demoStore.getUsers(clean));
      }
    );
    return unsubscribeFirestore;
  } catch (err) {
    console.warn('Firestore subscription init error:', err);
    onUpdate(demoStore.getUsers(clean));
    return () => {};
  }
};

export const updateUserRole = async (uid: string, role: 'admin' | 'employee') => {
  if (isDemoMode() || uid.startsWith('usr-') || uid.startsWith('demo-')) {
    demoStore.updateUserRole(uid, role);
    return;
  }
  try {
    await updateDoc(doc(db, 'users', uid), { role });
  } catch (err) {
    console.warn('Firestore updateUserRole fallback:', err);
    demoStore.updateUserRole(uid, role);
  }
};

export const updateUserStatus = async (uid: string, status: 'active' | 'suspended') => {
  if (isDemoMode() || uid.startsWith('usr-') || uid.startsWith('demo-')) {
    demoStore.updateUserStatus(uid, status);
    return;
  }
  try {
    await updateDoc(doc(db, 'users', uid), { status });
  } catch (err) {
    console.warn('Firestore updateUserStatus fallback:', err);
    demoStore.updateUserStatus(uid, status);
  }
};

export const createCompanyUser = async (user: AppUser) => {
  if (isDemoMode() || user.uid.startsWith('usr-') || user.uid.startsWith('demo-')) {
    demoStore.addUser(user);
    return;
  }
  try {
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, { ...user, createdAt: serverTimestamp() });
  } catch (err) {
    console.warn('Firestore createCompanyUser fallback:', err);
    demoStore.addUser(user);
  }
};

// ===========================
// Requirements
// ===========================
const reqFromDoc = (d: DocumentData & { id: string }): Requirement => ({
  id: d.id,
  title: d.title,
  description: d.description,
  category: d.category,
  quantity: d.quantity,
  unit: d.unit,
  budget: d.budget,
  deadline: toDate(d.deadline),
  status: d.status,
  createdBy: d.createdBy,
  createdByName: d.createdByName,
  companyId: d.companyId,
  maxBudget: d.maxBudget,
  maxDeliveryDays: d.maxDeliveryDays,
  minWarrantyMonths: d.minWarrantyMonths,
  minVendorRating: d.minVendorRating,
  createdAt: toDate(d.createdAt),
  updatedAt: toDate(d.updatedAt),
});

export const createRequirement = async (
  data: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  if (isDemoMode()) {
    return demoStore.createRequirement(data);
  }
  try {
    const ref = await addDoc(collection(db, 'requirements'), {
      ...data,
      deadline: Timestamp.fromDate(new Date(data.deadline)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.warn('Firestore createRequirement fallback:', err);
    return demoStore.createRequirement(data);
  }
};

export const getRequirements = async (companyId: string): Promise<Requirement[]> => {
  if (!companyId || !companyId.trim()) return [];
  const clean = companyId.trim();
  if (isDemoMode()) {
    return demoStore.getRequirements(clean);
  }
  try {
    const q = query(
      collection(db, 'requirements'),
      where('companyId', '==', clean),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => reqFromDoc({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Firestore getRequirements fallback:', err);
    return demoStore.getRequirements(clean);
  }
};

export const getRequirement = async (id: string, companyId?: string): Promise<Requirement | null> => {
  if (isDemoMode() || id.startsWith('req-')) {
    return demoStore.getRequirement(id, companyId);
  }
  try {
    const snap = await getDoc(doc(db, 'requirements', id));
    if (!snap.exists()) return null;
    const req = reqFromDoc({ id: snap.id, ...snap.data() });
    if (companyId && req.companyId.trim().toLowerCase() !== companyId.trim().toLowerCase()) {
      return null;
    }
    return req;
  } catch (err) {
    console.warn('Firestore getRequirement fallback:', err);
    return demoStore.getRequirement(id, companyId);
  }
};

export const updateRequirement = async (
  id: string,
  data: Partial<Omit<Requirement, 'id' | 'createdAt'>>
): Promise<void> => {
  if (isDemoMode() || id.startsWith('req-')) {
    demoStore.updateRequirement(id, data);
    return;
  }
  try {
    const payload: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
    if (data.deadline) {
      payload.deadline = Timestamp.fromDate(new Date(data.deadline));
    }
    await updateDoc(doc(db, 'requirements', id), payload);
  } catch (err) {
    console.warn('Firestore updateRequirement fallback:', err);
    demoStore.updateRequirement(id, data);
  }
};

export const deleteRequirement = async (id: string): Promise<void> => {
  if (isDemoMode() || id.startsWith('req-')) {
    demoStore.deleteRequirement(id);
    return;
  }
  try {
    await deleteDoc(doc(db, 'requirements', id));
  } catch (err) {
    console.warn('Firestore deleteRequirement fallback:', err);
    demoStore.deleteRequirement(id);
  }
};

// ===========================
// Vendors
// ===========================
const vendorFromDoc = (d: DocumentData & { id: string }): Vendor => ({
  id: d.id,
  name: d.name,
  company: d.company,
  email: d.email,
  phone: d.phone,
  category: d.category,
  rating: d.rating,
  address: d.address,
  notes: d.notes ?? '',
  companyId: d.companyId,
  createdBy: d.createdBy,
  createdAt: toDate(d.createdAt),
  updatedAt: toDate(d.updatedAt),
});

export const createVendor = async (
  data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  if (isDemoMode()) {
    return demoStore.createVendor(data);
  }
  try {
    const ref = await addDoc(collection(db, 'vendors'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.warn('Firestore createVendor fallback:', err);
    return demoStore.createVendor(data);
  }
};

export const getVendors = async (companyId: string): Promise<Vendor[]> => {
  if (!companyId || !companyId.trim()) return [];
  const clean = companyId.trim();
  if (isDemoMode()) {
    return demoStore.getVendors(clean);
  }
  try {
    const q = query(
      collection(db, 'vendors'),
      where('companyId', '==', clean),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => vendorFromDoc({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Firestore getVendors fallback:', err);
    return demoStore.getVendors(clean);
  }
};

export const getVendor = async (id: string, companyId?: string): Promise<Vendor | null> => {
  if (isDemoMode() || id.startsWith('vend-')) {
    return demoStore.getVendor(id, companyId);
  }
  try {
    const snap = await getDoc(doc(db, 'vendors', id));
    if (!snap.exists()) return null;
    const v = vendorFromDoc({ id: snap.id, ...snap.data() });
    if (companyId && v.companyId.trim().toLowerCase() !== companyId.trim().toLowerCase()) {
      return null;
    }
    return v;
  } catch (err) {
    console.warn('Firestore getVendor fallback:', err);
    return demoStore.getVendor(id, companyId);
  }
};

export const updateVendor = async (
  id: string,
  data: Partial<Omit<Vendor, 'id' | 'createdAt'>>
): Promise<void> => {
  if (isDemoMode() || id.startsWith('vend-')) {
    demoStore.updateVendor(id, data);
    return;
  }
  try {
    await updateDoc(doc(db, 'vendors', id), { ...data, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn('Firestore updateVendor fallback:', err);
    demoStore.updateVendor(id, data);
  }
};

export const deleteVendor = async (id: string): Promise<void> => {
  if (isDemoMode() || id.startsWith('vend-')) {
    demoStore.deleteVendor(id);
    return;
  }
  try {
    await deleteDoc(doc(db, 'vendors', id));
  } catch (err) {
    console.warn('Firestore deleteVendor fallback:', err);
    demoStore.deleteVendor(id);
  }
};

// ===========================
// Quotations
// ===========================
const quotFromDoc = (d: DocumentData & { id: string }): Quotation => ({
  id: d.id,
  requirementId: d.requirementId,
  requirementTitle: d.requirementTitle,
  vendorId: d.vendorId,
  vendorName: d.vendorName,
  vendorCompany: d.vendorCompany,
  price: d.price,
  warrantyMonths: d.warrantyMonths,
  deliveryDays: d.deliveryDays,
  vendorRating: d.vendorRating,
  notes: d.notes ?? '',
  companyId: d.companyId,
  submittedAt: toDate(d.submittedAt),
  createdBy: d.createdBy,
  createdAt: toDate(d.createdAt),
});

export const createQuotation = async (
  data: Omit<Quotation, 'id' | 'createdAt'>
): Promise<string> => {
  if (isDemoMode()) {
    return demoStore.createQuotation(data);
  }
  try {
    const ref = await addDoc(collection(db, 'quotations'), {
      ...data,
      submittedAt: Timestamp.fromDate(new Date(data.submittedAt)),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.warn('Firestore createQuotation fallback:', err);
    return demoStore.createQuotation(data);
  }
};

export const getQuotations = async (companyId: string): Promise<Quotation[]> => {
  if (!companyId || !companyId.trim()) return [];
  const clean = companyId.trim();
  if (isDemoMode()) {
    return demoStore.getQuotations(clean);
  }
  try {
    const q = query(
      collection(db, 'quotations'),
      where('companyId', '==', clean),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => quotFromDoc({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Firestore getQuotations fallback:', err);
    return demoStore.getQuotations(clean);
  }
};

export const getQuotationsByRequirement = async (
  requirementId: string,
  companyId?: string
): Promise<Quotation[]> => {
  if (isDemoMode() || requirementId.startsWith('req-')) {
    return demoStore.getQuotationsByRequirement(requirementId, companyId);
  }
  try {
    const q = query(
      collection(db, 'quotations'),
      where('requirementId', '==', requirementId),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => quotFromDoc({ id: d.id, ...d.data() }));
    if (companyId) {
      return list.filter((item) => item.companyId.trim().toLowerCase() === companyId.trim().toLowerCase());
    }
    return list;
  } catch (err) {
    console.warn('Firestore getQuotationsByRequirement fallback:', err);
    return demoStore.getQuotationsByRequirement(requirementId, companyId);
  }
};

export const updateQuotation = async (
  id: string,
  data: Partial<Omit<Quotation, 'id' | 'createdAt'>>
): Promise<void> => {
  if (isDemoMode() || id.startsWith('quot-')) {
    demoStore.updateQuotation(id, data);
    return;
  }
  try {
    await updateDoc(doc(db, 'quotations', id), data);
  } catch (err) {
    console.warn('Firestore updateQuotation fallback:', err);
    demoStore.updateQuotation(id, data);
  }
};

export const deleteQuotation = async (id: string): Promise<void> => {
  if (isDemoMode() || id.startsWith('quot-')) {
    demoStore.deleteQuotation(id);
    return;
  }
  try {
    await deleteDoc(doc(db, 'quotations', id));
  } catch (err) {
    console.warn('Firestore deleteQuotation fallback:', err);
    demoStore.deleteQuotation(id);
  }
};

// ===========================
// Comparisons
// ===========================
const compFromDoc = (d: DocumentData & { id: string }): Comparison => ({
  id: d.id,
  requirementId: d.requirementId,
  requirementTitle: d.requirementTitle,
  weights: d.weights,
  scores: d.scores,
  recommendedVendorId: d.recommendedVendorId,
  recommendedVendorName: d.recommendedVendorName,
  recommendationReason: d.recommendationReason,
  recommendationExplanation: d.recommendationExplanation,
  estimatedSavings: d.estimatedSavings,
  budgetAnalysis: d.budgetAnalysis,
  allRedFlags: d.allRedFlags,
  constraints: d.constraints,
  companyId: d.companyId,
  createdBy: d.createdBy,
  createdByName: d.createdByName,
  createdAt: toDate(d.createdAt),
});

export const saveComparison = async (
  data: Omit<Comparison, 'id' | 'createdAt'>
): Promise<string> => {
  if (isDemoMode()) {
    return demoStore.saveComparison(data);
  }
  try {
    const ref = await addDoc(collection(db, 'comparisons'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.warn('Firestore saveComparison fallback:', err);
    return demoStore.saveComparison(data);
  }
};

export const getComparisons = async (companyId: string): Promise<Comparison[]> => {
  if (!companyId || !companyId.trim()) return [];
  const clean = companyId.trim();
  if (isDemoMode()) {
    return demoStore.getComparisons(clean);
  }
  try {
    const q = query(
      collection(db, 'comparisons'),
      where('companyId', '==', clean),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => compFromDoc({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Firestore getComparisons fallback:', err);
    return demoStore.getComparisons(clean);
  }
};

export const getComparison = async (id: string, companyId?: string): Promise<Comparison | null> => {
  if (isDemoMode() || id.startsWith('comp-')) {
    return demoStore.getComparison(id, companyId);
  }
  try {
    const snap = await getDoc(doc(db, 'comparisons', id));
    if (!snap.exists()) return null;
    const comp = compFromDoc({ id: snap.id, ...snap.data() });
    if (companyId && comp.companyId.trim().toLowerCase() !== companyId.trim().toLowerCase()) {
      return null;
    }
    return comp;
  } catch (err) {
    console.warn('Firestore getComparison fallback:', err);
    return demoStore.getComparison(id, companyId);
  }
};

export const getComparisonsByRequirement = async (
  requirementId: string,
  companyId?: string
): Promise<Comparison[]> => {
  if (isDemoMode() || requirementId.startsWith('req-')) {
    return demoStore.getComparisonsByRequirement(requirementId, companyId);
  }
  try {
    const q = query(
      collection(db, 'comparisons'),
      where('requirementId', '==', requirementId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => compFromDoc({ id: d.id, ...d.data() }));
    if (companyId) {
      return list.filter((item) => item.companyId.trim().toLowerCase() === companyId.trim().toLowerCase());
    }
    return list;
  } catch (err) {
    console.warn('Firestore getComparisonsByRequirement fallback:', err);
    return demoStore.getComparisonsByRequirement(requirementId, companyId);
  }
};
