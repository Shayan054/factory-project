// src/pages/Dashboard.tsx
export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl  text-gray-800">Dashboard</h1>
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-white shadow"
          style={{ backgroundColor: "#4e73df" }}
        >
          <span className="text-sm">Generate Report</span>
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M5 20h14v-2H5v2zM12 2l4 4h-3v8h-2V6H8l4-4z" />
          </svg>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent="#4e73df"
          title="EARNINGS (MONTHLY)"
          value="$40,000"
          icon={<CalendarIcon />}
        />
        <KpiCard
          accent="#1cc88a"
          title="EARNINGS (ANNUAL)"
          value="$215,000"
          icon={<DollarIcon />}
        />
        <KpiCard
          accent="#36b9cc"
          title="TASKS"
          value="50%"
          bar
          icon={<ClipboardIcon />}
        />
        <KpiCard
          accent="#f6c23e"
          title="PENDING REQUESTS"
          value="18"
          icon={<ChatIcon />}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Earnings Overview (Area chart placeholder) */}
        <Card shellTitle="Earnings Overview" className="lg:col-span-2">
          <div className="h-72 rounded-lg border border-dashed grid place-items-center text-gray-500">
            Area Chart Placeholder
          </div>
        </Card>

        {/* Revenue Sources (Donut placeholder) */}
        <Card shellTitle="Revenue Sources">
          <div className="grid h-72 place-items-center">
            <Donut />
          </div>
        </Card>
      </div>

      {/* Projects + Illustrations */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card shellTitle="Projects" className="lg:col-span-2">
          <ProgressRow label="Server Migration" pct={20} color="#e74a3b" />
          <ProgressRow label="Sales Tracking" pct={40} color="#f6c23e" />
          <ProgressRow label="Customer Database" pct={60} color="#4e73df" />
          <ProgressRow label="Payout Details" pct={80} color="#36b9cc" />
          <ProgressRow label="Account Setup" pct={100} color="#1cc88a" rightLabel="Complete!" />
        </Card>

        <Card shellTitle="Illustrations">
          <div className="grid place-items-center p-6">
            <DeviceIllustration />
            <p className="mt-6 text-sm leading-6 text-gray-600 text-center max-w-prose">
              Add some quality SVG illustrations to your project from libraries like
              <span className="font-medium text-[#4e73df]"> unDraw</span>. They’re free and require no attribution.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Building blocks ---------- */

function KpiCard({
  accent,
  title,
  value,
  icon,
  bar = false,
}: {
  accent: string;
  title: string;
  value: string;
icon?: React.ReactNode;
  bar?: boolean;
}) {
  return (
    <div className="relative rounded-xl bg-white shadow-sm">
      {/* left accent bar */}
      <span className="absolute inset-y-0 left-0 w-1.5 rounded-l-xl" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between gap-4 p-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>
            {title}
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-800">{value}</div>
          {bar && (
            <div className="mt-3 h-2 w-40 overflow-hidden rounded bg-gray-200">
              <div className="h-full w-1/2" style={{ backgroundColor: accent }} />
            </div>
          )}
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-lg text-gray-300 bg-gray-100">{icon}</div>
      </div>
    </div>
  );
}

function Card({
  shellTitle,
  className = "",
  children,
}: {
  shellTitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold text-[#4e73df]">{shellTitle}</h2>
        <button className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-gray-100" aria-label="More">
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <circle cx="4" cy="10" r="2" /><circle cx="10" cy="10" r="2" /><circle cx="16" cy="10" r="2" />
          </svg>
        </button>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ProgressRow({
  label,
  pct,
  color,
  rightLabel,
}: {
  label: string;
  pct: number; // 0..100
  color: string;
  rightLabel?: string;
}) {
  return (
    <div className="py-3">
      <div className="mb-2 flex items-center justify-between text-sm text-gray-700">
        <span>{label}</span>
        <span className="text-gray-500">{rightLabel ?? `${pct}%`}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ---------- Simple visuals (placeholders) ---------- */

function Donut() {
  // simple SVG donut mimicking SB Admin 2 palette
  return (
    <svg viewBox="0 0 42 42" className="h-56 w-56">
      {/* bg ring */}
      <circle cx="21" cy="21" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="6" />
      {/* slices */}
      <circle cx="21" cy="21" r="15.915" fill="none" stroke="#36b9cc" strokeWidth="6" strokeDasharray="18 82" strokeDashoffset="25" />
      <circle cx="21" cy="21" r="15.915" fill="none" stroke="#1cc88a" strokeWidth="6" strokeDasharray="28 72" strokeDashoffset="7" />
      <circle cx="21" cy="21" r="15.915" fill="none" stroke="#4e73df" strokeWidth="6" strokeDasharray="40 60" strokeDashoffset="60" />
    </svg>
  );
}

function DeviceIllustration() {
  return (
    <svg viewBox="0 0 400 180" className="w-full max-w-xl">
      <rect x="20" y="40" width="220" height="120" rx="8" fill="#1f2937" />
      <rect x="35" y="55" width="190" height="90" rx="4" fill="#eef2ff" />
      <rect x="255" y="70" width="70" height="90" rx="8" fill="#1f2937" />
      <rect x="268" y="83" width="44" height="64" rx="4" fill="#eef2ff" />
      <rect x="335" y="55" width="45" height="110" rx="12" fill="#1f2937" />
      <rect x="344" y="75" width="27" height="64" rx="6" fill="#eef2ff" />
      <circle cx="130" cy="37" r="3" fill="#9ca3af" />
    </svg>
  );
}

/* ---------- Icons ---------- */
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3v16H4V4h3V2zm13 6H4v10h16V8z" />
    </svg>
  );
}
function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="currentColor" d="M11 17.5V19h2v-1.5c2.33-.41 4-2.01 4-3.95 0-2.22-1.91-3.5-4.5-4.02L12 9.3c-1.94-.38-2.5-1.06-2.5-1.8 0-.86.8-1.5 2-1.5s2 .64 2 1.5h2c0-1.72-1.55-3.12-3.5-3.45V2h-2v1.55C7.67 3.96 6 5.56 6 7.5c0 2.18 1.89 3.5 4.5 4.02l.5.1c1.94.38 2.5 1.06 2.5 1.83 0 .85-.85 1.55-2 1.55s-2-.7-2-1.55H9c0 1.66 1.55 3.06 3.5 3.35z" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="currentColor" d="M19 4h-3.18C15.4 2.84 14.3 2 13 2h-2c-1.3 0-2.4.84-2.82 2H5v18h14V4zM9 4h6v2H9V4z" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="currentColor" d="M2 3h20v14H6l-4 4V3z" />
    </svg>
  );
}
