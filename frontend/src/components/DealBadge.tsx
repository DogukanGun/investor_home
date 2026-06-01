import { useTranslation } from "react-i18next";
import type { DealRating } from "../lib/format";

export default function DealBadge({ rating }: { rating: DealRating }) {
  const { t } = useTranslation();
  return <span className={`badge ${rating}`}>{t(`deal.${rating}`)}</span>;
}
