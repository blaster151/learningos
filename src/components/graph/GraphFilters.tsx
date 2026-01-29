"use client";

import type { GraphFilters, MasteryLevel } from "@/types";

interface GraphFiltersProps {
  filters: GraphFilters;
  availableDomains: string[];
  onChange: (filters: GraphFilters) => void;
}

const MASTERY_LEVELS: MasteryLevel[] = [
  "exploring",
  "learning",
  "practicing",
  "comfortable",
  "expert",
];

export default function GraphFiltersComponent({
  filters,
  availableDomains,
  onChange,
}: GraphFiltersProps) {
  const handleDomainToggle = (domain: string) => {
    const newDomains = filters.domains.includes(domain)
      ? filters.domains.filter((d) => d !== domain)
      : [...filters.domains, domain];
    onChange({ ...filters, domains: newDomains });
  };

  const handleMasteryToggle = (level: MasteryLevel) => {
    const newLevels = filters.masteryLevels.includes(level)
      ? filters.masteryLevels.filter((l) => l !== level)
      : [...filters.masteryLevels, level];
    onChange({ ...filters, masteryLevels: newLevels });
  };

  const handleSearchChange = (query: string) => {
    onChange({ ...filters, searchQuery: query });
  };

  const clearAllFilters = () => {
    onChange({ domains: [], masteryLevels: [], searchQuery: "" });
  };

  const hasActiveFilters =
    filters.domains.length > 0 ||
    filters.masteryLevels.length > 0 ||
    filters.searchQuery.length > 0;

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search concepts..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Domains */}
      {availableDomains.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Domains
          </label>
          <div className="space-y-1">
            {availableDomains.map((domain) => (
              <label
                key={domain}
                className="flex items-center cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
              >
                <input
                  type="checkbox"
                  checked={filters.domains.includes(domain)}
                  onChange={() => handleDomainToggle(domain)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {domain}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Mastery Levels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mastery Level
        </label>
        <div className="space-y-1">
          {MASTERY_LEVELS.map((level) => (
            <label
              key={level}
              className="flex items-center cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
            >
              <input
                type="checkbox"
                checked={filters.masteryLevels.includes(level)}
                onChange={() => handleMasteryToggle(level)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {level}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
