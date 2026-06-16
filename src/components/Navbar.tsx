import { Link, useLocation } from "react-router-dom";
import { Menu, X, Award, ShieldCheck, LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/src/contexts/AuthContext";
import { loginWithGoogle, logout } from "@/src/supabase";

const PUBLIC_NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Categories", path: "/categories" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, isJury, user } = useAuth();
  const NAV_LINKS = isAdmin || isJury
    ? [...PUBLIC_NAV_LINKS, { label: "Gallery", path: "/gallery" }]
    : PUBLIC_NAV_LINKS;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center">
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tighter uppercase">AI Architecture</span>
              <span className="text-[9px] font-medium tracking-widest uppercase text-gray-500">Awards 2026</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-widest transition-colors hover:text-gray-500",
                    location.pathname === link.path ? "text-black" : "text-gray-400"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              {isJury && !isAdmin && (
                <Link
                  to="/jury"
                  className={cn(
                    "flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest transition-colors hover:text-black",
                    location.pathname === "/jury" ? "text-black" : "text-gray-400"
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Jury Portal</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest transition-colors hover:text-red-500",
                    location.pathname === "/admin" ? "text-red-600" : "text-red-400"
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </Link>
              )}

              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/my-submissions"
                    className={cn(
                      "flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest transition-colors",
                      location.pathname === "/my-submissions" ? "text-black" : "text-gray-400 hover:text-black"
                    )}
                    title="My Submissions"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">{user.displayName?.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="text-gray-400 hover:text-black transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Login</span>
                </Link>
              )}

              <Link
                to={user ? "/submit" : "/login?redirect=/submit"}
                className="bg-black px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
              >
                Submit
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 text-black hover:bg-gray-100"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-black bg-white md:hidden"
          >
            <div className="space-y-1 px-4 pb-4 pt-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-2 text-sm font-medium uppercase tracking-widest",
                    location.pathname === link.path ? "text-black" : "text-gray-400"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              {isJury && !isAdmin && (
                <Link
                  to="/jury"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-2 text-sm font-bold uppercase tracking-widest",
                    location.pathname === "/jury" ? "text-black" : "text-gray-400"
                  )}
                >
                  Jury Portal
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-2 text-sm font-bold uppercase tracking-widest",
                    location.pathname === "/admin" ? "text-red-600" : "text-red-400"
                  )}
                >
                  Admin Console
                </Link>
              )}

              {user ? (
                <>
                  <Link
                    to="/my-submissions"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex w-full items-center space-x-3 px-3 py-2 text-sm font-bold uppercase tracking-widest",
                      location.pathname === "/my-submissions" ? "text-black" : "text-gray-400"
                    )}
                  >
                    <User className="h-4 w-4" />
                    <span>My Submissions</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center space-x-3 px-3 py-2 text-sm font-medium uppercase tracking-widest text-gray-400"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout ({user.displayName?.split(' ')[0]})</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center space-x-3 px-3 py-2 text-sm font-medium uppercase tracking-widest text-gray-400"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}

              <Link
                to={user ? "/submit" : "/login?redirect=/submit"}
                onClick={() => setIsOpen(false)}
                className="block bg-black px-3 py-3 text-center text-sm font-bold uppercase tracking-widest text-white"
              >
                Submit Project
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
