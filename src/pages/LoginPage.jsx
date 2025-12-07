import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, Watch, Mail } from 'lucide-react';
import { authService } from '../services/api';
import loginBg from '../assets/login-bg.png';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Bypass auth for UI development
        localStorage.setItem('token', 'dummy-token');
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen w-full flex bg-[#FDFBF7] font-sans">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="text-[#A68B5B]">
                                <Watch size={48} strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="text-4xl font-normal text-[#A68B5B] tracking-wide font-vend">Welcome back</h2>
                        <p className="mt-2 text-gray-600 font-light">
                            Please enter your details to sign in.
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center justify-center">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-[#E5E0D8]"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-light">or sign in with username</span>
                        <div className="flex-grow border-t border-[#E5E0D8]"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-5">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-[#A68B5B] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-12 pr-6 py-4 border border-[#A68B5B]/40 rounded-full focus:ring-1 focus:ring-[#A68B5B] focus:border-[#A68B5B] bg-[#FDFBF7] text-gray-800 placeholder-gray-500 transition-all outline-none"
                                    placeholder="Username or Email"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-[#A68B5B] transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-6 py-4 border border-[#A68B5B]/40 rounded-full focus:ring-1 focus:ring-[#A68B5B] focus:border-[#A68B5B] bg-[#FDFBF7] text-gray-800 placeholder-gray-500 transition-all outline-none"
                                    placeholder="Password"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-[#A68B5B] focus:ring-[#A68B5B] border-[#A68B5B]/40 rounded bg-[#FDFBF7]"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-gray-600 font-light">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-[#A68B5B] hover:text-[#8A734B] transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-lg shadow-[#0F172A]/20 text-base font-medium text-white bg-[#0F172A] hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F172A] transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    <div className="text-center text-sm text-gray-500 font-light">
                        Don't have an account?{' '}
                        <a href="#" className="font-medium text-[#A68B5B] hover:text-[#8A734B]">
                            Sign up
                        </a>
                    </div>
                </div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden lg:block w-1/2 relative overflow-hidden">
                <img
                    src={loginBg}
                    alt="Login Background"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>
        </div>
    );
};

export default LoginPage;
