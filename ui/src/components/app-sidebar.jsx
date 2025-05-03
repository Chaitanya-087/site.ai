import { Snail, Plus, Ellipsis } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { NavUser } from "./nav-user";
import avatarImgSrc from '@/assets/avatar.jpeg';
import { SignedIn, SignedOut, useAuth, useClerk } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
const USERID = 124; // hardcoded for now
const data = {
    name: "shadcn",
    email: "m@example.com",
    avatar: avatarImgSrc,

}

export function AppSidebar() {
    const [chats, setChats] = useState([]);
    const { user, isSignedIn } = useUser();
    const navigate = useNavigate();
    const { userId } = useAuth()
    const [userDetails, setUserDetails] = useState(data);
    const clerk = useClerk();

    const createChat = async () => {
        if (isSignedIn) {
            const res = await fetch(`http://localhost:8080/chats/users/${userId}`, {
                method: 'POST'
            })
            const data = await res.json();
            navigate(`/${data["id"]}`)
            fetchChats()
        }
    }

    const fetchChats = async () => {
        const res = await fetch(`http://localhost:8080/chats/users/${userId || USERID}/all`);
        const data = await res.json();
        setChats(data);
    };
    useEffect(() => {
        const fetchData = async () => {
            await fetchChats();

            if (isSignedIn && user) {
                setUserDetails({
                    name: user.firstName + user.lastName || "Unknown User",
                    email: user.primaryEmailAddress?.emailAddress || "No email",
                    avatar: user.imageUrl || avatarImgSrc,
                });
            }
        };

        fetchData();
    }, [user, isSignedIn]);
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
                <SidebarGroup>
                    <SidebarGroupLabel>chats</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {chats.map((item) => (
                                <SidebarMenuItem key={item.id}>
                                    <NavLink
                                        to={`/${item.id}`}
                                        end
                                        className={({ isActive }) => isActive ? 'data-active' : ''}
                                    >
                                        {({ isActive }) => (
                                            <SidebarMenuButton asChild data-active={isActive}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="block truncate text-sm">{item.name}</span>
                                                    <Ellipsis className="w-4 h-4 invisible group-hover/menu-item:visible transition-opacity duration-200" />
                                                </div>
                                            </SidebarMenuButton>
                                        )}
                                    </NavLink>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SignedOut>
                    <Button variant="default" onClick={() => clerk.openSignIn({})} >
                        login
                    </Button>
                </SignedOut>
                <SignedIn>
                    {/* <UserButton /> */}
                    <NavUser user={userDetails} />
                </SignedIn>
            </SidebarFooter>

        </Sidebar>
    )
}
