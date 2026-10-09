import ComingSoon from "@/components/ComingSoon";
import { titleForPath } from "@/lib/nav";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = "/" + slug.join("/");
  const last = slug[slug.length - 1].replace(/-/g, " ");
  const fallback = last.charAt(0).toUpperCase() + last.slice(1);
  return <ComingSoon title={titleForPath(path) ?? fallback} />;
}
