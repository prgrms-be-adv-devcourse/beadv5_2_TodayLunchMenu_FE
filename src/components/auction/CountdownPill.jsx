import { useCountdown } from "../../features/auction/useCountdown";
import { pad2 } from "../../features/auction/format";

export default function CountdownPill({ endsAt, status }) {
  const { h, m, s, total, ended } = useCountdown(endsAt);
  const urgent = !ended && total < 60 * 60 * 1000;

  const isWaiting = status === "WAITING";

  const tone = isWaiting
    ? "bg-blue-500/80 text-white"
    : ended
      ? "bg-gray-500/80 text-white"
      : urgent
        ? "bg-red-600 text-white"
        : "bg-black/70 text-white";

  const label = isWaiting
    ? "시작 전"
    : ended
      ? "종료됨"
      : `${pad2(h)}:${pad2(m)}:${pad2(s)}`;

  return (
    <span
      className={[
        "absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold tabular-nums tracking-wide backdrop-blur",
        tone,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
