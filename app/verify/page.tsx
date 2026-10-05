"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/app/components/AppShell";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

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

  signature: string | null;
  signature_algorithm: string | null;
  signing_key_id: string | null;
  record_payload_hash: string | null;
};

export default function VerifyPage() {
  const [recordId, setRecordId] = useState("");

  const [record, setRecord] =
    useState<TestRecord | null>(null);

  const [verifying, setVerifying] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [imageVerified, setImageVerified] =
    useState<boolean | null>(null);

  const [signatureVerified, setSignatureVerified] =
    useState<boolean | null>(null);

  const [payloadHashVerified, setPayloadHashVerified] =
    useState<boolean | null>(null);

  const [overallVerified, setOverallVerified] =
    useState<boolean | null>(null);

  const [calculatedHash, setCalculatedHash] =
    useState("");

  const [calculatedPayloadHash, setCalculatedPayloadHash] =
    useState("");

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
      setMessage("Please enter a Record ID.");
      setRecord(null);
      setImageVerified(null);
      setSignatureVerified(null);
      setPayloadHashVerified(null);
      setOverallVerified(null);
      return;
    }

    try {
      setVerifying(true);
      setMessage("");

      setRecord(null);

      setImageVerified(null);
      setSignatureVerified(null);
      setPayloadHashVerified(null);
      setOverallVerified(null);

      setCalculatedHash("");
      setCalculatedPayloadHash("");

      /*
       * ------------------------------------------------------
       * Retrieve record
       * ------------------------------------------------------
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
       * ------------------------------------------------------
       * IMAGE SHA-256 VERIFICATION
       * ------------------------------------------------------
       */

      let imageHashMatches = false;

      if (
        data.image_path &&
        data.image_hash
      ) {
        const {
          data: image,
          error: imageError,
        } = await supabase.storage
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

        const buffer =
          await image.arrayBuffer();

        const currentHash =
          await generateSHA256(buffer);

        setCalculatedHash(
          currentHash
        );

        imageHashMatches =
          currentHash.toLowerCase() ===
          data.image_hash.toLowerCase();

        setImageVerified(
          imageHashMatches
        );
      } else {
        setImageVerified(false);
      }

      /*
       * ------------------------------------------------------
       * DIGITAL SIGNATURE VERIFICATION
       * ------------------------------------------------------
       *
       * IMPORTANT:
       * These are exactly the fields that were originally
       * signed by /sign-record.
       *
       * Signature fields themselves are NOT included.
       */

      let signatureMatches = false;
      let payloadHashMatches = false;

      if (
        data.signature &&
        data.record_payload_hash
      ) {
        const payload = {
          record_id: data.record_id,
          case_id: data.case_id,
          test_kit: data.test_kit,
          reagent: data.reagent,
          profile_id: data.profile_id,
          profile_version: data.profile_version,
          result: data.result,
          confidence: data.confidence,
          operator_id: data.operator_id,
          latitude: data.latitude,
          longitude: data.longitude,
          tested_at: data.tested_at,
          image_hash: data.image_hash,
          image_path: data.image_path,
        };

        const response = await fetch(
          `${API_URL}/verify-signature`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              payload,
              signature: data.signature,
            }),
          }
        );

        const verification =
          await response.json();

        if (!response.ok) {
          throw new Error(
            verification.detail ||
              "Digital signature verification failed."
          );
        }

        signatureMatches =
          verification.signature_valid === true;

        const calculatedHash =
          verification.record_payload_hash;

        if (calculatedHash) {
          setCalculatedPayloadHash(
            calculatedHash
          );

          payloadHashMatches =
            calculatedHash.toLowerCase() ===
            data.record_payload_hash.toLowerCase();
        }

        setSignatureVerified(
          signatureMatches
        );

        setPayloadHashVerified(
          payloadHashMatches
        );
      } else {
        setSignatureVerified(false);
        setPayloadHashVerified(false);
      }

      /*
       * ------------------------------------------------------
       * OVERALL VERIFICATION
       * ------------------------------------------------------
       */

      const completeVerification =
        imageHashMatches &&
        signatureMatches &&
        payloadHashMatches;

      setOverallVerified(
        completeVerification
      );

      if (completeVerification) {
        setMessage(
          "Record integrity verified successfully. Image hash, digital signature, and signed payload hash all match."
        );
      } else {
        setMessage(
          "Record found, but one or more integrity checks failed."
        );
      }

    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify the record."
      );

      setOverallVerified(false);

    } finally {
      setVerifying(false);
    }
  }

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
            Verify the stored record, image integrity,
            and digital signature.
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

          {message && (
            <div
              className={`mt-5 rounded-lg border p-4 ${
                overallVerified === true
                  ? "border-green-200 bg-green-50"
                  : overallVerified === false
                  ? "border-red-200 bg-red-50"
                  : "border-[#D9E1EA] bg-[#F7F9FC]"
              }`}
            >
              <p
                className={`text-sm ${
                  overallVerified === true
                    ? "text-green-700"
                    : overallVerified === false
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

            {/* Overall Status */}

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
                    overallVerified === true
                      ? "bg-green-50 text-green-700"
                      : overallVerified === false
                      ? "bg-red-50 text-red-700"
                      : "bg-[#F7F9FC] text-[#667085]"
                  }`}
                >
                  {overallVerified === true
                    ? "✓ Record Integrity Verified"
                    : overallVerified === false
                    ? "✕ Record Integrity Failed"
                    : "Verification Pending"}
                </div>

              </div>

              {/* Verification Checks */}

              <div className="mt-6 grid gap-4 border-t border-[#D9E1EA] pt-6 md:grid-cols-3">

                <VerificationCheck
                  label="Image Integrity"
                  verified={imageVerified}
                />

                <VerificationCheck
                  label="Digital Signature"
                  verified={signatureVerified}
                />

                <VerificationCheck
                  label="Payload Hash"
                  verified={payloadHashVerified}
                />

              </div>

            </section>

            {/* Record Details */}

            <section className="rounded-xl border border-[#D9E1EA] bg-white p-6">

              <h2 className="font-semibold text-[#0B1F3A]">
                Record Details
              </h2>

              <div className="mt-6 grid gap-5 border-t border-[#D9E1EA] pt-6 sm:grid-cols-2 lg:grid-cols-3">

                <InfoItem
                  label="Case ID"
                  value={
                    record.case_id || "—"
                  }
                />

                <InfoItem
                  label="Test Kit"
                  value={
                    record.test_kit || "—"
                  }
                />

                <InfoItem
                  label="Reagent"
                  value={
                    record.reagent || "—"
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
                    record.result || "—"
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
                    record.operator_id || "—"
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
                      ? record.latitude.toFixed(6)
                      : "—"
                  }
                />

                <InfoItem
                  label="Longitude"
                  value={
                    record.longitude != null
                      ? record.longitude.toFixed(6)
                      : "—"
                  }
                />

              </div>

            </section>

            {/* Image Integrity */}

            <section className="rounded-xl border border-[#D9E1EA] bg-white p-6">

              <div className="border-b border-[#D9E1EA] pb-4">

                <h2 className="font-semibold text-[#0B1F3A]">
                  Image Integrity Check
                </h2>

                <p className="mt-1 text-sm text-[#667085]">
                  SHA-256 comparison between the
                  recorded image hash and the currently
                  stored image.
                </p>

              </div>

              <div className="mt-6 space-y-5">

                <HashBlock
                  label="Stored SHA-256"
                  value={
                    record.image_hash ||
                    "No stored hash"
                  }
                />

                <HashBlock
                  label="Recalculated SHA-256"
                  value={
                    calculatedHash ||
                    "Not calculated"
                  }
                />

                <div
                  className={`rounded-lg border p-4 ${
                    imageVerified === true
                      ? "border-green-200 bg-green-50"
                      : imageVerified === false
                      ? "border-red-200 bg-red-50"
                      : "border-[#D9E1EA] bg-[#F7F9FC]"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      imageVerified === true
                        ? "text-green-800"
                        : imageVerified === false
                        ? "text-red-800"
                        : "text-[#172033]"
                    }`}
                  >
                    {imageVerified === true
                      ? "✓ Image hash matches."
                      : imageVerified === false
                      ? "✕ Image hash does not match."
                      : "Image hash verification pending."}
                  </p>
                </div>

              </div>

            </section>

            {/* Digital Signature */}

            <section className="rounded-xl border border-[#D9E1EA] bg-white p-6">

              <div className="border-b border-[#D9E1EA] pb-4">

                <h2 className="font-semibold text-[#0B1F3A]">
                  Digital Signature Verification
                </h2>

                <p className="mt-1 text-sm text-[#667085]">
                  Verification of the signed record
                  payload using the NarcoLens signing key.
                </p>

              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">

                <InfoItem
                  label="Algorithm"
                  value={
                    record.signature_algorithm ||
                    "—"
                  }
                />

                <InfoItem
                  label="Signing Key ID"
                  value={
                    record.signing_key_id ||
                    "—"
                  }
                />

              </div>

              <div className="mt-6 space-y-5">

                <HashBlock
                  label="Stored Record Payload Hash"
                  value={
                    record.record_payload_hash ||
                    "No stored payload hash"
                  }
                />

                <HashBlock
                  label="Recalculated Record Payload Hash"
                  value={
                    calculatedPayloadHash ||
                    "Not calculated"
                  }
                />

                <div
                  className={`rounded-lg border p-4 ${
                    signatureVerified === true &&
                    payloadHashVerified === true
                      ? "border-green-200 bg-green-50"
                      : signatureVerified === false ||
                        payloadHashVerified === false
                      ? "border-red-200 bg-red-50"
                      : "border-[#D9E1EA] bg-[#F7F9FC]"
                  }`}
                >

                  <p
                    className={`text-sm font-medium ${
                      signatureVerified === true &&
                      payloadHashVerified === true
                        ? "text-green-800"
                        : signatureVerified === false ||
                          payloadHashVerified === false
                        ? "text-red-800"
                        : "text-[#172033]"
                    }`}
                  >
                    {signatureVerified === true &&
                    payloadHashVerified === true
                      ? "✓ Ed25519 signature and payload hash verified."
                      : signatureVerified === false ||
                        payloadHashVerified === false
                      ? "✕ Digital signature or payload hash verification failed."
                      : "Digital signature verification pending."}
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
            SHA-256 verification confirms that the
            stored image matches its recorded hash.
            Ed25519 verification confirms that the
            signed record payload has not been altered
            since it was signed. These integrity checks
            do not certify the underlying field-test
            result or replace confirmatory laboratory
            analysis.

          </p>

        </div>

      </div>
    </AppShell>
  );
}

/*
 * ------------------------------------------------------
 * Verification Check
 * ------------------------------------------------------
 */

function VerificationCheck({
  label,
  verified,
}: {
  label: string;
  verified: boolean | null;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        verified === true
          ? "border-green-200 bg-green-50"
          : verified === false
          ? "border-red-200 bg-red-50"
          : "border-[#D9E1EA] bg-[#F7F9FC]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-semibold ${
          verified === true
            ? "text-green-700"
            : verified === false
            ? "text-red-700"
            : "text-[#667085]"
        }`}
      >
        {verified === true
          ? "✓ Verified"
          : verified === false
          ? "✕ Failed"
          : "Pending"}
      </p>
    </div>
  );
}

/*
 * ------------------------------------------------------
 * Hash Block
 * ------------------------------------------------------
 */

function HashBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
        {label}
      </p>

      <p className="mt-2 break-all rounded-lg bg-[#F7F9FC] p-4 font-mono text-xs leading-5 text-[#172033]">
        {value}
      </p>
    </div>
  );
}

/*
 * ------------------------------------------------------
 * Reusable Information Item
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