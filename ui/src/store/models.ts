export interface Message {
    id: string;
    type: "ai" | "user";
    content: string;
}

export interface ErrorState {
    message: string;
    timestamp: number;
}

export interface TokenResponse {
    token: string;
}

export interface Code {
    html: string;
    css: string;
    js: string;
}

export interface BasicChat {
    id: string;
    name: string;
    created_at: Date;
}

export interface Chat extends BasicChat {
    messages: Message[];
    code: Code;
}

export interface Response {
    message: Message;
    code: Code;
    name: string;
}

export const defaultChat: Chat = ({
    id: "",
    name: "New Chat",
    messages: [],
    created_at: new Date(),
    code: {
        html: "",
        css: "",
        js: "",
    },
});

export const chatDAO = (chat: BasicChat) => ({
    ...chat,
    isProcessing: false
});

export interface ChatWithUI extends ReturnType<typeof chatDAO> { }

export interface ChatStore {
    chat: Chat;
    error: ErrorState | null;
    isLoading: boolean;
    toBePosted: boolean;

    clear: () => void;
    fetchChat: (chatId: string) => Promise<void>;
    postMessage: (chatId: string, prompt: string) => Promise<void>;
    setToBePosted: () => void;
    resetToBePosted: () => void;
}

export interface ChatsStore {
    chats: ChatWithUI[];
    error: ErrorState | null;

    fetchChats: () => Promise<void>;
    createChat: (name: string) => Promise<string | null>;
    deleteChat: (chatId: string) => Promise<void>;
    renameChat: (chatId: string, name: string) => Promise<void>;
    getName: (chatId: string) => string | null;
    updateName: (chatId: string, name: string) => void;
    setIsProcessing: (chatId: string, value: boolean) => void;
    getIsProcessing: (chatId: string) => boolean;
}

export interface GeminiTokenStore {
    token: string | null;
    error: ErrorState | null;

    fetchToken: () => Promise<void>;
    saveToken: (token: string) => Promise<void>;
    clearToken: () => void;
}
