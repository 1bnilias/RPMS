'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">

        {/* Logo / Icon */}
        <div className="flex justify-center mb-8">
          <Image
            src="/smu_logo_v2.png"
            alt="SMU Logo"
            width={150}
            height={150}
            className="object-contain drop-shadow-xl"
          />
        </div>

        {/* University Name */}
        <h2 className="text-2xl md:text-3xl font-serif tracking-wider text-red-100 uppercase">
          Saint Mary&apos;s University
        </h2>

        {/* System Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
          RPMS
        </h1>
        <p className="text-xl md:text-2xl text-red-100 max-w-2xl mx-auto">
          Research and Publication Management System
        </p>

        {/* Description */}
        <p className="text-lg text-red-200 max-w-xl mx-auto mt-8">
          A centralized platform for submitting, reviewing, and publishing academic research papers.
        </p>

        {/* Next Button */}
        <div className="pt-12">
          <Link href="/login">
            <Button size="lg" className="bg-white text-red-800 hover:bg-red-50 px-10 py-6 text-xl font-bold rounded-full shadow-lg transition-transform hover:scale-105">
              Next <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-red-300 text-sm">
        &copy; 2024 Saint Mary&apos;s University. All rights reserved.
      </div>
    </div>
  )
}
