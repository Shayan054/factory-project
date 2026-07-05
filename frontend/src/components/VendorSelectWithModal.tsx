import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiRequest } from "../utils/api";
import { contactInputProps, applyContactValidity, clearContactValidity } from "../utils/contact";
import { isValidOptionalEmail } from "../utils/email";
import { useModal } from "../context/ModalContext";
import { useAuth } from "../context/AuthContext";

const input =
  "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.35)] focus:border-[var(--accent-color)]";

export type VendorRecord = {
  vendor_id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
};

type VendorFormState = {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
};

const emptyForm = (): VendorFormState => ({
  name: "",
  contact_person: "",
  email: "",
  phone: "",
});

type Props = {
  value: string;
  onChange: (vendorId: string) => void;
  vendors: VendorRecord[];
  onVendorsChange: (vendors: VendorRecord[]) => void;
  required?: boolean;
};

export default function VendorSelectWithModal({
  value,
  onChange,
  vendors,
  onVendorsChange,
  required = false,
}: Props) {
  const { showModal } = useModal();
  const { isCEO } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<VendorFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const selectedVendor = vendors.find((v) => String(v.vendor_id) === value);

  useEffect(() => {
    if (!open) {
      setQuery(selectedVendor ? `${selectedVendor.name}${selectedVendor.phone ? ` - ${selectedVendor.phone}` : ""}` : "");
    }
  }, [selectedVendor, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? vendors.filter((v) => {
          const haystack = `${v.name} ${v.phone ?? ""} ${v.email ?? ""} ${v.contact_person ?? ""}`.toLowerCase();
          return haystack.includes(q);
        })
      : vendors;
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [vendors, query]);

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

  const pick = (vendor: VendorRecord) => {
    onChange(String(vendor.vendor_id));
    setQuery(`${vendor.name}${vendor.phone ? ` - ${vendor.phone}` : ""}`);
    setOpen(false);
  };

  const openAddModal = () => {
    setOpen(false);
    setModalMode("add");
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedVendor) return;
    setOpen(false);
    setModalMode("edit");
    setForm({
      name: selectedVendor.name ?? "",
      contact_person: selectedVendor.contact_person ?? "",
      email: selectedVendor.email ?? "",
      phone: selectedVendor.phone ?? "",
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
    const phoneInput = formEl.elements.namedItem("vendor_phone") as HTMLInputElement | null;
    if (phoneInput) applyContactValidity(phoneInput);
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    if (!isValidOptionalEmail(form.email)) {
      showModal("Invalid email", "Please enter a valid email address or leave it blank.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      contact_person: form.contact_person.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    setSaving(true);
    try {
      if (modalMode === "add") {
        const response = await apiRequest("/vendors/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          showModal("Error", JSON.stringify(error));
          return;
        }
        const created: VendorRecord = await response.json();
        const updated = [...vendors, created].sort((a, b) => a.name.localeCompare(b.name));
        onVendorsChange(updated);
        onChange(String(created.vendor_id));
        showModal("Success", "Vendor added successfully.");
        closeModal();
      } else if (selectedVendor) {
        const response = await apiRequest(`/vendors/${selectedVendor.vendor_id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          showModal("Error", JSON.stringify(error));
          return;
        }
        const updatedVendor: VendorRecord = await response.json();
        const updated = vendors
          .map((v) => (v.vendor_id === updatedVendor.vendor_id ? updatedVendor : v))
          .sort((a, b) => a.name.localeCompare(b.name));
        onVendorsChange(updated);
        showModal("Success", "Vendor updated successfully.");
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
            {modalMode === "add" ? "Add Vendor" : "Edit Vendor"}
          </h3>
        </div>
        <form className="space-y-3 px-5 py-4" onSubmit={(e) => void handleSave(e)}>
          <input
            className={input}
            name="vendor_name"
            placeholder="Vendor Name *"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={input}
            name="vendor_contact_person"
            placeholder="Contact Person"
            value={form.contact_person}
            onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
          />
          <input
            className={input}
            name="vendor_email"
            placeholder="Email (optional)"
            type="text"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={input}
            name="vendor_phone"
            placeholder="Phone"
            {...contactInputProps}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            onInput={clearContactValidity}
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
              {saving ? "Saving..." : modalMode === "add" ? "Add Vendor" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <div>
      <label className="block font-semibold mb-2">
        Vendor
        {required ? " *" : ""}
      </label>
      <div className="flex gap-2">
        <div ref={containerRef} className="relative w-full">
          <input
            type="text"
            className={input}
            placeholder="Search vendor by name or phone"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (!e.target.value.trim()) onChange("");
            }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          {open && (
            <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[var(--border-color)] bg-white shadow-lg">
              <li className="sticky top-0 border-b border-[var(--border-color)] bg-white">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm font-semibold text-[var(--accent-color)] hover:bg-[rgba(14,165,164,0.10)]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={openAddModal}
                >
                  + Add new vendor...
                </button>
              </li>
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[var(--muted-color)]">No vendors found</li>
              ) : (
                filtered.map((vendor) => (
                  <li key={vendor.vendor_id}>
                    <button
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[rgba(14,165,164,0.10)] ${
                        String(vendor.vendor_id) === value ? "bg-[rgba(14,165,164,0.08)] font-semibold" : ""
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(vendor)}
                    >
                      {vendor.name}
                      {vendor.phone ? ` - ${vendor.phone}` : ""}
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
          title="Add vendor"
          aria-label="Add vendor"
        >
          +
        </button>
      </div>
      {selectedVendor && isCEO && (
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-[var(--accent-color)] hover:underline"
          onClick={openEditModal}
        >
          Edit selected vendor
        </button>
      )}
      {modalContent && createPortal(modalContent, document.body)}
    </div>
  );
}
