"use client";

import { useState } from "react";

export default function VerifyPage() {
  const [recordId, setRecordId] = useState("");
  const [message, setMessage] = useState("");

  function handleVerify() {
    if (!recordId.trim()) {
      setMessage("Please enter a record ID.");
      return;
    }

    setMessage(
      "Record verification will be connected to the NarcoLens verification service."
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] p-8">
      <div className="mx-auto max-w-4xl">

        <div>
          <p className="text-sm font-medium text-[#174A7E]">
            RECORD VERIFICATION
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#0B1F3A]">
            Verify Digital Record
          </h1>

          <p className="mt-2 text-[#667085]">
            Verify the integrity and status of a NarcoLens digital test record.
          </p>
        </div>

        <section className="mt-8 rounded-xl border border-[#D9E1EA] bg-white p-6">
          <label
            htmlFor="recordId"
            className="text-sm font-medium text-[#172033]"
          >
            Record ID
          </label>

          <input
            id="recordId"
            type="text"
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            placeholder="e.g. NLC-123456789"
            className="mt-2 w-full rounded-lg border border-[#D9E1EA] bg-white px-4 py-3 text-sm text-[#172033] outline-none focus:border-[#174A7E]"
          />

          <button
            onClick={handleVerify}
            className="mt-4 rounded-lg bg-[#174A7E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0B1F3A]"
          >
            Verify Record
          </button>

          {message && (
            <div className="mt-5 rounded-lg border border-[#D9E1EA] bg-[#F7F9FC] p-4">
              <p className="text-sm text-[#667085]">
                {message}
              </p>
            </div>
          )}
        </section>

        <div className="mt-6 rounded-lg border border-[#D9E1EA] bg-white p-4">
          <p className="text-xs leading-5 text-[#667085]">
            Verification checks are intended to support digital record
            integrity. They do not replace confirmatory laboratory testing.
          </p>
        </div>

      </div>
    </main>
  );
}