import { Link, useLocation } from "wouter";
import { Map, Activity, BarChart2, Info, Radio } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Map", icon: Map },
    { href: "/reports", label: "Reports", icon: Activity },
    { href: "/stats", label: "Intel", icon: BarChart2 },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-mono font-bold tracking-tighter text-primary">
            <Radio className="h-5 w-5" />
            <span className="hidden sm:inline">DEAD_ZONE_TRACKER</span>
            <span className="sm:hidden">DZT</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 border border-primary/30 ml-1">IN</span>
          </Link>
          <nav className="flex items-center space-x-1 sm:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:text-primary rounded-md
                  ${location === item.href ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
              >
                <item.icon className="h-4 w-4 hidden sm:block" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
