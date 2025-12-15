'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPaper, getCurrentUser, User } from '@/lib/api'
import PublicHeader from '@/components/PublicHeader'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'

export default function SubmitPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        type: 'research',
        file: null as File | null
    })

    useEffect(() => {
        async function checkAuth() {
            const currentUser = await getCurrentUser()
            if (currentUser) {
                setUser(currentUser)
                if (currentUser.role !== 'author') {
                    // Redirect non-authors
                    if (currentUser.role === 'admin') router.push('/admin')
                    else if (currentUser.role === 'editor') router.push('/editor')
                    else if (currentUser.role === 'coordinator') router.push('/coordinator')
                }
            } else {
                // Redirect unauthenticated users to login
                router.push('/login?redirect=/submit')
            }
            setLoading(false)
        }
        checkAuth()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        if (!user) return

        if (!formData.file) {
            setError('Please upload a file')
            setSubmitting(false)
            return
        }

        try {
            // 1. Upload File
            const { uploadFile } = await import('@/lib/api')
            const uploadResult = await uploadFile(formData.file)

            if (!uploadResult.success || !uploadResult.data) {
                throw new Error(uploadResult.error || 'File upload failed')
            }

            const fileUrl = uploadResult.data.url

            // 2. Create Paper
            const result = await createPaper({
                title: formData.title,
                abstract: formData.abstract,
                type: formData.type,
                file_url: fileUrl,
                author_id: user.id,
                status: 'submitted'
            })

            if (result.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/?portal=author') // Redirect to author dashboard after success
                }, 2000)
            } else {
                setError(result.error || 'Failed to submit paper')
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
                <PublicHeader />
                <div className="flex-1 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full text-center p-8">
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Submission Successful!</h2>
                        <p className="text-gray-500 mb-6">Your paper has been submitted for review. Redirecting you to your dashboard...</p>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <PublicHeader />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Submit New Paper</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Fill in the details below to submit your research for review.</p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-center">
                                    <AlertCircle className="h-5 w-5 mr-2" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="title">Paper Title</Label>
                                <Input
                                    id="title"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter the full title of your paper"
                                />
                            </div>

                            <div className="space-y-2 relative z-50">
                                <Label htmlFor="type">Paper Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger className="bg-white dark:bg-gray-800">
                                        <SelectValue placeholder="Select paper type" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[100] bg-white dark:bg-gray-800">
                                        <SelectItem value="research">Research Paper</SelectItem>
                                        <SelectItem value="thesis">Thesis</SelectItem>
                                        <SelectItem value="review">Review Article</SelectItem>
                                        <SelectItem value="case_study">Case Study</SelectItem>
                                        <SelectItem value="short_communication">Short Communication</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="abstract">Abstract</Label>
                                <Textarea
                                    id="abstract"
                                    required
                                    rows={6}
                                    value={formData.abstract}
                                    onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                                    placeholder="Provide a brief summary of your research..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="file">Upload Paper (PDF)</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        required
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFormData({ ...formData, file: e.target.files[0] })
                                            }
                                        }}
                                        className="cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Max file size: 10MB. Supported formats: PDF, DOC, DOCX.</p>
                            </div>

                            <div className="pt-4 flex justify-end space-x-4">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Upload className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Paper'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
