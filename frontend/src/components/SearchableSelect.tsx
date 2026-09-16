import { useEffect, useMemo, useRef, useState } from "react";

const inputClass =
  "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.35)] focus:border-[var(--accent-color)]";

export type SearchableOption = {
  value: string;
  label: string;
  searchText?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  className?: string;
  id?: string;
};

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Search or select...",
  className = inputClass,
  id,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? "");
    }
  }, [selected, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const haystack = `${o.label} ${o.searchText ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [query, open]);

  useEffect(() => {
    if (!open || highlightIndex < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-option-index="${highlightIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, open]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pick = (option: SearchableOption) => {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    setHighlightIndex(-1);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        if (filtered.length > 0) setHighlightIndex(0);
        return;
      }
      if (filtered.length === 0) return;
      setHighlightIndex((i) => (i < 0 ? 0 : Math.min(i + 1, filtered.length - 1)));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open || filtered.length === 0) return;
      setHighlightIndex((i) => (i <= 0 ? 0 : i - 1));
      return;
    }

    if (e.key === "Enter") {
      if (open && highlightIndex >= 0 && filtered[highlightIndex]) {
        e.preventDefault();
        pick(filtered[highlightIndex]);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        className={className}
        placeholder={placeholder}
        value={query}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
        autoComplete="off"
      />
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--border-color)] bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--muted-color)]">No matches found</li>
          ) : (
            filtered.map((option, index) => (
              <li key={option.value} role="option" aria-selected={index === highlightIndex}>
                <button
                  type="button"
                  data-option-index={index}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[rgba(14,165,164,0.10)] ${
                    index === highlightIndex
                      ? "bg-[rgba(14,165,164,0.18)] font-semibold"
                      : option.value === value
                        ? "bg-[rgba(14,165,164,0.08)] font-semibold"
                        : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => pick(option)}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
