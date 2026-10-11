
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import AppShell from "@/app/components/AppShell";
import { supabase } from "@/lib/supabase";

type TestRecord = {
  id: string;
  record_id: string;
  case_id: string | null;
  result: string | null;
  confidence: number | null;
  operator_id: string | null;
  latitude: number | null;
  longitude: number | null;
  tested_at: string | null;
  created_at: string | null;
  verification_status: string | null;
};

type FilterType = "All" | "Negative" | "Positive" | "Inconclusive";

const FILTERS: FilterType[] = [
  "All",
  "Negative",
  "Positive",
  "Inconclusive",
];

export default function Home() {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (manualRefresh = false) => {
    try {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      
const { data, error: queryError } = await supabase
  .from("test_records")
  .select("*")
  .order("created_at", { ascending: false });

if (queryError) {
  throw new Error(queryError.message);
}

setRecords((data ?? []) as unknown as TestRecord[]);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard records."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalTests = records.length;

  const negativeTests = records.filter(
    (record) => record.result?.toLowerCase() === "negative"
  ).length;

  const positiveTests = records.filter(
    (record) => record.result?.toLowerCase() === "positive"
  ).length;

  const inconclusiveTests = records.filter(
    (record) => record.result?.toLowerCase() === "inconclusive"
  ).length;

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
        record.operator_id,
      ];

      const matchesSearch =
        !query ||
        searchableFields.some((field) =>
          field?.toLowerCase().includes(query)
        );

      return matchesFilter && matchesSearch;
    });
  }, [records, filter, search]);

  const recentRecords = filteredRecords.slice(0, 5);

  function formatTime(date: string | null) {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getLocation(record: TestRecord) {
    if (record.latitude == null || record.longitude == null) {
      return "Location unavailable";
    }

    return `${record.latitude.toFixed(3)}, ${record.longitude.toFixed(3)}`;
  }

  return (
    <AppShell title="Dashboard" section="Field Operations">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Page heading */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#174A7E]">
              Overview / Field Operations
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-[#0B1F3A]">
              Field Test Activity
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#667085]">
              Monitor and review digitally documented presumptive
              field-test records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/test"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0B1F3A] px-4 text-sm font-medium text-white transition hover:bg-[#17365F] focus:outline-none focus:ring-2 focus:ring-[#174A7E]/30"
            >
              <Camera size={16} />
              Start New Test
            </Link>

            <Link
              href="/verify"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D9E1EA] bg-white px-4 text-sm font-medium text-[#174A7E] transition hover:bg-[#F3F6F9] focus:outline-none focus:ring-2 focus:ring-[#174A7E]/20"
            >
              <ShieldCheck size={16} />
              Verify Record
            </Link>
          </div>
        </div>

        {/* Error banner */}

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
                <p className="text-sm font-semibold text-red-800">
                  Unable to load dashboard data
                </p>
                <p className="mt-1 break-words text-xs text-red-700">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="self-start text-sm font-medium text-red-800 underline underline-offset-2 disabled:opacity-50 sm:self-center"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary cards */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Tests"
            value={totalTests}
            icon={<ClipboardList size={17} />}
            active={filter === "All"}
            loading={loading}
            onClick={() => setFilter("All")}
          />

          <StatCard
            label="Negative"
            value={negativeTests}
            icon={<CheckCircle2 size={17} />}
            active={filter === "Negative"}
            loading={loading}
            onClick={() => setFilter("Negative")}
          />

          <StatCard
            label="Positive"
            value={positiveTests}
            icon={<XCircle size={17} />}
            active={filter === "Positive"}
            loading={loading}
            onClick={() => setFilter("Positive")}
          />

          <StatCard
            label="Inconclusive"
            value={inconclusiveTests}
            icon={<AlertTriangle size={17} />}
            active={filter === "Inconclusive"}
            loading={loading}
            onClick={() => setFilter("Inconclusive")}
          />
        </div>

        {/* Data refresh panel */}

        <section className="flex flex-col justify-between gap-4 border border-[#D9E1EA] bg-white px-4 py-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF2F8] text-[#174A7E]">
              <ClipboardList size={17} />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#172033]">
                Record synchronization
              </p>

              <p className="mt-1 text-xs leading-5 text-[#667085]">
                {loading
                  ? "Loading records from Supabase..."
                  : error
                    ? "The latest records could not be retrieved."
                    : `${records.length} records retrieved successfully.`}
              </p>

              {lastUpdated && !error && (
                <p className="mt-1 text-[11px] text-[#98A2B3]">
                  Last retrieved{" "}
                  {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#D9E1EA] bg-white px-4 text-sm font-medium text-[#174A7E] transition hover:bg-[#F3F6F9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </section>

        {/* Recent records */}

        <section className="overflow-hidden border border-[#D9E1EA] bg-white">

          {/* Section heading and search */}

          <div className="flex flex-col gap-4 border-b border-[#D9E1EA] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0B1F3A]">
                Recent Test Records
              </h2>

              <p className="mt-1 text-xs text-[#667085]">
                {filter === "All"
                  ? "Latest activity from your field unit"
                  : `${filter} records`}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                />

                <input
                  type="search"
                  aria-label="Search records"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search records..."
                  className="h-10 w-full rounded-md border border-[#D9E1EA] bg-white pl-9 pr-3 text-sm text-[#172033] outline-none transition placeholder:text-[#98A2B3] focus:border-[#174A7E] focus:ring-2 focus:ring-[#174A7E]/10 sm:w-[230px]"
                />
              </div>

              <Link
                href="/test-records"
                className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-[#D9E1EA] px-3 text-sm font-medium text-[#174A7E] transition hover:bg-[#F3F6F9]"
              >
                View all
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>

          {/* Filter bar */}

          <div className="flex flex-wrap gap-2 border-b border-[#E8EDF3] px-4 py-3">
            {FILTERS.map((item) => {
              const active = filter === item;

              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(item)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-[#174A7E] bg-[#EAF2F8] text-[#174A7E]"
                      : "border-transparent text-[#667085] hover:border-[#D9E1EA] hover:bg-[#F7F9FC]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {/* Loading */}

          {loading ? (
            <div className="px-5 py-14 text-center">
              <RefreshCw
                size={21}
                className="mx-auto animate-spin text-[#174A7E]"
              />

              <p className="mt-3 text-sm font-medium text-[#172033]">
                Loading field records
              </p>

              <p className="mt-1 text-xs text-[#667085]">
                Retrieving records from Supabase...
              </p>
            </div>
          ) : recentRecords.length === 0 ? (
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
                  ? "Saved field-test records will appear here."
                  : "Try another search term or change the result filter."}
              </p>

              {records.length === 0 && !error && (
                <Link
                  href="/test"
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-[#0B1F3A] px-4 text-xs font-medium text-white transition hover:bg-[#17365F]"
                >
                  Start New Test
                </Link>
              )}
            </div>
          ) : (
            <div>
              {recentRecords.map((record) => (
                <Link
                  key={record.id}
                  href={`/verify?record=${encodeURIComponent(record.record_id)}`}
                  className="group flex flex-col gap-3 border-b border-[#E8EDF3] px-4 py-4 transition last:border-0 hover:bg-[#F8FAFC] focus:outline-none focus-visible:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#174A7E]/30 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF2F8] text-[#174A7E]">
                      <ClipboardList size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-all text-sm font-semibold text-[#172033]">
                          {record.record_id}
                        </p>

                        {record.verification_status === "Verified" && (
                          <span
                            title="Stored verification status"
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-[#027A48]"
                          >
                            <ShieldCheck size={13} />
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-[#667085]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={12} />
                          {formatTime(record.tested_at || record.created_at)}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={12} />
                          {getLocation(record)}
                        </span>

                        <span>
                          {formatDate(record.tested_at || record.created_at)}
                        </span>

                        {record.case_id && (
                          <span>
                            Case: {record.case_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 pl-12 sm:justify-end sm:pl-0">
                    <ResultBadge result={record.result || "Unknown"} />

                    <ChevronRight
                      size={16}
                      className="text-[#98A2B3] transition group-hover:translate-x-0.5 group-hover:text-[#174A7E]"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Footer information */}

        <div className="flex flex-col justify-between gap-2 text-[11px] text-[#98A2B3] sm:flex-row sm:items-center">
          <p>
            Showing{" "}
            <span className="font-semibold text-[#667085]">
              {loading ? "—" : recentRecords.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#667085]">
              {loading ? "—" : filteredRecords.length}
            </span>{" "}
            matching records
          </p>

          <Link
            href="/test-records"
            className="font-medium text-[#174A7E] hover:underline"
          >
            Open record management
          </Link>
        </div>

        {/* Presumptive result notice */}

        <div className="flex items-start gap-3 border-l-2 border-[#174A7E] bg-white px-4 py-3">
          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0 text-[#174A7E]"
          />

          <p className="text-xs leading-5 text-[#667085]">
            <span className="font-semibold text-[#174A7E]">
              Presumptive result.
            </span>{" "}
            NarcoLens supports digital documentation and prototype
            interpretation of field-test results. An integrity check
            confirms record integrity, not the scientific accuracy of
            the underlying result. Confirmatory laboratory testing
            remains necessary where applicable.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

/* Statistics card */

function StatCard({
  label,
  value,
  icon,
  active,
  onClick,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group border bg-white p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#174A7E]/30 ${
        active
          ? "border-[#174A7E] ring-1 ring-inset ring-[#174A7E]/20"
          : "border-[#D9E1EA] hover:border-[#B8C7D8] hover:bg-[#FCFDFE]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#667085]">
          {label}
        </p>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
            active
              ? "bg-[#174A7E] text-white"
              : "bg-[#EAF2F8] text-[#174A7E]"
          }`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <p className="text-2xl font-semibold tracking-tight tabular-nums text-[#0B1F3A]">
          {loading ? "—" : value.toLocaleString()}
        </p>

        <ChevronRight
          size={15}
          className={`mb-1 text-[#98A2B3] transition ${
            active
              ? "text-[#174A7E]"
              : "group-hover:translate-x-0.5 group-hover:text-[#174A7E]"
          }`}
        />
      </div>

      <p className="mt-1 text-[11px] text-[#98A2B3]">
        {active ? "Currently selected" : "View matching records"}
      </p>
    </button>
  );
}

/* Result badge */

function ResultBadge({ result }: { result: string }) {
  const normalized = result.toLowerCase();

  if (normalized === "positive") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#FECACA] bg-[#FEF3F2] px-2.5 py-1 text-[11px] font-medium text-[#B42318]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#B42318]" />
        Positive
      </span>
    );
  }

  if (normalized === "negative") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#ABEFC6] bg-[#ECFDF3] px-2.5 py-1 text-[11px] font-medium text-[#027A48]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#027A48]" />
        Negative
      </span>
    );
  }

  if (normalized === "inconclusive") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#FEDF89] bg-[#FFFAEB] px-2.5 py-1 text-[11px] font-medium text-[#B54708]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#B54708]" />
        Inconclusive
      </span>
    );
  }

  return (
    <span className="inline-flex border border-[#D9E1EA] bg-[#F7F9FC] px-2.5 py-1 text-[11px] font-medium text-[#667085]">
      {result}
    </span>
  );
}
