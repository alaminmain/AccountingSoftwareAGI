import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Mail, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await api.post('/auth/forgotPassword', { email });
            setMessage('Password reset link has been sent to your email.');
        } catch (err: any) {
            console.error(err);
            // Even if email not found, security practice is to say sent. 
            // But usually Identity returns 200 OK.
            // If error, it might be 400 validation.
            setError('Failed to process request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Reset Password</h1>
                    <p className="text-muted-foreground text-sm mt-2">Enter your email to receive instructions</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-md bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-6 p-3 rounded-md bg-green-50 text-green-600 text-sm flex items-center gap-2 border border-green-100">
                        <CheckCircle className="w-4 h-4" />
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};
