'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, MapPin } from 'lucide-react'
import { getEvents, Event } from '@/lib/api'

export default function WelcomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  const slides = [
    {
      title: "Welcome to RPMS",
      description: "A centralized platform for submitting, reviewing, and publishing academic research papers."
    },
    {
      title: "Streamlined Submission",
      description: "Easily submit your research papers and track their progress through the review process."
    },
    {
      title: "Expert Review",
      description: "Connect with qualified reviewers to ensure the highest quality of academic publications."
    }
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex flex-col text-white">
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center space-y-8 w-full">

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

          {/* Onboarding Carousel */}
          <div className="min-h-[180px] flex flex-col justify-center transition-all duration-500 ease-in-out">
            <h3 className="text-2xl font-bold mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500" key={`title-${currentSlide}`}>
              {slides[currentSlide].title}
            </h3>
            <p className="text-lg text-red-200 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100" key={`desc-${currentSlide}`}>
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? "w-8 bg-white" : "w-2 bg-red-300/50"
                  }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <div className="pt-8">
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-white text-red-800 hover:bg-red-50 px-10 py-6 text-xl font-bold rounded-full shadow-lg transition-transform hover:scale-105"
            >
              {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-red-300 text-sm">
        &copy; 2024 Saint Mary&apos;s University. All rights reserved.
      </div>
    </div>
  )
}
