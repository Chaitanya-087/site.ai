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
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

import clsx from "clsx"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import { useChatStore } from "@/store/chat-store"
import { Label } from "@radix-ui/react-dropdown-menu"
import { NavLink, useLocation } from "react-router-dom"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"

export function NavChats() {
    const location = useLocation();
    const { isMobile } = useSidebar();
    const [newName, setNewName] = useState();
    const [openDialogId, setOpenDialogId] = useState();
    const { renameChat, deleteChat, isLoading, chats, getChats } = useChatStore();

    useEffect(() => {
        getChats();
    }, [getChats])

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarMenu>
                {isLoading ? <>Loading...</> :
                    chats.map((chat) => {
                        const isActive = location.pathname === `/${chat.id}`

                        return (
                            <SidebarMenuItem
                                key={chat.id}
                                data-active={isActive ? "true" : undefined}
                                className={clsx({
                                    "bg-muted rounded-md": isActive,
                                })}
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

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuAction
                                            className={clsx(
                                                "transition-opacity duration-200 focus-visible:ring-0",
                                                {
                                                    "visible opacity-100": isActive,
                                                    "group-hover/menu-item:opacity-100 opacity-0": !isActive,
                                                }
                                            )}
                                        >
                                            <MoreHorizontal />
                                            <span className="sr-only">More</span>
                                        </SidebarMenuAction>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-48 rounded-lg"
                                        side={isMobile ? "bottom" : "right"}
                                        align={isMobile ? "end" : "start"}
                                    >
                                        <DropdownMenuItem onClick={() => {
                                            setOpenDialogId(chat.id)
                                            setNewName(chat.name)
                                        }}>
                                            <Pencil className="text-muted-foreground" />
                                            <span>Rename</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => deleteChat(chat.id)}>
                                            <Trash2 className="text-muted-foreground" />
                                            <span>Delete Chat</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
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
                                                onClick={() => {
                                                    renameChat(openDialogId, newName)
                                                    setOpenDialogId(null)
                                                }}
                                            >
                                                Save changes
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                            </SidebarMenuItem>
                        )
                    })}
            </SidebarMenu>
        </SidebarGroup >
    )
}
