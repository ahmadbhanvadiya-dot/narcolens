"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  MapPin,
  ShieldCheck,
} from "lucide-react";
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

const REAGENT_PROFILES = [
  {
    value: "marquis",
    label: "Marquis Reagent",
    profileId: "MARQUIS",
    version: "1.0",
  },
  {
    value: "cobalt-thiocyanate",
    label: "Cobalt Thiocyanate (Scott Test)",
    profileId: "SCOTT",
    version: "1.0",
  },
  {
    value: "duquenois-levine",
    label: "Duquenois-Levine Test",
    profileId: "DUQUENOIS_LEVINE",
    version: "1.0",
  },
  {
    value: "ehrlich",
    label: "Ehrlich's Reagent",
    profileId: "EHRLICH",
    version: "1.0",
  },
];

export default function NewTest() {
  const router = useRouter();

  const [caseId, setCaseId] = useState("");

  const [reagent, setReagent] =
    useState("");

  const [error, setError] =
    useState("");

  const operatorId = "OP-1042";

  const handleContinue = () => {
    setError("");

    /*
     * Validate required fields
     */
    if (!reagent) {
      setError(
        "Please select a test reagent before continuing."
      );
      return;
    }

    if (!caseId.trim()) {
      setError(
        "Please enter a Case / Reference ID."
      );
      return;
    }

    /*
     * Find the selected validated profile.
     */
    const selectedProfile =
      REAGENT_PROFILES.find(
        (profile) =>
          profile.value === reagent
      );

    if (!selectedProfile) {
      setError(
        "Unable to load the selected test profile."
      );
      return;
    }

    /*
     * Create the metadata object that will
     * travel through the entire test workflow.
     */
    const metadata: TestMetadata = {
      caseId:
        caseId.trim(),

      testKit:
        "Colorimetric Field Test",

      reagent:
        selectedProfile.label,

      profileId:
        selectedProfile.profileId,

      profileVersion:
        selectedProfile.version,

      operatorId,

      startedAt:
        new Date().toISOString(),
    };

    /*
     * Store the active test metadata.
     *
     * Capture → Analysis → Record will
     * read this same object.
     */
    sessionStorage.setItem(
      "narcolens_test_metadata",
      JSON.stringify(metadata)
    );

    /*
     * Clear any previous analysis from
     * an older test.
     */
    sessionStorage.removeItem(
      "narcolens_analysis"
    );

    sessionStorage.removeItem(
      "narcolens_captured_image"
    );

    sessionStorage.removeItem(
      "narcolens_test_location"
    );

    /*
     * Continue to image capture.
     */
    router.push("/test/capture");
  };

  return (
    <AppShell
      title="New Field Test"
      section="Field Operations"
    >
      <div className="mx-auto max-w-5xl">

        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-6 text-xs font-medium text-[#667085] hover:text-[#174A7E]"
        >
          ← Back to Dashboard
        </button>

        {/* Title */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.1em] text-[#174A7E]">
            Test Workflow
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-[#0B1F3A]">
            Start a new field test
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#667085]">
            Select the test method and record the
            case information before capturing the
            field-test image.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 border border-[#D9E1EA] bg-white px-5 py-4">

          <div className="flex items-center">

            <Step
              number="01"
              label="Test Details"
              active
            />

            <div className="h-px flex-1 bg-[#D9E1EA]" />

            <Step
              number="02"
              label="Capture"
            />

            <div className="h-px flex-1 bg-[#D9E1EA]" />

            <Step
              number="03"
              label="Analysis"
            />

            <div className="h-px flex-1 bg-[#D9E1EA]" />

            <Step
              number="04"
              label="Record"
            />

          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 border border-red-200 bg-red-50 px-5 py-4">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* Form */}
        <div className="border border-[#D9E1EA] bg-white">

          {/* Header */}
          <div className="border-b border-[#D9E1EA] px-6 py-5">

            <h2 className="text-sm font-semibold text-[#0B1F3A]">
              Test Information
            </h2>

            <p className="mt-1 text-xs text-[#667085]">
              These details will be associated with
              the image analysis and digital record.
            </p>

          </div>

          <div className="space-y-6 p-6">

            {/* Reagent */}
            <div>

              <label
                htmlFor="reagent"
                className="mb-2 block text-xs font-medium text-[#344054]"
              >
                Test Reagent / Method
              </label>

              <select
                id="reagent"
                value={reagent}
                onChange={(event) =>
                  setReagent(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-md border border-[#D9E1EA] bg-white px-3 text-sm text-[#172033] outline-none focus:border-[#174A7E] focus:ring-1 focus:ring-[#174A7E]"
              >
                <option value="">
                  Select test reagent
                </option>

                {REAGENT_PROFILES.map(
                  (profile) => (
                    <option
                      key={profile.value}
                      value={profile.value}
                    >
                      {profile.label}
                    </option>
                  )
                )}
              </select>

              <p className="mt-1.5 text-[11px] text-[#98A2B3]">
                The selected method determines
                which versioned analysis profile is
                used by NarcoLens.
              </p>

            </div>

            {/* Profile information */}
            {reagent && (
              <div className="border border-[#D9E1EA] bg-[#F7F9FC] p-4">

                <div className="flex items-start gap-3">

                  <ShieldCheck
                    size={17}
                    className="mt-0.5 shrink-0 text-[#174A7E]"
                  />

                  <div>

                    <p className="text-xs font-semibold text-[#172033]">
                      Analysis profile selected
                    </p>

                    {(() => {
                      const profile =
                        REAGENT_PROFILES.find(
                          (item) =>
                            item.value ===
                            reagent
                        );

                      if (!profile) {
                        return null;
                      }

                      return (
                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-[#667085]">

                          <span>
                            Profile:{" "}
                            <strong className="text-[#172033]">
                              {
                                profile.profileId
                              }
                            </strong>
                          </span>

                          <span>
                            Version:{" "}
                            <strong className="text-[#172033]">
                              {
                                profile.version
                              }
                            </strong>
                          </span>

                        </div>
                      );
                    })()}

                  </div>

                </div>

              </div>
            )}

            {/* Case ID */}
            <div>

              <label
                htmlFor="caseId"
                className="mb-2 block text-xs font-medium text-[#344054]"
              >
                Case / Reference ID
              </label>

              <input
                id="caseId"
                type="text"
                value={caseId}
                onChange={(event) =>
                  setCaseId(
                    event.target.value
                  )
                }
                placeholder="e.g. CASE-2026-00421"
                className="h-11 w-full rounded-md border border-[#D9E1EA] px-3 text-sm outline-none placeholder:text-[#98A2B3] focus:border-[#174A7E] focus:ring-1 focus:ring-[#174A7E]"
              />

              <p className="mt-1.5 text-[11px] text-[#98A2B3]">
                This identifier will be linked to
                the final digital test record.
              </p>

            </div>

            {/* Operator + timestamp */}
            <div className="grid gap-5 sm:grid-cols-2">

              <div>

                <label className="mb-2 block text-xs font-medium text-[#344054]">
                  Operator ID
                </label>

                <input
                  type="text"
                  value={operatorId}
                  readOnly
                  className="h-11 w-full rounded-md border border-[#D9E1EA] bg-[#F8FAFC] px-3 text-sm text-[#667085]"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-medium text-[#344054]">
                  Test Timestamp
                </label>

                <input
                  type="text"
                  value="Captured automatically"
                  readOnly
                  className="h-11 w-full rounded-md border border-[#D9E1EA] bg-[#F8FAFC] px-3 text-sm text-[#667085]"
                />

              </div>

            </div>

            {/* Location */}
            <div>

              <label className="mb-2 block text-xs font-medium text-[#344054]">
                Test Location
              </label>

              <div className="flex gap-3">

                <div className="relative flex-1">

                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                  />

                  <div className="flex h-11 w-full items-center rounded-md border border-[#D9E1EA] bg-[#F8FAFC] pl-9 pr-3 text-sm text-[#667085]">
                    GPS will be captured during
                    image capture
                  </div>

                </div>

                <div className="flex h-11 items-center rounded-md border border-[#D9E1EA] bg-[#F7F9FC] px-4 text-xs font-medium text-[#667085]">
                  Device GPS
                </div>

              </div>

              <p className="mt-1.5 text-[11px] text-[#98A2B3]">
                NarcoLens will request device
                location permission during the
                capture step.
              </p>

            </div>

          </div>

          {/* Footer */}
          <div className="flex flex-col gap-4 border-t border-[#D9E1EA] bg-[#FAFBFC] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="max-w-xl text-[11px] leading-5 text-[#667085]">
              The selected reagent, profile version,
              case ID, operator and timestamp will be
              carried into the subsequent analysis and
              digital record.
            </p>

            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#0B1F3A] px-5 text-sm font-medium text-white transition hover:bg-[#17365F]"
            >
              Continue to Capture
              <ArrowRight size={16} />
            </button>

          </div>

        </div>

        {/* Security notice */}
        <div className="mt-5 border border-[#D9E1EA] bg-white px-5 py-4">

          <div className="flex gap-3">

            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-[#174A7E]"
            />

            <div>

              <p className="text-xs font-semibold text-[#172033]">
                Secure digital record
              </p>

              <p className="mt-1 text-[11px] leading-5 text-[#667085]">
                NarcoLens associates the captured
                image with the selected test profile,
                operator, timestamp, location and
                cryptographic record information.
                Results remain presumptive and do not
                replace confirmatory laboratory testing.
              </p>

            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}

function Step({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-2">

      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${
          active
            ? "bg-[#0B1F3A] text-white"
            : "border border-[#D9E1EA] bg-white text-[#98A2B3]"
        }`}
      >
        {number}
      </div>

      <span
        className={`hidden text-xs sm:block ${
          active
            ? "font-medium text-[#0B1F3A]"
            : "text-[#98A2B3]"
        }`}
      >
        {label}
      </span>

    </div>
  );
}