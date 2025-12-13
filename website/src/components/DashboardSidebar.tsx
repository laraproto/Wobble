import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "#/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "#/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";

import {
  ChevronDown,
  ChevronUp,
  PlusCircle,
  LayoutDashboard,
} from "lucide-react";
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
import { type GuildProperty } from "#/types/discord";
import { Link } from "wouter";

export interface DashboardSidebarContextProps {
  selectedServerId?: string;
  setSelectedServerId: (id: string | undefined) => void;
  guild?: GuildProperty;
  user: UserMinimal;
  guilds: GuildProperty[];
}

export const DashboardSidebarContext =
  createContext<DashboardSidebarContextProps | null>(null);

export function useDashboard() {
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

  const selectedGuild: GuildProperty | undefined = guilds.find(
    (guild) => guild.uuid === selectedServerId,
  );

  const setSelectedServerId = useCallback(
    (id: string | undefined) => {
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
      guild: selectedGuild,
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
        {dashboardContext.guild && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>General</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/${dashboardContext.guild.uuid}/overview`}>
                        <LayoutDashboard />
                        Overview
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
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
