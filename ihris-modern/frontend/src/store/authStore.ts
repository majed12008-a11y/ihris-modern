import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, AuthState } from "@/types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,

      login: (user: User, token: string) =>
        set({ user, token, isAuthenticated: true, isHydrated: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, isHydrated: true }),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "ihris-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);
