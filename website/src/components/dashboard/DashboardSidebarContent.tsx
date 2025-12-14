import { useDashboard } from "./DashboardSidebar";

import { useMutation } from "@tanstack/react-query";
import { trpc } from "#lib/trpc";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarGroupAction,
} from "#/components/ui/sidebar";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";

import { LayoutDashboard, TriangleAlert, Bean } from "lucide-react";

import { toast } from "sonner";

import { Link } from "wouter";

export function DashboardSidebarContent() {
  const dashboardContext = useDashboard();

  const guildRefreshMutation = useMutation(
    trpc.authed.guild.refreshGuild.mutationOptions(),
  );

  if (!dashboardContext.guild) {
    return <p>Guild info not available</p>;
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>General</SidebarGroupLabel>
        <SidebarGroupAction
          onClick={async () => {
            const result = await guildRefreshMutation.mutateAsync({
              guildId: dashboardContext.guild!.id,
            });

            if (result.success) {
              toast.success(result.message);
            } else {
              toast.error(result.message);
            }
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <TriangleAlert />
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete the UK (guild refresh)</p>
            </TooltipContent>
          </Tooltip>
        </SidebarGroupAction>
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
    </>
  );
}
