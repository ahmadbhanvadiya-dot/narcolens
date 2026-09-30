"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Upload,
} from "lucide-react";

export default function CapturePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      setError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access is not supported by this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        setCameraReady(true);
      }
    } catch (err) {
      console.error(err);

      setCameraReady(false);
      setError(
        "Unable to access the camera. You can still upload an image from your files."
      );
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function captureImage() {
    if (!videoRef.current) {
      setError("Camera is not available.");
      return;
    }

    const video = videoRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      setError("Camera image is not ready yet. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture the image.");
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const image = canvas.toDataURL("image/jpeg", 0.92);

    sessionStorage.setItem(
      "narcolens_captured_image",
      image
    );

    setCapturedImage(image);
    setError("");

    stopCamera();
    setCameraReady(false);
  }

  function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        sessionStorage.setItem(
          "narcolens_captured_image",
          result
        );

        setCapturedImage(result);

        stopCamera();
        setCameraReady(false);
      }
    };

    reader.onerror = () => {
      setError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);

    // Allows selecting the same file again later.
    event.target.value = "";
  }

  function retakeImage() {
    sessionStorage.removeItem("narcolens_captured_image");

    setCapturedImage("");
    setError("");

    startCamera();
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <header className="border-b border-[#D9E1EA] bg-white">
        <div className="flex h-[78px]">
          {/* Logo */}
          <div className="flex w-[263px] items-center border-r border-[#D9E1EA] px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0B1F3A]">
                <ShieldCheck
                  size={20}
                  className="text-white"
                />
              </div>

              <div>
                <div className="text-[19px] font-semibold leading-none text-[#0B1F3A]">
                  NarcoLens
                </div>

                <div className="mt-1 text-[10px] font-medium tracking-[0.12em] text-[#667085]">
                  FIELD INTELLIGENCE
                </div>
              </div>
            </div>
          </div>

          {/* Page title */}
          <div className="flex flex-1 items-center px-8">
            <div>
              <p className="text-[11px] font-medium text-[#667085]">
                Test Workflow
              </p>

              <h1 className="mt-0.5 text-[15px] font-semibold text-[#0B1F3A]">
                Capture Test Result
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-78px)]">
        {/* Sidebar */}
        <aside className="hidden w-[263px] border-r border-[#D9E1EA] bg-white md:block">
          <div className="px-5 pt-6">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-[#98A2B3]">
              TEST WORKFLOW
            </p>

            <div className="flex items-center gap-3 rounded-md bg-[#EAF2F8] px-3 py-3 text-sm font-medium text-[#0B1F3A]">
              <Camera size={18} />
              <span>New Test</span>
            </div>
          </div>

          {/* Operator */}
          <div className="absolute bottom-0 flex w-[263px] items-center gap-3 border-t border-[#D9E1EA] px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F1F1F] text-sm font-medium text-white">
              N
            </div>

            <div>
              <p className="text-[11px] font-semibold text-[#172033]">
                Operator OP-1042
              </p>

              <p className="text-[11px] text-[#667085]">
                Active session
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1 px-6 py-8 md:px-10">
          <div className="mx-auto max-w-[865px]">
            {/* Back */}
            <Link
              href="/test"
              className="inline-flex items-center gap-2 text-[11px] text-[#667085] transition hover:text-[#174A7E]"
            >
              <ArrowLeft size={14} />
              Back to Test Details
            </Link>

            {/* Heading */}
            <div className="mt-5">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#174A7E]">
                STEP 02 / 04
              </p>

              <h2 className="mt-1 text-[20px] font-semibold text-[#0B1F3A]">
                Capture Test Result
              </h2>

              <p className="mt-1 text-[12px] text-[#667085]">
                Position the test result and reference colour card inside the
                capture area before taking the image.
              </p>
            </div>

            {/* Step progress */}
            <div className="mt-7 border border-[#D9E1EA] bg-white px-6 py-4">
              <div className="flex items-center">
                {/* Step 1 */}
                <div className="flex items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#174A7E] bg-[#EAF2F8]">
                    <CheckCircle2
                      size={14}
                      className="text-[#174A7E]"
                    />
                  </div>

                  <span className="ml-2 text-[10px] font-medium text-[#174A7E]">
                    Test Details
                  </span>
                </div>

                <div className="mx-3 h-px flex-1 bg-[#174A7E]" />

                {/* Step 2 */}
                <div className="flex items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0B1F3A] text-[10px] font-semibold text-white">
                    02
                  </div>

                  <span className="ml-2 text-[10px] font-medium text-[#0B1F3A]">
                    Capture
                  </span>
                </div>

                <div className="mx-3 h-px flex-1 bg-[#D9E1EA]" />

                {/* Step 3 */}
                <div className="flex items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#D9E1EA] text-[10px] text-[#98A2B3]">
                    03
                  </div>

                  <span className="ml-2 text-[10px] text-[#98A2B3]">
                    Analysis
                  </span>
                </div>

                <div className="mx-3 h-px flex-1 bg-[#D9E1EA]" />

                {/* Step 4 */}
                <div className="flex items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#D9E1EA] text-[10px] text-[#98A2B3]">
                    04
                  </div>

                  <span className="ml-2 text-[10px] text-[#98A2B3]">
                    Record
                  </span>
                </div>
              </div>
            </div>

            {/* Capture grid */}
            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_322px]">
              {/* Camera card */}
              <div className="border border-[#D9E1EA] bg-white">
                <div className="flex items-center justify-between border-b border-[#D9E1EA] px-4 py-3">
                  <div>
                    <h3 className="text-[12px] font-semibold text-[#0B1F3A]">
                      Image Capture
                    </h3>

                    <p className="mt-0.5 text-[10px] text-[#667085]">
                      Use the rear camera when available.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        cameraReady
                          ? "bg-green-500"
                          : capturedImage
                            ? "bg-[#174A7E]"
                            : "bg-amber-500"
                      }`}
                    />

                    <span
                      className={
                        cameraReady
                          ? "text-green-700"
                          : capturedImage
                            ? "text-[#174A7E]"
                            : "text-amber-700"
                      }
                    >
                      {cameraReady
                        ? "Camera Ready"
                        : capturedImage
                          ? "Image Ready"
                          : "Camera Unavailable"}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Preview area */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#8D8D8D]">
                    {capturedImage ? (
                      <>
                        <img
                          src={capturedImage}
                          alt="Captured test result"
                          className="h-full w-full object-contain"
                        />

                        <div className="absolute left-3 top-3 bg-[#0B1F3A] px-2 py-1 text-[9px] font-semibold text-white">
                          CAPTURED IMAGE
                        </div>
                      </>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />

                        {/* Capture frame */}
                        <div className="pointer-events-none absolute inset-5 border border-white/70">
                          {/* Reference card */}
                          <div className="absolute left-[4%] top-[4%] h-[22%] w-[32%] border border-[#4EA5FF]">
                            <span className="absolute -top-5 left-0 bg-[#0B1F3A] px-2 py-1 text-[9px] font-semibold text-white">
                              REFERENCE CARD
                            </span>
                          </div>

                          {/* Test result */}
                          <div className="absolute bottom-[7%] right-[4%] h-[30%] w-[43%] border border-white">
                            <span className="absolute -top-5 left-0 bg-[#0B1F3A] px-2 py-1 text-[9px] font-semibold text-white">
                              TEST RESULT
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {error && (
                    <div className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Buttons */}
                  {!capturedImage ? (
                    <div className="mt-4 flex flex-col items-center">
                      <button
                        type="button"
                        onClick={captureImage}
                        disabled={!cameraReady}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-5 py-3 text-[11px] font-semibold text-white transition hover:bg-[#174A7E] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Camera size={16} />
                        Capture Image
                      </button>

                      {/* Upload from files */}
                      <label className="mt-3 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#174A7E] bg-white px-5 py-3 text-[11px] font-semibold text-[#174A7E] transition hover:bg-[#EAF2F8]">
                        <Upload size={16} />
                        Upload from Files

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <p className="mt-2 text-[10px] text-[#98A2B3]">
                        JPG, PNG or WebP
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={retakeImage}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#174A7E] bg-white px-5 py-3 text-[11px] font-semibold text-[#174A7E] transition hover:bg-[#EAF2F8]"
                      >
                        <Camera size={16} />
                        Retake Image
                      </button>

                      <Link
                        href="/test/analysis"
                        className="inline-flex items-center justify-center rounded-lg bg-[#0B1F3A] px-6 py-3 text-[11px] font-semibold text-white transition hover:bg-[#174A7E]"
                      >
                        Continue to Analysis
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Status card */}
              <div className="border border-[#D9E1EA] bg-white">
                <div className="border-b border-[#D9E1EA] px-4 py-3">
                  <h3 className="text-[12px] font-semibold text-[#0B1F3A]">
                    Capture Status
                  </h3>

                  <p className="mt-0.5 text-[10px] text-[#667085]">
                    Image readiness checks
                  </p>
                </div>

                <div>
                  {/* Reference */}
                  <div className="flex items-center justify-between border-b border-[#D9E1EA] px-4 py-4">
                    <div>
                      <p className="text-[10px] font-semibold text-[#172033]">
                        Reference Card
                      </p>

                      <p className="mt-1 text-[10px] text-[#98A2B3]">
                        Required for colour calibration
                      </p>
                    </div>

                    <span className="rounded-md border border-[#D9E1EA] bg-[#F7F9FC] px-2 py-1 text-[10px] text-[#667085]">
                      Waiting
                    </span>
                  </div>

                  {/* Image quality */}
                  <div className="flex items-center justify-between border-b border-[#D9E1EA] px-4 py-4">
                    <div>
                      <p className="text-[10px] font-semibold text-[#172033]">
                        Image Quality
                      </p>

                      <p className="mt-1 text-[10px] text-[#98A2B3]">
                        Focus and exposure check
                      </p>
                    </div>

                    <span className="rounded-md border border-[#D9E1EA] bg-[#F7F9FC] px-2 py-1 text-[10px] text-[#667085]">
                      Waiting
                    </span>
                  </div>

                  {/* Lighting */}
                  <div className="flex items-center justify-between border-b border-[#D9E1EA] px-4 py-4">
                    <div>
                      <p className="text-[10px] font-semibold text-[#172033]">
                        Lighting
                      </p>

                      <p className="mt-1 text-[10px] text-[#98A2B3]">
                        Environmental lighting check
                      </p>
                    </div>

                    <span className="rounded-md border border-[#D9E1EA] bg-[#F7F9FC] px-2 py-1 text-[10px] text-[#667085]">
                      Waiting
                    </span>
                  </div>

                  {/* Capture */}
                  <div className="flex items-center justify-between border-b border-[#D9E1EA] px-4 py-4">
                    <div>
                      <p className="text-[10px] font-semibold text-[#172033]">
                        Capture
                      </p>

                      <p className="mt-1 text-[10px] text-[#98A2B3]">
                        Ready when framing is correct
                      </p>
                    </div>

                    <span
                      className={`rounded-md border px-2 py-1 text-[10px] ${
                        capturedImage
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-green-200 bg-green-50 text-green-700"
                      }`}
                    >
                      Ready
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex gap-3 px-4 py-5">
                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-[#174A7E]"
                    />

                    <p className="text-[11px] leading-5 text-[#667085]">
                      The reference colour card is used to help normalize
                      image conditions before color analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guidance */}
            <div className="mt-4 border-l-2 border-[#174A7E] bg-white px-4 py-3">
              <p className="text-[11px] text-[#667085]">
                <span className="font-semibold text-[#174A7E]">
                  Capture guidance:
                </span>{" "}
                Keep both the reference card and test-result area visible,
                avoid strong shadows, and keep the camera steady.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 text-[10px] leading-5 text-[#98A2B3]">
              Presumptive result. NarcoLens provides digital support for
              field-test interpretation and documentation. Confirmatory
              laboratory testing remains necessary where applicable.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}