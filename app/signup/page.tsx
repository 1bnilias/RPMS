'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function SignupPage() {
    const router = useRouter()
    const { login } = useAuth()
    const [step, setStep] = useState(1) // 1: Signup, 2: Verification
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'author', // Default to author
        academic_year: '',
        author_type: '',
        author_category: '',
        academic_rank: '',
        qualification: '',
        employment_type: '',
        gender: '',
    })
    const [verificationCode, setVerificationCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (response.ok) {
                setStep(2) // Move to verification step
            } else {
                setError(data.error || 'Failed to sign up')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, code: verificationCode }),
            })

            const result = await response.json()

            if (response.ok && result.user) {
                login(result.user)
                router.push('/dashboard') // Or wherever you want to redirect
            } else {
                setError(result.error || 'Verification failed')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {step === 1 ? 'Create your account' : 'Verify your email'}
                    </h2>
                    {step === 1 && (
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Or{' '}
                            <Link href="/login" className="font-medium text-red-600 hover:text-red-500">
                                sign in to your existing account
                            </Link>
                        </p>
                    )}
                </div>

                {step === 1 ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="name" className="sr-only">Full Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            {/* Role selection removed, defaulting to Author */}

                            {/* Author Profile Fields */}
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700">Academic Year</label>
                                    <select
                                        id="academic_year"
                                        name="academic_year"
                                        required
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                        value={formData.academic_year}
                                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                    >
                                        <option value="">Select Year</option>
                                        <option value="2024-2025">2024-2025</option>
                                        <option value="2025-2026">2025-2026</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="author_type" className="block text-sm font-medium text-gray-700">Author Type</label>
                                    <select
                                        id="author_type"
                                        name="author_type"
                                        required
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                        value={formData.author_type}
                                        onChange={(e) => setFormData({ ...formData, author_type: e.target.value })}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="FA">FA</option>
                                        <option value="COA">COA</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="author_category" className="block text-sm font-medium text-gray-700">Author Category</label>
                                    <select
                                        id="author_category"
                                        name="author_category"
                                        required
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                        value={formData.author_category}
                                        onChange={(e) => setFormData({ ...formData, author_category: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="AS">AS</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="academic_rank" className="block text-sm font-medium text-gray-700">Academic Rank</label>
                                    <select
                                        id="academic_rank"
                                        name="academic_rank"
                                        required
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                        value={formData.academic_rank}
                                        onChange={(e) => setFormData({ ...formData, academic_rank: e.target.value })}
                                    >
                                        <option value="">Select Rank</option>
                                        <option value="GRA-I">GRA-I</option>
                                        <option value="GRA-II">GRA-II</option>
                                        <option value="LEC">LEC</option>
                                        <option value="AST">AST</option>
                                        <option value="ASC">ASC</option>
                                        <option value="PRF">PRF</option>
                                        <option value="AL">AL</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="qualification" className="block text-sm font-medium text-gray-700">Qualification</label>
                                    <select
                                        id="qualification"
                                        name="qualification"
                                        required
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                        value={formData.qualification}
                                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                    >
                                        <option value="">Select Qualification</option>
                                        <option value="MST">MST</option>
                                        <option value="PHD">PHD</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700">Employment Type</label>
                                    <select
                                        id="employment_type"
                                        name="employment_type"
                                        required
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                        value={formData.employment_type}
                                        onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="FT">FT</option>
                                        <option value="JAEI">JAEI</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        required
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                {loading ? 'Signing up...' : 'Sign up'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleVerify}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="code" className="sr-only">Verification Code</label>
                                <input
                                    id="code"
                                    name="code"
                                    type="text"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                                    placeholder="Enter 6-digit code"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                        </div>

                        <div className="text-sm text-center text-gray-600">
                            We sent a code to {formData.email}
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
