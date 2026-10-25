// A set of tick-boxes sharing one name (sent as name[] for every ticked box).
// Each option is a large tap target so it is easy to use on a phone.
type CheckboxGroupProps = {
  name: string;
  legend: string;
  hint?: string;
  error?: string;
  options: string[];
  selected?: string[];
};

export function CheckboxGroup({ name, legend, hint, error, options, selected = [] }: CheckboxGroupProps) {
  if (options.length === 0) return null;
  const chosen = new Set(selected);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded border border-line bg-card px-3 text-sm has-[:checked]:border-forest has-[:checked]:text-forest"
          >
            <input type="checkbox" name={`${name}[]`} value={option} defaultChecked={chosen.has(option)} className="h-4 w-4 accent-forest" />
            {option}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </fieldset>
  );
}
