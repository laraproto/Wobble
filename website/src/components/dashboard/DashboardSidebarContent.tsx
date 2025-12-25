import { useDashboard } from "./DashboardSidebar";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "#/components/ui/sidebar";

import {
  LayoutDashboard,
  Bean,
  Bot,
  Gavel,
  UserRound,
  Notebook,
} from "lucide-react";

import { Link } from "wouter";

export function DashboardSidebarContent() {
  const dashboardContext = useDashboard();

  if (!dashboardContext.guild) {
    return <p>Guild info not available</p>;
  }

  return (
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
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={`/${dashboardContext.guild.uuid}/users`}>
                  <UserRound />
                  Users
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {dashboardContext.configuration.development && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={`/${dashboardContext.guild.uuid}/debug`}>
                    <Bean />
                    Debug
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Modules</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={`/${dashboardContext.guild.uuid}/cases`}>
                  <Notebook />
                  Cases
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={`/${dashboardContext.guild.uuid}/moderation`}>
                  <Gavel />
                  Mod Actions
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={`/${dashboardContext.guild.uuid}/counters`}>
                  <Bean />
                  Counters
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={`/${dashboardContext.guild.uuid}/automod`}>
                  <Bot />
                  Automod
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
