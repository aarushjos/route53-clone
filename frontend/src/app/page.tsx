"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  SpaceBetween,
  Spinner,
} from "@cloudscape-design/components";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <Spinner size="large" />;

  return (
    <Box padding="xxl">
      <SpaceBetween size="m">
        <Box variant="h1">Logged in as {user.email}</Box>
        <Button
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          Sign out
        </Button>
      </SpaceBetween>
    </Box>
  );
}
