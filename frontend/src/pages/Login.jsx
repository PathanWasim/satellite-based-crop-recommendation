import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login, signup } = useAuth();
    const toast = useToast();

    const [isSignup, setIsSignup] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (isSignup) {
            if (formData.password !== formData.confirmPassword) {
                toast.error('Passwords do not match');
                setLoading(false);
                return;
            }
            if (formData.password.length < 6) {
                toast.error('Password must be at least 6 characters');
                setLoading(false);
                return;
            }

            const result = signup(formData.name, formData.email, formData.password);
            if (result.success) {
                toast.success('Account created successfully!');
                navigate('/');
            } else {
                toast.error(result.error);
            }
        } else {
            const result = login(formData.email, formData.password);
            if (result.success) {
                toast.success('Welcome back!');
                navigate('/');
            } else {
                toast.error(result.error);
            }
        }
        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">
                        <Sprout size={40} />
                    </div>
                    <h1>GeoCrop</h1>
                    <p>{isSignup ? 'Create your account' : 'Welcome back'}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {isSignup && (
                        <div className="form-group">
                            <label><User size={18} /> Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label><Mail size={18} /> Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label><Lock size={18} /> Password</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {isSignup && (
                        <div className="form-group">
                            <label><Lock size={18} /> Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? <Loader2 size={20} className="spinning" /> : (isSignup ? 'Sign Up' : 'Login')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isSignup ? 'Already have an account?' : "Don't have an account?"}
                        <button onClick={() => setIsSignup(!isSignup)}>
                            {isSignup ? 'Login' : 'Sign Up'}
                        </button>
                    </p>
                </div>

                <div className="demo-credentials">
                    <p>Demo: Create any account or use existing</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
