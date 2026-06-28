import { useEffect, useMemo, useRef, useState } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((name) => name.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      const ok = await onAdd(trimmed);
      if (ok) {
        onChange(trimmed);
        setQuery(trimmed);
        setNewName("");
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const pick = (name: string) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  return (
    <div>
      <label className="block font-semibold mb-2">
        {label}
        {required ? " *" : ""}
      </label>
      <div className="flex gap-2">
        <div ref={containerRef} className="relative w-full">
          <input
            type="text"
            className={input}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              const exact = options.find(
                (o) => o.toLowerCase() === e.target.value.trim().toLowerCase()
              );
              onChange(exact ?? "");
            }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          {open && (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--border-color)] bg-white shadow-lg">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[var(--muted-color)]">No matches found</li>
              ) : (
                filtered.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[rgba(14,165,164,0.10)] ${
                        name === value ? "bg-[rgba(14,165,164,0.08)] font-semibold" : ""
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(name)}
                    >
                      {name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
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
