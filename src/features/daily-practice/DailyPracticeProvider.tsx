import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { api, getActiveProfileId } from "../../api/client";
import type { DailyPracticeGoal } from "../../types";
import { LEARNING_UPDATED, PROFILE_CHANGED } from "./events";

const DailyPracticeContext = createContext<{
  goal: DailyPracticeGoal | undefined; profileId: string; unavailable: boolean; refresh: () => void;
} | null>(null);

function subscribeProfile(listener: () => void) {
  window.addEventListener(PROFILE_CHANGED, listener);
  return () => window.removeEventListener(PROFILE_CHANGED, listener);
}

export function DailyPracticeProvider({ children }: { children: ReactNode }) {
  const profileId = useSyncExternalStore(subscribeProfile, getActiveProfileId);
  const client = useQueryClient();
  const { pathname } = useLocation();
  const query = useQuery({
    queryKey: ["daily-goal", profileId], queryFn: api.dailyGoal,
    staleTime: 15_000, refetchInterval: 60_000, refetchOnWindowFocus: "always",
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const updated = (event: Event) => {
      if ((event as CustomEvent<{ profileId: string }>).detail.profileId !== profileId) return;
      clearTimeout(timer);
      timer = setTimeout(() => void client.invalidateQueries({ queryKey: ["daily-goal", profileId] }), 150);
    };
    window.addEventListener(LEARNING_UPDATED, updated);
    return () => { clearTimeout(timer); window.removeEventListener(LEARNING_UPDATED, updated); };
  }, [client, profileId]);

  useEffect(() => {
    // Routes share one companion; changing pages also checks for cross-device activity.
    void client.invalidateQueries({ queryKey: ["daily-goal", profileId] });
  }, [client, profileId, pathname]);

  useEffect(() => {
    if (!query.data) return;
    // Use server-relative time so the browser's timezone/clock cannot choose a learning day.
    const delay = new Date(query.data.resets_at).getTime() - new Date(query.data.generated_at).getTime();
    const timer = setTimeout(() => void client.invalidateQueries({ queryKey: ["daily-goal", profileId] }), Math.max(500, delay + 500));
    return () => clearTimeout(timer);
  }, [client, profileId, query.data]);

  return <DailyPracticeContext.Provider value={{ goal: query.isError ? undefined : query.data, profileId, unavailable: query.isError, refresh: () => { void query.refetch(); } }}>{children}</DailyPracticeContext.Provider>;
}

export function useDailyPractice() {
  const context = useContext(DailyPracticeContext);
  if (!context) throw new Error("DailyPracticeProvider is required");
  return context;
}
