import { useCountdown } from "../../features/auction/useCountdown";
import { pad2 } from "../../features/auction/format";

export default function CountdownPill({ endsAt, status }) {
  const { h, m, s, total, ended } = useCountdown(endsAt);
  const urgent = !ended && total < 60 * 60 * 1000;

  const isWaiting = status === "WAITING";

  const tone = isWaiting
    ? "bg-blue-500 text-white"
    : ended
      ? "bg-gray-500 text-white"
      : urgent
        ? "bg-red-600 text-white"
        : "bg-black/75 text-white";

  const label = isWaiting
    ? "시작 전"
    : ended
      ? "종료"
      : `${pad2(h)}:${pad2(m)}:${pad2(s)}`;

  return (
    <span
      className={[
        "absolute right-2 top-2 px-2 py-0.5 text-[10px] font-bold tabular-nums tracking-wide",
        tone,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
