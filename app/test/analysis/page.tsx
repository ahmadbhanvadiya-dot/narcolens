"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TestMetadata = {
  caseId: string;
  testKit: string;
  reagent: string;
  profileId: string;
  profileVersion: string;
  operatorId: string;
  startedAt: string;
};

type AnalysisData = {
  result: string;
  confidence: number;
  quality: string;
  brightness: number;
  contrast: number;
  sharpness: number;

  rgb: {
    r: number;
    g: number;
    b: number;
  };

  hsv: {
    h: number;
    s: number;
    v: number;
  };

  lab: {
    l: number;
    a: number;
    b: number;
  };

  reference_lab?: {
    l: number;
    a: number;
    b: number;
  };

  delta_e: number;

  calibration?: {
    enabled: boolean;
  };

  prototype_notice?: string;
};

type AnalysisResponse = {
  status: string;

  image: {
    width: number;
    height: number;
  };

  analysis: AnalysisData;
};

export default function AnalysisPage() {
  const [image, setImage] =
    useState("");

  const [metadata, setMetadata] =
    useState<TestMetadata | null>(null);

  const [analysis, setAnalysis] =
    useState<AnalysisResponse | null>(null);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const capturedImage =
      sessionStorage.getItem(
        "narcolens_captured_image"
      );

    const savedMetadata =
      sessionStorage.getItem(
        "narcolens_test_metadata"
      );

    if (!capturedImage) {
      setError(
        "No captured image was found."
      );
    } else {
      setImage(capturedImage);
    }

    if (!savedMetadata) {
      setError(
        "Test profile information was not found. Please restart the test."
      );
      return;
    }

    try {
      const parsed =
        JSON.parse(savedMetadata);

      setMetadata(parsed);
    } catch (error) {
      console.error(
        "Unable to read test metadata:",
        error
      );

      setError(
        "Unable to read the selected test profile."
      );
    }
  }, []);

  async function runAnalysis() {
    if (!image) {
      setError(
        "No captured image is available."
      );
      return;
    }

    if (!metadata) {
      setError(
        "No test profile is available."
      );
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setAnalysis(null);

      /*
       * Convert captured image into Blob
       */
      const response =
        await fetch(image);

      const blob =
        await response.blob();

      /*
       * Create multipart request
       */
      const formData =
        new FormData();

      formData.append(
        "file",
        blob,
        "narcolens-capture.jpg"
      );

      /*
       * Send selected analysis profile
       * alongside the image.
       */
      formData.append(
        "profile_id",
        metadata.profileId
      );

      formData.append(
        "profile_version",
        metadata.profileVersion
      );

      /*
       * Also send the reagent name.
       * This makes the request easier to
       * inspect/debug on the backend.
       */
      formData.append(
        "reagent",
        metadata.reagent
      );

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://127.0.0.1:8000";

      const apiResponse =
        await fetch(
          `${apiUrl}/analyze`,
          {
            method: "POST",
            body: formData,
          }
        );

      if (!apiResponse.ok) {
        let message =
          "Image analysis failed.";

        try {
          const errorData =
            await apiResponse.json();

          message =
            errorData.detail ||
            message;
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      const data: AnalysisResponse =
        await apiResponse.json();

      /*
       * Store only the analysis object.
       */
      sessionStorage.setItem(
        "narcolens_analysis",
        JSON.stringify(
          data.analysis
        )
      );

      setAnalysis(data);

    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the analysis server."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-[#174A7E]">
            STEP 03 / 04
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#0B1F3A]">
            Image Analysis
          </h1>

          <p className="mt-2 text-[#667085]">
            Analyze the captured field-test image
            using the selected test profile.
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

          <div className="font-semibold text-[#174A7E]">
            03 Analysis
          </div>

          <span>→</span>

          <div className="text-[#98A2B3]">
            04 Record
          </div>

        </div>

        {/* Current Test */}
        {metadata && (
          <div className="mt-6 border border-[#D9E1EA] bg-white">

            <div className="border-b border-[#D9E1EA] px-5 py-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                Current Test
              </p>

            </div>

            <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">

              <InfoItem
                label="Case ID"
                value={metadata.caseId}
              />

              <InfoItem
                label="Reagent"
                value={metadata.reagent}
              />

              <InfoItem
                label="Profile"
                value={metadata.profileId}
              />

              <InfoItem
                label="Version"
                value={metadata.profileVersion}
              />

            </div>

          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-5 py-4">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* Main */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">

          {/* Image */}
          <section className="border border-[#D9E1EA] bg-white p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-[#0B1F3A]">
                  Captured Image
                </h2>

                <p className="mt-1 text-sm text-[#667085]">
                  Image submitted to the analysis engine.
                </p>
              </div>

              <span className="rounded-md bg-[#EAF2F8] px-3 py-1 text-xs font-medium text-[#174A7E]">
                {metadata?.profileId ||
                  "PROFILE"}
              </span>

            </div>

            <div className="mt-6 flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg border border-[#D9E1EA] bg-[#F7F9FC]">

              {image ? (
                <img
                  src={image}
                  alt="Captured field test"
                  className="max-h-[560px] w-full object-contain"
                />
              ) : (
                <p className="text-sm text-[#667085]">
                  No captured image available.
                </p>
              )}

            </div>

            {image && (
              <button
                type="button"
                onClick={runAnalysis}
                disabled={
                  analyzing ||
                  !metadata
                }
                className="mt-5 w-full rounded-lg bg-[#174A7E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0B1F3A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzing
                  ? "Analyzing..."
                  : analysis
                    ? "Run Analysis Again"
                    : "Run Analysis"}
              </button>
            )}

          </section>

          {/* Results */}
          <section className="border border-[#D9E1EA] bg-white p-6">

            <h2 className="font-semibold text-[#0B1F3A]">
              Analysis Results
            </h2>

            <p className="mt-1 text-sm text-[#667085]">
              Results returned by the NarcoLens
              analysis engine.
            </p>

            {/* Waiting */}
            {!analysis &&
              !analyzing && (
                <div className="mt-8 border border-[#D9E1EA] bg-[#F7F9FC] p-5">

                  <p className="text-sm text-[#667085]">
                    The image is ready for analysis.
                  </p>

                  <p className="mt-2 text-xs text-[#98A2B3]">
                    The selected{" "}
                    <strong>
                      {metadata?.reagent ||
                        "test profile"}
                    </strong>{" "}
                    will be sent to the analysis
                    engine.
                  </p>

                </div>
              )}

            {/* Loading */}
            {analyzing && (
              <div className="mt-8 border border-[#D9E1EA] bg-[#F7F9FC] p-5">

                <p className="font-medium text-[#174A7E]">
                  Running profile-aware analysis...
                </p>

                <p className="mt-2 text-sm text-[#667085]">
                  Processing the image against the
                  selected test profile.
                </p>

              </div>
            )}

            {/* Results */}
            {analysis && (
              <div className="mt-6 space-y-4">

                {/* Result */}
                <div className="border border-[#D9E1EA] p-5">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    Preliminary Result
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-[#174A7E]">
                    {
                      analysis.analysis
                        .result
                    }
                  </p>

                  <div className="mt-4 flex items-center justify-between">

                    <span className="text-sm text-[#667085]">
                      Confidence
                    </span>

                    <span className="font-semibold text-[#172033]">
                      {analysis.analysis.confidence.toFixed(
                        2
                      )}
                      %
                    </span>

                  </div>

                </div>

                {/* Quality */}
                <div className="border border-[#D9E1EA] p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    Image Quality
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3">

                    <Metric
                      label="Quality"
                      value={
                        analysis.analysis
                          .quality
                      }
                    />

                    <Metric
                      label="Brightness"
                      value={String(
                        analysis.analysis
                          .brightness
                      )}
                    />

                    <Metric
                      label="Contrast"
                      value={String(
                        analysis.analysis
                          .contrast
                      )}
                    />

                  </div>

                  <div className="mt-3">

                    <Metric
                      label="Sharpness"
                      value={String(
                        analysis.analysis
                          .sharpness
                      )}
                    />

                  </div>

                </div>

                {/* RGB */}
                <div className="border border-[#D9E1EA] p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    RGB
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3">

                    <Metric
                      label="R"
                      value={String(
                        analysis.analysis
                          .rgb.r
                      )}
                    />

                    <Metric
                      label="G"
                      value={String(
                        analysis.analysis
                          .rgb.g
                      )}
                    />

                    <Metric
                      label="B"
                      value={String(
                        analysis.analysis
                          .rgb.b
                      )}
                    />

                  </div>

                </div>

                {/* HSV */}
                <div className="border border-[#D9E1EA] p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    HSV
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3">

                    <Metric
                      label="Hue"
                      value={`${analysis.analysis.hsv.h}°`}
                    />

                    <Metric
                      label="Saturation"
                      value={String(
                        analysis.analysis
                          .hsv.s
                      )}
                    />

                    <Metric
                      label="Value"
                      value={String(
                        analysis.analysis
                          .hsv.v
                      )}
                    />

                  </div>

                </div>

                {/* CIELAB */}
                <div className="border border-[#D9E1EA] p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    CIELAB
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3">

                    <Metric
                      label="L*"
                      value={String(
                        analysis.analysis
                          .lab.l
                      )}
                    />

                    <Metric
                      label="a*"
                      value={String(
                        analysis.analysis
                          .lab.a
                      )}
                    />

                    <Metric
                      label="b*"
                      value={String(
                        analysis.analysis
                          .lab.b
                      )}
                    />

                  </div>

                </div>

                {/* Calibration */}
                <div className="border border-[#D9E1EA] p-4">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                        Reference Calibration
                      </p>

                      <p className="mt-1 text-xs text-[#667085]">
                        Calibration state returned by
                        the analysis engine.
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        analysis.analysis
                          .calibration
                          ?.enabled
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {analysis.analysis
                        .calibration
                        ?.enabled
                        ? "Active"
                        : "Unavailable"}
                    </span>

                  </div>

                  {analysis.analysis
                    .reference_lab && (
                    <div className="mt-4 grid grid-cols-3 gap-3">

                      <Metric
                        label="Reference L*"
                        value={String(
                          analysis.analysis
                            .reference_lab
                            .l
                        )}
                      />

                      <Metric
                        label="Reference a*"
                        value={String(
                          analysis.analysis
                            .reference_lab
                            .a
                        )}
                      />

                      <Metric
                        label="Reference b*"
                        value={String(
                          analysis.analysis
                            .reference_lab
                            .b
                        )}
                      />

                    </div>
                  )}

                </div>

                {/* Delta E */}
                <div className="border border-[#D9E1EA] p-4">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                        Colour Difference
                      </p>

                      <p className="mt-1 text-xs text-[#667085]">
                        CIE76 ΔE
                      </p>
                    </div>

                    <p className="text-2xl font-semibold text-[#174A7E]">
                      {analysis.analysis.delta_e.toFixed(
                        2
                      )}
                    </p>

                  </div>

                </div>

                {/* Notice */}
                {analysis.analysis
                  .prototype_notice && (
                  <div className="border border-amber-200 bg-amber-50 p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                      Prototype Notice
                    </p>

                    <p className="mt-2 text-xs leading-5 text-amber-700">
                      {
                        analysis.analysis
                          .prototype_notice
                      }
                    </p>

                  </div>
                )}

                {/* Continue */}
                <Link
                  href="/test/record"
                  className="block rounded-lg bg-[#174A7E] px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-[#0B1F3A]"
                >
                  Continue to Digital Record
                </Link>

              </div>
            )}

          </section>

        </div>

        {/* Disclaimer */}
        <div className="mt-6 border border-[#D9E1EA] bg-white p-4">

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

/*
 * ------------------------------------------------------
 * UI helpers
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
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-medium text-[#172033]">
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-[#667085]">
        {label}
      </p>

      <p className="mt-1 font-semibold text-[#172033]">
        {value}
      </p>
    </div>
  );
}