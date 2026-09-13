import { Link } from "@tanstack/react-router";
import { MoonStar } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-background/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2 font-display text-xl text-foreground">
          <MoonStar className="size-5 text-primary" aria-hidden="true" />
          Vetaal
        </Link>
        <nav aria-label="Primary navigation" className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link to="/about" activeProps={{ className: "text-foreground" }} className="transition-colors hover:text-foreground">About</Link>
          <Link to="/privacy" activeProps={{ className: "text-foreground" }} className="transition-colors hover:text-foreground">Privacy</Link>
        </nav>
      </div>
    </header>
  );
}