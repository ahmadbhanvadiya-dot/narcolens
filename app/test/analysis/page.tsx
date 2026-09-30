"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AnalysisResponse = {
  status: string;
  image: {
    width: number;
    height: number;
  };
  analysis: {
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
    reference_lab: {
      l: number;
      a: number;
      b: number;
    };
    delta_e: number;
  };
};

export default function AnalysisPage() {
  const [image, setImage] = useState("");
  const [analysis, setAnalysis] =
    useState<AnalysisResponse | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const capturedImage = sessionStorage.getItem(
      "narcolens_captured_image"
    );

    if (capturedImage) {
      setImage(capturedImage);
    } else {
      setError("No captured image was found.");
    }
  }, []);

  async function runAnalysis() {
    if (!image) {
      setError("No captured image available.");
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setAnalysis(null);

      // Convert base64 image into a Blob
      const response = await fetch(image);
      const blob = await response.blob();

      // Create multipart form data
      const formData = new FormData();

      formData.append(
        "file",
        blob,
        "narcolens-capture.jpg"
      );

      // Send image to FastAPI
      const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const apiResponse = await fetch(
  `${apiUrl}/analyze`,
  {
    method: "POST",
    body: formData,
  }
);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();

        throw new Error(
          errorData.detail || "Analysis failed."
        );
      }

      const data: AnalysisResponse =
        await apiResponse.json();

      setAnalysis(data);
    } catch (error) {
      console.error(error);

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
            Analyze the captured field-test image using
            the NarcoLens computer-vision engine.
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

        {/* Main */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">

          {/* Image */}
          <section className="rounded-xl border border-[#D9E1EA] bg-white p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-[#0B1F3A]">
                  Captured Image
                </h2>

                <p className="mt-1 text-sm text-[#667085]">
                  Image submitted to the CV analysis engine.
                </p>
              </div>

              <span className="rounded-md bg-[#EAF2F8] px-3 py-1 text-xs font-medium text-[#174A7E]">
                OPENCV
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
                onClick={runAnalysis}
                disabled={analyzing}
                className="mt-5 w-full rounded-lg bg-[#174A7E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0B1F3A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzing
                  ? "Analyzing with OpenCV..."
                  : analysis
                    ? "Run Analysis Again"
                    : "Run Analysis"}
              </button>
            )}

          </section>

          {/* Analysis */}
          <section className="rounded-xl border border-[#D9E1EA] bg-white p-6">

            <h2 className="font-semibold text-[#0B1F3A]">
              Analysis Results
            </h2>

            <p className="mt-1 text-sm text-[#667085]">
              Results returned by the NarcoLens FastAPI
              analysis engine.
            </p>

            {!analysis && !analyzing && (
              <div className="mt-8 rounded-lg border border-[#D9E1EA] bg-[#F7F9FC] p-5">

                <p className="text-sm text-[#667085]">
                  The image is ready for analysis.
                </p>

                <p className="mt-2 text-xs text-[#98A2B3]">
                  Click "Run Analysis" to send the image
                  to the OpenCV backend.
                </p>

              </div>
            )}

            {analyzing && (
              <div className="mt-8 rounded-lg border border-[#D9E1EA] bg-[#F7F9FC] p-5">

                <p className="font-medium text-[#174A7E]">
                  Analyzing image...
                </p>

                <p className="mt-2 text-sm text-[#667085]">
                  OpenCV is extracting image and color
                  characteristics.
                </p>

              </div>
            )}

            {analysis && (
              <div className="mt-6 space-y-4">

                {/* Result */}
                <div className="rounded-lg border border-[#D9E1EA] p-5">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    Preliminary Result
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-[#174A7E]">
                    {analysis.analysis.result}
                  </p>

                  <div className="mt-4 flex items-center justify-between">

                    <span className="text-sm text-[#667085]">
                      Confidence
                    </span>

                    <span className="font-semibold text-[#172033]">
                      {Math.round(
                        analysis.analysis.confidence * 100
                      )}
                      %
                    </span>

                  </div>

                </div>

                {/* Image Quality */}
                <div className="rounded-lg border border-[#D9E1EA] p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    Image Quality
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3">

                    <div>
                      <p className="text-xs text-[#667085]">
                        Quality
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.quality}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#667085]">
                        Brightness
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.brightness}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#667085]">
                        Sharpness
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.sharpness}
                      </p>
                    </div>

                  </div>

                </div>

                {/* RGB */}
                <div className="rounded-lg border border-[#D9E1EA] p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    RGB
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3">

                    <div>
                      <p className="text-xs text-[#667085]">
                        R
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.rgb.r}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#667085]">
                        G
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.rgb.g}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#667085]">
                        B
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.rgb.b}
                      </p>
                    </div>

                  </div>

                </div>

                {/* HSV */}
                <div className="rounded-lg border border-[#D9E1EA] p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    HSV
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3">

                    <div>
                      <p className="text-xs text-[#667085]">
                        Hue
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.hsv.h}°
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#667085]">
                        Saturation
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.hsv.s}%
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#667085]">
                        Value
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.hsv.v}%
                      </p>
                    </div>

                  </div>

                </div>

                {/* CIELAB */}
                <div className="rounded-lg border border-[#D9E1EA] p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                    CIELAB
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3">

                    <div>
                      <p className="text-xs text-[#667085]">
                        L*
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.lab.l}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#667085]">
                        a*
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.lab.a}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#667085]">
                        b*
                      </p>

                      <p className="font-semibold text-[#172033]">
                        {analysis.analysis.lab.b}
                      </p>
                    </div>

                  </div>

                </div>

                {/* Delta E */}
                <div className="rounded-lg border border-[#D9E1EA] p-4">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                        Colour Difference
                      </p>

                      <p className="mt-1 text-sm text-[#667085]">
                        CIE76 ΔE
                      </p>
                    </div>

                    <p className="text-2xl font-semibold text-[#174A7E]">
                      {analysis.analysis.delta_e}
                    </p>

                  </div>

                </div>

                {/* Continue */}
                <Link
                  href="/test/record"
                  className="block rounded-lg bg-[#174A7E] px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-[#0B1F3A]"
                >
                  Continue to Digital Record
                </Link>

              </div>
            )}

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

          </section>

        </div>

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