import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  Bars3Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import WorkspaceSelector from "./WorkspaceSelector";
import BusinessOnboardingModal from "./BusinessOnboardingModal";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: ComputerDesktopIcon },
  { name: "Decision Wizard", href: "/wizard", icon: SparklesIcon, highlight: true },
  { name: "Inventory & Catalog", href: "/inventory", icon: ArchiveBoxIcon },
  { name: "Suppliers", href: "/suppliers", icon: BuildingStorefrontIcon },
  { name: "Sales & Velocity", href: "/sales", icon: ArrowTrendingUpIcon },
  { name: "Workflow Canvas", href: "/workflows", icon: ChartBarIcon },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark relative">
      <BusinessOnboardingModal />

      {/* Mobile Sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative w-full max-w-xs flex max-h-full">
                <div className="flex grow flex-col gap-y-4 overflow-y-auto bg-surface-light px-5 pb-4 dark:bg-surface-dark border-r border-surface-light-border dark:border-surface-dark-border">
                  <div className="flex h-16 shrink-0 items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-brand-600 dark:text-brand-400">DMOC</span>
                      <span className="block text-[10px] text-text-light-muted">Decision Marketing Operating System</span>
                    </div>
                    <button
                      type="button"
                      className="-m-2.5 p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="py-1">
                    <WorkspaceSelector />
                  </div>

                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <NavLink
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                              clsx(
                                "group flex items-center gap-x-3 rounded-xl p-2.5 text-xs font-bold transition-all",
                                isActive
                                  ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shadow-sm"
                                  : "text-text-light-muted hover:bg-surface-light-hover hover:text-text-light dark:text-text-dark-muted dark:hover:bg-surface-dark-hover dark:hover:text-text-dark"
                              )
                            }
                          >
                            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                            {item.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#07090e]/85 backdrop-blur-2xl px-5 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/30 ring-1 ring-white/20">
                <CubeIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl font-heading font-black bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                  DMOC
                </span>
                <span className="block text-[10px] font-semibold text-text-light-muted dark:text-text-dark-muted tracking-tight">
                  Decision Marketing Operating System
                </span>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <WorkspaceSelector />
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      clsx(
                        "group flex items-center gap-x-3 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isActive
                          ? "bg-gradient-to-r from-brand-500/15 via-indigo-500/10 to-transparent text-brand-600 dark:text-cyan-400 font-extrabold shadow-xs border-l-2 border-brand-500"
                          : "text-text-light-muted hover:bg-slate-100/70 hover:text-text-light dark:text-text-dark-muted dark:hover:bg-white/5 dark:hover:text-text-dark",
                        item.highlight && !isActive && "text-brand-600 dark:text-cyan-400 font-extrabold"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.name}</span>
                    {item.highlight && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-cyan-400 font-black border border-brand-500/20">
                        AI
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-brand-500/5 to-cyan-500/5 border border-indigo-500/20 backdrop-blur-md text-[11px] text-text-light-muted dark:text-text-dark-muted shadow-xs">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-text-light dark:text-text-dark text-xs">DMOC Intelligence</span>
            </div>
            <p className="italic text-slate-500 dark:text-slate-400 leading-snug">
              "Know the risk. Understand the opportunity. Decide with evidence."
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-white/75 dark:bg-[#07090e]/80 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="hidden sm:block text-xs font-medium text-text-light-muted dark:text-text-dark-muted">
              Evidence-based purchasing, inventory & operational simulations
            </div>
          </div>

          <div className="flex items-center gap-x-4">
            <button
              type="button"
              className="rounded-lg p-2 text-text-light-muted hover:bg-surface-light-hover hover:text-text-light dark:text-text-dark-muted dark:hover:bg-surface-dark-hover dark:hover:text-text-dark"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {resolvedTheme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            <div className="relative">
              <button
                type="button"
                className="-m-1.5 flex items-center gap-1.5 rounded-lg p-1.5 text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark focus:outline-none"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
              >
                <UserCircleIcon className="h-8 w-8" aria-hidden="true" />
                <span className="hidden font-semibold text-xs lg:block">{user?.name}</span>
              </button>

              <Transition.Root show={userMenuOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setUserMenuOpen}>
                  <Transition.Child
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="fixed inset-0" />
                  </Transition.Child>

                  <div className="fixed right-4 top-14 z-50 lg:right-8">
                    <Dialog.Panel className="w-56 rounded-xl border border-surface-light-border bg-surface-light shadow-2xl dark:border-surface-dark-border dark:bg-surface-dark p-2">
                      <div className="px-3 py-2 border-b border-surface-light-border dark:border-surface-dark-border">
                        <p className="text-xs font-bold text-text-light dark:text-text-dark">{user?.name}</p>
                        <p className="text-[11px] text-text-light-muted dark:text-text-dark-muted truncate">{user?.email}</p>
                      </div>
                      <NavLink
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-x-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-text-light-muted hover:bg-surface-light-hover hover:text-text-light dark:hover:bg-surface-dark-hover"
                      >
                        <Cog6ToothIcon className="h-4 w-4" />
                        Settings
                      </NavLink>
                      <NavLink
                        to="/guide"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-x-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-text-light-muted hover:bg-surface-light-hover hover:text-text-light dark:hover:bg-surface-dark-hover"
                      >
                        <QuestionMarkCircleIcon className="h-4 w-4" />
                        User Guide
                      </NavLink>
                      <button
                        type="button"
                        onClick={async () => { await logout(); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-x-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        Sign out
                      </button>
                    </Dialog.Panel>
                  </div>
                </Dialog>
              </Transition.Root>
            </div>
          </div>
        </header>

        <main className="py-6">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}