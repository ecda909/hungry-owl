import { redirect } from "next/navigation";

export default function RecipesPage() {
  // Redirect to dashboard for now - recipe browsing is integrated in dashboard
  redirect("/dashboard");
}

