import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ModalState = { title: string; message: string } | null;

type ModalContextValue = {
  modal: ModalState;
  showModal: (title: string, message: string) => void;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null);

  const showModal = useCallback((title: string, message: string) => {
    setModal({ title, message });
  }, []);

  const hideModal = useCallback(() => setModal(null), []);

  const value = useMemo<ModalContextValue>(
    () => ({ modal, showModal, hideModal }),
    [modal, showModal, hideModal]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] shadow-xl">
            <div className="px-5 py-4">
              <div className="text-lg font-bold text-[var(--heading-color)]">{modal.title}</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted-color)]">{modal.message}</div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[var(--border-color)] px-5 py-3">
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--sidebar-color)] hover:bg-gray-100"
                onClick={hideModal}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

