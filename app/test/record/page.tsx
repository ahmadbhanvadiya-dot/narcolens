"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { supabase } from "@/lib/supabase";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type AnalysisResult = {
  result?: string;
  confidence?: number;
  quality?: string;
  brightness?: number;
  contrast?: number;
  sharpness?: number;

  rgb?: {
    r?: number;
    g?: number;
    b?: number;
  };

  hsv?: {
    h?: number;
    s?: number;
    v?: number;
  };

  lab?: {
    l?: number;
    a?: number;
    b?: number;
  };

  delta_e?: number;
};

type TestLocation = {
  latitude: number;
  longitude: number;
  timestamp?: string;
};

type TestMetadata = {
  caseId: string;
  testKit: string;
  reagent: string;
  profileId: string;
  profileVersion: string;
  operatorId: string;
  startedAt?: string;
};

type SignatureData = {
  signature: string;
  signature_algorithm: string;
  signing_key_id: string;
  record_payload_hash: string;
};

export default function DigitalRecordPage() {
  const router = useRouter();

  const [image, setImage] =
    useState<string | null>(null);

  const [analysis, setAnalysis] =
    useState<AnalysisResult | null>(null);

  const [metadata, setMetadata] =
    useState<TestMetadata | null>(null);

  const [location, setLocation] =
    useState<TestLocation | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  const [recordId, setRecordId] =
    useState("");

  const [imageHash, setImageHash] =
    useState("");

  const [signatureData, setSignatureData] =
    useState<SignatureData | null>(null);

  /*
   * Load temporary test data.
   */
  useEffect(() => {
    const capturedImage =
      sessionStorage.getItem(
        "narcolens_captured_image"
      );

    const savedAnalysis =
      sessionStorage.getItem(
        "narcolens_analysis"
      );

    const savedMetadata =
      sessionStorage.getItem(
        "narcolens_test_metadata"
      );

    const savedLocation =
      sessionStorage.getItem(
        "narcolens_test_location"
      );

    if (capturedImage) {
      setImage(capturedImage);
    }

    if (savedAnalysis) {
      try {
        setAnalysis(
          JSON.parse(savedAnalysis)
        );
      } catch (err) {
        console.error(
          "Unable to read analysis:",
          err
        );
      }
    }

    if (savedMetadata) {
      try {
        setMetadata(
          JSON.parse(savedMetadata)
        );
      } catch (err) {
        console.error(
          "Unable to read test metadata:",
          err
        );
      }
    }

    if (savedLocation) {
      try {
        const parsed =
          JSON.parse(savedLocation);

        if (
          typeof parsed.latitude ===
            "number" &&
          typeof parsed.longitude ===
            "number"
        ) {
          setLocation({
            latitude:
              parsed.latitude,
            longitude:
              parsed.longitude,
            timestamp:
              typeof parsed.timestamp ===
              "string"
                ? parsed.timestamp
                : undefined,
          });
        }
      } catch (err) {
        console.error(
          "Unable to read location:",
          err
        );
      }
    }
  }, []);

  const generateRecordId = () => {
    return `NLC-${Date.now()}`;
  };

  /*
   * Calculate SHA-256 for the captured image.
   */
  const calculateSHA256 = async (
    blob: Blob
  ) => {
    const buffer =
      await blob.arrayBuffer();

    const hashBuffer =
      await crypto.subtle.digest(
        "SHA-256",
        buffer
      );

    const hashArray = Array.from(
      new Uint8Array(hashBuffer)
    );

    return hashArray
      .map((byte) =>
        byte
          .toString(16)
          .padStart(2, "0")
      )
      .join("");
  };

  /*
   * Save the complete digital record.
   */
  const saveRecord = async () => {
    if (!image) {
      setError(
        "No captured image was found."
      );
      return;
    }

    if (!analysis) {
      setError(
        "No analysis result was found."
      );
      return;
    }

    if (!metadata) {
      setError(
        "Test metadata was not found. Please restart the test."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      /*
       * Generate unique record ID.
       */
      const newRecordId =
        generateRecordId();

      setRecordId(newRecordId);

      /*
       * Convert the captured image
       * into a Blob.
       */
      const imageResponse =
        await fetch(image);

      const blob =
        await imageResponse.blob();

      /*
       * Calculate image SHA-256.
       */
      const calculatedImageHash =
        await calculateSHA256(blob);

      setImageHash(
        calculatedImageHash
      );

      /*
       * Storage path.
       */
      const filePath =
        `${newRecordId}.jpg`;

      /*
       * Upload image to Supabase Storage.
       */
      const {
        error: uploadError,
      } = await supabase.storage
        .from("test-images")
        .upload(
          filePath,
          blob,
          {
            contentType:
              "image/jpeg",
            upsert: false,
          }
        );

      if (uploadError) {
        throw new Error(
          `Image upload failed: ${uploadError.message}`
        );
      }

      /*
       * Read saved GPS information.
       */
      const savedLocation =
        sessionStorage.getItem(
          "narcolens_test_location"
        );

      let latitude:
        | number
        | null = null;

      let longitude:
        | number
        | null = null;

      let testedAt =
        new Date().toISOString();

      if (savedLocation) {
        try {
          const parsed =
            JSON.parse(
              savedLocation
            );

          latitude =
            typeof parsed.latitude ===
            "number"
              ? parsed.latitude
              : null;

          longitude =
            typeof parsed.longitude ===
            "number"
              ? parsed.longitude
              : null;

          if (
            typeof parsed.timestamp ===
            "string"
          ) {
            testedAt =
              parsed.timestamp;
          }
        } catch (locationError) {
          console.error(
            "Unable to read saved location:",
            locationError
          );
        }
      }

      /*
       * Build the record payload.
       *
       * This is the exact object that will
       * be digitally signed by FastAPI.
       */
      const record = {
        record_id:
          newRecordId,

        case_id:
          metadata.caseId,

        test_kit:
          metadata.testKit,

        reagent:
          metadata.reagent,

        profile_id:
          metadata.profileId,

        profile_version:
          metadata.profileVersion,

        result:
          analysis.result ??
          "Inconclusive",

        confidence:
          typeof analysis.confidence ===
          "number"
            ? analysis.confidence
            : 0,

        operator_id:
          metadata.operatorId,

        latitude,

        longitude,

        tested_at:
          testedAt,

        image_hash:
          calculatedImageHash,

        image_path:
          filePath,
      };

      /*
       * -------------------------------------------------
       * DIGITAL SIGNATURE
       * -------------------------------------------------
       *
       * Send the record to FastAPI.
       *
       * The private Ed25519 key stays on the
       * backend and NEVER reaches the browser.
       */
      const signingResponse =
        await fetch(
          `${API_URL}/sign-record`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              record
            ),
          }
        );

      if (!signingResponse.ok) {
        const errorData =
          await signingResponse
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Unable to digitally sign the record."
        );
      }

      const signingData =
        await signingResponse.json();

      /*
       * Validate signing response.
       */
      if (
        signingData.status !==
          "success" ||
        !signingData.signature ||
        !signingData.record_payload_hash
      ) {
        throw new Error(
          "Digital signing service returned an invalid response."
        );
      }

      const signedData: SignatureData =
        {
          signature:
            signingData.signature,

          signature_algorithm:
            signingData.signature_algorithm,

          signing_key_id:
            signingData.signing_key_id,

          record_payload_hash:
            signingData.record_payload_hash,
        };

      setSignatureData(
        signedData
      );

      /*
       * -------------------------------------------------
       * FINAL DATABASE RECORD
       * -------------------------------------------------
       */
      const signedRecord = {
        ...record,

        signature:
          signedData.signature,

        signature_algorithm:
          signedData.signature_algorithm,

        signing_key_id:
          signedData.signing_key_id,

        record_payload_hash:
          signedData.record_payload_hash,

        /*
         * This is currently a demo status.
         * Cryptographic verification will happen
         * on the Verify Record page.
         */
        verification_status:
          "Created",
      };

      /*
       * Insert signed record into Supabase.
       */
      const {
        error: insertError,
      } = await supabase
        .from("test_records")
        .insert(
          signedRecord
        );

      if (insertError) {
        throw new Error(
          `Record creation failed: ${insertError.message}`
        );
      }

      /*
       * Record successfully saved.
       */
      setSaved(true);

      /*
       * Clear temporary test data.
       */
      sessionStorage.removeItem(
        "narcolens_captured_image"
      );

      sessionStorage.removeItem(
        "narcolens_analysis"
      );

      sessionStorage.removeItem(
        "narcolens_test_location"
      );

      sessionStorage.removeItem(
        "narcolens_test_metadata"
      );
    } catch (err) {
      console.error(
        "Unable to save record:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save digital record."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Automatically save once all
   * required data has loaded.
   */
  useEffect(() => {
    if (
      image &&
      analysis &&
      metadata &&
      !saved &&
      !saving
    ) {
      saveRecord();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    image,
    analysis,
    metadata,
  ]);

  return (
    <AppShell
      title="Digital Record"
      section="Create a tamper-evident digital record of the field test"
    >
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-[#174A7E]">
            STEP 4 OF 4
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-[#0B1F3A]">
            Digital Test Record
          </h1>

          <p className="mt-1 text-sm text-[#667085]">
            The captured image, analysis,
            location and cryptographic
            integrity data are stored
            together as a digital record.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Saving */}
        {saving && (
          <div className="rounded-lg border border-[#D9E1EA] bg-white p-5">
            <div className="flex items-center gap-3">

              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D9E1EA] border-t-[#174A7E]" />

              <div>
                <p className="font-medium text-[#172033]">
                  Creating digital record...
                </p>

                <p className="mt-1 text-sm text-[#667085]">
                  Uploading the image,
                  generating the integrity
                  hash and signing the record.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Successfully saved */}
        {saved && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
                ✓
              </div>

              <div>
                <h2 className="font-semibold text-green-800">
                  Digital Record Created
                </h2>

                <p className="mt-1 text-sm text-green-700">
                  The record has been stored
                  with image integrity data
                  and a digital signature.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Record information */}
        {saved && metadata && (
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Main record */}
            <div className="rounded-xl border border-[#D9E1EA] bg-white lg:col-span-2">

              <div className="border-b border-[#D9E1EA] px-6 py-5">

                <h2 className="text-lg font-semibold text-[#0B1F3A]">
                  Record Details
                </h2>

                <p className="mt-1 text-sm text-[#667085]">
                  Stored metadata for this field test.
                </p>

              </div>

              <div className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Record ID
                  </p>

                  <p className="mt-1 font-semibold text-[#172033]">
                    {recordId}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Case ID
                  </p>

                  <p className="mt-1 font-medium text-[#172033]">
                    {metadata.caseId}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Test Kit
                  </p>

                  <p className="mt-1 font-medium text-[#172033]">
                    {metadata.testKit}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Reagent
                  </p>

                  <p className="mt-1 font-medium text-[#172033]">
                    {metadata.reagent}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Profile
                  </p>

                  <p className="mt-1 font-medium text-[#172033]">
                    {metadata.profileId} v
                    {metadata.profileVersion}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Operator
                  </p>

                  <p className="mt-1 font-medium text-[#172033]">
                    {metadata.operatorId}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Result
                  </p>

                  <p className="mt-1 font-semibold text-[#174A7E]">
                    {analysis?.result ??
                      "Inconclusive"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Confidence
                  </p>

                  <p className="mt-1 font-semibold text-[#172033]">
                    {typeof analysis?.confidence ===
                    "number"
                      ? `${analysis.confidence.toFixed(
                          1
                        )}%`
                      : "—"}
                  </p>
                </div>

              </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-[#D9E1EA] bg-white">

              <div className="border-b border-[#D9E1EA] px-5 py-4">

                <h2 className="font-semibold text-[#0B1F3A]">
                  Test Location
                </h2>

                <p className="mt-1 text-xs text-[#667085]">
                  Device GPS captured during testing.
                </p>

              </div>

              <div className="space-y-4 p-5">

                {location ? (
                  <>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#667085]">
                        Latitude
                      </p>

                      <p className="mt-1 font-medium text-[#172033]">
                        {location.latitude.toFixed(
                          6
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#667085]">
                        Longitude
                      </p>

                      <p className="mt-1 font-medium text-[#172033]">
                        {location.longitude.toFixed(
                          6
                        )}
                      </p>
                    </div>

                    {location.timestamp && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#667085]">
                          GPS Timestamp
                        </p>

                        <p className="mt-1 text-sm text-[#172033]">
                          {new Date(
                            location.timestamp
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg bg-[#EAF2F8] p-3">
                      <p className="text-xs font-medium text-[#174A7E]">
                        ✓ Location captured
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-amber-50 p-4">

                    <p className="text-sm font-medium text-amber-800">
                      Location unavailable
                    </p>

                    <p className="mt-1 text-xs text-amber-700">
                      No GPS coordinates were
                      available for this test.
                    </p>

                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Image + integrity */}
        {saved && (
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Captured image */}
            <div className="rounded-xl border border-[#D9E1EA] bg-white">

              <div className="border-b border-[#D9E1EA] px-6 py-4">
                <h2 className="font-semibold text-[#0B1F3A]">
                  Captured Test Image
                </h2>
              </div>

              <div className="p-6">

                {image ? (
                  <img
                    src={image}
                    alt="Captured field test"
                    className="max-h-[420px] w-full rounded-lg border border-[#D9E1EA] object-contain"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-lg bg-[#F7F9FC] text-sm text-[#667085]">
                    Image unavailable
                  </div>
                )}

              </div>
            </div>

            {/* Integrity */}
            <div className="rounded-xl border border-[#D9E1EA] bg-white">

              <div className="border-b border-[#D9E1EA] px-6 py-4">
                <h2 className="font-semibold text-[#0B1F3A]">
                  Cryptographic Integrity
                </h2>
              </div>

              <div className="space-y-5 p-6">

                {/* Image hash */}
                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Image SHA-256
                  </p>

                  <p className="mt-2 break-all rounded-lg bg-[#F7F9FC] p-3 font-mono text-xs leading-5 text-[#172033]">
                    {imageHash ||
                      "Hash unavailable"}
                  </p>

                </div>

                {/* Digital signature */}
                {signatureData && (
                  <>
                    <div>

                      <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                        Digital Signature
                      </p>

                      <div className="mt-2 rounded-lg bg-[#F7F9FC] p-3">

                        <p className="break-all font-mono text-xs leading-5 text-[#172033]">
                          {signatureData.signature}
                        </p>

                      </div>

                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">

                      <div>
                        <p className="text-xs text-[#667085]">
                          Algorithm
                        </p>

                        <p className="mt-1 text-sm font-medium text-[#172033]">
                          {signatureData.signature_algorithm}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#667085]">
                          Signing Key
                        </p>

                        <p className="mt-1 text-sm font-medium text-[#172033]">
                          {signatureData.signing_key_id}
                        </p>
                      </div>

                    </div>

                    <div>

                      <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                        Record Payload Hash
                      </p>

                      <p className="mt-2 break-all rounded-lg bg-[#F7F9FC] p-3 font-mono text-xs leading-5 text-[#172033]">
                        {signatureData.record_payload_hash}
                      </p>

                    </div>

                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">

                      <p className="text-sm font-semibold text-green-800">
                        ✓ Digital signature created
                      </p>

                      <p className="mt-1 text-xs leading-5 text-green-700">
                        This record was signed by the
                        NarcoLens backend using Ed25519.
                        The private signing key remains
                        on the server.
                      </p>

                    </div>
                  </>
                )}

                <div className="rounded-lg border border-[#D9E1EA] bg-[#F7F9FC] p-4">

                  <p className="text-sm font-medium text-[#172033]">
                    Tamper detection
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#667085]">
                    The image SHA-256 hash checks
                    whether the stored image changed.
                    The Ed25519 signature provides
                    cryptographic integrity for the
                    record payload.
                  </p>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {saved && (
          <div className="flex flex-col gap-3 border-t border-[#D9E1EA] pt-6 sm:flex-row">

            <button
              onClick={() =>
                router.push(
                  `/verify?record=${recordId}`
                )
              }
              className="rounded-lg bg-[#174A7E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123B64]"
            >
              Verify Record
            </button>

            <button
              onClick={() =>
                router.push(
                  "/test-records"
                )
              }
              className="rounded-lg border border-[#D9E1EA] bg-white px-5 py-3 text-sm font-semibold text-[#172033] transition hover:bg-[#F7F9FC]"
            >
              View Test Records
            </button>

            <button
              onClick={() =>
                router.push("/test")
              }
              className="rounded-lg border border-[#D9E1EA] bg-white px-5 py-3 text-sm font-semibold text-[#172033] transition hover:bg-[#F7F9FC]"
            >
              Start New Test
            </button>

            <button
              onClick={() =>
                router.push("/")
              }
              className="rounded-lg border border-[#D9E1EA] bg-white px-5 py-3 text-sm font-semibold text-[#172033] transition hover:bg-[#F7F9FC]"
            >
              Back to Dashboard
            </button>

          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-lg border border-[#D9E1EA] bg-white p-4">

          <p className="text-xs leading-5 text-[#667085]">

            <span className="font-semibold text-[#172033]">
              Prototype notice:
            </span>{" "}

            NarcoLens provides presumptive digital
            analysis for demonstration purposes.
            Results do not replace confirmatory
            laboratory testing.

          </p>

        </div>

      </div>
    </AppShell>
  );
}