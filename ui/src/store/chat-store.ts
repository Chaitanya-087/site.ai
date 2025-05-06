import { create } from 'zustand';
import { produce } from 'immer';

const API = 'http://localhost:8080';

interface Message {
    id: string;
    type: "ai" | "user";
    content: string;
}

interface Code {
    html: string;
    css: string;
    js: string;
}

interface Chat {
    id: string;
    name: string;
    messages: Message[];
    created_at: Date;
    code: Code;
}

const chatDAO = (chat: Chat) => ({
    ...chat,
    isProcessing: false,
});

interface ChatWithUI extends ReturnType<typeof chatDAO> { }

interface ChatStore {
    chats: ChatWithUI[];
    isLoading: boolean;
    error: string | null;
    getChats: () => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
    renameChat: (chatId: string, name: string) => Promise<void>;
    createChat: () => Promise<string | null>;
}

const useChatStore = create<ChatStore>((set) => ({
    chats: [],
    isLoading: false,
    error: null,

    getChats: async () => {
        set({ isLoading: true, error: null });
        const userId = sessionStorage.getItem("userId");

        if (!userId) {
            set({ isLoading: false, error: "User not found." });
            return;
        }

        try {
            const res = await fetch(`${API}/chats/users/${userId}/all`);
            if (!res.ok) throw new Error("Failed to fetch chats");

            const data: Chat[] = await res.json();
            const chats = data
                .map(chatDAO)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            set({ chats, isLoading: false });
        } catch (err: any) {
            set({ isLoading: false, error: err.message || "Unknown error" });
        }
    },

    deleteChat: async (chatId: string) => {
        set(produce((state: ChatStore) => {
            const chat = state.chats.find(c => c.id === chatId);
            if (chat) chat.isProcessing = true;
            state.error = null;
        }));

        try {
            const res = await fetch(`${API}/chats/${chatId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to delete chat");

            set(produce((state: ChatStore) => {
                state.chats = state.chats.filter(chat => chat.id !== chatId);
            }));
        } catch (err: any) {
            set(produce((state: ChatStore) => {
                const chat = state.chats.find(c => c.id === chatId);
                if (chat) chat.isProcessing = false;
                state.error = err.message || "Unknown error while deleting chat";
            }));
        }
    },

    renameChat: async (chatId: string, name: string) => {
        set(produce((state: ChatStore) => {
            const chat = state.chats.find(c => c.id === chatId);
            if (chat) chat.isProcessing = true;
            state.error = null;
        }));

        try {
            const res = await fetch(`${API}/chats/${chatId}/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) throw new Error("Failed to rename chat");

            set(produce((state: ChatStore) => {
                const chat = state.chats.find(c => c.id === chatId);
                if (chat) {
                    chat.name = name;
                    chat.isProcessing = false;
                }
            }));
        } catch (err: any) {
            set(produce((state: ChatStore) => {
                const chat = state.chats.find(c => c.id === chatId);
                if (chat) chat.isProcessing = false;
                state.error = err.message || "Unknown error while renaming chat";
            }));
        }
    },

    createChat: async () => {
        const userId = sessionStorage.getItem("userId");
        if (!userId) {
            set({ error: "User not found" });
            return null;
        }

        try {
            const res = await fetch(`${API}/chats/users/${userId}`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error("Failed to create chat");

            const data: Chat = await res.json();
            const newChat = chatDAO(data);

            set(produce((state: ChatStore) => {
                state.chats.unshift(newChat);
                state.error = null;
            }));

            return newChat.id;
        } catch (err: any) {
            set({ error: err.message || "Unknown error while creating chat" });
            return null;
        }
    }
}));

export {
    useChatStore
};
