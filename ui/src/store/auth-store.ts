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
  openSignInWithProvider: (clerk: Clerk, provider: "google" | "github") => Promise<void>;
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
      set({ user: null, isSignedIn: false });
    }
  },

  openSignInWithProvider: async (clerk: Clerk, provider: "google" | "github") => {
    const strategy = provider === "google" ? "oauth_google" : "oauth_github";

    try {
      const signIn = await clerk.client.signIn.create({
        strategy,
        redirectUrl: "/",
      });

      const redirectUrl = signIn.firstFactorVerification?.externalVerificationRedirectURL;

      if (redirectUrl) {
        window.location.href = redirectUrl; // ✅ Redirect directly to GitHub/Google
      } else {
        console.error("OAuth redirect URL not available.");
      }
    } catch (err) {
      console.error("OAuth sign-in error:", err);
    }
  },

  signOut: async (clerk: Clerk) => {
    sessionStorage.clear();
    localStorage.clear();
    await clerk.signOut();
    set({ user: null, isSignedIn: false });
  },
}));

export { useAuthStore };
