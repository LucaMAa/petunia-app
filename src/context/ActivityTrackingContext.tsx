import React, { createContext, useContext, useState } from 'react';
import { useActivityTracking } from '../hooks/useActivityTracking';

type ActivityTrackingState = ReturnType<typeof useActivityTracking> & {
  dock: { minimized: boolean; top: number | null };
  setDock: React.Dispatch<React.SetStateAction<{ minimized: boolean; top: number | null }>>;
};

const ActivityTrackingContext = createContext<ActivityTrackingState | null>(null);

/** One activity session for the whole application, independent from the current tab. */
export function ActivityTrackingProvider({ children }: { children: React.ReactNode }) {
  const tracking = useActivityTracking();
  const [dock, setDock] = useState<{ minimized: boolean; top: number | null }>({
    minimized: false,
    top: null,
  });
  return (
    <ActivityTrackingContext.Provider value={{ ...tracking, dock, setDock }}>
      {children}
    </ActivityTrackingContext.Provider>
  );
}

export function useActivityTrackingContext() {
  const tracking = useContext(ActivityTrackingContext);
  if (!tracking)
    throw new Error('useActivityTrackingContext must be used within ActivityTrackingProvider');
  return tracking;
}
