"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
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

type FilterType =
  | "All"
  | "Negative"
  | "Positive"
  | "Inconclusive";

export default function Home() {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<FilterType>("All");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard(
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data, error: supabaseError } =
        await supabase
          .from("test_records")
          .select(
            `
              id,
              record_id,
              case_id,
              result,
              confidence,
              operator_id,
              latitude,
              longitude,
              tested_at,
              created_at,
              verification_status
            `
          )
          .order("created_at", {
            ascending: false,
          });

      if (supabaseError) {
        throw new Error(
          supabaseError.message
        );
      }

      setRecords(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const totalTests = records.length;

  const negativeTests = records.filter(
    (record) =>
      record.result?.toLowerCase() ===
      "negative"
  ).length;

  const positiveTests = records.filter(
    (record) =>
      record.result?.toLowerCase() ===
      "positive"
  ).length;

  const inconclusiveTests = records.filter(
    (record) =>
      record.result?.toLowerCase() ===
      "inconclusive"
  ).length;

  const filteredRecords = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return records
      .filter((record) => {
        if (filter === "All") {
          return true;
        }

        return (
          record.result?.toLowerCase() ===
          filter.toLowerCase()
        );
      })
      .filter((record) => {
        if (!query) {
          return true;
        }

        return (
          record.record_id
            ?.toLowerCase()
            .includes(query) ||
          record.case_id
            ?.toLowerCase()
            .includes(query) ||
          record.operator_id
            ?.toLowerCase()
            .includes(query)
        );
      });
  }, [records, filter, search]);

  const recentRecords =
    filteredRecords.slice(0, 5);

  function formatTime(
    date: string | null
  ) {
    if (!date) return "—";

    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  function formatDate(
    date: string | null
  ) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      [],
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getLocation(record: TestRecord) {
    if (
      record.latitude !== null &&
      record.longitude !== null
    ) {
      return `${record.latitude.toFixed(
        3
      )}, ${record.longitude.toFixed(3)}`;
    }

    return "Field location unavailable";
  }

  return (
    <AppShell title="Dashboard">

      {/* Page intro */}
      <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.1em] text-[#174A7E]">
            Overview
          </p>

          <h3 className="text-2xl font-semibold tracking-tight text-[#0B1F3A]">
            Field Test Activity
          </h3>

          <p className="mt-1 text-sm text-[#667085]">
            Monitor and manage presumptive field-test
            records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <Link
            href="/test"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0B1F3A] px-4 text-sm font-medium text-white transition hover:bg-[#17365F]"
          >
            <Camera size={16} />
            Start New Test
          </Link>

          <Link
            href="/verify"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D9E1EA] bg-white px-4 text-sm font-medium text-[#174A7E] transition hover:bg-[#F3F6F9]"
          >
            <ShieldCheck size={16} />
            Verify Record
          </Link>

        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">

          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="text-sm font-medium text-red-700 hover:underline"
          >
            Retry
          </button>

        </div>
      )}

      {/* Statistics */}
      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Total Tests"
          value={totalTests}
          icon={
            <ClipboardList size={17} />
          }
          active={filter === "All"}
          onClick={() => setFilter("All")}
          loading={loading}
        />

        <StatCard
          label="Negative"
          value={negativeTests}
          icon={
            <CheckCircle2 size={17} />
          }
          active={filter === "Negative"}
          onClick={() =>
            setFilter("Negative")
          }
          loading={loading}
        />

        <StatCard
          label="Positive"
          value={positiveTests}
          icon={
            <XCircle size={17} />
          }
          active={filter === "Positive"}
          onClick={() =>
            setFilter("Positive")
          }
          loading={loading}
        />

        <StatCard
          label="Inconclusive"
          value={inconclusiveTests}
          icon={
            <AlertTriangle size={17} />
          }
          active={filter === "Inconclusive"}
          onClick={() =>
            setFilter("Inconclusive")
          }
          loading={loading}
        />

      </div>

      {/* Quick status */}
      <div className="mb-7 grid gap-4 lg:grid-cols-[1fr_auto]">

        <div className="border border-[#D9E1EA] bg-white px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#ECFDF3] text-[#027A48]">
              <CheckCircle2 size={17} />
            </div>

            <div>
              <p className="text-sm font-medium text-[#172033]">
                System operational
              </p>

              <p className="mt-0.5 text-xs text-[#667085]">
                Supabase record synchronization is active.
              </p>
            </div>

          </div>

        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex min-h-[64px] items-center justify-center gap-2 border border-[#D9E1EA] bg-white px-5 text-sm font-medium text-[#174A7E] transition hover:bg-[#F3F6F9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh Data"}
        </button>

      </div>

      {/* Records */}
      <div className="border border-[#D9E1EA] bg-white">

        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[#D9E1EA] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h4 className="text-sm font-semibold text-[#0B1F3A]">
              Recent Test Records
            </h4>

            <p className="mt-0.5 text-xs text-[#667085]">
              {filter === "All"
                ? "Latest activity from your field unit"
                : `${filter} records`}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            {/* Search */}
            <div className="relative">

              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search records..."
                className="h-9 w-full rounded-md border border-[#D9E1EA] bg-white pl-9 pr-3 text-xs text-[#172033] outline-none focus:border-[#174A7E] sm:w-[210px]"
              />

            </div>

            <Link
              href="/test-records"
              className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-[#D9E1EA] px-3 text-xs font-medium text-[#174A7E] hover:bg-[#F3F6F9]"
            >
              View all
              <ChevronRight size={13} />
            </Link>

          </div>

        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 border-b border-[#E8EDF3] px-5 py-3">

          {(
            [
              "All",
              "Negative",
              "Positive",
              "Inconclusive",
            ] as FilterType[]
          ).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                setFilter(item)
              }
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filter === item
                  ? "bg-[#EAF2F8] text-[#174A7E]"
                  : "text-[#667085] hover:bg-[#F3F6F9]"
              }`}
            >
              {item}
            </button>
          ))}

        </div>

        {/* Records */}
        {loading ? (
          <div className="px-5 py-12 text-center">

            <RefreshCw
              size={20}
              className="mx-auto animate-spin text-[#174A7E]"
            />

            <p className="mt-3 text-sm text-[#667085]">
              Loading field records...
            </p>

          </div>
        ) : recentRecords.length === 0 ? (
          <div className="px-5 py-12 text-center">

            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[#F1F5F9]">
              <ClipboardList
                size={18}
                className="text-[#667085]"
              />
            </div>

            <p className="mt-3 text-sm font-medium text-[#172033]">
              No records found
            </p>

            <p className="mt-1 text-xs text-[#667085]">
              Try another filter or search term.
            </p>

          </div>
        ) : (
          <div>

            {recentRecords.map(
              (record) => (
                <Link
                  key={record.id}
                  href={`/verify?record=${encodeURIComponent(
                    record.record_id
                  )}`}
                  className="group flex flex-col gap-3 border-b border-[#E8EDF3] px-5 py-4 transition last:border-0 hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex min-w-0 items-center gap-4">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F1F5F9]">
                      <ClipboardList
                        size={16}
                        className="text-[#174A7E]"
                      />
                    </div>

                    <div className="min-w-0">

                      <div className="flex items-center gap-2">

                        <p className="truncate text-sm font-medium text-[#172033]">
                          {record.record_id}
                        </p>

                        {record.verification_status ===
                          "Verified" && (
                          <ShieldCheck
                            size={14}
                            className="shrink-0 text-[#027A48]"
                          />
                        )}

                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#667085]">

                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(
                            record.tested_at ||
                              record.created_at
                          )}
                        </span>

                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {getLocation(
                            record
                          )}
                        </span>

                        <span>
                          {formatDate(
                            record.tested_at ||
                              record.created_at
                          )}
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="flex items-center gap-3 sm:shrink-0">

                    <ResultBadge
                      result={
                        record.result ||
                        "Unknown"
                      }
                    />

                    <ChevronRight
                      size={16}
                      className="text-[#98A2B3] transition group-hover:translate-x-0.5 group-hover:text-[#174A7E]"
                    />

                  </div>

                </Link>
              )
            )}

          </div>
        )}

      </div>

      {/* Sync information */}
      <div className="mt-4 flex flex-col justify-between gap-2 text-[11px] text-[#98A2B3] sm:flex-row">

        <span>
          Showing{" "}
          <span className="font-medium text-[#667085]">
            {recentRecords.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-[#667085]">
            {filteredRecords.length}
          </span>{" "}
          matching records
        </span>

        <span>
          {lastUpdated
            ? `Last synced ${lastUpdated.toLocaleTimeString(
                [],
                {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                }
              )}`
            : "Not yet synchronized"}
        </span>

      </div>

      {/* Disclaimer */}
      <div className="mt-5 border-l-2 border-[#174A7E] bg-white px-4 py-3 text-xs leading-5 text-[#667085]">

        <span className="font-semibold text-[#174A7E]">
          Presumptive result.
        </span>{" "}

        NarcoLens provides digital support for field-test
        interpretation and documentation. Confirmatory
        laboratory testing remains necessary where applicable.

      </div>

    </AppShell>
  );
}


/* ---------------------------------------------
   Statistics Card
--------------------------------------------- */

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
      className={`group border bg-white px-5 py-4 text-left transition ${
        active
          ? "border-[#174A7E] ring-1 ring-[#174A7E]/20"
          : "border-[#D9E1EA] hover:border-[#B8C7D8] hover:bg-[#FCFDFE]"
      }`}
    >

      <div className="mb-5 flex items-center justify-between">

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-md ${
            active
              ? "bg-[#174A7E] text-white"
              : "bg-[#EAF2F8] text-[#174A7E]"
          }`}
        >
          {icon}
        </div>

        <ChevronRight
          size={15}
          className={`text-[#98A2B3] transition ${
            active
              ? "text-[#174A7E]"
              : "group-hover:translate-x-0.5"
          }`}
        />

      </div>

      <p className="text-xs text-[#667085]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-[#0B1F3A]">
        {loading ? "—" : value}
      </p>

    </button>
  );
}


/* ---------------------------------------------
   Result Badge
--------------------------------------------- */

function ResultBadge({
  result,
}: {
  result: string;
}) {
  const normalized =
    result.toLowerCase();

  if (normalized === "positive") {
    return (
      <span className="rounded-md border border-[#FECACA] bg-[#FEF3F2] px-2.5 py-1 text-[11px] font-medium text-[#B42318]">
        Positive
      </span>
    );
  }

  if (normalized === "negative") {
    return (
      <span className="rounded-md border border-[#ABEFC6] bg-[#ECFDF3] px-2.5 py-1 text-[11px] font-medium text-[#027A48]">
        Negative
      </span>
    );
  }

  if (normalized === "inconclusive") {
    return (
      <span className="rounded-md border border-[#FEDF89] bg-[#FFFAEB] px-2.5 py-1 text-[11px] font-medium text-[#B54708]">
        Inconclusive
      </span>
    );
  }

  return (
    <span className="rounded-md border border-[#D9E1EA] bg-[#F7F9FC] px-2.5 py-1 text-[11px] font-medium text-[#667085]">
      {result}
    </span>
  );
}