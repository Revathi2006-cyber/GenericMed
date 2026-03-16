import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MedicineResult } from '../services/geminiService';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';

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
        const newItem: HistoryItem = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          image,
          results,
        };
        
        set((state) => ({
          history: [newItem, ...state.history],
        }));

        const user = auth.currentUser;
        if (user) {
          try {
            await setDoc(doc(db, 'history', newItem.id), {
              ...newItem,
              uid: user.uid
            });
          } catch (error) {
            console.error("Error saving history to Firestore", error);
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
              await deleteDoc(doc(db, 'history', item.id));
            }
          } catch (error) {
            console.error("Error clearing history from Firestore", error);
          }
        }
      },
      fetchHistory: async () => {
        const user = auth.currentUser;
        if (user) {
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
            console.error("Error fetching history from Firestore", error);
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
