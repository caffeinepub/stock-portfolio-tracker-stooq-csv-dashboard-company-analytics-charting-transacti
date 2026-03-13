import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Moon,
  Settings,
  Sun,
  TrendingUp,
} from "lucide-react";
import { useThemeMode } from "../../hooks/useThemeMode";

export function SidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();

  const navItems = [
    { icon: Building2, label: "Entreprises", path: "/" },
    { icon: BarChart3, label: "Portefeuille", path: "/portfolio" },
    { icon: Settings, label: "Paramètres", path: "/settings" },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground leading-none">
              Portfolio Tracker
            </p>
            <p className="text-xs text-sidebar-foreground/50 mt-0.5">
              Données Stooq
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                onClick={() => navigate({ to: item.path })}
                isActive={
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                }
                data-ocid={`nav.${item.label.toLowerCase().replace(/[^a-z]/g, "")}.link`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMode}
          className="w-full"
          data-ocid="settings.toggle"
        >
          {mode === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Mode clair
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Mode sombre
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
