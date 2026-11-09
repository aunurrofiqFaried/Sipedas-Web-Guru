import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) redirect("/login");

  return <div className="min-h-dvh">{children}</div>;
}