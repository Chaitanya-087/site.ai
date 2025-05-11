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
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { NavUser } from "./nav-user";
import { NavChats } from "./nav-chats";
import { useClerk } from "@clerk/clerk-react";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { Link, useNavigate } from "react-router-dom";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
const NAME = "New Chat"
export function AppSidebar() {
    const clerk = useClerk();
    const navigate = useNavigate();
    const { createChat } = useChatStore();
    const { openSignIn, setUserFromClerk, isSignedIn } = useAuthStore();
    const [name, setName] = useState(NAME);
    const [openDialog, setOpenDialog] = useState(false);
    useEffect(() => {
        setUserFromClerk(clerk)
    }, [clerk, setUserFromClerk])

    const handleCreateChat = async () => {
        const chatId = await createChat(name);
        if (chatId) {
            navigate(chatId);
            setOpenDialog(false);
            setName(NAME)
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
                    {isSignedIn && <SidebarGroup>
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
