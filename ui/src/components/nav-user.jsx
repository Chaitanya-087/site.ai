import React, { useEffect, useRef, useState } from "react"
import { PropTypes } from "prop-types"

import {
    LogOut,
    UserCircle,
    Settings,
    Vault
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useClerk } from "@clerk/clerk-react"
import { useGeminiTokenStore } from "@/store/gemini-token-store"
import { toast } from "sonner"

export const NavUser = ({ user }) => {
    const clerk = useClerk();
    const token = useGeminiTokenStore((state) => state.token);
    const fetchToken = useGeminiTokenStore((state) => state.fetchToken);
    const saveToken = useGeminiTokenStore((state) => state.saveToken);
    const error = useGeminiTokenStore((state) => state.error);
    const { isMobile } = useSidebar();
    const [currentToken, setCurrentToken] = useState(token || "");
    const [openDialog, setOpenDialog] = useState(false);
    const initRef = useRef(false);
    const errorTimestampRef = useRef(null);

    const handleSignOut = async () => {
        sessionStorage.clear();
        await clerk.signOut();
    }

    useEffect(() => {
        if (initRef.current) return;

        initRef.current = true;

        const init = async () => {
            await fetchToken();
        };

        init();
    }, [fetchToken]);


    useEffect(() => {
        setCurrentToken(token || "")
    }, [token])

    const onSubmit = async () => {
        if (!currentToken) return;
        await saveToken(currentToken)
        setOpenDialog(false)
    }

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

    return (
        <React.Fragment>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </span>
                                </div>
                                <div className="relative w-fit">
                                    <Settings className="ml-auto size-4" />

                                    {!token && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-600" />
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    Please Add Token!
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>

                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{user.name}</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => clerk.openUserProfile({})}>
                                    <UserCircle />
                                    Account
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="relative w-full" onClick={() => setOpenDialog(true)} >
                                <Vault />
                                Vault
                                {!token &&
                                    <div className="absolute top-1/2 right-2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-600" />
                                }
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut}>
                                <LogOut />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            <Dialog open={openDialog} onOpenChange={() => setOpenDialog(false)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Token</DialogTitle>
                        <DialogDescription>
                            Add your <b>gemini</b> llm token, we securely store your token using RSA encryption.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="token" className="text-right">
                                Token
                            </Label>
                            <Input id="token" defaultValue={token} placeholder="add.token.here" onChange={(e) => setCurrentToken(e.target.value)} type="password" className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={onSubmit} >Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    )
}

NavUser.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
        avatar: PropTypes.string
    }).isRequired
}
