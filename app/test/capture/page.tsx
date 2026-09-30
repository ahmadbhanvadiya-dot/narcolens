"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function CapturePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraReady, setCameraReady] =
    useState(false);

  const [capturedImage, setCapturedImage] =
    useState("");

  const [error, setError] =
    useState("");

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locationError, setLocationError] =
    useState("");

  const [locationLoading, setLocationLoading] =
    useState(true);

  const [cameraLoading, setCameraLoading] =
    useState(true);

  /* --------------------------------------------------
     Start Camera
  -------------------------------------------------- */

  useEffect(() => {
    startCamera();
    getDeviceLocation();

    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      setCameraLoading(true);
      setError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera access is not supported by this browser."
        );
        setCameraLoading(false);
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 1920,
            },
            height: {
              ideal: 1080,
            },
          },
          audio: false,
        });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        setCameraReady(true);
      }
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      setError(
        "Unable to access the camera. Please allow camera permission or use Upload from Files."
      );
    } finally {
      setCameraLoading(false);
    }
  }

  /* --------------------------------------------------
     Stop Camera
  -------------------------------------------------- */

  function stopCamera() {
    const stream =
      videoRef.current?.srcObject as MediaStream | null;

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }

  /* --------------------------------------------------
     Get Device Location
  -------------------------------------------------- */

  function getDeviceLocation() {
    if (!navigator.geolocation) {
      setLocationLoading(false);

      setLocationError(
        "Geolocation is not supported by this device."
      );

      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const timestamp =
          new Date().toISOString();

        const locationData = {
          latitude,
          longitude,
          timestamp,
        };

        setLocation({
          latitude,
          longitude,
        });

        sessionStorage.setItem(
          "narcolens_test_location",
          JSON.stringify(locationData)
        );

        setLocationLoading(false);
      },

      (error) => {
        console.error(
          "Location error:",
          error
        );

        let message =
          "Unable to access device location.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Location permission was denied. Please allow location access and try again.";
        } else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "Your current location could not be determined.";
        } else if (
          error.code ===
          error.TIMEOUT
        ) {
          message =
            "Location request timed out. Please try again.";
        }

        setLocationError(message);
        setLocationLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  /* --------------------------------------------------
     Capture Image From Camera
  -------------------------------------------------- */

  function captureImage() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError(
        "Camera is not ready."
      );

      return;
    }

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setError(
        "Camera image is not ready yet."
      );

      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context =
      canvas.getContext("2d");

    if (!context) {
      setError(
        "Unable to capture the camera image."
      );

      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const image =
      canvas.toDataURL(
        "image/jpeg",
        0.92
      );

    sessionStorage.setItem(
      "narcolens_captured_image",
      image
    );

    setCapturedImage(image);

    stopCamera();

    setError("");
  }

  /* --------------------------------------------------
     Upload Image From Files
  -------------------------------------------------- */

  function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      return;
    }

    setError("");

    const reader =
      new FileReader();

    reader.onload = () => {
      const result =
        reader.result;

      if (typeof result === "string") {
        sessionStorage.setItem(
          "narcolens_captured_image",
          result
        );

        setCapturedImage(result);

        stopCamera();
      }
    };

    reader.onerror = () => {
      setError(
        "Unable to read the selected image."
      );
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }

  /* --------------------------------------------------
     Retake Image
  -------------------------------------------------- */

  function retakeImage() {
    sessionStorage.removeItem(
      "narcolens_captured_image"
    );

    setCapturedImage("");

    setError("");

    startCamera();
  }

  /* --------------------------------------------------
     Continue
  -------------------------------------------------- */

  function continueToAnalysis() {
    if (!capturedImage) {
      setError(
        "Please capture or upload an image first."
      );

      return;
    }

    if (!location) {
      setError(
        "Test location has not been captured. Please allow location access before continuing."
      );

      return;
    }

    window.location.href =
      "/test/analysis";
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC]">

      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* Back */}
        <Link
          href="/test"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#174A7E] hover:underline"
        >
          ← Back to Test Details
        </Link>

        {/* Header */}
        <div className="mt-6">

          <p className="text-sm font-medium text-[#174A7E]">
            STEP 02 / 04
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#0B1F3A]">
            Capture Test Result
          </h1>

          <p className="mt-2 text-[#667085]">
            Capture the test result with the reference
            colour card visible in the frame.
          </p>

        </div>

        {/* Workflow */}
        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">

          <div className="text-[#667085]">
            01 Test Details
          </div>

          <span className="text-[#98A2B3]">
            →
          </span>

          <div className="font-semibold text-[#174A7E]">
            02 Capture
          </div>

          <span className="text-[#98A2B3]">
            →
          </span>

          <div className="text-[#667085]">
            03 Analysis
          </div>

          <span className="text-[#98A2B3]">
            →
          </span>

          <div className="text-[#667085]">
            04 Record
          </div>

        </div>

        {/* Camera / Image */}
        <section className="mt-8 overflow-hidden rounded-xl border border-[#D9E1EA] bg-white">

          {/* Camera header */}
          <div className="border-b border-[#D9E1EA] px-6 py-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-[#0B1F3A]">
                  Test Image
                </h2>

                <p className="mt-1 text-sm text-[#667085]">
                  Keep both the test result and reference
                  colour card visible.
                </p>
              </div>

              <div
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  capturedImage
                    ? "bg-green-50 text-green-700"
                    : cameraReady
                      ? "bg-[#EAF2F8] text-[#174A7E]"
                      : "bg-[#F7F9FC] text-[#667085]"
                }`}
              >
                {capturedImage
                  ? "Image Captured"
                  : cameraReady
                    ? "Camera Ready"
                    : "Camera Starting"}
              </div>

            </div>

          </div>

          {/* Camera area */}
          <div className="p-6">

            <div className="relative aspect-video overflow-hidden rounded-lg border border-[#D9E1EA] bg-[#0B1F3A]">

              {/* Camera */}
              {!capturedImage && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />

                  {/* Camera loading */}
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0B1F3A]">

                      <div className="text-center text-white">

                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        <p className="mt-3 text-sm">
                          Starting camera...
                        </p>

                      </div>

                    </div>
                  )}

                  {/* Capture overlay */}
                  {cameraReady && (
                    <div className="pointer-events-none absolute inset-0">

                      {/* Reference card */}
                      <div className="absolute left-[8%] top-[15%] h-[70%] w-[30%] border-2 border-white/80">

                        <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold tracking-wide text-white">
                          REFERENCE CARD
                        </div>

                      </div>

                      {/* Test result */}
                      <div className="absolute right-[8%] top-[15%] h-[70%] w-[30%] border-2 border-white/80">

                        <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold tracking-wide text-white">
                          TEST RESULT
                        </div>

                      </div>

                    </div>
                  )}
                </>
              )}

              {/* Captured image */}
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured test result"
                  className="h-full w-full object-contain"
                />
              )}

            </div>

            {/* Camera controls */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">

              {!capturedImage && (
                <>
                  <button
                    type="button"
                    onClick={captureImage}
                    disabled={!cameraReady}
                    className="flex-1 rounded-lg bg-[#174A7E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0B1F3A] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Capture Image
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="flex-1 rounded-lg border border-[#D9E1EA] bg-white px-5 py-3 text-sm font-medium text-[#174A7E] transition hover:bg-[#F7F9FC]"
                  >
                    Upload from Files
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}

              {capturedImage && (
                <button
                  type="button"
                  onClick={retakeImage}
                  className="w-full rounded-lg border border-[#D9E1EA] bg-white px-5 py-3 text-sm font-medium text-[#174A7E] transition hover:bg-[#F7F9FC]"
                >
                  Retake Image
                </button>
              )}

            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

          </div>

        </section>

        {/* Location */}
        <section className="mt-5 rounded-xl border border-[#D9E1EA] bg-white p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                Test Location
              </p>

              <p className="mt-1 text-sm font-medium text-[#172033]">
                Device GPS
              </p>

              <p className="mt-1 text-xs text-[#667085]">
                Location is recorded with the digital test
                record.
              </p>

            </div>

            <div
              className={`rounded-md px-3 py-2 text-xs font-medium ${
                location
                  ? "bg-green-50 text-green-700"
                  : locationError
                    ? "bg-red-50 text-red-700"
                    : "bg-[#F7F9FC] text-[#667085]"
              }`}
            >
              {location
                ? "Location Ready"
                : locationError
                  ? "Location Unavailable"
                  : "Getting Location"}
            </div>

          </div>

          {location && (
            <div className="mt-4 border-t border-[#D9E1EA] pt-4">

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-xs text-[#667085]">
                    Latitude
                  </p>

                  <p className="mt-1 font-mono text-sm text-[#172033]">
                    {location.latitude.toFixed(
                      6
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#667085]">
                    Longitude
                  </p>

                  <p className="mt-1 font-mono text-sm text-[#172033]">
                    {location.longitude.toFixed(
                      6
                    )}
                  </p>
                </div>

              </div>

            </div>
          )}

          {locationError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">

              <p className="text-xs leading-5 text-red-700">
                {locationError}
              </p>

              <button
                type="button"
                onClick={getDeviceLocation}
                className="mt-2 text-xs font-semibold text-red-700 underline"
              >
                Try location again
              </button>

            </div>
          )}

          {locationLoading && (
            <div className="mt-4">

              <div className="h-1 overflow-hidden rounded-full bg-[#EAF2F8]">
                <div className="h-full w-1/2 animate-pulse bg-[#174A7E]" />
              </div>

            </div>
          )}

        </section>

        {/* Continue */}
        <section className="mt-5 rounded-xl border border-[#D9E1EA] bg-white p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold text-[#172033]">
                Ready for analysis?
              </p>

              <p className="mt-1 text-xs leading-5 text-[#667085]">
                The captured image and test location will
                be passed to the analysis stage.
              </p>

            </div>

            <button
              type="button"
              onClick={continueToAnalysis}
              disabled={
                !capturedImage ||
                !location
              }
              className="rounded-lg bg-[#174A7E] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0B1F3A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Analysis →
            </button>

          </div>

        </section>

        {/* Disclaimer */}
        <div className="mt-5 border-l-2 border-[#174A7E] bg-white px-4 py-3">

          <p className="text-xs leading-5 text-[#667085]">

            <span className="font-semibold text-[#174A7E]">
              Presumptive field testing:
            </span>{" "}

            NarcoLens provides digital support for field-test
            interpretation and documentation. Results do not
            replace confirmatory laboratory testing.

          </p>

        </div>

        {/* Hidden canvas */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

      </div>

    </main>
  );
}