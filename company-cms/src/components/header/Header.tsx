"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import useAuthStore from "@/store/store"
import ThemeToggle from "./ThemeToggle"

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const currentUser = useAuthStore().user
  const [isScrolledDown, setIsScrolledDown] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolledDown(true)
      } else {
        setIsScrolledDown(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <>
      <header
        className={`sticky px-2 sm:px-3 lg:px-4 top-0 z-50 py-3 w-full flex items-center justify-center min-h-[60px] sm:min-h-[70px] md:min-h-[80px] transition-all duration-300 ease-in-out ${
          isScrolledDown
            ? "bg-transparent shadow-none"
            : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 "
        }`}
      >
        <div
          className={`max-w-7xl w-full mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-5 lg:py-6 flex justify-between items-center rounded-full transition-all duration-300 ease-in-out ${
            isScrolledDown ? "bg-teal-400 dark:bg-teal-800/70" : "bg-teal-400 dark:bg-teal-800"
          }`}
        >
          {/* Left Side: Project Name */}
          <Link
            href="/"
            className="text-sm sm:text-lg md:text-xl font-bold font-serif dark:text-white truncate max-w-[100px] xs:max-w-[140px] sm:max-w-full"
          >
            Company CMS
          </Link>

          {/* Center: Navigation Links (Hidden in Mobile) */}
          <nav className="hidden font-semibold md:flex space-x-3  lg:space-x-6 text-sm lg:text-base">
            
            
            <a href="#features" className="dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Features
            </a>
            <a href="#content" className="dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Content
            </a>
            <a href="#stats" className=" dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Stats
            </a>
            <a href="#team" className=" dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Team
            </a>
            <a href="#testimonials" className=" dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Testimonials
            </a>
            
            <a href="#pricing" className=" dark:text-gray-200 hover:text-pink-400 dark:hover:text-white">
              Pricing
            </a>
          </nav>

          {/* Right Side: Login (md+) & Theme Toggle */}
          <div className="flex items-center space-x-1 sm:space-x-3 md:space-x-4">
            {currentUser ? (
              <Button className="hidden md:block rounded-full">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button className="hidden md:block rounded-full ">
                <Link href="/sign-in">Login</Link>
              </Button>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              className="md:hidden dark:text-white p-1"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} className="sm:w-5 sm:h-5" /> : <Menu size={20} className="sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown (Includes Login) */}
      {isOpen && (
        <div className="md:hidden bg-teal-400 dark:bg-teal-800 mt-5 p-3 sm:p-4 space-y-1 sm:space-y-2 fixed top-[60px] sm:top-[70px] md:top-[80px] left-0 right-0 z-40 w-screen overflow-y-auto max-h-[calc(100vh-60px)] sm:max-h-[calc(100vh-70px)] md:max-h-[calc(100vh-80px)]">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 font-semibold">
            
            
            <a
              href="#features"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Features
            </a>
            <a
              href="#content"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Content
            </a>
            <a
              href="#stats"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Stats
            </a>
            <a
              href="#team"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Team
            </a>
            <a
              href="#testimonials"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Testimonials
            </a>
            
            <a
              href="#pricing"
              className="block py-1.5 sm:py-2 dark:text-gray-200 dark:hover:text-white text-sm sm:text-base"
              onClick={closeMenu}
            >
              Pricing
            </a>

            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
              {currentUser ? (
                <Button className="w-full rounded-full">
                  <Link href="/dashboard" onClick={closeMenu}>
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <Button className="w-full rounded-full text-sm sm:text-base  dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                  <Link href="/sign-in" onClick={closeMenu}>
                    Login
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header

