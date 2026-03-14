import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp } from "lucide-react";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { SidebarNav } from "./SidebarNav";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(!isMobile);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background relative overflow-hidden">
      {/* Hover/tap trigger strip */}
      {!open && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: edge strip
        <div
          className={[
            "fixed left-0 top-0 h-full z-40",
            isMobile
              ? "w-4 flex items-center justify-start cursor-pointer"
              : "w-3 hover:w-4 transition-all duration-150",
          ].join(" ")}
          onMouseEnter={
            !isMobile
              ? () => {
                  cancelClose();
                  setOpen(true);
                }
              : undefined
          }
          onClick={isMobile ? () => setOpen(true) : undefined}
          data-ocid="nav.sidebar.edge_trigger"
        >
          <div
            className={[
              "h-16 rounded-r-md bg-primary/60 hover:bg-primary/90 transition-colors",
              isMobile ? "w-1.5" : "w-1",
            ].join(" ")}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={[
          "fixed left-0 top-0 h-full z-50 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        onMouseLeave={!isMobile ? scheduleClose : undefined}
        onMouseEnter={!isMobile ? cancelClose : undefined}
      >
        <SidebarNav onClose={() => setOpen(false)} />
      </div>

      {/* Overlay for mobile */}
      {isMobile && open && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          data-ocid="nav.sidebar.overlay"
        />
      )}

      {/* Main content */}
      <div
        className={[
          "flex flex-col flex-1 min-w-0 transition-all duration-200",
          open && !isMobile ? "ml-64" : "ml-0",
        ].join(" ")}
      >
        {/* Mobile top bar */}
        <header className="flex md:hidden items-center gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3 shrink-0">
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            onClick={() => setOpen(true)}
            data-ocid="nav.sidebar.toggle"
          >
            <TrendingUp className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">
              Portfolio Tracker
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-screen-2xl mx-auto w-full">{children}</div>
        </main>

        <footer className="border-t border-border bg-card/50 px-6 py-3 text-center text-xs text-muted-foreground shrink-0">
          © {new Date().getFullYear()} · Construit avec ❤️ en utilisant{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
