export function isValidContact(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** Shared HTML attributes for phone/contact inputs */
export const contactInputProps = {
  type: "tel" as const,
  inputMode: "tel" as const,
  pattern: "[0-9+\\-\\s()]{7,20}",
  maxLength: 20,
  required: true,
  title: "Enter a valid phone number (7–15 digits)",
};

/** Pattern/title cannot count digits only — set this before form.checkValidity() */
export function applyContactValidity(input: HTMLInputElement) {
  if (!isValidContact(input.value)) {
    input.setCustomValidity("Please enter a valid phone number (7–15 digits).");
    return false;
  }
  input.setCustomValidity("");
  return true;
}

export function validateFormContact(form: HTMLFormElement, fieldName: string) {
  const input = form.elements.namedItem(fieldName) as HTMLInputElement | null;
  if (!input) return true;
  return applyContactValidity(input);
}

export function clearContactValidity(e: { currentTarget: HTMLInputElement }) {
  e.currentTarget.setCustomValidity("");
}
