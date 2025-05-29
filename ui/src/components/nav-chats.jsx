import React, { useEffect, useRef, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"

import {
    MoreHorizontal,
    Pencil,
    Trash2
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import clsx from "clsx"
import { Loader } from "./loader"
import { useTheme } from "@/hooks/use-theme"
import { useChatsStore } from "@/store/chats-store"
import { SpinnerCircularFixed } from "spinners-react"
import { useChatStore } from "@/store/chat-store"
import { toast } from 'sonner';


export const NavChats = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isMobile } = useSidebar();
    const [newName, setNewName] = useState();
    const [openDialogId, setOpenDialogId] = useState();
    const chats = useChatsStore((state) => state.chats);
    const error = useChatsStore((state) => state.error);
    const renameChat = useChatsStore((state) => state.renameChat);
    const deleteChat = useChatsStore((state) => state.deleteChat);
    const fetchChats = useChatsStore((state) => state.fetchChats);
    const isChatThinking = useChatStore((state) => state.isChatThinking);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const { theme } = useTheme();
    const errorTimestampRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const initRef = useRef(false);

    useEffect(() => {
        if (error && error.message && error.timestamp !== errorTimestampRef.current) {
            toast.error(error.message, {
                action: {
                    label: "undo",
                },
            });
            errorTimestampRef.current = error.timestamp;
        }
    }, [error]);

    useEffect(() => {
        if (initRef.current) return

        initRef.current = true;

        const init = async () => {
            setIsLoading(true);
            await fetchChats();
            setIsLoading(false);
        }

        init();
    }, [fetchChats])

    const handleDeleteChat = (chatId) => {
        deleteChat(chatId);
        navigate("/");
    }

    const handleRenameChat = () => {
        renameChat(openDialogId, newName)
        setOpenDialogId(null);
    }

    return (
        <React.Fragment>
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                <SidebarGroupLabel>Chats</SidebarGroupLabel>
                <SidebarMenu>
                    {isLoading ? <Loader /> :
                        chats.map((chat) => {
                            const isDropdownOpen = chat.id === openDropdownId;
                            const isActive = (location.pathname === `/${chat.id}`) || isDropdownOpen;
                            return (
                                <SidebarMenuItem
                                    key={chat.id}
                                    data-active={isActive ? "true" : undefined}
                                    className={clsx(
                                        "flex items-center hover:bg-muted hover:rounded-md",
                                        { "bg-muted rounded-md font-bold": isActive }
                                    )}
                                >
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={`/${chat.id}`}
                                            className={({ isActive }) =>
                                                clsx(
                                                    "flex justify-between items-center w-full",
                                                    {
                                                        "text-primary font-semibold": isActive,
                                                    }
                                                )
                                            }
                                        >
                                            <span className="truncate">{chat.name}</span>
                                        </NavLink>
                                    </SidebarMenuButton>

                                    {isChatThinking(chat.id) ?
                                        <Button variant="ghost" className="px-2 py-1 flex focus-visible:ring-0 hover:bg-transparent">
                                            <SpinnerCircularFixed size={20} thickness={125} speed={100} color={theme == 'dark' ? "#ffffff" : "#000000"} secondaryColor={theme == 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                                        </Button>
                                        :
                                        <DropdownMenu open={openDropdownId === chat.id}
                                            onOpenChange={(open) => setOpenDropdownId(open ? chat.id : null)}
                                        >
                                            <DropdownMenuTrigger asChild >
                                                <Button variant="ghost" className={clsx(
                                                    "invisible transition-all py-1 px-2 duration-200 focus-visible:ring-0 hover:bg-transparent",
                                                    "group-hover/menu-item:visible",
                                                    { "visible": isDropdownOpen })}

                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(chat.id);
                                                    }}>
                                                    <MoreHorizontal size={8} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                className="w-48 rounded-lg"
                                                side={isMobile ? "bottom" : "right"}
                                                align={isMobile ? "end" : "start"}
                                            >
                                                <DropdownMenuItem onClick={() => {
                                                    setOpenDialogId(chat.id)
                                                    setNewName(chat.name)
                                                    setOpenDropdownId(null)
                                                }}>
                                                    <Pencil className="text-muted-foreground" />
                                                    <span>Rename</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDeleteChat(chat.id)}>
                                                    <Trash2 className="text-muted-foreground" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    }

                                </SidebarMenuItem>
                            )
                        })}
                </SidebarMenu>
            </SidebarGroup >
            <Dialog open={!!openDialogId} onOpenChange={() => setOpenDialogId(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Rename Chat</DialogTitle>
                        <DialogDescription>
                            Enter a new name for your chat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={handleRenameChat}
                        >
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    )
}
