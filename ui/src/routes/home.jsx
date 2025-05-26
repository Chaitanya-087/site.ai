import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useNavigate } from "react-router-dom";
import { useChatsStore } from "@/store/chats-store";

const NAME = "New Chat";

function Home() {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState("");
    const { createChat } = useChatsStore();

    const onSubmit = async () => {
        if (!prompt.trim()) return;
        const chatId = await createChat(NAME);
        if (chatId) {
            navigate(`/${chatId}`, { state: { initialPrompt: prompt } });
            setPrompt("");
        }
    }

    return (
        <React.Fragment>
            <SiteHeader />
            <div className="flex w-full flex-col flex-grow items-center justify-center p-4">
                <div className="space-y-6 min-w-[55%]">
                    <h1 className="text-3xl font-semibold text-center">
                        What can I develop today?
                    </h1>
                    <div className="flex justify-center items-center space-x-2 border rounded-full h-14 px-2">
                        <Input
                            placeholder="Start typing your idea..." className="h-full border-none focus-visible:ring-0"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}

                            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                        />
                        <Button className="rounded-full size-[40px]" onClick={onSubmit} >
                            <Send />
                        </Button>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Home;
