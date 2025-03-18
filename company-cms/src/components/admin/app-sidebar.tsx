'use client'

import * as React from "react"
import { GalleryVerticalEnd, Minus, Plus } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/store"
import { Axios } from "@/config/axios"
import { env } from "@/config/env"

// Add before the sidebarData
interface SidebarItem {
  title: string;
  url: string;
  isActive?: boolean;
  items?: SidebarItem[];
}

const sidebarData: { navMain: SidebarItem[] } = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
    },
    {
      title: "Settings",
      url: "#",
      items: [
        {
          title: "Account",
          url: "/settings/account-manage",
        },
        {
          title: "User Management",
          url: "/settings/user-manage",
        },
      ],
    },
    
  ],
};


  

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

    const { user, logout } = useAuthStore();
    const router = useRouter();
    
  
    const handleLogout = async () => {
      try {
        const response = await Axios.post(
          `${env.BACKEND_BASE_URL}/api/auth/signout`
        );
        if (response.data.success) {
          logout();
          router.push("/sign-in");
        } else {
          throw new Error("Failed to sign out");
        }
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Hostel Haven</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarData.navMain.map((item, index) => (
              <Collapsible
                key={item.title}
                defaultOpen={index === 1}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.title}{" "}
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={item.isActive}
                            >
                              <a href={item.url}>{item.title}</a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser 
          user={{
            name: session?.user?.name || null,
            email: session?.user?.email || null,
            avatar: session?.user?.image || undefined,
          }} 
          onSignOut={handleSignOut}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}


