export type NavLink = { text: string; href: string; badge?: boolean };
export type NavSection = { text: string; items: NavLink[] };

export const TOP_LINKS: NavLink[] = [
  { text: "Dashboard", href: "/" },
  { text: "Hosted zones", href: "/hosted-zones" },
  { text: "Health checks", href: "/health-checks" },
  { text: "Profiles", href: "/profiles" },
];

export const SECTIONS: NavSection[] = [
  {
    text: "Global Resolver",
    items: [
      { text: "Global resolvers", href: "/global-resolvers", badge: true },
      { text: "Shared DNS views", href: "/shared-dns-views", badge: true },
    ],
  },
  {
    text: "VPC Resolver",
    items: [
      { text: "VPCs", href: "/vpcs" },
      { text: "Inbound endpoints", href: "/inbound-endpoints" },
      { text: "Outbound endpoints", href: "/outbound-endpoints" },
      { text: "Rules", href: "/rules" },
      { text: "Query logging", href: "/query-logging" },
      { text: "Outposts", href: "/outposts" },
    ],
  },
  {
    text: "Domains",
    items: [
      { text: "Registered domains", href: "/registered-domains" },
      { text: "Requests", href: "/requests" },
    ],
  },
  {
    text: "IP-based routing",
    items: [{ text: "CIDR collections", href: "/cidr-collections" }],
  },
  {
    text: "Traffic flow",
    items: [
      { text: "Traffic policies", href: "/traffic-policies" },
      { text: "Policy records", href: "/policy-records" },
    ],
  },
];

export const EXTERNAL_LINKS = [
  { text: "DNS Firewall", href: "https://console.aws.amazon.com/route53resolver/home#/dns-firewall" },
  { text: "Application Recovery Controller", href: "https://console.aws.amazon.com/route53recovery/home" },
];

const EXTRA: NavLink[] = [{ text: "Resolver", href: "/resolver" }];

const ALL = [...TOP_LINKS, ...SECTIONS.flatMap((s) => s.items), ...EXTRA];

export function titleForPath(path: string): string | undefined {
  return ALL.find((l) => l.href === path)?.text;
}