'use client'

import { User } from '@/lib/api'
import { Button } from "@/components/ui/button"
import { LayoutDashboard, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface WelcomeHeroProps {
    user: User
}

export default function WelcomeHero({ user }: WelcomeHeroProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome back, {user.name}!
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        You are logged in as a <span className="font-semibold capitalize text-red-600">{user.role}</span>.
                        Ready to continue your work?
                    </p>
                </div>

                <Link href="/dashboard">
                    <Button size="lg" className="px-8 py-6 text-lg bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition-all">
                        <LayoutDashboard className="mr-2 h-6 w-6" />
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
