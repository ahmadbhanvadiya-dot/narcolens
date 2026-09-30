"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RecordPage() {
  const [recordId, setRecordId] = useState("");
  const [capturedImage, setCapturedImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [imageHash, setImageHash] = useState("");

  useEffect(() => {
    setRecordId(`NLC-${Date.now()}`);

    const image = sessionStorage.getItem("narcolens_captured_image");

    if (image) {
      setCapturedImage(image);
    }
  }, []);

  async function generateSHA256(data: ArrayBuffer) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async function saveRecord() {
    if (!recordId) {
      setSaveError("Record ID is still being generated.");
      return;
    }

    if (!capturedImage) {
      setSaveError("No captured image was found.");
      return;
    }

    try {
      setSaving(true);
      setSaveError("");

      // Convert captured base64 image into a Blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Generate SHA-256 hash
      const arrayBuffer = await blob.arrayBuffer();
      const hash = await generateSHA256(arrayBuffer);

      setImageHash(hash);

      // Upload image to Supabase Storage
      const filePath = `${recordId}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("test-images")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `Image upload failed: ${uploadError.message}`
        );
      }

      // Save record to Supabase database
      const record = {
        record_id: recordId,
        case_id: "CASE-2026-001",
        test_kit: "Demo Colorimetric Kit",
        result: "Inconclusive",
        confidence: 92,
        operator_id: "OP-1042",
        latitude: 17.385,
        longitude: 78.4867,
        image_hash: hash,
        image_path: filePath,
        verification_status: "Verified",
      };

      const { error: recordError } = await supabase
        .from("test_records")
        .insert([record]);

      if (recordError) {
        throw new Error(
          `Record save failed: ${recordError.message}`
        );
      }

      setSaved(true);

      sessionStorage.removeItem("narcolens_captured_image");
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
        <h1 className="text-3xl font-semibold text-[#0B1F3A]">
          Digital Test Record
        </h1>

        <p className="mt-2 text-[#667085]">
          Review and securely save the test record.
        </p>

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

              <p className="mt-1 font-medium text-[#172033]">
                Inconclusive
              </p>
            </div>

            <div>
              <p className="text-sm text-[#667085]">
                Confidence
              </p>

              <p className="mt-1 font-medium text-[#172033]">
                92%
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
                alt="Captured test"
                className="mt-3 max-h-80 w-full rounded-lg border border-[#D9E1EA] object-contain"
              />

            </div>
          )}

          {/* Image Hash */}
          <div className="mt-8 border-t border-[#D9E1EA] pt-6">

            <p className="text-sm text-[#667085]">
              Image SHA-256
            </p>

            <p className="mt-1 break-all font-mono text-sm text-[#172033]">
              {imageHash || "Generated during save"}
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
            <p className="mt-4 text-sm text-green-700">
              Record successfully saved to Supabase.
            </p>
          )}

        </div>
      </div>
    </main>
  );
}