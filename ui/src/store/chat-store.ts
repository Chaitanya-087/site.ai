import { create } from "zustand";
import { produce } from "immer";
import { createMessage, handleRequest, setError } from "./util";
import { Chat, ChatStore, defaultChat, Response } from "./models";
import { useChatsStore } from "./chats-store";

// const API: string = "https://site-ai.onrender.com";
const API = import.meta.env.VITE_API_URL;

export const useChatStore = create<ChatStore>((set, get) => ({
  chat: defaultChat,
  error: null,
  isLoading: false,
  toBePosted: false,

  clear: () => {
    set({
      chat: defaultChat,
      error: null,
      isLoading: false,
    });
  },

  fetchChat: async (chatId) => {
    set({ isLoading: true, error: null });
    const data = await handleRequest<Chat>(`${API}/chats/${chatId}`, {}, set);

    if (data) {
      set({ chat: data, isLoading: false, error: null });
    }
  },

  postMessage: async (chatId, prompt) => {
    const rawUserId = sessionStorage.getItem("userId");

    if (!rawUserId || typeof rawUserId !== "string" || !rawUserId.trim()) {
      setError(set, "User not found");
      return;
    }
    
    const userId = rawUserId.trim();

    if (!prompt.trim()) {
      setError(set, "Prompt is empty");
      return;
    }

    set(
      produce((state: ChatStore) => {
        state.chat.messages.push(createMessage(prompt, "user"));
        useChatsStore.getState().setIsProcessing(chatId, true);
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
          state.chat.messages.push(data.message);
          if (data.code.css) state.chat.code.css = data.code.css;
          if (data.code.html) state.chat.code.html = data.code.html;
          if (data.code.js) state.chat.code.js = data.code.js;
          useChatsStore.getState().updateName(chatId, data.name);
          state.chat.name = data.name;
          useChatsStore.getState().setIsProcessing(chatId, false);
        })
      );
    } else {
      set(
        produce((state: ChatStore) => {
          useChatsStore.getState().setIsProcessing(chatId, false);
          state.chat.messages = state.chat.messages.filter(
            (message) => message.content !== prompt
          );
        })
      );
    }
  },

  setToBePosted: () => {
    set({ toBePosted: true })
  },

  resetToBePosted: () => {
    set({ toBePosted: false })
  },
}));
