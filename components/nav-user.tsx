"use client"

import {
    ChevronsUpDown,
    User,
} from "lucide-react";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Link from "next/link";
import LogoutButton from "./signOut";

export function NavUser({
    usuario,
}: {
    usuario: {

        IdUser: string;
        User: string;
        Rol: string;
        IdRol: string;
        IdEmpleado: string;

        Permiso: string[];

    }
}) {

    return (<SidebarMenu>
        <SidebarMenuItem>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage alt={usuario?.User} />
                            <AvatarFallback className="rounded-lg">{usuario.User.toUpperCase()[0]}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{usuario?.User}</span>
                            <span className="truncate text-xs">{usuario?.Rol}</span>
                        </div>
                        <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    align="end"
                    sideOffset={4}
                >
                    <DropdownMenuItem asChild></DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex justify-between">
                            <span>Perfil</span>
                            <User className="ml-2 h-4 w-40 text-muted-foreground" />
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <LogoutButton />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    </SidebarMenu>

    )
}