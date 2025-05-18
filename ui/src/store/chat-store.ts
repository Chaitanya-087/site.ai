import { create } from 'zustand';
import { produce } from 'immer';
import { getErrorMessageFromResponse } from './util';

const API = 'http://localhost:8080';

interface Message {
    id: string;
    type: "ai" | "user";
    content: string;
}

interface ErrorState {
    message: string;
    timestamp: number;
}

interface TokenResponse {
    token: string;
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

interface Response {
    message: Message;
    code: Code;
    name: string;
}

const chatDAO = (chat: Chat) => ({
    ...chat,
    isProcessing: false,
});

const createMessage = (prompt: string, type: "ai" | "user") => ({
    id: Date.now().toString(),
    type: type,
    content: prompt
})

interface ChatWithUI extends ReturnType<typeof chatDAO> { }

interface ChatStore {
    chats: ChatWithUI[];
    selectedChat: ChatWithUI;
    isLoading: boolean;
    error: ErrorState | null;
    token: string | null;
    clear: () => void;
    getChats: () => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
    renameChat: (chatId: string, name: string) => Promise<void>;
    createChat: (name: string) => Promise<string | null>;
    setSelectedChat: (chatId: string) => Promise<void>;
    postMessage: (chatId: string, prompt: string) => Promise<void>;
    getToken: () => Promise<void>;
    saveToken: (token: string) => Promise<void>;
}

const defaultChat: ChatWithUI = chatDAO({
    id: '',
    name: 'New Chat',
    messages: [],
    created_at: new Date(),
    code: {
        html: '',
        css: '',
        js: ''
    }
});

const setError = (set: any, err: any) => {
    const message = typeof err === "string" ? err : err.message;
    console.log(message);
    set({
        error: {
            message,
            timestamp: Date.now(),
        },
    });
};

const useChatStore = create<ChatStore>((set, get) => ({
    chats: [],
    selectedChat: defaultChat,
    isLoading: false,
    error: null,
    token: "",

    clear: () => {
        set({ selectedChat: defaultChat, isLoading: false });
        setError(set, "")
    },

    saveToken: async (token: string) => {
        const userId = sessionStorage.getItem("userId");
        if (!userId) {
            setError(set, "User not found");
        }

        try {
            const res = await fetch(`${API}/chats/users/${userId}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            if (!res.ok) throw new Error(await getErrorMessageFromResponse(res));

            set({ token });
        } catch (err: any) {
            setError(set, err);
        }
    },

    getToken: async () => {
        const userId = sessionStorage.getItem("userId");

        if (!userId) {
            setError(set, "User not found");
            return;
        }

        try {
            const res = await fetch(`${API}/chats/users/${userId}/token`);

            if (!res.ok) throw new Error(await getErrorMessageFromResponse(res));

            const data: TokenResponse = await res.json();
            set({ token: data.token });
        } catch (err: any) {
            setError(set, err);
        }
    },

    getChats: async () => {
        set({ isLoading: true });
        const userId = sessionStorage.getItem("userId");

        if (!userId) {
            set({ isLoading: false });
            setError(set, "User not found");
            return;
        }

        try {
            const res = await fetch(`${API}/chats/users/${userId}/all`);
            if (!res.ok) throw new Error(await getErrorMessageFromResponse(res));

            const data: Chat[] = await res.json();
            const chats = data.map(chatDAO).sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            set({ chats, isLoading: false });
        } catch (err: any) {
            set({ isLoading: false });
            setError(set, err);
        }
    },

    deleteChat: async (chatId: string) => {
        try {
            const res = await fetch(`${API}/chats/${chatId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await getErrorMessageFromResponse(res));

            set(produce((state: ChatStore) => {
                state.chats = state.chats.filter(chat => chat.id !== chatId);
            }));
        } catch (err: any) {
            setError(set, err);
        }
    },

    renameChat: async (chatId: string, name: string) => {
        try {
            const res = await fetch(`${API}/chats/${chatId}/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error(await getErrorMessageFromResponse(res));

            set(produce((state: ChatStore) => {
                const chat = state.chats.find(c => c.id === chatId);
                if (chat) chat.name = name;
                if (state.selectedChat.id === chatId) state.selectedChat.name = name;
            }));
        } catch (err: any) {
            setError(set, err);
        }
    },

    createChat: async (name: string) => {
        const userId = sessionStorage.getItem("userId");

        if (!userId) {
            set({ isLoading: false });
            setError(set, "User not found");
            return null;
        }

        try {
            const res = await fetch(`${API}/chats/users/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error(await getErrorMessageFromResponse(res));

            const data: Chat = await res.json();
            const newChat = chatDAO(data);
            set(produce((state: ChatStore) => {
                state.chats.unshift(newChat);
            }));
            return newChat.id;
        } catch (err: any) {
            setError(set, err);
            return null;
        }
    },

    setSelectedChat: async (chatId: string) => {
        try {
            const res = await fetch(`${API}/chats/${chatId}`);
            if (!res.ok) throw new Error(await getErrorMessageFromResponse(res));

            const data: Chat = await res.json();
            set({ selectedChat: chatDAO(data) });
        } catch (err: any) {
            setError(set, err);
        }
    },

    postMessage: async (chatId: string, prompt: string) => {
        const userId = sessionStorage.getItem('userId');

        if (!userId) {
            set({ isLoading: false });
            setError(set, "User not found");
            return;
        }

        if (!prompt.trim()) {
            setError(set, "Prompt is empty");
            return;
        }

        set(produce((state: ChatStore) => {
            state.selectedChat.messages.push(createMessage(prompt, "user"));
            const chat = state.chats.find(c => c.id === chatId);
            if (chat) {
                chat.isProcessing = true;
            }
        }));

        try {
            const res = await fetch(`${API}/chats/${chatId}/messages/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: prompt }),
            });

            if (!res.ok) throw new Error(await getErrorMessageFromResponse(res));

            const data: Response = await res.json();

            set(produce((state: ChatStore) => {
                state.selectedChat.messages.push(data.message);
                if (data.code.css) state.selectedChat.code.css = data.code.css;
                if (data.code.html) state.selectedChat.code.html = data.code.html;
                if (data.code.js) state.selectedChat.code.js = data.code.js;
                state.selectedChat.name = data.name;

                const chat = state.chats.find(c => c.id === chatId);
                if (chat) {
                    chat.name = data.name;
                    chat.isProcessing = false;
                }
            }));
        } catch (err: any) {
            set(produce((state: ChatStore) => {
                const chat = state.chats.find(c => c.id === chatId);
                if (chat) chat.isProcessing = false;
            }));
            setError(set, err);
            console.log(err);
        }
    }
}));

export { useChatStore };