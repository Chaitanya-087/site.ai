import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

function Home() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState("");

    const onSubmit = async () => {
        const res = await fetch(`http://localhost:8080/chats/users/${currentUser?.id}`, {
            method: 'POST'
        })
        const data = await res.json();
        if (data["id"]) {
            navigate(`/${data["id"]}`, {
                state: {
                    prompt: prompt
                }
            })
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
