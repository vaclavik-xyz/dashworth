"use client";

import { getIcon, ICON_GROUPS } from "@/lib/icons";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string; // badge class for selected icon
}

export default function IconPicker({ value, onChange, color }: IconPickerProps) {
  const selectedClass = color ?? "bg-emerald-500/20 text-emerald-400";

  return (
    <div className="max-h-40 overflow-y-auto space-y-3 pr-1">
      {ICON_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1 text-xs text-zinc-500">{group.label}</p>
          <div className="grid grid-cols-6 gap-1.5">
            {group.icons.map((iconName) => {
              const Icon = getIcon(iconName);
              const isSelected = value === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => onChange(iconName)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? selectedClass
                      : "text-zinc-400 hover:bg-[var(--dw-hover)]"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
