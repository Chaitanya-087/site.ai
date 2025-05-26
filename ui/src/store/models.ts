import { UserResource } from "@clerk/types";

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

export interface ChatStore {
    chat: Chat;
    error: ErrorState | null;
    isLoading: boolean;
    isThinking: boolean;
    
    clear: () => void;
    fetchChat: (chatId: string) => Promise<void>;
    postMessage: (chatId: string, prompt: string) => Promise<void>;
    isChatThinking: (chatId: string) => boolean;
}

const userDAO = (user: UserResource) => ({
    id: user.id,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    email: user.primaryEmailAddress?.emailAddress,
    avatar: user.imageUrl,
});

interface User extends ReturnType<typeof userDAO> { }

export interface UserStore {
    user: User | null;
    setUser: (user: UserResource) => void;
    clearUser: () => void;
}

export interface ChatsStore {
    chats: BasicChat[];
    error: ErrorState | null;

    fetchChats: () => Promise<void>;
    createChat: (name: string) => Promise<string | null>;
    deleteChat: (chatId: string) => Promise<void>;
    renameChat: (chatId: string, name: string) => Promise<void>;
    getName: (chatId: string) => string | null;
}

export interface GeminiTokenStore {
    token: string | null;
    error: ErrorState | null;

    fetchToken: () => Promise<void>;
    saveToken: (token: string) => Promise<void>;
    clearToken: () => void;
}