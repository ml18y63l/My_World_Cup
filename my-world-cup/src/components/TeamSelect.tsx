"use client";

import { useState, useRef, useEffect } from "react";

interface TeamOption {
  team_id: string;
  team_name: string;
  team_name_en: string;
  confederation: string;
  group: string;
}

interface TeamSelectProps {
  teams: TeamOption[];
  value: string | null;
  onChange: (teamNameEn: string | null) => void;
  placeholder?: string;
  disabled?: string | null;
}

export function TeamSelect({
  teams,
  value,
  onChange,
  placeholder = "选择球队...",
  disabled,
}: TeamSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = teams.find((t) => t.team_name_en === value);

  const filtered = teams.filter((t) => {
    if (t.team_name_en === disabled) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.team_name.toLowerCase().includes(q) ||
      t.team_name_en.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-[260px]">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 rounded-lg border text-left text-sm flex items-center justify-between gap-2 transition-colors ${
          isOpen
            ? "border-[#3182ce] bg-white ring-2 ring-[#3182ce]/20"
            : "border-[#e2e8f0] bg-white hover:border-gray-300"
        }`}
      >
        <span className={selected ? "text-[#1a1a2e] font-medium" : "text-gray-400"}>
          {selected ? selected.team_name : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-[#e2e8f0] shadow-lg max-h-[280px] overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[#eef0f3]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索球队..."
              className="w-full px-2 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-[#3182ce]"
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-[220px]">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">无匹配结果</div>
            ) : (
              filtered.map((team) => (
                <button
                  key={team.team_id}
                  type="button"
                  onClick={() => {
                    onChange(team.team_name_en);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[#f7f8fa] transition-colors flex items-center justify-between ${
                    team.team_name_en === value ? "bg-[#3182ce]/5 text-[#3182ce]" : "text-[#1a1a2e]"
                  }`}
                >
                  <span className="font-medium">{team.team_name}</span>
                  <span className="text-[10px] text-gray-400 uppercase">{team.confederation}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
