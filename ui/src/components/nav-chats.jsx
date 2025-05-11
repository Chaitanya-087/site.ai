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

import clsx from "clsx"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import React, { useEffect, useState } from "react"
import { useChatStore } from "@/store/chat-store"
import { Label } from "@radix-ui/react-dropdown-menu"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { PulseLoader } from "react-spinners"

export function NavChats() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isMobile } = useSidebar();
    const [newName, setNewName] = useState();
    const [openDialogId, setOpenDialogId] = useState();
    const { renameChat, deleteChat, isLoading, chats, getChats, clear } = useChatStore();
    const [openDropdownId, setOpenDropdownId] = useState(null);

    useEffect(() => {
        getChats();
    }, [getChats])

    const handleDeleteChat = (chatId) => {
        deleteChat(chatId);
        clear();
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
                    {isLoading ? <>Loading...</> :
                        chats.map((chat) => {
                            const isDropdownOpen = chat.id === openDropdownId;
                            const isActive = (location.pathname === `/${chat.id}`) || isDropdownOpen;
                            return (
                                <SidebarMenuItem
                                    key={chat.id}
                                    data-active={isActive ? "true" : undefined}
                                    className={clsx(
                                        "flex items-center hover:bg-muted hover:rounded-md",
                                        { "bg-muted rounded-md": isActive }
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

                                    {chat.isProcessing ?
                                        <Button variant="ghost" className="px-2 py-1 flex focus-visible:ring-0 hover:bg-transparent">
                                            <PulseLoader color="#ffffff" size={4} />
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
