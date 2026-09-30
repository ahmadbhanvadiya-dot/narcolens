"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/app/components/AppShell";

type TestRecord = {
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
  image_path: string | null;

  verification_status: string | null;
};

export default function VerifyPage() {
  const [recordId, setRecordId] =
    useState("");

  const [record, setRecord] =
    useState<TestRecord | null>(null);

  const [verifying, setVerifying] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [verified, setVerified] =
    useState<boolean | null>(null);

  const [calculatedHash, setCalculatedHash] =
    useState("");

  /*
   * ------------------------------------------------------
   * Automatically verify ?record=...
   * ------------------------------------------------------
   */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const id =
      params.get("record");

    if (id) {
      setRecordId(id);
      verifyRecord(id);
    }
  }, []);

  /*
   * ------------------------------------------------------
   * SHA-256
   * ------------------------------------------------------
   */

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
        byte
          .toString(16)
          .padStart(2, "0")
      )
      .join("");
  }

  /*
   * ------------------------------------------------------
   * Verify record
   * ------------------------------------------------------
   */

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
      setCalculatedHash("");

      return;
    }

    try {
      setVerifying(true);
      setMessage("");
      setRecord(null);
      setVerified(null);
      setCalculatedHash("");

      /*
       * Retrieve record
       */

      const {
        data,
        error,
      } = await supabase
        .from("test_records")
        .select("*")
        .eq("record_id", id)
        .maybeSingle();

      if (error) {
        throw new Error(
          error.message
        );
      }

      if (!data) {
        setMessage(
          "No record was found with this Record ID."
        );

        return;
      }

      setRecord(data);

      /*
       * --------------------------------------------------
       * Verify stored image
       * --------------------------------------------------
       */

      if (
        data.image_path &&
        data.image_hash
      ) {
        const {
          data: image,
          error: imageError,
        } =
          await supabase.storage
            .from("test-images")
            .download(
              data.image_path
            );

        if (imageError) {
          throw new Error(
            `Unable to retrieve stored image: ${imageError.message}`
          );
        }

        if (!image) {
          throw new Error(
            "Stored image could not be retrieved."
          );
        }

        /*
         * Recalculate hash
         */

        const buffer =
          await image.arrayBuffer();

        const currentHash =
          await generateSHA256(
            buffer
          );

        setCalculatedHash(
          currentHash
        );

        /*
         * Compare hashes
         */

        const hashMatches =
          currentHash.toLowerCase() ===
          data.image_hash.toLowerCase();

        setVerified(
          hashMatches
        );

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

  /*
   * ------------------------------------------------------
   * Date formatting
   * ------------------------------------------------------
   */

  function formatDate(
    date: string | null
  ) {
    if (!date) {
      return "—";
    }

    return new Date(
      date
    ).toLocaleString();
  }

  /*
   * ------------------------------------------------------
   * UI
   * ------------------------------------------------------
   */

  return (
    <AppShell
      title="Verify Digital Record"
      section="Verify record integrity and stored test metadata"
    >

      <div className="mx-auto max-w-6xl space-y-6">

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

        <section className="rounded-xl border border-[#D9E1EA] bg-white p-6">

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
                setRecordId(
                  e.target.value
                )
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
              onClick={() =>
                verifyRecord()
              }
              disabled={verifying}
              className="rounded-lg bg-[#174A7E] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0B1F3A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifying
                ? "Verifying..."
                : "Verify Record"}
            </button>

          </div>

          {/* Message */}

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

        {/* Verification Result */}

        {record && (
          <>

            {/* Status */}

            <section className="rounded-xl border border-[#D9E1EA] bg-white p-6">

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
                    ? "✓ Image Integrity Verified"
                    : verified === false
                      ? "✕ Image Integrity Failed"
                      : "Verification Pending"}
                </div>

              </div>

              {/* Details */}

              <div className="mt-6 grid gap-5 border-t border-[#D9E1EA] pt-6 sm:grid-cols-2 lg:grid-cols-3">

                <InfoItem
                  label="Case ID"
                  value={
                    record.case_id ||
                    "—"
                  }
                />

                <InfoItem
                  label="Test Kit"
                  value={
                    record.test_kit ||
                    "—"
                  }
                />

                <InfoItem
                  label="Reagent"
                  value={
                    record.reagent ||
                    "—"
                  }
                />

                <InfoItem
                  label="Profile"
                  value={
                    record.profile_id
                      ? `${record.profile_id} v${
                          record.profile_version ||
                          "—"
                        }`
                      : "—"
                  }
                />

                <InfoItem
                  label="Result"
                  value={
                    record.result ||
                    "—"
                  }
                />

                <InfoItem
                  label="Confidence"
                  value={
                    record.confidence != null
                      ? `${record.confidence}%`
                      : "—"
                  }
                />

                <InfoItem
                  label="Operator"
                  value={
                    record.operator_id ||
                    "—"
                  }
                />

                <InfoItem
                  label="Tested At"
                  value={formatDate(
                    record.tested_at
                  )}
                />

                <InfoItem
                  label="Verification Status"
                  value={
                    record.verification_status ||
                    "—"
                  }
                />

                <InfoItem
                  label="Latitude"
                  value={
                    record.latitude != null
                      ? record.latitude.toFixed(
                          6
                        )
                      : "—"
                  }
                />

                <InfoItem
                  label="Longitude"
                  value={
                    record.longitude != null
                      ? record.longitude.toFixed(
                          6
                        )
                      : "—"
                  }
                />

              </div>

            </section>

            {/* Hash Verification */}

            <section className="rounded-xl border border-[#D9E1EA] bg-white p-6">

              <div className="border-b border-[#D9E1EA] pb-4">

                <h2 className="font-semibold text-[#0B1F3A]">
                  Image Integrity Check
                </h2>

                <p className="mt-1 text-sm text-[#667085]">
                  SHA-256 hash comparison between
                  the stored record and the current
                  stored image.
                </p>

              </div>

              <div className="mt-6 space-y-5">

                {/* Stored hash */}

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    Stored SHA-256
                  </p>

                  <p className="mt-2 break-all rounded-lg bg-[#F7F9FC] p-4 font-mono text-xs leading-5 text-[#172033]">
                    {record.image_hash ||
                      "No stored hash"}
                  </p>

                </div>

                {/* Calculated hash */}

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    Recalculated SHA-256
                  </p>

                  <p className="mt-2 break-all rounded-lg bg-[#F7F9FC] p-4 font-mono text-xs leading-5 text-[#172033]">
                    {calculatedHash ||
                      "Not calculated"}
                  </p>

                </div>

                {/* Comparison */}

                <div
                  className={`rounded-lg border p-4 ${
                    verified === true
                      ? "border-green-200 bg-green-50"
                      : verified === false
                        ? "border-red-200 bg-red-50"
                        : "border-[#D9E1EA] bg-[#F7F9FC]"
                  }`}
                >

                  <p
                    className={`text-sm font-medium ${
                      verified === true
                        ? "text-green-800"
                        : verified === false
                          ? "text-red-800"
                          : "text-[#172033]"
                    }`}
                  >
                    {verified === true
                      ? "✓ Hashes match — image integrity verified."
                      : verified === false
                        ? "✕ Hashes do not match — image integrity could not be verified."
                        : "Hash comparison pending."}
                  </p>

                </div>

              </div>

            </section>

          </>
        )}

        {/* Disclaimer */}

        <div className="rounded-lg border border-[#D9E1EA] bg-white p-4">

          <p className="text-xs leading-5 text-[#667085]">

            <span className="font-semibold text-[#172033]">
              Integrity note:
            </span>{" "}
            SHA-256 verification confirms whether
            the stored image matches the hash
            recorded when the digital record was
            created. It does not by itself constitute
            a digital signature or certify the
            underlying field-test result.

          </p>

        </div>

      </div>

    </AppShell>
  );
}


/*
 * ------------------------------------------------------
 * Reusable information item
 * ------------------------------------------------------
 */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
        {label}
      </p>

      <p className="mt-1 break-words font-medium text-[#172033]">
        {value}
      </p>

    </div>
  );
}