"use client"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Sun, User, Users } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/context/auth"

const primaryMenuItems = [
  { title: "На главную", url: "/", icon: Home },
  { title: "Пациенты", url: "/patients", icon: Users },
]

const toMenuItem = (item) => {
  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild tooltip={item.title}>
        <Link href={item.url}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

const ThemeToggleButton = () => {
  const { setTheme } = useTheme()
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip="Сменить тему">
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span>Сменить тему</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-fit min-w-0">
          <DropdownMenuItem onClick={() => setTheme('light')}>
            Светлая
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            Тёмная
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            Системная
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

const UserProfileMenu = () => {
  const { logout } = useAuth()
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip="Профиль">
            <User />
            <span>Профиль</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User />
              Профиль
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOut />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="hidden md:block">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar} tooltip={open ? "Свернуть" : "Раскрыть"}>
              {open ? <PanelLeftClose /> : <PanelLeftOpen />}
              <span>{open ? "Свернуть" : "Раскрыть"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryMenuItems.map((item) => toMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <ThemeToggleButton />
          <UserProfileMenu />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
