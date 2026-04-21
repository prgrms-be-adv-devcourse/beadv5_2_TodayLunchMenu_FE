import { useCountdown } from "../../features/auction/useCountdown";
import { pad2 } from "../../features/auction/format";

export default function CountdownPill({ endsAt }) {
  const { h, m, s, total, ended } = useCountdown(endsAt);
  const urgent = !ended && total < 60 * 60 * 1000;

  const tone = ended
    ? "bg-gray-500/80 text-white"
    : urgent
      ? "bg-red-600 text-white"
      : "bg-black/70 text-white";

  return (
    <span
      className={[
        "absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold tabular-nums tracking-wide backdrop-blur",
        tone,
      ].join(" ")}
    >
      {ended ? "종료됨" : `${pad2(h)}:${pad2(m)}:${pad2(s)}`}
    </span>
  );
}
