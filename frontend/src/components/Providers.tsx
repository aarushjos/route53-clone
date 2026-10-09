"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { applyTheme } from "@cloudscape-design/components/theming";
import { AuthProvider } from "@/lib/auth";
import { NotificationsProvider } from "@/lib/notifications";
import { ThemeProvider } from "@/lib/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const { reset } = applyTheme({
      theme: {
        tokens: {
          colorBackgroundButtonPrimaryDefault: "#ff9900",
          colorBackgroundButtonPrimaryHover: "#ffac31",
          colorBackgroundButtonPrimaryActive: "#ffb85c",
          colorTextButtonPrimaryDefault: "#0f141a",
          colorTextButtonPrimaryHover: "#0f141a",
          colorTextButtonPrimaryActive: "#0f141a",
        },
      },
    });
    return reset;
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
