import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiRequest } from "../utils/api";
import { contactInputProps, applyContactValidity, clearContactValidity } from "../utils/contact";
import { useModal } from "../context/ModalContext";
import { useAuth } from "../context/AuthContext";

const input =
  "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.35)] focus:border-[var(--accent-color)]";

export type CustomerRecord = {
  customer_id: number;
  name: string;
  contact: string;
  address?: string;
  remark?: string;
};

type CustomerFormState = {
  name: string;
  contact: string;
  address: string;
  remark: string;
};

const emptyForm = (): CustomerFormState => ({
  name: "",
  contact: "",
  address: "",
  remark: "",
});

const labelFor = (c: CustomerRecord) =>
  `${c.name}${c.contact ? ` (${c.contact})` : ""}`;

type Props = {
  value: string;
  onChange: (customerId: string) => void;
  customers: CustomerRecord[];
  onCustomersChange: (customers: CustomerRecord[]) => void;
  required?: boolean;
};

export default function CustomerSelectWithModal({
  value,
  onChange,
  customers,
  onCustomersChange,
  required = false,
}: Props) {
  const { showModal } = useModal();
  const { isCEO } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const selectedCustomer = customers.find((c) => String(c.customer_id) === value);

  useEffect(() => {
    if (!open) {
      setQuery(selectedCustomer ? labelFor(selectedCustomer) : "");
    }
  }, [selectedCustomer, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? customers.filter((c) => {
          const haystack = `${c.name} ${c.contact ?? ""} ${c.address ?? ""} ${c.remark ?? ""}`.toLowerCase();
          return haystack.includes(q);
        })
      : customers;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, query]);

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

  const pick = (customer: CustomerRecord) => {
    onChange(String(customer.customer_id));
    setQuery(labelFor(customer));
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

  const openAddModal = () => {
    setOpen(false);
    setModalMode("add");
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedCustomer) return;
    setOpen(false);
    setModalMode("edit");
    setForm({
      name: selectedCustomer.name ?? "",
      contact: selectedCustomer.contact ?? "",
      address: selectedCustomer.address ?? "",
      remark: selectedCustomer.remark ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm());
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const contactInput = formEl.elements.namedItem("customer_contact") as HTMLInputElement | null;
    if (contactInput) applyContactValidity(contactInput);
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }

    const payload = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      address: form.address.trim(),
      remark: form.remark.trim(),
    };

    setSaving(true);
    try {
      if (modalMode === "add") {
        const response = await apiRequest("/customers/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          showModal("Error", JSON.stringify(error));
          return;
        }
        const created: CustomerRecord = await response.json();
        const updated = [...customers, created].sort((a, b) => a.name.localeCompare(b.name));
        onCustomersChange(updated);
        onChange(String(created.customer_id));
        showModal("Success", "Customer added successfully.");
        closeModal();
      } else if (selectedCustomer) {
        const response = await apiRequest(`/customers/${selectedCustomer.customer_id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          showModal("Error", JSON.stringify(error));
          return;
        }
        const updatedCustomer: CustomerRecord = await response.json();
        const updated = customers
          .map((c) => (c.customer_id === updatedCustomer.customer_id ? updatedCustomer : c))
          .sort((a, b) => a.name.localeCompare(b.name));
        onCustomersChange(updated);
        showModal("Success", "Customer updated successfully.");
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  };

  const modalContent = modalOpen ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--border-color)] px-5 py-4">
          <h3 className="text-lg font-bold text-[var(--heading-color)]">
            {modalMode === "add" ? "Add Customer" : "Edit Customer"}
          </h3>
        </div>
        <form className="space-y-3 px-5 py-4" onSubmit={(e) => void handleSave(e)}>
          <input
            className={input}
            name="customer_name"
            placeholder="Customer Name *"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={input}
            name="customer_contact"
            placeholder="Contact *"
            {...contactInputProps}
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            onInput={clearContactValidity}
          />
          <textarea
            className={input}
            name="customer_address"
            placeholder="Address"
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <textarea
            className={input}
            name="customer_remark"
            placeholder="Remark"
            rows={2}
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
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
              disabled={saving}
            >
              {saving ? "Saving..." : modalMode === "add" ? "Add Customer" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <div>
      <label className="block font-semibold mb-2">
        Customer
        {required ? " *" : ""}
      </label>
      <div className="flex gap-2">
        <div ref={containerRef} className="relative w-full">
          <input
            type="text"
            className={input}
            placeholder="Search customer by name or contact"
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
              className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--border-color)] bg-white shadow-lg"
            >
              <li className="sticky top-0 border-b border-[var(--border-color)] bg-white">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm font-semibold text-[var(--accent-color)] hover:bg-[rgba(14,165,164,0.10)]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={openAddModal}
                >
                  + Add new customer...
                </button>
              </li>
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[var(--muted-color)]">No customers found</li>
              ) : (
                filtered.map((customer, index) => (
                  <li key={customer.customer_id} role="option" aria-selected={index === highlightIndex}>
                    <button
                      type="button"
                      data-option-index={index}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[rgba(14,165,164,0.10)] ${
                        index === highlightIndex
                          ? "bg-[rgba(14,165,164,0.18)] font-semibold"
                          : String(customer.customer_id) === value
                            ? "bg-[rgba(14,165,164,0.08)] font-semibold"
                            : ""
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setHighlightIndex(index)}
                      onClick={() => pick(customer)}
                    >
                      {labelFor(customer)}
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
          onClick={openAddModal}
          title="Add customer"
          aria-label="Add customer"
        >
          +
        </button>
      </div>
      {selectedCustomer && isCEO && (
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-[var(--accent-color)] hover:underline"
          onClick={openEditModal}
        >
          Edit selected customer
        </button>
      )}
      {modalContent && createPortal(modalContent, document.body)}
    </div>
  );
}
