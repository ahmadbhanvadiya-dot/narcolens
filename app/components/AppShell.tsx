"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  ClipboardList,
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
      icon: <ClipboardList size={17} />,
    },
    {
      href: "/test",
      label: "New Test",
      icon: <Camera size={17} />,
    },
    {
      href: "/test-records",
      label: "Test Records",
      icon: <ClipboardList size={17} />,
    },
    {
      href: "/verify",
      label: "Verify Record",
      icon: <ShieldCheck size={17} />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#172033]">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-[245px] shrink-0 border-r border-[#D9E1EA] bg-white md:flex md:flex-col">

          {/* Logo */}
          <div className="border-b border-[#D9E1EA] px-6 py-6">
            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0B1F3A]">
                <ShieldCheck
                  size={19}
                  className="text-white"
                />
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

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6">

            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
              Workspace
            </p>

            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-[#EAF2F8] font-medium text-[#0B1F3A]"
                      : "text-[#667085] hover:bg-[#F3F6F9] hover:text-[#172033]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}

          </nav>

          {/* Operator */}
          <div className="border-t border-[#D9E1EA] p-4">

            <div className="flex items-center gap-3 rounded-md px-2 py-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF2F8] text-xs font-semibold text-[#174A7E]">
                OP
              </div>

              <div>
                <p className="text-xs font-semibold text-[#172033]">
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
        <section className="min-w-0 flex-1">

          {/* Top bar */}
          <header className="flex h-[72px] items-center justify-between border-b border-[#D9E1EA] bg-white px-6 md:px-10">

            <div>
              <p className="text-xs text-[#667085]">
                {section}
              </p>

              <h2 className="text-lg font-semibold text-[#0B1F3A]">
                {title}
              </h2>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium">
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

          {/* Page */}
          <div className="p-6 md:p-10">

            {/* Back */}
            {pathname !== "/" && (
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#174A7E] hover:underline"
              >
                ← Back to Dashboard
              </Link>
            )}

            {children}

          </div>

        </section>

      </div>
    </main>
  );
}