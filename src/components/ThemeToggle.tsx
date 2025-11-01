"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = (mounted ? resolvedTheme : theme) === "dark";
  return (
    <Button size="sm" variant="ghost" onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? "Light" : "Dark"}
    </Button>
  );
}


