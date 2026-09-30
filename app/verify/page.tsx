"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TestRecord = {
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
  image_path: string | null;
  verification_status: string | null;
};

export default function VerifyPage() {
  const [recordId, setRecordId] = useState("");
  const [record, setRecord] =
    useState<TestRecord | null>(null);

  const [verifying, setVerifying] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [verified, setVerified] =
    useState<boolean | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const id = params.get("record");

    if (id) {
      setRecordId(id);
      verifyRecord(id);
    }
  }, []);

  async function generateSHA256(
    data: ArrayBuffer
  ) {
    const hashBuffer =
      await crypto.subtle.digest(
        "SHA-256",
        data
      );

    return Array.from(
      new Uint8Array(hashBuffer)
    )
      .map((byte) =>
        byte.toString(16).padStart(2, "0")
      )
      .join("");
  }

  async function verifyRecord(
    suppliedId?: string
  ) {
    const id = (
      suppliedId ?? recordId
    ).trim();

    if (!id) {
      setMessage(
        "Please enter a Record ID."
      );
      setRecord(null);
      setVerified(null);
      return;
    }

    try {
      setVerifying(true);
      setMessage("");
      setRecord(null);
      setVerified(null);

      const { data, error } = await supabase
        .from("test_records")
        .select("*")
        .eq("record_id", id)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        setMessage(
          "No record was found with this Record ID."
        );
        return;
      }

      setRecord(data);

      /*
       * Verify the stored image hash.
       *
       * The image remains in the private
       * Supabase Storage bucket. We download it
       * through the Supabase client and calculate
       * its SHA-256 hash again.
       */
      if (data.image_path && data.image_hash) {
        const {
          data: image,
          error: imageError,
        } = await supabase.storage
          .from("test-images")
          .download(data.image_path);

        if (imageError) {
          throw new Error(
            `Unable to retrieve stored image: ${imageError.message}`
          );
        }

        const buffer =
          await image.arrayBuffer();

        const currentHash =
          await generateSHA256(buffer);

        const hashMatches =
          currentHash.toLowerCase() ===
          data.image_hash.toLowerCase();

        setVerified(hashMatches);

        if (hashMatches) {
          setMessage(
            "Record found and image integrity verified."
          );
        } else {
          setMessage(
            "Record found, but the image hash does not match the stored hash."
          );
        }
      } else {
        setMessage(
          "Record found, but no image hash is available for verification."
        );

        setVerified(null);
      }

    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify the record."
      );
    } finally {
      setVerifying(false);
    }
  }

  function formatDate(
    date: string | null
  ) {
    if (!date) return "—";

    return new Date(date).toLocaleString();
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] p-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-[#174A7E]">
            RECORD VERIFICATION
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#0B1F3A]">
            Verify Digital Record
          </h1>

          <p className="mt-2 text-[#667085]">
            Verify a stored test record and check
            image integrity using SHA-256.
          </p>
        </div>

        {/* Search */}
        <section className="mt-8 rounded-xl border border-[#D9E1EA] bg-white p-6">

          <label
            htmlFor="recordId"
            className="text-sm font-medium text-[#172033]"
          >
            Record ID
          </label>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">

            <input
              id="recordId"
              type="text"
              value={recordId}
              onChange={(e) =>
                setRecordId(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  verifyRecord();
                }
              }}
              placeholder="e.g. NLC-123456789"
              className="flex-1 rounded-lg border border-[#D9E1EA] bg-white px-4 py-3 text-sm text-[#172033] outline-none focus:border-[#174A7E]"
            />

            <button
              onClick={() => verifyRecord()}
              disabled={verifying}
              className="rounded-lg bg-[#174A7E] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0B1F3A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifying
                ? "Verifying..."
                : "Verify Record"}
            </button>

          </div>

          {message && (
            <div
              className={`mt-5 rounded-lg border p-4 ${
                verified === true
                  ? "border-green-200 bg-green-50"
                  : verified === false
                    ? "border-red-200 bg-red-50"
                    : "border-[#D9E1EA] bg-[#F7F9FC]"
              }`}
            >
              <p
                className={`text-sm ${
                  verified === true
                    ? "text-green-700"
                    : verified === false
                      ? "text-red-700"
                      : "text-[#667085]"
                }`}
              >
                {message}
              </p>
            </div>
          )}

        </section>

        {/* Verification result */}
        {record && (
          <section className="mt-6 rounded-xl border border-[#D9E1EA] bg-white p-6">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                  Digital Record
                </p>

                <h2 className="mt-1 text-xl font-semibold text-[#0B1F3A]">
                  {record.record_id}
                </h2>
              </div>

              <div
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  verified === true
                    ? "bg-green-50 text-green-700"
                    : verified === false
                      ? "bg-red-50 text-red-700"
                      : "bg-[#F7F9FC] text-[#667085]"
                }`}
              >
                {verified === true
                  ? "✓ Integrity Verified"
                  : verified === false
                    ? "✕ Integrity Check Failed"
                    : "Verification Pending"}
              </div>

            </div>

            {/* Record details */}
            <div className="mt-6 grid gap-5 border-t border-[#D9E1EA] pt-6 sm:grid-cols-2 lg:grid-cols-3">

              <div>
                <p className="text-xs text-[#667085]">
                  Case ID
                </p>

                <p className="mt-1 font-medium text-[#172033]">
                  {record.case_id || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#667085]">
                  Test Kit
                </p>

                <p className="mt-1 font-medium text-[#172033]">
                  {record.test_kit || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#667085]">
                  Result
                </p>

                <p className="mt-1 font-medium text-[#174A7E]">
                  {record.result || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#667085]">
                  Confidence
                </p>

                <p className="mt-1 font-medium text-[#172033]">
                  {record.confidence != null
                    ? `${record.confidence}%`
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#667085]">
                  Operator
                </p>

                <p className="mt-1 font-medium text-[#172033]">
                  {record.operator_id || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#667085]">
                  Tested At
                </p>

                <p className="mt-1 font-medium text-[#172033]">
                  {formatDate(record.tested_at)}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#667085]">
                  Latitude
                </p>

                <p className="mt-1 font-medium text-[#172033]">
                  {record.latitude ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#667085]">
                  Longitude
                </p>

                <p className="mt-1 font-medium text-[#172033]">
                  {record.longitude ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#667085]">
                  Verification Status
                </p>

                <p className="mt-1 font-medium text-[#172033]">
                  {record.verification_status ||
                    "—"}
                </p>
              </div>

            </div>

            {/* Hash */}
            <div className="mt-6 border-t border-[#D9E1EA] pt-6">

              <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                Stored Image SHA-256
              </p>

              <p className="mt-2 break-all font-mono text-xs leading-5 text-[#172033]">
                {record.image_hash ||
                  "No hash available"}
              </p>

            </div>

          </section>
        )}

        {/* Disclaimer */}
        <div className="mt-6 rounded-lg border border-[#D9E1EA] bg-white p-4">

          <p className="text-xs leading-5 text-[#667085]">

            <span className="font-semibold text-[#172033]">
              Record integrity:
            </span>{" "}

            SHA-256 verification checks whether the stored
            image matches the hash recorded when the digital
            record was created.

          </p>

        </div>

      </div>
    </main>
  );
}