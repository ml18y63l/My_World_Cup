import { getAllTeamsWithRadar } from "@/lib/data";
import { H2HClient } from "@/components/H2HClient";

export default function H2HPage() {
  const data = getAllTeamsWithRadar();

  return (
    <div className="bg-[#f7f8fa] min-h-screen flex flex-col">
      <H2HClient data={data} />
    </div>
  );
}
