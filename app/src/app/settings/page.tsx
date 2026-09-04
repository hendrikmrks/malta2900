import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopHeader } from "@/components/TopHeader";
import { USERNAME_COOLDOWN_MS } from "@/lib/game";
import SettingsForm from "./SettingsForm";
import AccountForm from "./AccountForm";
import DangerZone from "./DangerZone";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = await getSessionUserId();

  if (!userId || !session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { locale: true, email: true, username: true, usernameChangedAt: true },
  });

  const nextUsernameChangeAt = user?.usernameChangedAt
    ? new Date(user.usernameChangedAt.getTime() + USERNAME_COOLDOWN_MS).toISOString()
    : null;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <TopHeader username={session.user.name ?? ""} active="/settings" />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <AccountForm
            email={user?.email ?? ""}
            username={user?.username ?? ""}
            nextUsernameChangeAt={nextUsernameChangeAt}
          />
        </div>
        <div className="space-y-6">
          <SettingsForm currentLocale={user?.locale ?? "de"} />
        </div>
      </div>

      <div className="mt-6">
        <DangerZone />
      </div>
    </main>
  );
}
