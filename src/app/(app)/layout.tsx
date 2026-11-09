import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Providers from "@/app/providers";
import Shell from "@/components/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) redirect("/login");

  return (
    <Providers>
      <Shell user={user}>{children}</Shell>
    </Providers>
  );
}