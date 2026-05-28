import { dealLabel, type DealRating } from "../lib/format";

export default function DealBadge({ rating }: { rating: DealRating }) {
  return <span className={`badge ${rating}`}>{dealLabel[rating]}</span>;
}
