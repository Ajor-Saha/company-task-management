import { create } from "zustand";
import { persist, devtools, createJSONStorage } from "zustand/middleware";

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatar: string | null;
  role: string;
  verifyCode: string;
  verifyCodeExpiry: string;
  isVerified: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  getLoggedInUser: () => User | null; // Getter for logged-in user
  updateUser: (updates: Partial<Pick<User, "firstName" | "lastName" | "avatar">>) => void;

}

const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: (user, accessToken) => {
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        },
        logout: () => {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        },
        setUser: (user) => {
          set({ user });
        },
        setAccessToken: (token) => {
          set({ accessToken: token });
        },
        getLoggedInUser: () => {
          return get().user; // Return the current user from the state
        },
        updateUser: (updates) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          }));
        },
      }),
      {
        name: "auth-storage", // Name for persistence
        storage: createJSONStorage(() => localStorage), // Using localStorage
      }
    )
  )
);

export default useAuthStore;