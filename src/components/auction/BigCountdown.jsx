import { useCountdown } from "../../features/auction/useCountdown";
import { pad2 } from "../../features/auction/format";

function TimeUnit({ value, label, urgent }) {
  return (
    <div className="text-center">
      <span
        className={[
          "block text-2xl font-bold leading-none tabular-nums",
          urgent ? "text-red-600" : "text-gray-900",
        ].join(" ")}
      >
        {pad2(value)}
      </span>
      <span className="mt-1 block text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

export default function BigCountdown({ endsAt }) {
  const { h, m, s, total, ended } = useCountdown(endsAt);
  const urgent = !ended && total < 60 * 1000;

  if (ended) {
    return <p className="text-sm font-semibold text-gray-500">경매 종료</p>;
  }

  const sep = (
    <span
      className={[
        "mt-1 text-xl font-bold",
        urgent ? "text-red-300" : "text-gray-300",
      ].join(" ")}
    >
      :
    </span>
  );

  return (
    <div className="flex items-start justify-center gap-2">
      <TimeUnit value={h} label="시간" urgent={urgent} />
      {sep}
      <TimeUnit value={m} label="분" urgent={urgent} />
      {sep}
      <TimeUnit value={s} label="초" urgent={urgent} />
    </div>
  );
}
