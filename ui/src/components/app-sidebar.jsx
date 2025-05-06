import { Snail, Plus } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useEffect } from "react";
import { Button } from "./ui/button";
import { NavUser } from "./nav-user";
import { NavChats } from "./nav-chats";
import { useClerk } from "@clerk/clerk-react";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { Link, useNavigate } from "react-router-dom";

export function AppSidebar() {
    const clerk = useClerk();
    const navigate = useNavigate();
    const { createChat } = useChatStore();
    const { openSignIn, setUserFromClerk, isSignedIn } = useAuthStore();

    useEffect(() => {
        setUserFromClerk(clerk)
    }, [clerk, setUserFromClerk])

    const handleCreateChat = async () => {
        const chatId = await createChat();
        if (chatId) {
            navigate(chatId);
        }
    }

    return (
        <Sidebar className="border-none">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <Link to={`/`} className="flex w-full">
                                <Snail className="w-5 h-4" />
                                <span className="text-2xl font-semibold">Site.ai</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {isSignedIn && <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <Button variant="default" className="w-full" onClick={handleCreateChat}>
                                    <Plus />
                                    Create
                                </Button>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>}
                <NavChats />
            </SidebarContent>

            <SidebarFooter>
                {
                    isSignedIn ?
                        <NavUser />
                        :
                        <Button variant="default" onClick={() => openSignIn(clerk)} >
                            login
                        </Button>
                }
            </SidebarFooter>

        </Sidebar>
    )
}
