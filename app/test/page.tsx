"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export default function NewTest() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#172033]">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-[245px] shrink-0 border-r border-[#D9E1EA] bg-white md:flex md:flex-col">

          <div className="border-b border-[#D9E1EA] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0B1F3A]">
                <ShieldCheck size={19} className="text-white" />
              </div>

              <div>
                <h1 className="text-[17px] font-semibold tracking-tight text-[#0B1F3A]">
                  NarcoLens
                </h1>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#667085]">
                  Field Intelligence
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-6">

            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
              Workspace
            </p>

            <Link
              href="/"
              className="mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#667085] hover:bg-[#F3F6F9]"
            >
              <ClipboardList size={17} />
              Dashboard
            </Link>

            <Link
              href="/test"
              className="mb-1 flex items-center gap-3 rounded-md bg-[#EAF2F8] px-3 py-2.5 text-sm font-medium text-[#0B1F3A]"
            >
              <CheckCircle2 size={17} />
              New Test
            </Link>

            <Link
              href="/records"
              className="mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#667085] hover:bg-[#F3F6F9]"
            >
              <ClipboardList size={17} />
              Test Records
            </Link>

            <Link
              href="/verify"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#667085] hover:bg-[#F3F6F9]"
            >
              <ShieldCheck size={17} />
              Verify Record
            </Link>

          </nav>

          <div className="border-t border-[#D9E1EA] p-4">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF2F8] text-xs font-semibold text-[#174A7E]">
                OP
              </div>

              <div>
                <p className="text-xs font-semibold">
                  Operator OP-1042
                </p>
                <p className="text-[11px] text-[#667085]">
                  Active session
                </p>
              </div>
            </div>
          </div>

        </aside>

        {/* Main */}
        <section className="flex-1">

          {/* Header */}
          <header className="flex h-[72px] items-center border-b border-[#D9E1EA] bg-white px-6 md:px-10">
            <div>
              <p className="text-xs text-[#667085]">
                Field Operations
              </p>

              <h2 className="text-lg font-semibold text-[#0B1F3A]">
                New Field Test
              </h2>
            </div>
          </header>

          <div className="mx-auto max-w-5xl p-6 md:p-10">

            {/* Back */}
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-[#667085] hover:text-[#174A7E]"
            >
              <ArrowLeft size={14} />
              Back to Dashboard
            </Link>

            {/* Title */}
            <div className="mb-8">
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.1em] text-[#174A7E]">
                Test Workflow
              </p>

              <h3 className="text-2xl font-semibold tracking-tight text-[#0B1F3A]">
                Start a new field test
              </h3>

              <p className="mt-1 max-w-2xl text-sm text-[#667085]">
                Enter the basic test information before capturing the
                colorimetric reaction.
              </p>
            </div>

            {/* Progress */}
            <div className="mb-8 border border-[#D9E1EA] bg-white px-5 py-4">

              <div className="flex items-center">

                <Step number="01" label="Test Details" active />

                <div className="h-px flex-1 bg-[#D9E1EA]" />

                <Step number="02" label="Capture" />

                <div className="h-px flex-1 bg-[#D9E1EA]" />

                <Step number="03" label="Analysis" />

                <div className="h-px flex-1 bg-[#D9E1EA]" />

                <Step number="04" label="Record" />

              </div>

            </div>

            {/* Form */}
            <div className="border border-[#D9E1EA] bg-white">

              <div className="border-b border-[#D9E1EA] px-6 py-5">
                <h4 className="text-sm font-semibold text-[#0B1F3A]">
                  Test Information
                </h4>

                <p className="mt-1 text-xs text-[#667085]">
                  Record the details associated with this field test.
                </p>
              </div>

              <div className="space-y-6 p-6">

                {/* Test Kit */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#344054]">
                    Test Kit / Method
                  </label>

                  <select
                    className="h-11 w-full rounded-md border border-[#D9E1EA] bg-white px-3 text-sm text-[#172033] outline-none focus:border-[#174A7E] focus:ring-1 focus:ring-[#174A7E]"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select test kit
                    </option>
                    <option>Colorimetric Field Test — Type A</option>
                    <option>Colorimetric Field Test — Type B</option>
                    <option>Demonstration / Research Test</option>
                  </select>

                  <p className="mt-1.5 text-[11px] text-[#98A2B3]">
                    The selected method determines which validated
                    reference profile is used during analysis.
                  </p>
                </div>

                {/* Case ID */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#344054]">
                    Case / Reference ID
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. CASE-2026-00421"
                    className="h-11 w-full rounded-md border border-[#D9E1EA] px-3 text-sm outline-none placeholder:text-[#98A2B3] focus:border-[#174A7E] focus:ring-1 focus:ring-[#174A7E]"
                  />
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

                      <input
                        type="text"
                        placeholder="Location will be captured from device GPS"
                        disabled
                        className="h-11 w-full rounded-md border border-[#D9E1EA] bg-[#F8FAFC] pl-9 pr-3 text-sm text-[#667085]"
                      />
                    </div>

                    <button
                      type="button"
                      className="h-11 rounded-md border border-[#D9E1EA] px-4 text-xs font-medium text-[#174A7E] hover:bg-[#F7F9FC]"
                    >
                      Capture GPS
                    </button>

                  </div>
                </div>

                {/* Operator */}
                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#344054]">
                      Operator ID
                    </label>

                    <input
                      type="text"
                      value="OP-1042"
                      readOnly
                      className="h-11 w-full rounded-md border border-[#D9E1EA] bg-[#F8FAFC] px-3 text-sm text-[#667085]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#344054]">
                      Date & Time
                    </label>

                    <input
                      type="text"
                      value="Automatically captured"
                      readOnly
                      className="h-11 w-full rounded-md border border-[#D9E1EA] bg-[#F8FAFC] px-3 text-sm text-[#667085]"
                    />
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[#D9E1EA] bg-[#FAFBFC] px-6 py-4">

                <p className="text-[11px] text-[#667085]">
                  All test metadata will be included in the digital record.
                </p>

                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0B1F3A] px-4 text-sm font-medium text-white hover:bg-[#17365F]"
                >
                  <Link href="/test/capture">
  Continue to Capture
</Link>
                  <ArrowRight size={16} />
                  
                </button>

              </div>

            </div>

            {/* Notice */}
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
                    NarcoLens will associate the captured image with the
                    operator, timestamp, location and cryptographic record
                    information. Results remain presumptive and do not
                    replace laboratory confirmation.
                  </p>
                </div>

              </div>

            </div>

          </div>
        </section>
      </div>
    </main>
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