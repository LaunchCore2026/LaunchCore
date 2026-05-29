import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Search, 
  Link as LinkIcon, 
  Users, 
  Settings, 
  Terminal,
  ChevronRight,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/crawls", label: "Crawls", icon: Terminal },
  { href: "/keywords", label: "Keywords", icon: Search },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/backlinks", label: "Backlinks", icon: LinkIcon },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row dark">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="h-14 border-b border-border flex items-center px-4 font-mono font-bold tracking-tight text-primary">
          <Terminal className="w-5 h-5 mr-2" />
          LAUNCHCORE
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full justify-start text-muted-foreground font-mono text-xs">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 md:hidden">
           <div className="font-mono font-bold text-primary flex items-center">
             <Terminal className="w-5 h-5 mr-2" />
             LAUNCHCORE
           </div>
           <Button variant="ghost" size="icon">
             <Menu className="w-5 h-5" />
           </Button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
