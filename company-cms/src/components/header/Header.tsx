"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useAuthStore from "@/store/store";
import ThemeToggle from "./ThemeToggle";

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = useAuthStore().user;
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolledDown(true);
      } else {
        setIsScrolledDown(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full flex items-center justify-center min-h-[100px] transition-all duration-300 ease-in-out ${
          isScrolledDown
            ? "bg-transparent shadow-none"
            : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md"
        }`}
      >
        <div
          className={`max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex justify-between items-center rounded-full transition-all duration-300 ease-in-out ${
            isScrolledDown
              ? "bg-[var(--light-cream)]/60 dark:bg-[var(--dark-slate)]/70"
              : "bg-[var(--light-tan)]/70 dark:bg-[var(--dark-teal)]"
          }`}
        >
          {/* Left Side: Project Name */}
          <Link
            href="/"
            className="md:text-xl text-lg font-semibold font-serif text-[var(--dark-navy)] dark:text-[var(--light-cream)]"
          >
            Company CMS
          </Link>

          {/* Center: Navigation Links (Hidden in Mobile) */}
          <nav className="hidden md:flex space-x-6">
            <a
              href="#"
              className="text-[var(--dark-blue)] hover:underline font-semibold hover:text-[var(--dark-aqua)] dark:text-[var(--light-beige)] dark:hover:text-[var(--light-cream)]"
            >
              Home
            </a>
            <a
              href="#"
              className="text-[var(--dark-blue)] hover:underline font-semibold hover:text-[var(--dark-aqua)] dark:text-[var(--light-beige)] dark:hover:text-[var(--light-cream)]"
            >
              About
            </a>
            <a
              href="#"
              className="text-[var(--dark-blue)] hover:underline font-semibold hover:text-[var(--dark-aqua)] dark:text-[var(--light-beige)] dark:hover:text-[var(--light-cream)]"
            >
              Services
            </a>
            <a
              href="#"
              className="text-[var(--dark-blue)] font-semibold hover:underline hover:text-[var(--dark-aqua)] dark:text-[var(--light-beige)] dark:hover:text-[var(--light-cream)]"
            >
              Contact
            </a>
          </nav>

          {/* Right Side: Login (md+) & Theme Toggle */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <Button className="hidden md:block rounded-full md:px-6 lg:px-8 xl:px-10 bg-[var(--light-tan)] hover:bg-[var(--light-pink)] dark:bg-[var(--dark-aqua)] dark:hover:bg-[var(--dark-jade)] text-[var(--dark-navy)] dark:text-[var(--light-cream)]">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button className="hidden md:block rounded-full md:px-6 lg:px-8 xl:px-10 bg-[var(--light-mauve)]/60 hover:bg-[var(--light-pink)] dark:bg-[var(--dark-aqua)] dark:hover:bg-[var(--dark-jade)] text-[var(--dark-navy)] dark:text-[var(--light-cream)]">
                <Link href="/sign-in">Login</Link>
              </Button>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-[var(--dark-navy)] dark:text-[var(--light-cream)]"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown (Includes Login) */}
      {isOpen && (
        <div className="md:hidden bg-[var(--light-cream)] dark:bg-[var(--dark-teal)] p-4 space-y-2 w-full max-w-7xl mx-auto mt-2 rounded-b-lg fixed top-[100px] left-0 right-0 z-40">
          <a
            href="#"
            className="block py-2 text-[var(--dark-blue)] hover:text-[var(--dark-aqua)] dark:text-[var(--light-beige)] dark:hover:text-[var(--light-cream)]"
          >
            Home
          </a>
          <a
            href="#"
            className="block py-2 text-[var(--dark-blue)] hover:text-[var(--dark-aqua)] dark:text-[var(--light-beige)] dark:hover:text-[var(--light-cream)]"
          >
            About
          </a>
          <a
            href="#"
            className="block py-2 text-[var(--dark-blue)] hover:text-[var(--dark-aqua)] dark:text-[var(--light-beige)] dark:hover:text-[var(--light-cream)]"
          >
            Services
          </a>
          <a
            href="#"
            className="block py-2 text-[var(--dark-blue)] hover:text-[var(--dark-aqua)] dark:text-[var(--light-beige)] dark:hover:text-[var(--light-cream)]"
          >
            Contact
          </a>

          {currentUser ? (
            <Button className="w-full rounded-full md:px-6 lg:px-8 xl:px-10 bg-[var(--light-tan)] hover:bg-[var(--light-pink)] dark:bg-[var(--dark-aqua)] dark:hover:bg-[var(--dark-jade)] text-[var(--dark-navy)] dark:text-[var(--light-cream)]">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button className="w-full rounded-full md:px-6 lg:px-8 xl:px-10 bg-[var(--light-tan)] hover:bg-[var(--light-pink)] dark:bg-[var(--dark-aqua)] dark:hover:bg-[var(--dark-jade)] text-[var(--dark-navy)] dark:text-[var(--light-cream)]">
              <Link href="/sign-in">Login</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export default Header;
