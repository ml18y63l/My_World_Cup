import { notFound } from "next/navigation";
import { getTeamPageData, getAllTeamProfiles } from "@/lib/data";
import { TeamProfileClient } from "@/components/TeamProfileClient";

export function generateStaticParams() {
  return getAllTeamProfiles().map((p) => ({ teamId: p.team_id }));
}

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const data = getTeamPageData(teamId);
  if (!data) notFound();
  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <TeamProfileClient data={data} />
    </div>
  );
}
