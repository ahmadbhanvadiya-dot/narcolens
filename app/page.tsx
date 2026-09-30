import Link from "next/link";
import {
  Camera,
  ClipboardList,
  ShieldCheck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";

const recentTests = [
  {
    id: "NL-00184",
    result: "Negative",
    time: "12:42 PM",
    location: "Hyderabad",
  },
  {
    id: "NL-00183",
    result: "Positive",
    time: "11:18 AM",
    location: "Hyderabad",
  },
  {
    id: "NL-00182",
    result: "Inconclusive",
    time: "10:51 AM",
    location: "Hyderabad",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#172033]">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-[245px] shrink-0 border-r border-[#D9E1EA] bg-white md:flex md:flex-col">

          {/* Logo */}
          <div className="border-b border-[#D9E1EA] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0B1F3A]">
                <ShieldCheck size={19} className="text-white" />
              </div>

              <div>
                <h1 className="text-[17px] font-semibold tracking-tight text-[#0B1F3A]">
                  NarcoLens
                </h1>

                <p className="text-[10px] uppercase tracking-[0.12em] text-[#667085]">
                  Field Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6">

            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
              Workspace
            </p>

            <NavItem
              href="/"
              icon={<ClipboardList size={17} />}
              label="Dashboard"
              active
            />

            <NavItem
              href="/test"
              icon={<Camera size={17} />}
              label="New Test"
            />

            <NavItem
              href="/test-records"
              icon={<ClipboardList size={17} />}
              label="Test Records"
            />

            <NavItem
              href="/verify"
              icon={<ShieldCheck size={17} />}
              label="Verify Record"
            />

          </nav>

          {/* Operator */}
          <div className="border-t border-[#D9E1EA] p-4">
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF2F8] text-xs font-semibold text-[#174A7E]">
                OP
              </div>

              <div>
                <p className="text-xs font-semibold text-[#172033]">
                  Operator OP-1042
                </p>
                <p className="text-[11px] text-[#667085]">
                  Active session
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1">

          {/* Top bar */}
          <header className="flex h-[72px] items-center justify-between border-b border-[#D9E1EA] bg-white px-6 md:px-10">

            <div>
              <p className="text-xs text-[#667085]">
                Field Operations
              </p>

              <h2 className="text-lg font-semibold text-[#0B1F3A]">
                Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium">
                  Operator OP-1042
                </p>

                <p className="text-[11px] text-[#667085]">
                  Hyderabad Unit
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B1F3A] text-[11px] font-semibold text-white">
                OP
              </div>
            </div>

          </header>

          <div className="p-6 md:p-10">

            {/* Page intro */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.1em] text-[#174A7E]">
                  Overview
                </p>

                <h3 className="text-2xl font-semibold tracking-tight text-[#0B1F3A]">
                  Field Test Activity
                </h3>

                <p className="mt-1 text-sm text-[#667085]">
                  Monitor and manage presumptive field-test records.
                </p>
              </div>

              <Link
                href="/test"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0B1F3A] px-4 text-sm font-medium text-white transition hover:bg-[#17365F]"
              >
                <Camera size={16} />
                Start New Test
              </Link>

            </div>

            {/* Statistics */}
            <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                label="Total Tests"
                value="18"
                icon={<ClipboardList size={17} />}
              />

              <StatCard
                label="Negative"
                value="11"
                icon={<CheckCircle2 size={17} />}
              />

              <StatCard
                label="Positive"
                value="4"
                icon={<XCircle size={17} />}
              />

              <StatCard
                label="Inconclusive"
                value="3"
                icon={<AlertTriangle size={17} />}
              />

            </div>

            {/* Recent records */}
            <div className="border border-[#D9E1EA] bg-white">

              <div className="flex items-center justify-between border-b border-[#D9E1EA] px-5 py-4">

                <div>
                  <h4 className="text-sm font-semibold text-[#0B1F3A]">
                    Recent Test Records
                  </h4>

                  <p className="mt-0.5 text-xs text-[#667085]">
                    Latest activity from your field unit
                  </p>
                </div>

                <Link
                  href="/test-records"
                  className="flex items-center gap-1 text-xs font-medium text-[#174A7E] hover:underline"
                >
                  View records
                  <ChevronRight size={14} />
                </Link>

              </div>

              <div>
                {recentTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex flex-col gap-3 border-b border-[#E8EDF3] px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F1F5F9]">
                        <ClipboardList
                          size={16}
                          className="text-[#174A7E]"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#172033]">
                          {test.id}
                        </p>

                        <div className="mt-1 flex gap-4 text-[11px] text-[#667085]">

                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {test.time}
                          </span>

                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {test.location}
                          </span>

                        </div>
                      </div>

                    </div>

                    <ResultBadge result={test.result} />

                  </div>
                ))}
              </div>

            </div>

            {/* Disclaimer */}
            <div className="mt-5 border-l-2 border-[#174A7E] bg-white px-4 py-3 text-xs leading-5 text-[#667085]">
              <span className="font-semibold text-[#174A7E]">
                Presumptive result.
              </span>{" "}
              NarcoLens provides digital support for field-test
              interpretation and documentation. Confirmatory laboratory
              testing remains necessary where applicable.
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}


/* Navigation item */

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
        active
          ? "bg-[#EAF2F8] font-medium text-[#0B1F3A]"
          : "text-[#667085] hover:bg-[#F3F6F9] hover:text-[#172033]"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}


/* Statistics card */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border border-[#D9E1EA] bg-white px-5 py-4">

      <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-md bg-[#EAF2F8] text-[#174A7E]">
        {icon}
      </div>

      <p className="text-xs text-[#667085]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-[#0B1F3A]">
        {value}
      </p>

    </div>
  );
}


/* Result badge */

function ResultBadge({ result }: { result: string }) {
  const styles = {
    Positive: "bg-[#FEF3F2] text-[#B42318] border-[#FECACA]",
    Negative: "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]",
    Inconclusive: "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]",
  };

  return (
    <span
      className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${
        styles[result as keyof typeof styles]
      }`}
    >
      {result}
    </span>
  );
}