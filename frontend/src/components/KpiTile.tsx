type Props = {
  label: string;
  value: string;
  foot?: string;
  good?: boolean;
  delay?: number;
};

export default function KpiTile({ label, value, foot, good, delay = 0 }: Props) {
  return (
    <div className={`kpi reveal ${good ? "kpi-good" : ""}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${good ? "good" : ""}`}>{value}</div>
      {foot && <div className="kpi-foot">{foot}</div>}
    </div>
  );
}
