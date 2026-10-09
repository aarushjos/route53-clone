"use client";

import { useEffect, useState } from "react";
import { useZone } from "@/lib/zones";
import { usePathname, useRouter } from "next/navigation";
import {
  AppLayout,
  Badge,
  BreadcrumbGroup,
  Flashbar,
  Input,
  SideNavigation,
  SideNavigationProps,
  Spinner,
  TopNavigation,
} from "@cloudscape-design/components";
import { useAuth } from "@/lib/auth";
import {
  EXTERNAL_LINKS,
  NavLink,
  SECTIONS,
  TOP_LINKS,
  titleForPath,
} from "@/lib/nav";
import { useNotifications } from "@/lib/notifications";

const LOGO_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='44' height='28' viewBox='0 0 44 28'>" +
  "<text x='3' y='16' font-family='Arial' font-weight='700' font-size='18' fill='white'>aws</text>" +
  "<path d='M4 21 Q 20 28 36 20' stroke='#ff9900' stroke-width='2.4' fill='none' stroke-linecap='round'/>" +
  "</svg>";
const LOGO_SRC = "data:image/svg+xml," + encodeURIComponent(LOGO_SVG);

const navLink = (l: NavLink): SideNavigationProps.Link => ({
  type: "link",
  text: l.text,
  href: l.href,
  info: l.badge ? <Badge color="blue">New</Badge> : undefined,
});

export default function ConsoleShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { items: notifications } = useNotifications();
  const zoneIdInPath = /^\/hosted-zones\/(\d+)/.exec(pathname)?.[1];
  const { data: crumbZone } = useZone(Number(zoneIdInPath ?? 0));
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <Spinner size="large" />;
  const section = "/" + (pathname.split("/")[1] ?? "");
  const title = titleForPath(section) ?? "Route 53";

  const go = (e: {
    preventDefault: () => void;
    detail: { href?: string; external?: boolean };
  }) => {
    if (e.detail.external) return;
    e.preventDefault();
    if (e.detail.href) router.push(e.detail.href);
  };

  const crumbs = [
    { text: "Route 53", href: "/" },
    { text: title, href: section },
  ];
  if (pathname === "/hosted-zones/create") {
    crumbs.push({ text: "Create hosted zone", href: pathname });
  } else if (/^\/hosted-zones\/\d+/.test(pathname)) {
    crumbs.push({
      text: crumbZone?.name ?? "Hosted zone details",
      href: `/hosted-zones/${pathname.split("/")[2]}`,
    });
    if (pathname.endsWith("/records/create")) {
      crumbs.push({ text: "Create record", href: pathname });
    } else if (pathname.endsWith("/edit")) {
      crumbs.push({ text: "Edit record", href: pathname });
    }
  }

  const navItems: SideNavigationProps.Item[] = [
    ...TOP_LINKS.map(navLink),
    ...SECTIONS.map(
      (s): SideNavigationProps.Section => ({
        type: "section",
        text: s.text,
        defaultExpanded: true,
        items: s.items.map(navLink),
      }),
    ),
    { type: "divider" },
    ...EXTERNAL_LINKS.map(
      (l): SideNavigationProps.Link => ({
        type: "link",
        text: l.text,
        href: l.href,
        external: true,
      }),
    ),
  ];

  const username = user.email.split("@")[0];

  return (
    <>
      <div id="top-nav" style={{ position: "sticky", top: 0, zIndex: 1002 }}>
        <TopNavigation
          identity={{
            href: "/",
            logo: { src: LOGO_SRC, alt: "AWS" },
            onFollow: go,
          }}
          search={
            <Input
              type="search"
              value={searchText}
              placeholder="Search"
              ariaLabel="Search"
              onChange={({ detail }) => setSearchText(detail.value)}
            />
          }
          utilities={[
            {
              type: "button",
              iconName: "command-prompt",
              ariaLabel: "CloudShell",
              title: "CloudShell",
            },
            {
              type: "button",
              iconName: "notification",
              ariaLabel: "Notifications",
              title: "Notifications",
            },
            {
              type: "button",
              iconName: "status-info",
              ariaLabel: "Support",
              title: "Support",
            },
            {
              type: "button",
              iconName: "settings",
              ariaLabel: "Settings",
              title: "Settings",
            },
            {
              type: "menu-dropdown",
              text: "Global",
              items: [{ id: "global", text: "Global" }],
            },
            {
              type: "menu-dropdown",
              text: username,
              description: "1234-5678-9012",
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
        footerSelector="#footer"
        toolsHide
        notifications={<Flashbar items={notifications} />}
        navigation={
          <SideNavigation
            activeHref={section}
            header={{ text: "Route 53", href: "/" }}
            onFollow={go}
            items={navItems}
          />
        }
        breadcrumbs={<BreadcrumbGroup onFollow={go} items={crumbs} />}
        content={children}
      />

      <div
        id="footer"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1001,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          padding: "10px 16px",
          background: "#161d26",
          color: "#e9ebed",
          fontSize: 14,
        }}
      >
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <span>CloudShell</span>
          <span>Agent Toolkit for AWS</span>
          <span>Feedback</span>
          <span>Console Mobile App</span>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <span>
            © {new Date().getFullYear()}, Amazon Web Services, Inc. or its
            affiliates.
          </span>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Cookie preferences</span>
        </div>
      </div>
    </>
  );
}
