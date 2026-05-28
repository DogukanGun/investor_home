type Option = { value: string; label: string; tone?: "good" | "fair" | "overpriced" };

type Props = {
  value: string;
  options: Option[];
  onChange: (v: string) => void;
};

export default function FilterChips({ value, options, onChange }: Props) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          key={o.value}
          className={`chip ${value === o.value ? "on" : ""} ${o.tone ?? ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
