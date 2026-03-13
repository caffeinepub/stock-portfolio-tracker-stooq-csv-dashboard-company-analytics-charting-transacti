import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { ReactNode } from "react";
import { SidebarNav } from "./SidebarNav";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SidebarNav />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <main className="flex-1 p-6 overflow-auto">{children}</main>
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
