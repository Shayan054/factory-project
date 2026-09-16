import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  disabled?: boolean;
  /** Modal title when adding a new option. Defaults to "Add {label}". */
  addTitle?: string;
  /** Placeholder inside the add popup input. */
  addPlaceholder?: string;
};

export default function SelectWithAdd({
  label,
  value,
  onChange,
  options,
  onAdd,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  addTitle,
  addPlaceholder = "Enter name",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const modalTitle = addTitle ?? `Add ${label}`;
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((name) => name.toLowerCase().includes(q));
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (modalOpen) {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [modalOpen]);

  const openModal = () => {
    setOpen(false);
    setNewName("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewName("");
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      const ok = await onAdd(trimmed);
      if (ok) {
        onChange(trimmed);
        setQuery(trimmed);
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  };

  const pick = (name: string) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
    setHighlightIndex(-1);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

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

  const modalContent = modalOpen ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-with-add-modal-title"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--border-color)] px-5 py-4">
          <h3 id="select-with-add-modal-title" className="text-lg font-bold text-[var(--heading-color)]">
            {modalTitle}
          </h3>
        </div>
        <form
          className="space-y-4 px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleAdd();
          }}
        >
          <input
            className={input}
            placeholder={addPlaceholder}
            value={newName}
            autoFocus
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex justify-end gap-2 border-t border-[var(--border-color)] pt-4">
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-100"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-color-hover)] transition disabled:opacity-50"
              disabled={!newName.trim() || saving}
            >
              {saving ? "Saving..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

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
            className={`${input}${disabled ? " bg-gray-100 cursor-not-allowed" : ""}`}
            placeholder={placeholder}
            value={query}
            disabled={disabled}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            onChange={(e) => {
              if (disabled) return;
              setQuery(e.target.value);
              setOpen(true);
              const exact = options.find(
                (o) => o.toLowerCase() === e.target.value.trim().toLowerCase()
              );
              onChange(exact ?? "");
            }}
            onFocus={() => {
              if (!disabled) setOpen(true);
            }}
            onKeyDown={onInputKeyDown}
            autoComplete="off"
          />
          {open && !disabled && (
            <ul
              ref={listRef}
              role="listbox"
              className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--border-color)] bg-white shadow-lg"
            >
              <li className="sticky top-0 border-b border-[var(--border-color)] bg-white">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm font-semibold text-[var(--accent-color)] hover:bg-[rgba(14,165,164,0.10)]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={openModal}
                >
                  + Add new...
                </button>
              </li>
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[var(--muted-color)]">No matches found</li>
              ) : (
                filtered.map((name, index) => (
                  <li key={name} role="option" aria-selected={index === highlightIndex}>
                    <button
                      type="button"
                      data-option-index={index}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[rgba(14,165,164,0.10)] ${
                        index === highlightIndex
                          ? "bg-[rgba(14,165,164,0.18)] font-semibold"
                          : name === value
                            ? "bg-[rgba(14,165,164,0.08)] font-semibold"
                            : ""
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setHighlightIndex(index)}
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
          className="shrink-0 bg-[var(--accent-color)] text-white px-3 py-2 rounded-lg hover:bg-[var(--accent-color-hover)] transition font-bold text-lg leading-none disabled:cursor-not-allowed disabled:opacity-50"
          onClick={openModal}
          disabled={disabled}
          title={modalTitle}
          aria-label={modalTitle}
        >
          +
        </button>
      </div>
      {modalContent && createPortal(modalContent, document.body)}
    </div>
  );
}
