import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "#/components/ui/sidebar";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { DashboardSidebarContent } from "./DashboardSidebarContent";

import { type RouterOutput } from "#lib/trpc";

import type { UserMinimal } from "#/modules/db/schema";
import { type GuildProperty } from "#/types/discord";
import { DashboardSidebarFooter } from "./DashboardSidebarFooter";
import { DashboardSidebarHeader } from "./DashboardSidebarHeader";

export interface DashboardSidebarContextProps {
  selectedServerId?: string;
  setSelectedServerId: (id: string | undefined) => void;
  guild?: GuildProperty;
  user: UserMinimal;
  configuration: RouterOutput["configuration"];
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
  configuration,
  guilds,
}: {
  children: React.ReactNode;
  user: UserMinimal;
  selectedServerId?: string;
  configuration: RouterOutput["configuration"];
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
      configuration,
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <DashboardSidebarHeader />
      </SidebarHeader>

      <SidebarContent>
        {dashboardContext.guild && <DashboardSidebarContent />}
      </SidebarContent>
      <SidebarFooter>
        <DashboardSidebarFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
