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
        className={`sticky px-5 lg:px-0 top-0 z-50 w-full flex items-center justify-center min-h-[100px] transition-all duration-300 ease-in-out ${
          isScrolledDown
            ? "bg-transparent shadow-none"
            : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md"
        }`}
      >
        <div
          className={`max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex justify-between items-center rounded-full transition-all duration-300 ease-in-out ${
            isScrolledDown ? "bg-amber-100/70 dark:bg-teal-800/70" : "bg-amber-100 dark:bg-teal-800"
          }`}
        >
          {/* Left Side: Project Name */}
          <Link href="/" className="md:text-xl text-lg font-semibold font-serif dark:text-white">
            Company CMS
          </Link>

          {/* Center: Navigation Links (Hidden in Mobile) */}
          <nav className="hidden md:flex space-x-6">
            <a href="#hero" className="hover:text-gray-300 dark:text-gray-200 dark:hover:text-white">
              Hero
            </a>
            <a href="#clients" className="hover:text-gray-300 dark:text-gray-200 dark:hover:text-white">
              Logo Cloud
            </a>
            <a href="#features" className="hover:text-gray-300 dark:text-gray-200 dark:hover:text-white">
              Features
            </a>
            <a href="#content" className="hover:text-gray-300 dark:text-gray-200 dark:hover:text-white">
              Content
            </a>
            <a href="#stats" className="hover:text-gray-300 dark:text-gray-200 dark:hover:text-white">
              Stats
            </a>
            <a href="#team" className="hover:text-gray-300 dark:text-gray-200 dark:hover:text-white">
              Team
            </a>
            <a href="#testimonials" className="hover:text-gray-300 dark:text-gray-200 dark:hover:text-white">
              Testimonials
            </a>
            <a href="#cta" className="hover:text-gray-300 dark:text-gray-200 dark:hover:text-white">
              Call to Action
            </a>
            <a href="#pricing" className="hover:text-gray-300 dark:text-gray-200 dark:hover:text-white">
              Pricing
            </a>
          </nav>

          {/* Right Side: Login (md+) & Theme Toggle */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <Button className="hidden md:block rounded-full md:px-6 lg:px-8 xl:px-10 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button className="hidden md:block rounded-full md:px-6 lg:px-8 xl:px-10 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                <Link href="/sign-in">Login</Link>
              </Button>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button className="md:hidden dark:text-white" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown (Includes Login) */}
      {isOpen && (
        <div className="md:hidden bg-amber-100 dark:bg-teal-800 p-4 space-y-2 fixed top-[100px] left-0 right-0 z-40 w-screen overflow-y-auto max-h-[calc(100vh-100px)]">
          <div className="max-w-7xl mx-auto px-4">
            <a href="#hero" className="block py-2 dark:text-gray-200 dark:hover:text-white" onClick={closeMenu}>
              Hero
            </a>
            <a href="#clients" className="block py-2 dark:text-gray-200 dark:hover:text-white" onClick={closeMenu}>
              Logo Cloud
            </a>
            <a href="#features" className="block py-2 dark:text-gray-200 dark:hover:text-white" onClick={closeMenu}>
              Features
            </a>
            <a href="#content" className="block py-2 dark:text-gray-200 dark:hover:text-white" onClick={closeMenu}>
              Content
            </a>
            <a href="#stats" className="block py-2 dark:text-gray-200 dark:hover:text-white" onClick={closeMenu}>
              Stats
            </a>
            <a href="#team" className="block py-2 dark:text-gray-200 dark:hover:text-white" onClick={closeMenu}>
              Team
            </a>
            <a href="#testimonials" className="block py-2 dark:text-gray-200 dark:hover:text-white" onClick={closeMenu}>
              Testimonials
            </a>
            <a href="#cta" className="block py-2 dark:text-gray-200 dark:hover:text-white" onClick={closeMenu}>
              Call to Action
            </a>
            <a href="#pricing" className="block py-2 dark:text-gray-200 dark:hover:text-white" onClick={closeMenu}>
              Pricing
            </a>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {currentUser ? (
                <Button className="w-full rounded-full md:px-6 lg:px-8 xl:px-10 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button className="w-full rounded-full md:px-6 lg:px-8 xl:px-10 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                  <Link href="/sign-in">Login</Link>
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

