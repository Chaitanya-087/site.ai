import { create } from "zustand";
import { BasicChat, ChatsStore } from "./models";
import { handleRequest, setError } from "./util";
import { produce } from "immer";

const API: string = "https://site-ai.onrender.com";
// const API = "http://localhost:8080";

export const useChatsStore = create<ChatsStore>((set, get) => ({
    chats: [],
    error: null,

    updateName: (chatId, name) => {
        set(produce((state: ChatsStore) => {
            const chat = state.chats.find(c => c.id === chatId);
            chat.name = name
        }))
    },

    getName: (chatId) => {
        const chat = get().chats.find((c) => c.id === chatId);
        return chat ? chat.name : null;
    },

    fetchChats: async () => {
        const userId = sessionStorage.getItem("userId");
        if (!userId) {
            setError(set, "User not found");
            return;
        }
        const data = await handleRequest<BasicChat[]>(
            `${API}/chats/users/${userId}/all`,
            {},
            set
        );

        if (data) {
            const chats = data
                .sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            set({ chats });
        }
    },
    createChat: async (name) => {
        const userId = sessionStorage.getItem("userId");
        if (!userId) {
            setError(set, "User not found");
            return null;
        }
        const data = await handleRequest<BasicChat>(
            `${API}/chats/users/${userId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            },
            set
        );
        if (data) {
            const newChat = data;
            set(
                produce((state: ChatsStore) => {
                    state.chats.unshift(newChat);
                })
            );
            return newChat.id;
        }
        return null;
    },
    deleteChat: async (chatId) => {
        const success = await handleRequest<void>(
            `${API}/chats/${chatId}`,
            { method: "DELETE" },
            set
        );
        if (success !== null) {
            set(
                produce((state: ChatsStore) => {
                    state.chats = state.chats.filter((chat) => chat.id !== chatId);
                })
            );
        }
    },
    renameChat: async (chatId, name) => {
        const success = await handleRequest<void>(
            `${API}/chats/${chatId}/rename`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            },
            set
        );
        if (success !== null) {
            set(
                produce((state: ChatsStore) => {
                    const chat = state.chats.find((c) => c.id === chatId);
                    if (chat) chat.name = name;
                })
            );
        }
    }
}));