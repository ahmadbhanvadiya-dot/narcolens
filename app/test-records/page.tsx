"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  image_hash: string | null;
  verification_status: string | null;
};

type Filter =
  | "All"
  | "Negative"
  | "Positive"
  | "Inconclusive";

export default function TestRecordsPage() {
  const [records, setRecords] =
    useState<TestRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("All");

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    try {
      setLoading(true);
      setError("");

      const {
        data,
        error,
      } = await supabase
        .from("test_records")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw new Error(
          error.message
        );
      }

      setRecords(data || []);

    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load test records."
      );

    } finally {
      setLoading(false);
    }
  }

  function formatDate(
    date: string | null
  ) {
    if (!date) return "—";

    return new Date(
      date
    ).toLocaleString();
  }

  /*
   * ------------------------------------------------------
   * Search + filter
   * ------------------------------------------------------
   */

  const filteredRecords =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return records.filter(
        (record) => {
          const matchesSearch =
            !query ||
            record.record_id
              ?.toLowerCase()
              .includes(query) ||
            record.case_id
              ?.toLowerCase()
              .includes(query) ||
            record.reagent
              ?.toLowerCase()
              .includes(query) ||
            record.profile_id
              ?.toLowerCase()
              .includes(query) ||
            record.operator_id
              ?.toLowerCase()
              .includes(query);

          const matchesFilter =
            filter === "All" ||
            record.result === filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      records,
      search,
      filter,
    ]);

  /*
   * ------------------------------------------------------
   * Summary counts
   * ------------------------------------------------------
   */

  const positiveCount =
    records.filter(
      (record) =>
        record.result === "Positive"
    ).length;

  const negativeCount =
    records.filter(
      (record) =>
        record.result === "Negative"
    ).length;

  const inconclusiveCount =
    records.filter(
      (record) =>
        record.result ===
        "Inconclusive"
    ).length;

  return (
    <AppShell
      title="Test Records"
      section="View and manage digitally recorded field-test results"
    >

      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

          <div>

            <p className="text-sm font-medium text-[#174A7E]">
              RECORD MANAGEMENT
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-[#0B1F3A]">
              Test Records
            </h1>

            <p className="mt-2 text-[#667085]">
              View and manage digitally recorded
              field-test results.
            </p>

          </div>

          <button
            onClick={loadRecords}
            disabled={loading}
            className="rounded-lg border border-[#D9E1EA] bg-white px-4 py-2.5 text-sm font-medium text-[#172033] transition hover:bg-[#F7F9FC] disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh Records"}
          </button>

        </div>

        {/* Summary */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            label="Total Records"
            value={records.length}
          />

          <SummaryCard
            label="Positive"
            value={positiveCount}
          />

          <SummaryCard
            label="Negative"
            value={negativeCount}
          />

          <SummaryCard
            label="Inconclusive"
            value={inconclusiveCount}
          />

        </div>

        {/* Search + Filters */}

        <section className="rounded-xl border border-[#D9E1EA] bg-white p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            {/* Search */}

            <div className="flex-1">

              <label
                htmlFor="record-search"
                className="text-xs font-semibold uppercase tracking-wide text-[#667085]"
              >
                Search Records
              </label>

              <input
                id="record-search"
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search Record ID, Case ID, Reagent, Profile or Operator..."
                className="mt-2 w-full rounded-lg border border-[#D9E1EA] bg-white px-4 py-2.5 text-sm text-[#172033] outline-none focus:border-[#174A7E]"
              />

            </div>

            {/* Filters */}

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                Result
              </p>

              <div className="mt-2 flex flex-wrap gap-2">

                {(
                  [
                    "All",
                    "Negative",
                    "Positive",
                    "Inconclusive",
                  ] as Filter[]
                ).map(
                  (option) => (
                    <button
                      key={option}
                      onClick={() =>
                        setFilter(
                          option
                        )
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                        filter ===
                        option
                          ? "bg-[#174A7E] text-white"
                          : "border border-[#D9E1EA] bg-white text-[#667085] hover:bg-[#F7F9FC]"
                      }`}
                    >
                      {option}
                    </button>
                  )
                )}

              </div>

            </div>

          </div>

          {/* Filter result count */}

          <div className="mt-4 border-t border-[#D9E1EA] pt-4">

            <p className="text-xs text-[#667085]">

              Showing{" "}
              <span className="font-semibold text-[#172033]">
                {filteredRecords.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#172033]">
                {records.length}
              </span>{" "}
              records

            </p>

          </div>

        </section>

        {/* Records */}

        <section className="overflow-hidden rounded-xl border border-[#D9E1EA] bg-white">

          <div className="border-b border-[#D9E1EA] px-6 py-5">

            <h2 className="font-semibold text-[#0B1F3A]">
              Recorded Tests
            </h2>

            <p className="mt-1 text-sm text-[#667085]">
              Records stored in Supabase.
            </p>

          </div>

          {/* Loading */}

          {loading && (
            <div className="p-10 text-center">

              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#D9E1EA] border-t-[#174A7E]" />

              <p className="mt-3 text-sm text-[#667085]">
                Loading records...
              </p>

            </div>
          )}

          {/* Error */}

          {error && (
            <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4">

              <p className="text-sm text-red-700">
                {error}
              </p>

            </div>
          )}

          {/* Empty */}

          {!loading &&
            !error &&
            filteredRecords.length ===
              0 && (
              <div className="p-10 text-center">

                <p className="font-medium text-[#172033]">
                  {records.length === 0
                    ? "No test records found"
                    : "No matching records"}
                </p>

                <p className="mt-1 text-sm text-[#667085]">
                  {records.length === 0
                    ? "Completed test records will appear here."
                    : "Try changing your search or result filter."}
                </p>

              </div>
            )}

          {/* Table */}

          {!loading &&
            !error &&
            filteredRecords.length >
              0 && (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1250px] text-left">

                  <thead className="border-b border-[#D9E1EA] bg-[#F7F9FC]">

                    <tr>

                      <TableHeader>
                        Record ID
                      </TableHeader>

                      <TableHeader>
                        Case ID
                      </TableHeader>

                      <TableHeader>
                        Reagent
                      </TableHeader>

                      <TableHeader>
                        Profile
                      </TableHeader>

                      <TableHeader>
                        Result
                      </TableHeader>

                      <TableHeader>
                        Confidence
                      </TableHeader>

                      <TableHeader>
                        Operator
                      </TableHeader>

                      <TableHeader>
                        Date
                      </TableHeader>

                      <TableHeader>
                        Status
                      </TableHeader>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-[#D9E1EA]">

                    {filteredRecords.map(
                      (record) => (
                        <tr
                          key={
                            record.id
                          }
                          className="hover:bg-[#F7F9FC]"
                        >

                          {/* Record ID */}

                          <td className="px-6 py-4">

                            <Link
                              href={`/verify?record=${encodeURIComponent(
                                record.record_id
                              )}`}
                              className="font-medium text-[#174A7E] hover:underline"
                            >
                              {
                                record.record_id
                              }
                            </Link>

                          </td>

                          {/* Case */}

                          <td className="px-6 py-4 text-sm text-[#172033]">
                            {record.case_id ||
                              "—"}
                          </td>

                          {/* Reagent */}

                          <td className="px-6 py-4 text-sm text-[#172033]">
                            {record.reagent ||
                              "—"}
                          </td>

                          {/* Profile */}

                          <td className="px-6 py-4">

                            {record.profile_id ? (
                              <div>

                                <p className="text-sm font-medium text-[#172033]">
                                  {
                                    record.profile_id
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-[#667085]">
                                  v
                                  {record.profile_version ||
                                    "—"}
                                </p>

                              </div>
                            ) : (
                              <span className="text-sm text-[#667085]">
                                —
                              </span>
                            )}

                          </td>

                          {/* Result */}

                          <td className="px-6 py-4">

                            <ResultBadge
                              result={
                                record.result
                              }
                            />

                          </td>

                          {/* Confidence */}

                          <td className="px-6 py-4 text-sm text-[#172033]">

                            {record.confidence !=
                            null
                              ? `${record.confidence}%`
                              : "—"}

                          </td>

                          {/* Operator */}

                          <td className="px-6 py-4 text-sm text-[#172033]">
                            {record.operator_id ||
                              "—"}
                          </td>

                          {/* Date */}

                          <td className="px-6 py-4 text-sm text-[#667085]">
                            {formatDate(
                              record.tested_at
                            )}
                          </td>

                          {/* Status */}

                          <td className="px-6 py-4">

                            <span
                              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                                record.verification_status ===
                                "Verified"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-[#F7F9FC] text-[#667085]"
                              }`}
                            >
                              {record.verification_status ||
                                "Unknown"}
                            </span>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

        </section>

        {/* Disclaimer */}

        <div className="rounded-lg border border-[#D9E1EA] bg-white p-4">

          <p className="text-xs leading-5 text-[#667085]">

            <span className="font-semibold text-[#172033]">
              Presumptive analysis:
            </span>{" "}
            NarcoLens provides digital support for
            field-test interpretation and documentation.
            Results do not replace confirmatory
            laboratory testing.

          </p>

        </div>

      </div>

    </AppShell>
  );
}


/*
 * ------------------------------------------------------
 * Summary Card
 * ------------------------------------------------------
 */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#D9E1EA] bg-white p-5">

      <p className="text-sm text-[#667085]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#0B1F3A]">
        {value}
      </p>

    </div>
  );
}


/*
 * ------------------------------------------------------
 * Table Header
 * ------------------------------------------------------
 */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085]">
      {children}
    </th>
  );
}


/*
 * ------------------------------------------------------
 * Result Badge
 * ------------------------------------------------------
 */

function ResultBadge({
  result,
}: {
  result: string | null;
}) {
  if (result === "Positive") {
    return (
      <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        Positive
      </span>
    );
  }

  if (result === "Negative") {
    return (
      <span className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
        Negative
      </span>
    );
  }

  if (result === "Inconclusive") {
    return (
      <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        Inconclusive
      </span>
    );
  }

  return (
    <span className="rounded-md bg-[#F7F9FC] px-2.5 py-1 text-xs font-medium text-[#667085]">
      {result || "Unknown"}
    </span>
  );
}