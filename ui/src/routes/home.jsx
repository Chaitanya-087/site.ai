import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

function Home() {
    return (
        <React.Fragment>
            <SiteHeader />
            <div className="flex w-full flex-col flex-grow items-center justify-center p-4">
                <div className="space-y-6 min-w-[55%]">
                    <h1 className="text-3xl font-semibold text-center">
                        What can I develop today?
                    </h1>
                    <div className="flex justify-center items-center space-x-2 border rounded-full h-14 px-2">
                        <Input placeholder="Start typing your idea..." className="h-full border-none focus-visible:ring-0" />
                        <Button className="rounded-full size-[40px]">
                            <Send />
                        </Button>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Home;
