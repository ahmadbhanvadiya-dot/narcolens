"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { supabase } from "@/lib/supabase";

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

export default function DigitalRecordPage() {
  const router = useRouter();

  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] =
    useState<AnalysisResult | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [recordId, setRecordId] = useState("");

  const [location, setLocation] =
    useState<TestLocation | null>(null);

  useEffect(() => {
    const capturedImage = sessionStorage.getItem(
      "narcolens_captured_image"
    );

    const savedAnalysis = sessionStorage.getItem(
      "narcolens_analysis"
    );

    const savedLocation = sessionStorage.getItem(
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

    if (savedLocation) {
      try {
        const parsed =
          JSON.parse(savedLocation);

        if (
          typeof parsed.latitude === "number" &&
          typeof parsed.longitude === "number"
        ) {
          setLocation({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
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
        byte.toString(16).padStart(2, "0")
      )
      .join("");
  };

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

    setSaving(true);
    setError("");

    try {
      /*
       * Generate unique record ID
       */
      const newRecordId =
        generateRecordId();

      setRecordId(newRecordId);

      /*
       * Convert base64/data URL image
       * into a Blob
       */
      const response =
        await fetch(image);

      const blob =
        await response.blob();

      /*
       * Generate SHA-256 image hash
       */
      const imageHash =
        await calculateSHA256(blob);

      /*
       * Image storage path
       */
      const filePath =
        `${newRecordId}.jpg`;

      /*
       * Upload image to Supabase Storage
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
       * Read GPS location captured
       * on the Capture page.
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
       * Prepare database record
       */
      const record = {
        record_id:
          newRecordId,

        case_id:
          "CASE-2026-001",

        test_kit:
          "Demo Colorimetric Kit",

        result:
          analysis.result ??
          "Inconclusive",

        confidence:
          typeof analysis.confidence ===
          "number"
            ? analysis.confidence
            : 0,

        operator_id:
          "OP-1042",

        latitude:
          latitude,

        longitude:
          longitude,

        tested_at:
          testedAt,

        image_hash:
          imageHash,

        image_path:
          filePath,

        verification_status:
          "Verified",
      };

      /*
       * Insert record into Supabase
       */
      const {
        error: insertError,
      } = await supabase
        .from("test_records")
        .insert(record);

      if (insertError) {
        throw new Error(
          `Record creation failed: ${insertError.message}`
        );
      }

      /*
       * Record successfully saved
       */
      setSaved(true);

      /*
       * Clear temporary test data.
       * The permanent record is now in Supabase.
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
   * Automatically save the record
   * once the page has loaded all required data.
   */
  useEffect(() => {
    if (
      image &&
      analysis &&
      !saved &&
      !saving
    ) {
      saveRecord();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, analysis]);

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
            The captured image, analysis result,
            location and integrity hash are stored
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
                  Uploading the captured image
                  and storing the test metadata.
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
                  The test record has been
                  successfully stored.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Record information */}
        {saved && (
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Main record */}
            <div className="lg:col-span-2 rounded-xl border border-[#D9E1EA] bg-white">

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
                    CASE-2026-001
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Test Kit
                  </p>

                  <p className="mt-1 font-medium text-[#172033]">
                    Demo Colorimetric Kit
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Operator
                  </p>

                  <p className="mt-1 font-medium text-[#172033]">
                    OP-1042
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
                  Integrity Information
                </h2>
              </div>

              <div className="space-y-5 p-6">

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Image Hash
                  </p>

                  <p className="mt-2 break-all rounded-lg bg-[#F7F9FC] p-3 font-mono text-xs text-[#172033]">
                    SHA-256 generated during
                    record creation
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">
                    Verification Status
                  </p>

                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Verified
                  </div>
                </div>

                <div className="rounded-lg border border-[#D9E1EA] bg-[#F7F9FC] p-4">
                  <p className="text-sm font-medium text-[#172033]">
                    Tamper detection
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#667085]">
                    The SHA-256 hash of the captured
                    image is stored with the record.
                    The Verify Record page can
                    recalculate the hash and compare
                    it with the stored value.
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