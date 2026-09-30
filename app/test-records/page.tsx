"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TestRecord = {
  id: string;
  record_id: string;
  case_id: string | null;
  test_kit: string | null;
  result: string | null;
  confidence: number | null;
  operator_id: string | null;
  latitude: number | null;
  longitude: number | null;
  tested_at: string | null;
  image_hash: string | null;
  verification_status: string | null;
};

export default function TestRecordsPage() {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("test_records")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw new Error(error.message);
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

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleString();
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-[#174A7E]">
            RECORD MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#0B1F3A]">
            Test Records
          </h1>

          <p className="mt-2 text-[#667085]">
            View and manage digitally recorded field-test results.
          </p>
        </div>

        {/* Summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-[#D9E1EA] bg-white p-5">
            <p className="text-sm text-[#667085]">
              Total Records
            </p>

            <p className="mt-2 text-2xl font-semibold text-[#0B1F3A]">
              {records.length}
            </p>
          </div>

          <div className="rounded-xl border border-[#D9E1EA] bg-white p-5">
            <p className="text-sm text-[#667085]">
              Verified Records
            </p>

            <p className="mt-2 text-2xl font-semibold text-[#174A7E]">
              {
                records.filter(
                  (record) =>
                    record.verification_status ===
                    "Verified"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-[#D9E1EA] bg-white p-5">
            <p className="text-sm text-[#667085]">
              Inconclusive
            </p>

            <p className="mt-2 text-2xl font-semibold text-[#667085]">
              {
                records.filter(
                  (record) =>
                    record.result ===
                    "Inconclusive"
                ).length
              }
            </p>
          </div>

        </div>

        {/* Records */}
        <section className="mt-8 overflow-hidden rounded-xl border border-[#D9E1EA] bg-white">

          <div className="border-b border-[#D9E1EA] px-6 py-5">
            <h2 className="font-semibold text-[#0B1F3A]">
              Recorded Tests
            </h2>

            <p className="mt-1 text-sm text-[#667085]">
              Records stored in Supabase.
            </p>
          </div>

          {loading && (
            <div className="p-8 text-center text-sm text-[#667085]">
              Loading records...
            </div>
          )}

          {error && (
            <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            records.length === 0 && (
              <div className="p-10 text-center">
                <p className="font-medium text-[#172033]">
                  No test records found
                </p>

                <p className="mt-1 text-sm text-[#667085]">
                  Completed test records will appear here.
                </p>
              </div>
            )}

          {!loading &&
            records.length > 0 && (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px] text-left">

                  <thead className="border-b border-[#D9E1EA] bg-[#F7F9FC]">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085]">
                        Record ID
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085]">
                        Case ID
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085]">
                        Result
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085]">
                        Confidence
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085]">
                        Operator
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085]">
                        Date
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085]">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#D9E1EA]">

                    {records.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-[#F7F9FC]"
                      >

                        <td className="px-6 py-4">
                          <Link
                            href={`/verify?record=${encodeURIComponent(
                              record.record_id
                            )}`}
                            className="font-medium text-[#174A7E] hover:underline"
                          >
                            {record.record_id}
                          </Link>
                        </td>

                        <td className="px-6 py-4 text-sm text-[#172033]">
                          {record.case_id || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-medium text-[#172033]">
                            {record.result || "—"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-[#172033]">
                          {record.confidence != null
                            ? `${record.confidence}%`
                            : "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-[#172033]">
                          {record.operator_id || "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-[#667085]">
                          {formatDate(record.tested_at)}
                        </td>

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
                    ))}

                  </tbody>

                </table>

              </div>
            )}

        </section>

        {/* Disclaimer */}
        <div className="mt-6 rounded-lg border border-[#D9E1EA] bg-white p-4">
          <p className="text-xs leading-5 text-[#667085]">
            <span className="font-semibold text-[#172033]">
              Presumptive analysis:
            </span>{" "}
            NarcoLens provides digital support for field-test
            interpretation and documentation. Results do not
            replace confirmatory laboratory testing.
          </p>
        </div>

      </div>
    </main>
  );
}