import { useDashboard } from "./DashboardSidebar";

import { useMutation } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";

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

import { ChevronDown, PlusCircle } from "lucide-react";

import { toast } from "sonner";

export function DashboardSidebarHeader() {
  const dashboardContext = useDashboard();

  const inviteMutation = useMutation(trpc.authed.makeInvite.mutationOptions());

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              {dashboardContext.guild ? (
                <>
                  <Avatar className="w-8 h-8">
                    {dashboardContext.guild.icon && (
                      <AvatarImage
                        src={`https://cdn.discordapp.com/icons/${dashboardContext.guild.id}/${dashboardContext.guild.icon}.webp?size=128`}
                        alt={dashboardContext.guild.name}
                      />
                    )}
                    <AvatarFallback>
                      {dashboardContext.guild.name}
                    </AvatarFallback>
                  </Avatar>
                  <span>{dashboardContext.guild.name}</span>
                </>
              ) : (
                <span>Select server</span>
              )}
              <ChevronDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-popper-anchor-width]"
            sideOffset={4}
          >
            {dashboardContext.guilds.map((guild) => (
              <DropdownMenuItem
                key={guild.id}
                onClick={async () => {
                  if (!guild.inviteable && guild.uuid) {
                    navigate(`/dashboard/${guild.uuid}/overview`);
                    return;
                  }

                  const result = await inviteMutation.mutateAsync(guild.id);
                  if (result.success && result.url) {
                    window.location.href = result.url;
                  } else {
                    toast.error(
                      `Failed to create invite link: ${
                        result.message ?? "Unknown error"
                      }`,
                    );
                  }
                }}
              >
                <Avatar className="w-6 h-6">
                  {guild.icon && (
                    <AvatarImage
                      src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=32`}
                      alt={guild.name}
                    />
                  )}
                  <AvatarFallback>{guild.name}</AvatarFallback>
                </Avatar>
                <span>{guild.name}</span>
                {guild.inviteable && <PlusCircle className="ml-auto mr-1" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
