import { create } from "zustand";
import { produce } from "immer";
import { getErrorMessageFromResponse } from "./util";

const API = "http://localhost:8080";
// const API = "https://px5sz4-8080.csb.app";

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
  content: prompt,
});

interface ChatWithUI extends ReturnType<typeof chatDAO> { }

interface ChatStore {
  chats: ChatWithUI[];
  selectedChat: ChatWithUI;
  isLoading: boolean;
  error: ErrorState | null;
  token: string | null;
  clear: () => void;
  getHeaderName: (id: string) => string;
  chatIsProcessing: (id: string) => boolean;
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

const handleRequest = async <T>(
  url: string,
  options: RequestInit = {},
  set: any
): Promise<T | null> => {
  try {
    const res = await fetch(url, options);

    if (res.status === 401) {
      setError(set, "Unauthorized: Invalid credentials");
      return null;
    }

    if (res.status === 403) {
      setError(
        set,
        "Forbidden: You do not have permission to perform this action."
      );
      return null;
    }

    if (!res.ok) {
      const errorMessage = await getErrorMessageFromResponse(res);
      setError(set, `Request failed: ${errorMessage}`);
      return null;
    }

    const data: T = await res.json();
    return data;
  } catch (err: any) {
    setError(set, `An unexpected error occurred: ${err.message || err}`);
    return null;
  }
};

const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  selectedChat: defaultChat,
  isLoading: false,
  error: null,
  token: "",

  clear: () => {
    set({
      selectedChat: defaultChat,
      isLoading: false,
      error: null,
    });
  },

  saveToken: async (token: string) => {
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
        body: JSON.stringify({ token: token }),
      },
      set
    );

    if (data) {
      set({ token: token });
    }
  },

  chatIsProcessing: (id: string) => {
    return get().chats.find(chat => chat.id === id)?.isProcessing;
  },

  getToken: async () => {
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
      set({ token: data.token });
    }
  },

  getHeaderName: (id: string) => {
    if (!id) {
      return ""
    }
    return get().chats.find(chat => chat.id === id)?.name;
  },

  getChats: async () => {
    set({ isLoading: true });
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      set({ isLoading: false });
      setError(set, "User not found");
      return;
    }

    const data = await handleRequest<Chat[]>(
      `${API}/chats/users/${userId}/all`,
      {},
      set
    );

    set({ isLoading: false });

    if (data) {
      const chats = data
        .map(chatDAO)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      set({ chats });
    }
  },

  deleteChat: async (chatId: string) => {
    const success = await handleRequest<void>(
      `${API}/chats/${chatId}`,
      { method: "DELETE" },
      set
    );

    if (success !== null) {
      set(
        produce((state: ChatStore) => {
          state.chats = state.chats.filter((chat) => chat.id !== chatId);
        })
      );
    }
  },

  renameChat: async (chatId: string, name: string) => {
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
        produce((state: ChatStore) => {
          const chat = state.chats.find((c) => c.id === chatId);
          if (chat) chat.name = name;
          if (state.selectedChat.id === chatId) state.selectedChat.name = name;
        })
      );
    }
  },

  createChat: async (name: string) => {
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      set({ isLoading: false });
      setError(set, "User not found");
      return null;
    }

    const data = await handleRequest<Chat>(
      `${API}/chats/users/${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name }),
      },
      set
    );

    if (data) {
      const newChat = chatDAO(data);
      set(
        produce((state: ChatStore) => {
          state.chats.unshift(newChat);
        })
      );
      return newChat.id;
    }

    return null;
  },

  setSelectedChat: async (chatId: string) => {
    const data = await handleRequest<Chat>(`${API}/chats/${chatId}`, {}, set);

    if (data) {
      set({ selectedChat: chatDAO(data) });
    }
  },

  postMessage: async (chatId: string, prompt: string) => {
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      set({ isLoading: false });
      setError(set, "User not found");
      return;
    }

    if (!prompt.trim()) {
      setError(set, "Prompt is empty");
      return;
    }

    set(
      produce((state: ChatStore) => {
        state.selectedChat.messages.push(createMessage(prompt, "user"));
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) {
          chat.isProcessing = true;
        }
      })
    );

    const data = await handleRequest<Response>(
      `${API}/chats/${chatId}/messages/${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: prompt }),
      },
      set
    );

    if (data) {
      set(
        produce((state: ChatStore) => {
          state.selectedChat.messages.push(data.message);
          if (data.code.css) state.selectedChat.code.css = data.code.css;
          if (data.code.html) state.selectedChat.code.html = data.code.html;
          if (data.code.js) state.selectedChat.code.js = data.code.js;
          state.selectedChat.name = data.name;

          const chat = state.chats.find((c) => c.id === chatId);
          if (chat) {
            chat.name = data.name;
            chat.isProcessing = false;
          }
        })
      );
    } else {
      set(
        produce((state: ChatStore) => {
          const chat = state.chats.find((c) => c.id === chatId);
          if (chat) chat.isProcessing = false;
          state.selectedChat.messages = state.selectedChat.messages.filter(
            (message) => message.content !== prompt
          );
        })
      );
    }
  },
}));

export { useChatStore };
