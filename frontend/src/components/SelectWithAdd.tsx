import { useState } from "react";

const input =
  "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.35)] focus:border-[var(--accent-color)]";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onAdd: (name: string) => Promise<boolean>;
  placeholder?: string;
  required?: boolean;
};

export default function SelectWithAdd({
  label,
  value,
  onChange,
  options,
  onAdd,
  placeholder = "Select an option",
  required = false,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      const ok = await onAdd(trimmed);
      if (ok) {
        onChange(trimmed);
        setNewName("");
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="block font-semibold mb-2">
        {label}
        {required ? " *" : ""}
      </label>
      <div className="flex gap-2">
        <select
          className={input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="shrink-0 bg-[var(--accent-color)] text-white px-3 py-2 rounded-lg hover:bg-[var(--accent-color-hover)] transition font-bold text-lg leading-none"
          onClick={() => setAdding((v) => !v)}
          title="Add new option"
          aria-label="Add new option"
        >
          +
        </button>
      </div>
      {adding && (
        <div className="flex gap-2 mt-2">
          <input
            className={input}
            placeholder="Enter name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleAdd();
              }
            }}
          />
          <button
            type="button"
            className="shrink-0 bg-[var(--accent-color)] text-white px-4 py-2 rounded-lg hover:bg-[var(--accent-color-hover)] transition disabled:opacity-50"
            onClick={() => void handleAdd()}
            disabled={!newName.trim() || saving}
          >
            {saving ? "..." : "Add"}
          </button>
        </div>
      )}
    </div>
  );
}
