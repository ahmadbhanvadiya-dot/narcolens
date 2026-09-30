"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/AppShell";

type TestMetadata = {
  caseId: string;
  testKit: string;
  reagent: string;
  profileId: string;
  profileVersion: string;
  operatorId: string;
  startedAt: string;
};

type TestLocation = {
  latitude: number;
  longitude: number;
  timestamp: string;
};

export default function CapturePage() {
  const router = useRouter();

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const [metadata, setMetadata] =
    useState<TestMetadata | null>(null);

  const [image, setImage] =
    useState<string | null>(null);

  const [location, setLocation] =
    useState<TestLocation | null>(null);

  const [cameraReady, setCameraReady] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  const [locationError, setLocationError] =
    useState("");

  const [loadingLocation, setLoadingLocation] =
    useState(false);

  /*
   * ----------------------------------------------------
   * Load active test metadata
   * ----------------------------------------------------
   */

  useEffect(() => {
    const savedMetadata =
      sessionStorage.getItem(
        "narcolens_test_metadata"
      );

    if (!savedMetadata) {
      router.replace("/test");
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

      router.replace("/test");
    }
  }, [router]);

  /*
   * ----------------------------------------------------
   * Start camera
   * ----------------------------------------------------
   */

  useEffect(() => {
    if (!metadata) {
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [metadata]);

  async function startCamera() {
    try {
      setCameraError("");

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "Camera access is not supported by this browser."
        );

        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
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
          }
        );

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();

        setCameraReady(true);
      }
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      setCameraError(
        "Unable to access the camera. Please allow camera permission or upload an image from your files."
      );

      setCameraReady(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }
  }

  /*
   * ----------------------------------------------------
   * Capture image
   * ----------------------------------------------------
   */

  function captureImage() {
    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setCameraError(
        "Camera image is not ready yet. Please try again."
      );

      return;
    }

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const capturedImage =
      canvas.toDataURL(
        "image/jpeg",
        0.92
      );

    setImage(capturedImage);

    sessionStorage.setItem(
      "narcolens_captured_image",
      capturedImage
    );
  }

  /*
   * ----------------------------------------------------
   * Upload image from files
   * ----------------------------------------------------
   */

  function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setCameraError(
        "Please select a JPEG, PNG, or WebP image."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const result =
        reader.result;

      if (
        typeof result !== "string"
      ) {
        return;
      }

      setImage(result);

      sessionStorage.setItem(
        "narcolens_captured_image",
        result
      );

      setCameraError("");
    };

    reader.readAsDataURL(file);
  }

  /*
   * ----------------------------------------------------
   * GPS
   * ----------------------------------------------------
   */

  function getLocation() {
    setLocationError(
      ""
    );

    if (
      !navigator.geolocation
    ) {
      setLocationError(
        "Geolocation is not supported by this browser."
      );

      return;
    }

    setLoadingLocation(
      true
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const savedLocation: TestLocation =
          {
            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,

            timestamp:
              new Date().toISOString(),
          };

        setLocation(
          savedLocation
        );

        sessionStorage.setItem(
          "narcolens_test_location",
          JSON.stringify(
            savedLocation
          )
        );

        setLoadingLocation(
          false
        );

        setLocationError(
          ""
        );
      },

      (error) => {
        console.error(
          "Location error:",
          error
        );

        let message =
          "Unable to capture device location.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Location permission was denied. Please allow location access to continue.";
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "The device location is currently unavailable.";
        }

        if (
          error.code ===
          error.TIMEOUT
        ) {
          message =
            "Location request timed out. Please try again.";
        }

        setLocationError(
          message
        );

        setLoadingLocation(
          false
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  /*
   * ----------------------------------------------------
   * Continue to analysis
   * ----------------------------------------------------
   */

  function continueToAnalysis() {
    if (!image) {
      setCameraError(
        "Capture or upload a test image before continuing."
      );

      return;
    }

    if (!location) {
      setLocationError(
        "Test location is required before continuing."
      );

      return;
    }

    if (!metadata) {
      setCameraError(
        "Test metadata is missing. Please restart the test."
      );

      return;
    }

    /*
     * Make sure the latest values are persisted.
     */
    sessionStorage.setItem(
      "narcolens_test_metadata",
      JSON.stringify(metadata)
    );

    sessionStorage.setItem(
      "narcolens_captured_image",
      image
    );

    sessionStorage.setItem(
      "narcolens_test_location",
      JSON.stringify(location)
    );

    router.push(
      "/test/analysis"
    );
  }

  /*
   * ----------------------------------------------------
   * Retake
   * ----------------------------------------------------
   */

  function retakeImage() {
    setImage(null);

    sessionStorage.removeItem(
      "narcolens_captured_image"
    );

    if (
      !streamRef.current
    ) {
      startCamera();
    }
  }

  /*
   * ----------------------------------------------------
   * UI
   * ----------------------------------------------------
   */

  return (
    <AppShell
      title="Capture Test Image"
      section="Field Operations"
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6">

          <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#174A7E]">
            STEP 02 / 04
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-[#0B1F3A]">
            Capture Test Image
          </h1>

          <p className="mt-1 text-sm text-[#667085]">
            Capture the field-test result together
            with the reference colour card.
          </p>

        </div>

        {/* Workflow */}
        <div className="mb-6 flex items-center gap-3 text-xs">

          <span className="text-[#667085]">
            01 Test Details
          </span>

          <span>→</span>

          <span className="font-semibold text-[#174A7E]">
            02 Capture
          </span>

          <span>→</span>

          <span className="text-[#98A2B3]">
            03 Analysis
          </span>

          <span>→</span>

          <span className="text-[#98A2B3]">
            04 Record
          </span>

        </div>

        {/* Active test */}
        {metadata && (
          <div className="mb-6 border border-[#D9E1EA] bg-white">

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
                value={`${metadata.profileId} v${metadata.profileVersion}`}
              />

              <InfoItem
                label="Operator"
                value={metadata.operatorId}
              />

            </div>

          </div>
        )}

        {/* Main */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">

          {/* Camera */}
          <section className="border border-[#D9E1EA] bg-white">

            <div className="border-b border-[#D9E1EA] px-5 py-4">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-sm font-semibold text-[#0B1F3A]">
                    Camera Capture
                  </h2>

                  <p className="mt-1 text-xs text-[#667085]">
                    Keep the reference card and test
                    result visible inside the frame.
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                    cameraReady
                      ? "bg-green-50 text-green-700"
                      : "bg-[#F2F4F7] text-[#667085]"
                  }`}
                >
                  {cameraReady
                    ? "Camera Ready"
                    : "Camera Offline"}
                </span>

              </div>

            </div>

            <div className="p-5">

              {/* Camera area */}
              <div className="relative overflow-hidden rounded-lg bg-[#101828]">

                {image ? (
                  <img
                    src={image}
                    alt="Captured field test"
                    className="block aspect-video w-full object-contain"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="block aspect-video w-full object-cover"
                  />
                )}

                {/* Capture overlay */}
                {!image && (
                  <div className="pointer-events-none absolute inset-0">

                    {/* Reference card */}
                    <div className="absolute left-[20%] right-[20%] top-[15%] h-[27%] border-2 border-dashed border-white/80">

                      <div className="absolute left-2 top-2 bg-black/60 px-2 py-1 text-[9px] font-semibold tracking-wide text-white">
                        REFERENCE CARD
                      </div>

                    </div>

                    {/* Test result */}
                    <div className="absolute bottom-[13%] left-[20%] right-[20%] h-[30%] border-2 border-dashed border-white/80">

                      <div className="absolute left-2 top-2 bg-black/60 px-2 py-1 text-[9px] font-semibold tracking-wide text-white">
                        TEST RESULT
                      </div>

                    </div>

                  </div>
                )}

              </div>

              <canvas
                ref={canvasRef}
                className="hidden"
              />

              {/* Camera error */}
              {cameraError && (
                <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3">

                  <p className="text-xs text-red-700">
                    {cameraError}
                  </p>

                </div>
              )}

              {/* Controls */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                {!image ? (
                  <>
                    <button
                      type="button"
                      onClick={
                        captureImage
                      }
                      disabled={
                        !cameraReady
                      }
                      className="flex-1 rounded-md bg-[#174A7E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0B1F3A] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Capture Image
                    </button>

                    <label className="flex cursor-pointer items-center justify-center rounded-md border border-[#D9E1EA] bg-white px-5 py-3 text-sm font-medium text-[#172033] transition hover:bg-[#F7F9FC]">

                      Upload from Files

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={
                          handleFileUpload
                        }
                      />

                    </label>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={
                        retakeImage
                      }
                      className="flex-1 rounded-md border border-[#D9E1EA] bg-white px-5 py-3 text-sm font-medium text-[#172033] transition hover:bg-[#F7F9FC]"
                    >
                      Retake Image
                    </button>

                    <label className="flex flex-1 cursor-pointer items-center justify-center rounded-md border border-[#D9E1EA] bg-white px-5 py-3 text-sm font-medium text-[#172033] transition hover:bg-[#F7F9FC]">

                      Upload Different Image

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={
                          handleFileUpload
                        }
                      />

                    </label>
                  </>
                )}

              </div>

            </div>

          </section>

          {/* Test readiness */}
          <section className="border border-[#D9E1EA] bg-white">

            <div className="border-b border-[#D9E1EA] px-5 py-4">

              <h2 className="text-sm font-semibold text-[#0B1F3A]">
                Test Readiness
              </h2>

              <p className="mt-1 text-xs text-[#667085]">
                Both image and location are required
                before analysis.
              </p>

            </div>

            <div className="space-y-4 p-5">

              {/* Image status */}
              <StatusRow
                label="Test Image"
                ready={Boolean(image)}
                readyText="Captured"
                waitingText="Waiting for image"
              />

              {/* Location */}
              <div className="border border-[#D9E1EA] p-4">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-xs font-medium text-[#172033]">
                      Device Location
                    </p>

                    <p className="mt-1 text-[11px] text-[#667085]">
                      GPS coordinates will be attached
                      to the digital test record.
                    </p>

                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      location
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {location
                      ? "Ready"
                      : "Required"}
                  </span>

                </div>

                {location && (
                  <div className="mt-3 border-t border-[#D9E1EA] pt-3">

                    <p className="font-mono text-[11px] text-[#667085]">
                      {location.latitude.toFixed(
                        6
                      )}
                      ,{" "}
                      {location.longitude.toFixed(
                        6
                      )}
                    </p>

                  </div>
                )}

                <button
                  type="button"
                  onClick={
                    getLocation
                  }
                  disabled={
                    loadingLocation
                  }
                  className="mt-4 w-full rounded-md border border-[#D9E1EA] bg-white px-4 py-2.5 text-xs font-medium text-[#172033] transition hover:bg-[#F7F9FC] disabled:opacity-50"
                >
                  {loadingLocation
                    ? "Getting Location..."
                    : location
                      ? "Refresh Location"
                      : "Get Device Location"}
                </button>

                {locationError && (
                  <p className="mt-2 text-[11px] text-red-600">
                    {locationError}
                  </p>
                )}

              </div>

              {/* Profile */}
              {metadata && (
                <div className="border border-[#D9E1EA] bg-[#F7F9FC] p-4">

                  <p className="text-xs font-medium text-[#172033]">
                    Analysis Profile
                  </p>

                  <div className="mt-3 space-y-2">

                    <InfoLine
                      label="Reagent"
                      value={
                        metadata.reagent
                      }
                    />

                    <InfoLine
                      label="Profile"
                      value={
                        metadata.profileId
                      }
                    />

                    <InfoLine
                      label="Version"
                      value={
                        metadata.profileVersion
                      }
                    />

                  </div>

                </div>
              )}

              {/* Continue */}
              <button
                type="button"
                onClick={
                  continueToAnalysis
                }
                disabled={
                  !image ||
                  !location ||
                  !metadata
                }
                className="w-full rounded-md bg-[#0B1F3A] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#17365F] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue to Analysis
              </button>

            </div>

          </section>

        </div>

        {/* Capture guidance */}
        <div className="mt-6 border border-[#D9E1EA] bg-white px-5 py-4">

          <p className="text-xs font-semibold text-[#172033]">
            Capture guidance
          </p>

          <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[#667085]">
            <li>
              • Keep the reference card visible in
              the upper guide area.
            </li>

            <li>
              • Keep the test result visible in the
              lower guide area.
            </li>

            <li>
              • Avoid glare, heavy shadows and motion
              blur.
            </li>

            <li>
              • The selected test profile will be
              carried into image analysis.
            </li>
          </ul>

        </div>

        {/* Disclaimer */}
        <div className="mt-5 border border-[#D9E1EA] bg-white px-5 py-4">

          <p className="text-[11px] leading-5 text-[#667085]">

            <span className="font-semibold text-[#172033]">
              Presumptive analysis:
            </span>{" "}
            NarcoLens is a digital documentation and
            analysis prototype. Image-based results
            do not replace confirmatory laboratory
            testing.

          </p>

        </div>

      </div>
    </AppShell>
  );
}

/*
 * ------------------------------------------------------
 * Small UI components
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

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-[11px] text-[#667085]">
        {label}
      </span>

      <span className="text-right text-[11px] font-medium text-[#172033]">
        {value}
      </span>

    </div>
  );
}

function StatusRow({
  label,
  ready,
  readyText,
  waitingText,
}: {
  label: string;
  ready: boolean;
  readyText: string;
  waitingText: string;
}) {
  return (
    <div className="flex items-center justify-between border border-[#D9E1EA] p-4">

      <div>
        <p className="text-xs font-medium text-[#172033]">
          {label}
        </p>

        <p className="mt-1 text-[11px] text-[#667085]">
          {ready
            ? readyText
            : waitingText}
        </p>
      </div>

      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
          ready
            ? "bg-green-50 text-green-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {ready
          ? "Ready"
          : "Required"}
      </span>

    </div>
  );
}