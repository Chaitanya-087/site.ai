import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "./mode-toggle"
import { useChatStore } from "@/store/chat-store"
import { useLocation, useParams } from "react-router-dom";

export function SiteHeader() {
    const { getHeaderName } = useChatStore();
    const location = useLocation();
    const { id } = useParams();

    return (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear w-full">
            <div className="flex w-full items-center gap-1 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-base font-medium truncate">{location.pathname == '/' ? "Home" : getHeaderName(id)}</h1>

                <div className="ml-auto">
                    <ModeToggle />
                </div>
            </div>
        </header>
    )
}
