
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";

export default function AppShell({
  children,
  title,
  section = "Field Operations",
}: {
  children: React.ReactNode;
  title: string;
  section?: string;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/test",
      label: "New Test",
      icon: Camera,
    },
    {
      href: "/test-records",
      label: "Test Records",
      icon: ClipboardList,
    },
    {
      href: "/verify",
      label: "Verify Record",
      icon: ShieldCheck,
    },
  ];

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#172033]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#D9E1EA] bg-white px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#174A7E]/30"
          aria-label="NarcoLens home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0B1F3A]">
            <ShieldCheck size={19} className="text-white" />
          </div>

          <div>
            <h1 className="text-[16px] font-semibold tracking-tight text-[#0B1F3A]">
              NarcoLens
            </h1>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#667085]">
              Field Intelligence
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-[#172033]">
              Operator OP-1042
            </p>
            <p className="text-[11px] text-[#667085]">
              Hyderabad Unit
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B1F3A] text-[11px] font-semibold text-white">
            OP
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="min-w-0">
        <div className="border-b border-[#E8EDF3] bg-white/70 px-4 py-3 sm:px-6 lg:px-10">
          <p className="text-[11px] font-medium text-[#667085]">
            {section}
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-[#0B1F3A]">
            {title}
          </h2>
        </div>

        <div className="mx-auto w-full min-w-0 max-w-[1600px] p-4 pb-28 sm:p-6 sm:pb-28 lg:p-10 lg:pb-28">
          {pathname !== "/" && (
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-[#174A7E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#174A7E]/30"
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </Link>
          )}

          {children}
        </div>
      </div>

      {/* Floating bottom navigation */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6"
      >
        <div className="mx-auto max-w-[600px] rounded-xl border border-[#D9E1EA] bg-white/95 p-1.5 shadow-[0_4px_24px_rgba(11,31,58,0.12)] backdrop-blur-md">
          <div className="grid grid-cols-4 gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-2.5 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#174A7E]/40 sm:flex-row sm:gap-2 sm:px-3 ${
                    active
                      ? "bg-[#EAF2F8] text-[#174A7E]"
                      : "text-[#667085] hover:bg-[#F3F6F9] hover:text-[#172033]"
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.2 : 1.8}
                    className="shrink-0"
                  />

                  <span
                    className={`text-[10px] leading-tight sm:text-xs ${
                      active ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </main>
  );
}
