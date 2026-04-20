import { useCountdown } from "../../features/auction/useCountdown";
import { pad2 } from "../../features/auction/format";

function Unit({ value, label, urgent }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl bg-purple-100/70 py-4">
      <span
        className={[
          "text-3xl font-extrabold leading-none tracking-tight tabular-nums",
          urgent ? "text-red-600" : "text-gray-900",
        ].join(" ")}
      >
        {pad2(value)}
      </span>
      <span className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </span>
    </div>
  );
}

export default function BigCountdown({ endsAt }) {
  const { h, m, s, total, ended } = useCountdown(endsAt);
  const urgent = !ended && total < 60 * 1000;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Unit value={h} label="시간" urgent={urgent} />
      <Unit value={m} label="분" urgent={urgent} />
      <Unit value={s} label="초" urgent={urgent} />
    </div>
  );
}
