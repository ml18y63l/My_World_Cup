import Link from "next/link";

const NAV_ITEMS = [
  { label: "赛事概览", href: "/" },
  { label: "球队画像", href: "/team" },
  { label: "对阵模拟", href: "/h2h" },
];

export function TopNav({ currentPath = "/" }: { currentPath?: string }) {
  return (
    <header className="bg-[#1a1a2e] px-5 py-2.5 flex items-center gap-4">
      <span className="text-white font-bold text-base">🏆 WC 2026</span>
      <span className="text-white/30 text-sm">|</span>
      <nav className="flex gap-5 text-sm">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pb-0.5 ${
                isActive
                  ? "text-white font-semibold border-b-2 border-[#e53e3e]"
                  : "text-white/50 hover:text-white/80 transition-colors"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
