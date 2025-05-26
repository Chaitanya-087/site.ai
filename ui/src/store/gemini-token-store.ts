import { create } from "zustand";
import { GeminiTokenStore, TokenResponse } from "./models";
import { handleRequest, setError } from "./util";

const API: string = "https://site-ai.onrender.com";
// const API = "http://localhost:8080";

export const useGeminiTokenStore = create<GeminiTokenStore>((set, _) => ({
    token: "",
    error: null,

    fetchToken: async () => {
        const userId = sessionStorage.getItem("userId");

        if (!userId) {
            setError(set, "User not found");
            return;
        }

        const data = await handleRequest<TokenResponse>(
            `${API}/chats/users/${userId}/token`,
            {},
            set
        );

        if (data) {
            set({ token: data.token, error: null });
        }

    },
    saveToken: async (token) => {
        const userId = sessionStorage.getItem("userId");

        if (!userId) {
            setError(set, "User not found");
            return;
        }

        const data = await handleRequest<any>(
            `${API}/chats/users/${userId}/token`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            },
            set
        );

        if (data) {
            set({ token: token });
        }
    },
    clearToken: () => set({ token: null, error: null })
}));