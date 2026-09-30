"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SavedAnalysis = {
  result: string;
  confidence: number;
  quality?: string;
  brightness?: number;
  contrast?: number;
  sharpness?: number;
  delta_e?: number;
};

export default function RecordPage() {
  const [recordId, setRecordId] = useState("");
  const [capturedImage, setCapturedImage] = useState("");

  const [analysisResult, setAnalysisResult] = useState("");
  const [confidence, setConfidence] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [imageHash, setImageHash] = useState("");

  useEffect(() => {
    setRecordId(`NLC-${Date.now()}`);

    const image = sessionStorage.getItem(
      "narcolens_captured_image"
    );

    if (image) {
      setCapturedImage(image);
    }

    const savedAnalysis = sessionStorage.getItem(
      "narcolens_analysis"
    );

    if (savedAnalysis) {
      try {
        const parsed: SavedAnalysis = JSON.parse(
          savedAnalysis
        );

        setAnalysisResult(parsed.result || "");

        setConfidence(
          Math.round(
            (parsed.confidence || 0) * 100
          )
        );
      } catch (error) {
        console.error(
          "Unable to read saved analysis:",
          error
        );
      }
    }
  }, []);

  async function generateSHA256(data: ArrayBuffer) {
    const hashBuffer = await crypto.subtle.digest(
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

  async function saveRecord() {
    if (!recordId) {
      setSaveError(
        "Record ID is still being generated."
      );
      return;
    }

    if (!capturedImage) {
      setSaveError(
        "No captured image was found."
      );
      return;
    }

    if (!analysisResult) {
      setSaveError(
        "No analysis result was found. Please run the image analysis first."
      );
      return;
    }

    try {
      setSaving(true);
      setSaveError("");

      // Convert captured image to Blob
      const response = await fetch(
        capturedImage
      );

      const blob = await response.blob();

      // Generate SHA-256 hash
      const arrayBuffer =
        await blob.arrayBuffer();

      const hash =
        await generateSHA256(arrayBuffer);

      setImageHash(hash);

      // Storage path
      const filePath = `${recordId}.jpg`;

      // Upload image to Supabase Storage
      const { error: uploadError } =
        await supabase.storage
          .from("test-images")
          .upload(
            filePath,
            blob,
            {
              contentType: "image/jpeg",
              upsert: false,
            }
          );

      if (uploadError) {
        throw new Error(
          `Image upload failed: ${uploadError.message}`
        );
      }

      // Create database record
      const record = {
        record_id: recordId,

        case_id: "CASE-2026-001",

        test_kit:
          "Demo Colorimetric Kit",

        result: analysisResult,

        confidence: confidence,

        operator_id: "OP-1042",

        latitude: 17.385,

        longitude: 78.4867,

        image_hash: hash,

        image_path: filePath,

        verification_status:
          "Verified",
      };

      const { error: recordError } =
        await supabase
          .from("test_records")
          .insert([record]);

      if (recordError) {
        throw new Error(
          `Record save failed: ${recordError.message}`
        );
      }

      setSaved(true);

      // Clear temporary session data
      sessionStorage.removeItem(
        "narcolens_captured_image"
      );

      sessionStorage.removeItem(
        "narcolens_analysis"
      );
    } catch (error) {
      console.error(error);

      setSaveError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the record."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] p-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-[#174A7E]">
            STEP 04 / 04
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#0B1F3A]">
            Digital Test Record
          </h1>

          <p className="mt-2 text-[#667085]">
            Review and securely save the test record.
          </p>
        </div>

        {/* Workflow */}
        <div className="mt-8 flex items-center gap-3 text-sm">
          <div className="text-[#667085]">
            01 Test Details
          </div>

          <span>→</span>

          <div className="text-[#667085]">
            02 Capture
          </div>

          <span>→</span>

          <div className="text-[#667085]">
            03 Analysis
          </div>

          <span>→</span>

          <div className="font-semibold text-[#174A7E]">
            04 Record
          </div>
        </div>

        {/* Record */}
        <div className="mt-8 rounded-xl border border-[#D9E1EA] bg-white p-6">

          {/* Record Information */}
          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <p className="text-sm text-[#667085]">
                Record ID
              </p>

              <p className="mt-1 font-medium text-[#172033]">
                {recordId || "Generating..."}
              </p>
            </div>

            <div>
              <p className="text-sm text-[#667085]">
                Case ID
              </p>

              <p className="mt-1 font-medium text-[#172033]">
                CASE-2026-001
              </p>
            </div>

            <div>
              <p className="text-sm text-[#667085]">
                Test Kit
              </p>

              <p className="mt-1 font-medium text-[#172033]">
                Demo Colorimetric Kit
              </p>
            </div>

            <div>
              <p className="text-sm text-[#667085]">
                Result
              </p>

              <p className="mt-1 font-medium text-[#174A7E]">
                {analysisResult ||
                  "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-[#667085]">
                Confidence
              </p>

              <p className="mt-1 font-medium text-[#172033]">
                {confidence}%
              </p>
            </div>

            <div>
              <p className="text-sm text-[#667085]">
                Operator
              </p>

              <p className="mt-1 font-medium text-[#172033]">
                OP-1042
              </p>
            </div>
          </div>

          {/* Captured Image */}
          {capturedImage && (
            <div className="mt-8 border-t border-[#D9E1EA] pt-6">

              <p className="text-sm text-[#667085]">
                Captured Test Image
              </p>

              <img
                src={capturedImage}
                alt="Captured field test"
                className="mt-3 max-h-80 w-full rounded-lg border border-[#D9E1EA] object-contain"
              />

            </div>
          )}

          {/* Hash */}
          <div className="mt-8 border-t border-[#D9E1EA] pt-6">

            <p className="text-sm text-[#667085]">
              Image SHA-256
            </p>

            <p className="mt-1 break-all font-mono text-sm text-[#172033]">
              {imageHash ||
                "Generated during save"}
            </p>

          </div>

          {/* Save Button */}
          <button
            onClick={saveRecord}
            disabled={saving || saved}
            className="mt-8 rounded-lg bg-[#174A7E] px-5 py-3 font-medium text-white transition hover:bg-[#0B1F3A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : saved
                ? "Record Saved ✓"
                : "Save Record"}
          </button>

          {/* Error */}
          {saveError && (
            <p className="mt-4 text-sm text-red-600">
              {saveError}
            </p>
          )}

          {/* Success */}
          {saved && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                Record successfully saved.
              </p>

              <p className="mt-1 text-sm text-green-700">
                The image and digital record have been
                stored in Supabase.
              </p>
            </div>
          )}

        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-lg border border-[#D9E1EA] bg-white p-4">

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
    </main>
  );
}