import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function PublicHeader() {
    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">RPMS</span>
                        </Link>
                        <nav className="hidden md:ml-8 md:flex md:space-x-8">
                            <Link href="/" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                Home
                            </Link>
                            <Link href="/#about" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                About
                            </Link>
                            <Link href="/#contact" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                Contact
                            </Link>
                        </nav>
                    </div>
                    {/* Buttons removed as per request */}
                </div>
            </div>
        </header>
    )
}
