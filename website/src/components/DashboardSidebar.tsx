import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
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

import { ChevronDown, ChevronUp, PlusCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useMutation } from "@tanstack/react-query";
import { queryClient, trpc } from "#lib/trpc";

import type { UserMinimal } from "#/modules/db/schema";
import { navigate } from "wouter/use-browser-location";
import { toast } from "sonner";

import type { APIPartialGuild } from "discord-api-types/v10";

export interface DashboardSidebarContextProps {
  selectedServerId?: string;
  setSelectedServerId: (id: string) => void;
  user: UserMinimal;
  guilds: GuildProperty[];
}

interface GuildProperty {
  id: string;
  name: string;
  permissions: number;
  icon: string | null;
  banner: string | null | undefined;
  owner: boolean;
  inviteable: boolean;
  uuid: string | null;
}

export const DashboardSidebarContext =
  createContext<DashboardSidebarContextProps | null>(null);

function useDashboard() {
  const context = useContext(DashboardSidebarContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider.");
  }

  return context;
}

export function DashboardProvider({
  children,
  user,
  selectedServerId: selectedServerIdProp,
  guilds,
}: {
  children: React.ReactNode;
  user: UserMinimal;
  selectedServerId?: string;
  guilds: GuildProperty[];
}) {
  const [_selectedServerId, _setSelectedServerId] = useState<
    string | undefined
  >();

  const selectedServerId = selectedServerIdProp ?? _selectedServerId;

  const setSelectedServerId = useCallback(
    (id: string) => {
      _setSelectedServerId(id);
    },
    [selectedServerId],
  );

  const contextValue = useMemo<DashboardSidebarContextProps>(
    () => ({
      selectedServerId,
      setSelectedServerId,
      user,
      guilds,
    }),
    [selectedServerId, user],
  );

  return (
    <DashboardSidebarContext.Provider value={contextValue}>
      {children}
    </DashboardSidebarContext.Provider>
  );
}

export function DashboardSidebar() {
  const dashboardContext = useDashboard();

  const logoutMutation = useMutation(
    trpc.authed.currentUser.logout.mutationOptions(),
  );

  const inviteMutation = useMutation(trpc.authed.makeInvite.mutationOptions());

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <span>Select server</span>
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
                        dashboardContext.setSelectedServerId(guild.uuid);
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
                    {guild.inviteable && (
                      <PlusCircle className="ml-auto mr-1" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
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
      </SidebarFooter>
    </Sidebar>
  );
}
