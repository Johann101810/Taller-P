export type LikertOption = { value: number; label: string };

export function LikertQuestion({
  name, text, value, onChange, options, required=false
}:{
  name: string;
  text: string;
  value?: number;
  onChange: (v:number)=>void;
  options: LikertOption[];
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <div className="fw-semibold mb-2">{text}</div>
      <div className="d-flex flex-wrap gap-3">
        {options.map(opt => {
          const id = `${name}-${opt.value}`;
          return (
            <div className="form-check" key={id}>
              <input
                className="form-check-input"
                type="radio"
                name={name}
                id={id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                required={required && value === undefined}
              />
              <label className="form-check-label" htmlFor={id}>
                {opt.label}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
