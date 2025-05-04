"use client"

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

import { NavLink, useLocation } from "react-router-dom"
import clsx from "clsx"
import Proptypes from "prop-types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "@radix-ui/react-dropdown-menu"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { useState } from "react"

export function NavChats({ chats, isLoaded, renameChat, deleteChat }) {
    const location = useLocation()
    const { isMobile } = useSidebar()
    const [newName, setNewName] = useState();
    const [openDialogId, setOpenDialogId] = useState();

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarMenu>
                {
                    isLoaded ?
                        chats.map((item) => {
                            const isActive = location.pathname === `/${item.id}`

                            return (
                                <SidebarMenuItem
                                    key={item.id}
                                    data-active={isActive ? "true" : undefined}
                                    className={clsx({
                                        "bg-muted rounded-md": isActive,
                                    })}
                                >
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={`/${item.id}`}
                                            className={({ isActive }) =>
                                                clsx(
                                                    "flex justify-between items-center w-full",
                                                    {
                                                        "text-primary font-semibold": isActive,
                                                    }
                                                )
                                            }
                                        >
                                            <span className="truncate">{item.name}</span>
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
                                                setOpenDialogId(item.id)
                                                setNewName(item.name)
                                            }}>
                                                <Pencil className="text-muted-foreground" />
                                                <span>Rename</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => deleteChat(item.id)}>
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
                        }) : <>Loading...</>
                }
            </SidebarMenu>
        </SidebarGroup >
    )
}

NavChats.propTypes = {
    chats: Proptypes.arrayOf(
        Proptypes.shape({
            id: Proptypes.oneOfType([Proptypes.string, Proptypes.number]).isRequired,
            name: Proptypes.string.isRequired,
        })
    ).isRequired,
    isLoaded: Proptypes.bool.isRequired,
    renameChat: Proptypes.func.isRequired,
    deleteChat: Proptypes.func.isRequired
};
