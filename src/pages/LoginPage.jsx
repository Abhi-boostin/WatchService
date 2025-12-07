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

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await authService.login(username, password);
            localStorage.setItem('token', data.access_token);
            navigate('/');
        } catch (err) {
            console.error('Login failed:', err);
            setError('Invalid username or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white font-sans">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                <Watch size={24} />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-gray-500">
                            Please enter your details to sign in.
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center justify-center">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or sign in with username</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-12 pr-6 py-4 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition-all outline-none"
                                    placeholder="Username or Email"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-6 py-4 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition-all outline-none"
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
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-gray-500">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-gray-500 hover:text-blue-600 underline decoration-gray-300 hover:decoration-blue-600 underline-offset-4">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-lg shadow-blue-600/30 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    <div className="text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-16 text-white">
                    <h3 className="text-4xl font-bold mb-4">Precision & Excellence</h3>
                    <p className="text-lg text-white/90 max-w-md">
                        Manage your watch service operations with our premium management solution.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
