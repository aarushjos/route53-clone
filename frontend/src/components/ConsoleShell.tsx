"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppLayout,
  BreadcrumbGroup,
  SideNavigation,
  Flashbar,
  Spinner,
  TopNavigation,
} from "@cloudscape-design/components";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/hosted-zones": "Hosted zones",
  "/health-checks": "Health checks",
  "/traffic-policies": "Traffic policies",
  "/resolver": "Resolver",
  "/profiles": "Profiles",
};

export default function ConsoleShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { items: notifications } = useNotifications();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <Spinner size="large" />;

  const section = "/" + (pathname.split("/")[1] ?? "");
  const title = TITLES[section] ?? "Route 53";

  const go = (e: { preventDefault: () => void; detail: { href?: string } }) => {
    e.preventDefault(); // stop the full page reload
    if (e.detail.href) router.push(e.detail.href); // navigate without reloading
  };
  const crumbs = [
    { text: "Route 53", href: "/" },
    { text: title, href: section },
  ];
  if (pathname === "/hosted-zones/create") {
    crumbs.push({ text: "Create hosted zone", href: pathname });
  } else if (/^\/hosted-zones\/\d+/.test(pathname)) {
    crumbs.push({
      text: "Hosted zone details",
      href: `/hosted-zones/${pathname.split("/")[2]}`,
    });
    if (pathname.endsWith("/records/create")) {
      crumbs.push({ text: "Create record", href: pathname });
    } else if (pathname.endsWith("/edit")) {
      crumbs.push({ text: "Edit record", href: pathname });
    }
  }

  return (
    <>
      <div id="top-nav" style={{ position: "sticky", top: 0, zIndex: 1002 }}>
        <TopNavigation
          identity={{ href: "/", title: "Route 53", onFollow: go }}
          utilities={[
            {
              type: "menu-dropdown",
              text: "Global",
              items: [{ id: "global", text: "Global" }],
            },
            {
              type: "menu-dropdown",
              text: user.email,
              iconName: "user-profile",
              items: [{ id: "signout", text: "Sign out" }],
              onItemClick: async ({ detail }) => {
                if (detail.id === "signout") {
                  await logout();
                  router.replace("/login");
                }
              },
            },
          ]}
        />
      </div>

      <AppLayout
        headerSelector="#top-nav"
        toolsHide
        notifications={<Flashbar items={notifications} />}
        navigation={
          <SideNavigation
            activeHref={section}
            header={{ text: "Route 53", href: "/" }}
            onFollow={go}
            items={[
              { type: "link", text: "Dashboard", href: "/" },
              { type: "link", text: "Hosted zones", href: "/hosted-zones" },
              { type: "link", text: "Health checks", href: "/health-checks" },
              {
                type: "link",
                text: "Traffic policies",
                href: "/traffic-policies",
              },
              { type: "link", text: "Resolver", href: "/resolver" },
              { type: "link", text: "Profiles", href: "/profiles" },
            ]}
          />
        }
        breadcrumbs={<BreadcrumbGroup onFollow={go} items={crumbs} />}
        content={children}
      />
    </>
  );
}
