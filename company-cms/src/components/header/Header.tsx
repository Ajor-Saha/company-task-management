"use client"

import { useState, useEffect } from "react"
import { Menu, X, User, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import useAuthStore from "@/store/store"
import ThemeToggle from "./ThemeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuthStore() // Only used to check if logged in and for logout
  const [isScrolledDown, setIsScrolledDown] = useState(false)

  // Dummy user data - use this instead of actual user data
  const dummyUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    initial: "J",
  }

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

  const handleLogout = () => {
    logout()
    // Add any additional logout logic here
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
          {/* Right Side: Avatar Dropdown (if logged in) or Login Button & Theme Toggle */}
          <div className="flex items-center space-x-1 sm:space-x-3 md:space-x-4">
            {user ? (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 ring-2 ring-background dark:ring-gray-800">
                        <AvatarImage
                          src="data:image/jpeg;base64,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"
                          alt={dummyUser.name}
                          className="dark:brightness-90"
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {dummyUser.initial}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{dummyUser.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{dummyUser.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer flex w-full items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings/account-manage" className="cursor-pointer flex w-full items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button className="hidden md:block rounded-full">
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
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 py-2">
                    <Avatar className="h-8 w-8 ring-2 ring-background dark:ring-gray-800">
                      <AvatarImage
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundType=gradientLinear&accessories=prescription01,prescription02&clothingGraphic=skull,bear&top=shortCurly,shortFlat&hairColor=2c1b18,4a312c,724133&facialHair=beardMedium&facialHairColor=2c1b18,4a312c,724133"
                        alt={dummyUser.name}
                        className="dark:brightness-90"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {dummyUser.initial}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{dummyUser.name}</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">{dummyUser.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 py-2 text-sm sm:text-base"
                    onClick={closeMenu}
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/settings/account-manage"
                    className="flex items-center gap-2 py-2 text-sm sm:text-base"
                    onClick={closeMenu}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      closeMenu()
                    }}
                    className="flex items-center gap-2 py-2 text-sm sm:text-base w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              ) : (
                <Button className="w-full rounded-full text-sm sm:text-base dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
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

