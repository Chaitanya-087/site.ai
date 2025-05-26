import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
import { NavUser } from "./nav-user";
import { NavChats } from "./nav-chats";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { ClerkLoaded, ClerkLoading, useClerk } from "@clerk/clerk-react";
import { useChatsStore } from "@/store/chats-store";

import { formatUser } from "@/store/util";

const DEFAULT_NAME = "New Chat"

export const AppSidebar = () => {
    const clerk = useClerk();
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const { createChat } = useChatsStore();
    const [name, setName] = useState(DEFAULT_NAME);
    const [openDialog, setOpenDialog] = useState(false);

    useEffect(() => {
        const currentUser = clerk.user;
        if (clerk.isSignedIn && currentUser) {
            sessionStorage.setItem("userId", currentUser.id);
            setUser(formatUser(currentUser));
        }
    }, [clerk.isSignedIn, clerk.user]);

    const handleCreateChat = async () => {
        const chatId = await createChat(name);
        if (chatId) {
            navigate(chatId);
            setOpenDialog(false);
            setName(DEFAULT_NAME)
        }
    }

    return (
        <React.Fragment>
            <Sidebar className="border-none">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                className="focus-visible:ring-0 hover:bg-transparent flex items-center gap-2"
                            >
                                <Link to={`/`} className="flex w-full">
                                    <Snail className="w-5 h-5" />
                                    <p className="text-2xl font-semibold">Site.ai</p>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    {<SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem onClick={() => {
                                    setOpenDialog(true)
                                }}>
                                    <Button variant="default" className="w-full">
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
                    <ClerkLoading>
                        <p>loading...</p>
                    </ClerkLoading>
                    <ClerkLoaded>
                        <NavUser user={user} />
                    </ClerkLoaded>
                </SidebarFooter>

            </Sidebar>

            <Dialog open={openDialog} onOpenChange={() => setOpenDialog(false)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create Chat</DialogTitle>
                        <DialogDescription>
                            Enter a name for your chat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={handleCreateChat}
                        >
                            Create Chat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    )
}
