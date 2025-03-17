'use client'

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import useAuthStore from "@/store/store";


function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = useAuthStore().user;
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 py-3 flex justify-between items-center">
        {/* Left Side: Project Name */}
        <Link href="/" className="md:text-xl text-lg font-semibold font-serif">
           Company CMS
        </Link>

        {/* Center: Navigation Links (Hidden in Mobile) */}
        <nav className="hidden md:flex space-x-6">
          <a href="#" className="hover:text-gray-300">
            Home
          </a>
          <a href="#" className="hover:text-gray-300">
            About
          </a>
          <a href="#" className="hover:text-gray-300">
            Services
          </a>
          <a href="#" className="hover:text-gray-300">
            Contact
          </a>
        </nav>

        {/* Right Side: Login (md+) & Theme Toggle */}
        <div className="flex items-center space-x-4">
         {currentUser ? (
            <Button className="hidden md:block rounded-full md:px-6 lg:px-8 xl:px-10">
            <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button className="hidden md:block rounded-full md:px-6 lg:px-8 xl:px-10">
            <Link href="/sign-in">Login</Link>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Includes Login) */}
      {isOpen && (
        <div className="md:hidden dark:bg-gray-800 p-4 space-y-2">
          <a href="#" className="block py-2">
            Home
          </a>
          <a href="#" className="block py-2">
            About
          </a>
          <a href="#" className="block py-2">
            Services
          </a>
          <a href="#" className="block py-2">
            Contact
          </a>
          
          {currentUser ? (
            <Button className="md:hidden w-full rounded-full md:px-6 lg:px-8 xl:px-10">
            <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button className="md:hidden w-full rounded-full md:px-6 lg:px-8 xl:px-10">
            <Link href="/sign-in">Login</Link>
            </Button>
          )}
          
        </div>
      )}
    </header>
  );
}

export default Header;