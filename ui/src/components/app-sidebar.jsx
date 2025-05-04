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
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { NavUser } from "./nav-user";
import { SignedIn, SignedOut, useUser, useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/use-auth";
import { NavChats } from "./nav-chats";

// default
// const USERID = 124;

export function AppSidebar() {
    const clerk = useClerk();
    const navigate = useNavigate();
    const { user, isSignedIn } = useUser();
    const [chats, setChats] = useState([]);
    const { currentUser, setCurrentUser } = useAuth();
    const [isChatsLoaded, setIsChatsLoaded] = useState(false);

    const deleteChat = async (id) => {
        const res = await fetch(`http://localhost:8080/chats/${id}`, {
            method: 'DELETE'
        })
        const data = await res.json();
        console.log("in deleteChat handler", id)
        console.log(data?.message + " " + id)
        const newChats = chats.filter(chat => chat.id != id)
        setChats(newChats)
    }

    const renameChat = async (id, newName) => {
        const res = await fetch(`http://localhost:8080/chats/${id}/rename`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
        })
        const data = await res.json();
        console.log(data?.message + " " + id)
        const newChats = chats.map(chat => {
            if (chat.id === id) {
                return { ...chat, name: newName }
            } return chat
        })
        setChats(newChats);
    }

    const createChat = async () => {
        if (isSignedIn) {
            const res = await fetch(`http://localhost:8080/chats/users/${currentUser?.id}`, {
                method: 'POST'
            })
            const data = await res.json();
            navigate(`/${data["id"]}`)
            fetchChats()
        }
    }

    const fetchChats = useCallback(async () => {
        if (isSignedIn) {
            setIsChatsLoaded(false)
            const res = await fetch(`http://localhost:8080/chats/users/${currentUser?.id}/all`);
            const data = await res.json();
            setIsChatsLoaded(true)
            setChats(data);
        }
    }, [currentUser?.id, isSignedIn]);

    const handleSignIn = async () => {
        try {
            clerk.openSignIn({ redirectUrl: "/" });
        } catch (error) {
            console.error("Sign-in failed:", error);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            if (isSignedIn && user) {
                if (!currentUser?.id) {
                    setCurrentUser({
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.primaryEmailAddress?.emailAddress,
                        avatar: user.imageUrl,
                    });
                }
                await fetchChats();
            }
        };
        fetchData();
        return () => {
            fetchData();
        }
    }, [isSignedIn, user, currentUser?.id, setCurrentUser, fetchChats]);

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
                                <Button variant="default" className="w-full" onClick={createChat}>
                                    <Plus />
                                    Create
                                </Button>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>}
                <NavChats chats={chats} isLoaded={isChatsLoaded} deleteChat={deleteChat} renameChat={renameChat} />
            </SidebarContent>

            <SidebarFooter>
                <SignedOut>
                    <Button variant="default" onClick={handleSignIn} >
                        login
                    </Button>
                </SignedOut>
                <SignedIn>
                    <NavUser />
                </SignedIn>
            </SidebarFooter>

        </Sidebar>
    )
}
