import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { CategoryId } from '@/data/categories';
import { deleteOrphanedPhotos, deletePhoto } from '@/lib/photos';

const STORAGE_KEY = 'findmybin.scans.v1';
// How long a removed scan can still be brought back with "Undo".
const UNDO_WINDOW_MS = 8000;

export type Scan = {
  id: string;
  photoFile: string;
  // What the classifier said.
  category: CategoryId;
  confidence: number;
  // What the user said, if they corrected it. Kept separately so these can be
  // exported later as labels for retraining.
  correctedCategory?: CategoryId;
  confirmed?: boolean;
  createdAt: number;
};

export function effectiveCategory(scan: Scan): CategoryId {
  return scan.correctedCategory ?? scan.category;
}

type ScansContextValue = {
  ready: boolean;
  // Newest first.
  scans: Scan[];
  addScan: (scan: Scan) => void;
  // Pass undefined to clear a correction.
  correctScan: (id: string, category: CategoryId | undefined) => void;
  confirmScan: (id: string) => void;
  // Returns an undo function that is valid for a few seconds.
  removeScan: (id: string) => () => void;
  clearAll: () => void;
};

const ScansContext = createContext<ScansContextValue | null>(null);

function newestFirst(a: Scan, b: Scan) {
  return b.createdAt - a.createdAt;
}

export function ScansProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [scans, setScans] = useState<Scan[]>([]);
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Latest scans for callbacks that need to read before they write.
  const scansRef = useRef(scans);
  useEffect(() => {
    scansRef.current = scans;
  }, [scans]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        const saved: Scan[] = stored ? JSON.parse(stored) : [];
        setScans(saved.sort(newestFirst));
        deleteOrphanedPhotos(new Set(saved.map((scan) => scan.photoFile)));
      })
      .catch((error) => console.warn('Could not load scans', error))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scans)).catch((error) =>
      console.warn('Could not save scans', error),
    );
  }, [ready, scans]);

  const updateScan = useCallback((id: string, changes: Partial<Scan>) => {
    setScans((current) => current.map((scan) => (scan.id === id ? { ...scan, ...changes } : scan)));
  }, []);

  const addScan = useCallback((scan: Scan) => {
    setScans((current) => [scan, ...current].sort(newestFirst));
  }, []);

  const correctScan = useCallback(
    (id: string, category: CategoryId | undefined) => {
      updateScan(id, { correctedCategory: category, confirmed: false });
    },
    [updateScan],
  );

  const confirmScan = useCallback(
    (id: string) => updateScan(id, { correctedCategory: undefined, confirmed: true }),
    [updateScan],
  );

  const removeScan = useCallback((id: string) => {
    const removed = scansRef.current.find((scan) => scan.id === id);
    if (!removed) return () => {};
    setScans((current) => current.filter((scan) => scan.id !== id));

    // Keep the photo on disk until the undo window closes.
    const timer = setTimeout(() => {
      pendingDeletes.current.delete(id);
      deletePhoto(removed.photoFile);
    }, UNDO_WINDOW_MS);
    pendingDeletes.current.set(id, timer);

    return () => {
      const pending = pendingDeletes.current.get(id);
      if (!pending) return;
      clearTimeout(pending);
      pendingDeletes.current.delete(id);
      setScans((current) =>
        current.some((scan) => scan.id === id) ? current : [...current, removed].sort(newestFirst),
      );
    };
  }, []);

  const clearAll = useCallback(() => {
    scansRef.current.forEach((scan) => deletePhoto(scan.photoFile));
    setScans([]);
  }, []);

  const value = useMemo(
    () => ({ ready, scans, addScan, correctScan, confirmScan, removeScan, clearAll }),
    [ready, scans, addScan, correctScan, confirmScan, removeScan, clearAll],
  );
  return <ScansContext.Provider value={value}>{children}</ScansContext.Provider>;
}

export function useScans() {
  const context = useContext(ScansContext);
  if (!context) throw new Error('useScans must be used inside ScansProvider');
  return context;
}
