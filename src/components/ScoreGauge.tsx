const RADIUS = 85;
const CX = 100;
const CY = 100;
const CIRCUMFERENCE = Math.PI * RADIUS; // ≈ 267
const ARC_PATH = `M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`;

interface ScoreGaugeProps {
  score: number;
  severity: string;
  severityLabel: string;
}

export default function ScoreGauge({ score, severity, severityLabel }: ScoreGaugeProps) {
  const filled = CIRCUMFERENCE * (score / 100);
  const dashOffset = CIRCUMFERENCE - filled;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 100"
        className="w-full max-w-[280px]"
        aria-label={`Termination probability: ${score}%`}
      >
        {/* Background track */}
        <path
          d={ARC_PATH}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Filled track */}
        <path
          d={ARC_PATH}
          fill="none"
          stroke="#f5c518"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
        />
      </svg>

      {/* Score number */}
      <div className="text-5xl font-bold text-[#f5c518] -mt-2 leading-none">
        {score}
      </div>
      <div className="text-xs text-[#555555] mt-0.5">/ 100</div>

      {/* Severity badge */}
      <div className="mt-2 text-sm font-bold tracking-widest text-[#E24B4A] uppercase">
        {severity}
      </div>

      {/* Severity one-liner */}
      <div className="mt-1 text-xs text-[#888888] italic text-center px-4 max-w-[240px]">
        {severityLabel}
      </div>
    </div>
  );
}
