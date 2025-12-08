import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Force dynamic rendering for all protected routes
// This prevents Clerk errors during build when no valid key is available
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}

