
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import AppShell from "@/app/components/AppShell";

type TestRecord = {
  id: string;
  record_id: string;
  case_id: string | null;
  test_kit: string | null;
  reagent: string | null;
  profile_id: string | null;
  profile_version: string | null;
  result: string | null;
  confidence: number | null;
  operator_id: string | null;
  latitude: number | null;
  longitude: number | null;
  tested_at: string | null;
  created_at?: string | null;
  image_hash: string | null;
  verification_status: string | null;
};

type Filter = "All" | "Negative" | "Positive" | "Inconclusive";

const filters: Filter[] = [
  "All",
  "Negative",
  "Positive",
  "Inconclusive",
];

export default function TestRecordsPage() {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    void loadRecords();
  }, []);

  async function loadRecords() {
    try {
      setLoading(true);
      setRefreshing(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("test_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      setRecords((data ?? []) as TestRecord[]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Unable to load test records:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load test records. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const normalizedResult = record.result?.toLowerCase();

      const matchesFilter =
        filter === "All" ||
        normalizedResult === filter.toLowerCase();

      const searchableFields = [
        record.record_id,
        record.case_id,
        record.reagent,
        record.profile_id,
        record.profile_version,
        record.operator_id,
        record.test_kit,
      ];

      const matchesSearch =
        !query ||
        searchableFields.some((field) =>
          field?.toLowerCase().includes(query)
        );

      return matchesFilter && matchesSearch;
    });
  }, [records, search, filter]);

  const totalCount = records.length;

  const positiveCount = records.filter(
    (record) => record.result?.toLowerCase() === "positive"
  ).length;

  const negativeCount = records.filter(
    (record) => record.result?.toLowerCase() === "negative"
  ).length;

  const inconclusiveCount = records.filter(
    (record) => record.result?.toLowerCase() === "inconclusive"
  ).length;

  function formatDate(date: string | null | undefined) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <AppShell
      title="Test Records"
      section="Record Management"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Page heading */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#174A7E]">
              Field Operations / Records
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-[#0B1F3A]">
              Test Records
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
              Search, review, and access digitally recorded
              presumptive field-test results.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadRecords()}
            disabled={refreshing}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#D9E1EA] bg-white px-4 text-sm font-medium text-[#174A7E] transition hover:bg-[#F3F6F9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh Records"}
          </button>
        </div>

        {/* Error message */}

        {error && (
          <div
            role="alert"
            className="flex flex-col justify-between gap-3 border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-red-700"
              />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Could not load records
                </p>
                <p className="mt-1 break-words text-xs text-red-700">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadRecords()}
              disabled={refreshing}
              className="self-start text-sm font-medium text-red-800 underline underline-offset-2 disabled:opacity-50 sm:self-center"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary cards */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Records"
            value={totalCount}
            icon={<ClipboardList size={17} />}
            loading={loading}
          />

          <SummaryCard
            label="Positive"
            value={positiveCount}
            icon={<XCircle size={17} />}
            loading={loading}
          />

          <SummaryCard
            label="Negative"
            value={negativeCount}
            icon={<CheckCircle2 size={17} />}
            loading={loading}
          />

          <SummaryCard
            label="Inconclusive"
            value={inconclusiveCount}
            icon={<AlertTriangle size={17} />}
            loading={loading}
          />
        </div>

        {/* Search and filters */}

        <section className="border border-[#D9E1EA] bg-white">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">

            <div className="w-full flex-1">
              <label
                htmlFor="record-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#667085]"
              >
                Search records
              </label>

              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                />

                <input
                  id="record-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Record ID, case, reagent, profile or operator..."
                  className="h-10 w-full rounded-md border border-[#D9E1EA] bg-white pl-9 pr-3 text-sm text-[#172033] outline-none transition placeholder:text-[#98A2B3] focus:border-[#174A7E] focus:ring-2 focus:ring-[#174A7E]/10"
                />
              </div>
            </div>

            <div className="shrink-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#667085]">
                Filter by result
              </p>

              <div className="flex flex-wrap gap-2">
                {filters.map((option) => {
                  const active = filter === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(option)}
                      className={`rounded-md border px-3 py-2 text-xs font-medium transition ${
                        active
                          ? "border-[#174A7E] bg-[#174A7E] text-white"
                          : "border-[#D9E1EA] bg-white text-[#667085] hover:bg-[#F3F6F9] hover:text-[#172033]"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-2 border-t border-[#E8EDF3] bg-[#F7F9FC] px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-xs text-[#667085]">
              Showing{" "}
              <span className="font-semibold text-[#172033]">
                {loading ? "—" : filteredRecords.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#172033]">
                {loading ? "—" : records.length}
              </span>{" "}
              records
            </p>

            <p className="text-xs text-[#98A2B3]">
              {lastUpdated
                ? `Last synced ${lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Awaiting synchronization"}
            </p>
          </div>
        </section>

        {/* Records table */}

        <section className="overflow-hidden border border-[#D9E1EA] bg-white">
          <div className="flex flex-col justify-between gap-1 border-b border-[#D9E1EA] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-[#0B1F3A]">
                Recorded Tests
              </h2>
              <p className="mt-1 text-xs text-[#667085]">
                Select a record ID to inspect its integrity verification.
              </p>
            </div>

            <span className="text-xs text-[#667085]">
              Source: Supabase
            </span>
          </div>

          {loading ? (
            <div className="px-5 py-14 text-center">
              <RefreshCw
                size={21}
                className="mx-auto animate-spin text-[#174A7E]"
              />
              <p className="mt-3 text-sm font-medium text-[#172033]">
                Loading records
              </p>
              <p className="mt-1 text-xs text-[#667085]">
                Retrieving stored field-test records...
              </p>
            </div>
          ) : error ? (
            <div className="px-5 py-12 text-center">
              <AlertCircle
                size={22}
                className="mx-auto text-[#B42318]"
              />
              <p className="mt-3 text-sm font-medium text-[#172033]">
                Records are unavailable
              </p>
              <p className="mt-1 text-xs text-[#667085]">
                Resolve the connection issue and try refreshing.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-[#D9E1EA] bg-[#F7F9FC]">
                <ClipboardList
                  size={19}
                  className="text-[#667085]"
                />
              </div>

              <p className="mt-3 text-sm font-semibold text-[#172033]">
                {records.length === 0
                  ? "No test records yet"
                  : "No matching records"}
              </p>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#667085]">
                {records.length === 0
                  ? "Completed records will appear here once saved."
                  : "Try a different search term or select another result filter."}
              </p>

              {records.length === 0 && (
                <Link
                  href="/test"
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-[#0B1F3A] px-4 text-xs font-medium text-white transition hover:bg-[#17365F]"
                >
                  Start New Test
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead className="border-b border-[#D9E1EA] bg-[#F7F9FC]">
                  <tr>
                    <TableHeader>Record ID</TableHeader>
                    <TableHeader>Case ID</TableHeader>
                    <TableHeader>Reagent</TableHeader>
                    <TableHeader>Profile</TableHeader>
                    <TableHeader>Result</TableHeader>
                    <TableHeader>Confidence</TableHeader>
                    <TableHeader>Operator</TableHeader>
                    <TableHeader>Date / Time</TableHeader>
                    <TableHeader>Record Status</TableHeader>
                    <TableHeader> </TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E8EDF3]">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="transition hover:bg-[#F8FAFC]"
                    >
                      <td className="whitespace-nowrap px-4 py-4">
                        <Link
                          href={`/verify?record=${encodeURIComponent(
                            record.record_id
                          )}`}
                          className="font-mono text-xs font-semibold text-[#174A7E] hover:underline hover:underline-offset-2"
                        >
                          {record.record_id}
                        </Link>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#172033]">
                        {record.case_id || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#172033]">
                        {record.reagent || record.test_kit || "—"}
                      </td>

                      <td className="px-4 py-4">
                        {record.profile_id ? (
                          <div>
                            <p className="whitespace-nowrap text-xs font-medium text-[#172033]">
                              {record.profile_id}
                            </p>
                            <p className="mt-1 text-[11px] text-[#667085]">
                              Version {record.profile_version || "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-[#98A2B3]">
                            —
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <ResultBadge result={record.result} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm tabular-nums text-[#172033]">
                        {record.confidence != null
                          ? `${record.confidence}%`
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#172033]">
                        {record.operator_id || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#667085]">
                        {formatDate(record.tested_at || record.created_at)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <RecordStatus
                          status={record.verification_status}
                        />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <Link
                          href={`/verify?record=${encodeURIComponent(
                            record.record_id
                          )}`}
                          aria-label={`Verify record ${record.record_id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#667085] transition hover:bg-[#EAF2F8] hover:text-[#174A7E] focus:outline-none focus:ring-2 focus:ring-[#174A7E]/30"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Presumptive-result notice */}

        <div className="flex items-start gap-3 border border-[#D9E1EA] bg-white px-4 py-4">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[#174A7E]"
          />

          <p className="text-xs leading-5 text-[#667085]">
            <span className="font-semibold text-[#0B1F3A]">
              Important notice.
            </span>{" "}
            NarcoLens supports digital documentation and prototype
            interpretation of presumptive field-test results. A stored
            record or successful integrity check does not establish the
            accuracy of the underlying test result. Confirmatory laboratory
            testing remains necessary where applicable.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

/* Summary card */

function SummaryCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="border border-[#D9E1EA] bg-white p-4 transition hover:border-[#B8C7D8]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#667085]">
          {label}
        </p>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EAF2F8] text-[#174A7E]">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums text-[#0B1F3A]">
        {loading ? "—" : value.toLocaleString()}
      </p>

      <p className="mt-1 text-[11px] text-[#98A2B3]">
        Stored records
      </p>
    </div>
  );
}

/* Table header */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
      {children}
    </th>
  );
}

/* Result badge */

function ResultBadge({
  result,
}: {
  result: string | null;
}) {
  const normalized = result?.toLowerCase();

  if (normalized === "positive") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#FECACA] bg-[#FEF3F2] px-2 py-1 text-[11px] font-medium text-[#B42318]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#B42318]" />
        Positive
      </span>
    );
  }

  if (normalized === "negative") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#ABEFC6] bg-[#ECFDF3] px-2 py-1 text-[11px] font-medium text-[#027A48]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#027A48]" />
        Negative
      </span>
    );
  }

  if (normalized === "inconclusive") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#FEDF89] bg-[#FFFAEB] px-2 py-1 text-[11px] font-medium text-[#B54708]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#B54708]" />
        Inconclusive
      </span>
    );
  }

  return (
    <span className="inline-flex border border-[#D9E1EA] bg-[#F7F9FC] px-2 py-1 text-[11px] font-medium text-[#667085]">
      {result || "Unknown"}
    </span>
  );
}

/* Record status badge */

function RecordStatus({
  status,
}: {
  status: string | null;
}) {
  const normalized = status?.toLowerCase();

  if (normalized === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#ABEFC6] bg-[#ECFDF3] px-2 py-1 text-[11px] font-medium text-[#027A48]">
        <ShieldCheck size={12} />
        Verified
      </span>
    );
  }

  if (normalized === "created") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#D9E1EA] bg-[#F7F9FC] px-2 py-1 text-[11px] font-medium text-[#475467]">
        Created
      </span>
    );
  }

  return (
    <span className="inline-flex border border-[#D9E1EA] bg-white px-2 py-1 text-[11px] font-medium text-[#667085]">
      {status || "Unknown"}
    </span>
  );
}
