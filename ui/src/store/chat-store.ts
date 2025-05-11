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
    error: string | null;
    getChats: () => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
    renameChat: (chatId: string, name: string) => Promise<void>;
    createChat: (name: string) => Promise<string | null>;
    setSelectedChat: (chatId: string) => Promise<void>;
    postMessage: (chatId: string, prompt: string) => Promise<void>;
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

const useChatStore = create<ChatStore>((set, get) => ({
    chats: [],
    selectedChat: defaultChat,
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
        try {
            const res = await fetch(`${API}/chats/${chatId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to delete chat");

            set(produce((state: ChatStore) => {
                state.chats = state.chats.filter(chat => chat.id !== chatId);
            }));
        } catch (err: any) {
            set({ error: err.message || "Unknown error while deleting chat" });
        }
    },

    renameChat: async (chatId: string, name: string) => {
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
                } if (state.selectedChat.id === chatId) {
                    state.selectedChat.name = name;
                }
            }));
        } catch (err: any) {
            set({ error: err.message || "Unknown error while renaming chat" });
        }
    },

    createChat: async (name: string) => {
        const userId = sessionStorage.getItem("userId");
        if (!userId) {
            set({ error: "User not found" });
            return null;
        }

        try {
            const res = await fetch(`${API}/chats/users/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
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
    },

    setSelectedChat: async (chatId: string) => {
        try {
            const res = await fetch(`${API}/chats/${chatId}`);
            if (!res.ok) throw new Error("Failed to fetch chat");
            const data: Chat = await res.json();
            set({ selectedChat: chatDAO(data) })
        } catch (err: any) {
            set({ error: err.message || "Unknown error while fetching chat" })
        }
    },

    postMessage: async (chatId: string, prompt: string) => {
        set(produce((state: ChatStore) => {
            if (!prompt.trim()) {
                state.error = "Prompt is empty";
                return;
            }

            state.selectedChat.messages.push(createMessage(prompt, "user"));
            const chat = state.chats.find(c => c.id === chatId);

            if (!chat) {
                state.error = `Chat with id ${chatId} not found`;
                return;
            }

            chat.isProcessing = true;
        }));

        try {
            const res = await fetch(`${API}/chats/${chatId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: prompt }),
            })
            const data: Response = await res.json();

            set(produce((state: ChatStore) => {
                state.selectedChat.messages.push(data.message)
                if (data.code.css) {
                    state.selectedChat.code.css = data.code.css;
                } if (data.code.html) {
                    state.selectedChat.code.html = data.code.html;
                } if (data.code.js) {
                    state.selectedChat.code.js = data.code.js;
                }
                state.selectedChat.name = data.name
                const chat = state.chats.find(c => c.id === chatId);
                chat.name = data.name;
                if (!chat) state.error = `Chat with id ${chatId} not found`;

                chat.isProcessing = false;
            }))

        } catch (err: any) {
            set(produce((state: ChatStore) => {
                const chat = state.chats.find(c => c.id === chatId);
                if (chat) chat.isProcessing = false;
                state.error = err.message || "Unknown Error";
            }));
        }
    }
}));

export {
    useChatStore
};
