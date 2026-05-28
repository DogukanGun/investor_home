import { Link } from "react-router-dom";

type Props = { title: string; hint?: string; cta?: { to: string; label: string } };

export default function EmptyState({ title, hint, cta }: Props) {
  return (
    <div className="empty">
      <div className="big">{title}</div>
      {hint && <div>{hint}</div>}
      {cta && (
        <div style={{ marginTop: 16 }}>
          <Link className="btn primary" to={cta.to} style={{ display: "inline-block" }}>{cta.label}</Link>
        </div>
      )}
    </div>
  );
}
