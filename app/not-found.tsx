import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] px-6 py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center">
        <div className="w-full text-center">

          {/* Brand */}
          <div className="mb-10">
            <p className="text-xl font-semibold tracking-tight text-[#0B1F3A]">
              NarcoLens
            </p>

            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#174A7E]" />
          </div>

          {/* Error */}
          <div className="rounded-xl border border-[#D9E1EA] bg-white px-6 py-12 shadow-sm sm:px-12">

            <p className="text-7xl font-bold tracking-tight text-[#174A7E] sm:text-8xl">
              404
            </p>

            <h1 className="mt-6 text-2xl font-semibold text-[#0B1F3A] sm:text-3xl">
              Page not found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#667085] sm:text-base">
              The page you're looking for doesn't exist or may have
              been moved to another location.
            </p>

            {/* Action */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/"
                className="rounded-lg bg-[#174A7E] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0B1F3A]"
              >
                Return to Dashboard
              </Link>
            </div>

          </div>

          {/* Footer */}
          <p className="mt-6 text-xs text-[#98A2B3]">
            NarcoLens · Digital Companion for Field Testing
          </p>

        </div>
      </div>
    </main>
  );
}