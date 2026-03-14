import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  ChevronLeft,
  Moon,
  Settings,
  Sun,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useThemeMode } from "../../hooks/useThemeMode";

interface SidebarNavProps {
  onClose?: () => void;
}

export function SidebarNav({ onClose }: SidebarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();

  const navItems = [
    { icon: Building2, label: "Entreprises", path: "/" },
    { icon: TrendingDown, label: "Opportunités", path: "/opportunities" },
    { icon: BarChart3, label: "Portefeuille", path: "/portfolio" },
    { icon: Settings, label: "Paramètres", path: "/settings" },
  ];

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">
              Portfolio Tracker
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Données Stooq
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground"
          data-ocid="nav.sidebar.close_button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <button
              type="button"
              key={item.path}
              onClick={() => {
                navigate({ to: item.path });
                onClose?.();
              }}
              className={[
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors mb-0.5",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              ].join(" ")}
              data-ocid={`nav.${item.label.toLowerCase().replace(/[^a-z]/g, "")}.link`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
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
      </div>
    </div>
  );
}
