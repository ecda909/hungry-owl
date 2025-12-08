import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getOrCreateUser, isOnboardingComplete } from "@/lib/actions/user";
import { redirect } from "next/navigation";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user exists in our database
  await getOrCreateUser();

  // Check if onboarding is complete
  const onboardingComplete = await isOnboardingComplete();
  
  if (!onboardingComplete) {
    redirect("/onboarding");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

