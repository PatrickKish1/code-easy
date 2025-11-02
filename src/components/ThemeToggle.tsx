"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button size="sm" variant="ghost" disabled>
        <span className="opacity-0">Light</span>
      </Button>
    );
  }
  
  const isDark = resolvedTheme === "dark";
  return (
    <Button size="sm" variant="ghost" onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? "Light" : "Dark"}
    </Button>
  );
}


