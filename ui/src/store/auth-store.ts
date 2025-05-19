import { create } from "zustand";
import type { UserResource, Clerk } from "@clerk/types";

interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
}

interface AuthStore {
  user: User | null;
  isSignedIn: boolean;
  setUserFromClerk: (clerk: Clerk) => void;
  openSignIn: (clerk: Clerk) => void;
  signOut: (clerk: Clerk) => Promise<void>;
}

const formatUser = (user: UserResource): User => ({
  id: user.id,
  name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
  email: user.primaryEmailAddress?.emailAddress,
  avatar: user.imageUrl,
});

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isSignedIn: false,

  setUserFromClerk: (clerk: Clerk) => {
    const currentUser = clerk.user;
    if (currentUser) {
      sessionStorage.setItem("userId", currentUser.id);
      set({ user: formatUser(currentUser), isSignedIn: true });
    } else {
      clerk;
      set({ user: null });
    }
  },

  openSignIn: (clerk: Clerk) => {
    clerk.openSignIn({ redirectUrl: "/" });
  },

  signOut: async (clerk: Clerk) => {
    sessionStorage.clear();
    localStorage.clear();
    await clerk.signOut();
    set({ user: null, isSignedIn: false });
  },
}));

export { useAuthStore };
