export function formToJSON(form: HTMLFormElement | FormData): Record<string, any> {
  const fd = form instanceof FormData ? form : new FormData(form);
  const obj: Record<string, any> = {};

  for (const [key, value] of fd.entries()) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
      obj[key].push(value);
    } else {
      obj[key] = value;
    }
  }

  // If an HTMLFormElement was provided, ensure unchecked checkboxes are represented as booleans
  if (!(form instanceof FormData)) {
    const inputs = form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name]');
    inputs.forEach((input) => {
      const name = input.name;
      if (!Object.prototype.hasOwnProperty.call(obj, name)) {
        obj[name] = input.checked;
      } else {
        // normalize common string values to booleans
        const val = obj[name];
        if (val === 'on') obj[name] = true;
        else if (val === 'true') obj[name] = true;
        else if (val === 'false') obj[name] = false;
      }
    });
  }

  return obj;
}
