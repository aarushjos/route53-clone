"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { FlashbarProps } from "@cloudscape-design/components";

type Item = FlashbarProps.MessageDefinition;

type NotificationsState = {
  items: Item[];
  notify: (type: "success" | "error", content: string) => void;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<Item[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const notify = useCallback(
    (type: "success" | "error", content: string) => {
      const id = crypto.randomUUID();
      setItems((prev) => [
        { id, type, content, dismissible: true, onDismiss: () => dismiss(id) },
        ...prev,
      ]);
      if (type === "success") setTimeout(() => dismiss(id), 8000);
    },
    [dismiss],
  );

  return (
    <NotificationsContext.Provider value={{ items, notify }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside NotificationsProvider",
    );
  return ctx;
}
