import { useDashboard } from "./DashboardSidebar";

import { useMutation } from "@tanstack/react-query";
import { queryClient, trpc } from "#lib/trpc";

import { navigate } from "wouter/use-hash-location";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "#/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "#/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";

import { ChevronUp } from "lucide-react";

export function DashboardSidebarFooter() {
  const dashboardContext = useDashboard();

  const logoutMutation = useMutation(
    trpc.authed.currentUser.logout.mutationOptions(),
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              <Avatar>
                {dashboardContext.user.avatarHash && (
                  <AvatarImage
                    src={`https://cdn.discordapp.com/avatars/${dashboardContext.user.discordId}/${dashboardContext.user.avatarHash}.webp?size=128`}
                    alt={dashboardContext.user.username}
                  />
                )}
                <AvatarFallback>
                  {dashboardContext.user.username}
                </AvatarFallback>
              </Avatar>
              <span>
                {dashboardContext.user.displayName ??
                  dashboardContext.user.username}
              </span>
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width]"
            align="start"
          >
            <DropdownMenuItem
              onClick={async () => {
                await logoutMutation.mutateAsync();
                await queryClient.invalidateQueries();
                navigate("/", {
                  replace: true,
                });
              }}
            >
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
