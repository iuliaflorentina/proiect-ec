import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
    const [showPw, setShowPw] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const navigate = useNavigate()

    const handleChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = (e) => {
        e.preventDefault()
        navigate('/')
    }

    const inputCls =
        'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-border bg-card p-8">
                    <div className="mb-8 flex flex-col items-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
                            <Palette className="h-6 w-6" />
                        </span>
                        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Join thousands of wearable art lovers
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                value={form.name}
                                onChange={handleChange}
                                className={inputCls}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                className={inputCls}
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPw ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    className={`${inputCls} pr-10`}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" size="lg">
                            Create Account
                        </Button>
                    </form>

                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/auth/login" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
