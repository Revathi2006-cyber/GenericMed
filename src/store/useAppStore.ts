import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MedicineResult } from '../services/geminiService';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface HistoryItem {
  id: string;
  date: string;
  image: string;
  results: MedicineResult[];
}

interface AppState {
  prescriptionImage: string | null;
  setPrescriptionImage: (image: string | null) => void;
  results: MedicineResult[];
  setResults: (results: MedicineResult[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
  saveToHistory: (image: string, results: MedicineResult[]) => Promise<void>;
  clearHistory: () => Promise<void>;
  fetchHistory: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      prescriptionImage: null,
      setPrescriptionImage: (image) => set({ prescriptionImage: image }),
      results: [],
      setResults: (results) => set({ results }),
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      history: [],
      setHistory: (history) => set({ history }),
      saveToHistory: async (image, results) => {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const newItem: HistoryItem = {
          id,
          date: new Date().toISOString(),
          image,
          results,
        };
        
        set((state) => ({
          history: [newItem, ...state.history],
        }));

        const user = auth.currentUser;
        if (user) {
          const path = `history/${newItem.id}`;
          try {
            await setDoc(doc(db, 'history', newItem.id), {
              ...newItem,
              uid: user.uid
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
          }
        }
      },
      clearHistory: async () => {
        const currentHistory = get().history;
        set({ history: [] });
        
        const user = auth.currentUser;
        if (user) {
          try {
            for (const item of currentHistory) {
              const path = `history/${item.id}`;
              try {
                await deleteDoc(doc(db, 'history', item.id));
              } catch (error) {
                handleFirestoreError(error, OperationType.DELETE, path);
              }
            }
          } catch (error) {
            console.error("Error clearing history from Firestore", error);
          }
        }
      },
      fetchHistory: async () => {
        const user = auth.currentUser;
        if (user) {
          const path = 'history';
          try {
            const q = query(
              collection(db, 'history'),
              where('uid', '==', user.uid)
            );
            const querySnapshot = await getDocs(q);
            const fetchedHistory: HistoryItem[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              fetchedHistory.push({
                id: doc.id,
                date: data.date,
                image: data.image,
                results: data.results
              });
            });
            
            // Sort by date descending
            fetchedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            set({ history: fetchedHistory });
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, path);
          }
        }
      }
    }),
    {
      name: 'genericmed-storage',
      partialize: (state) => ({ history: state.history }),
    }
  )
);
