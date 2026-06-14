import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Eye icons inline (no extra dep)
const EyeOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeClosed = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { setToken, backendUrl, token } = useContext(ShopContext);
  const navigate = useNavigate();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);

  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');

  const [otpSent, setOtpSent]         = useState(false);
  const [otp, setOtp]                 = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (token) navigate('/');
  }, [token, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const switchState = (state) => {
    setCurrentState(state);
    setOtpSent(false); setOtp('');
    setName(''); setEmail(''); setPassword(''); setPhone('');
    setShowPassword(false);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!backendUrl) return toast.error("Backend URL missing");
    setLoading(true);
    try {
      if (currentState === 'Login') {
        const { data } = await axios.post(`${backendUrl}/api/user/login`, { email, password });
        if (data.success) {
          setToken(data.token);
          sessionStorage.setItem('token', data.token);
          toast.success('Logged in successfully!');
          navigate('/');
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password, phone });
        if (data.success) {
          setOtpSent(true);
          setResendTimer(60);
          toast.success('OTP sent to your email!');
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/verify-otp`, { email, otp });
      if (data.success) {
        setToken(data.token);
        sessionStorage.setItem('token', data.token);
        toast.success('Email verified! Welcome to Kashvi Creations 🎉');
        navigate('/');
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password, phone });
      if (data.success) { setResendTimer(60); toast.success('OTP resent!'); }
      else toast.error(data.message);
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // OTP Screen
  if (otpSent) {
    return (
      <form onSubmit={onVerifyOtp} className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800">
        <div className="inline-flex items-center gap-2 mb-2 mt-10">
          <p className="prata-regular text-3xl">Verify Email</p>
          <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
        </div>
        <p className="text-sm text-gray-500 text-center">
          We sent a 6-digit OTP to <strong>{email}</strong>
        </p>
        <input
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          type="text" inputMode="numeric" maxLength={6}
          className="w-full px-3 py-3 border border-gray-800 text-center text-2xl tracking-widest"
          placeholder="_ _ _ _ _ _" required
        />
        <button type="submit" disabled={loading}
          className="bg-black text-white font-light px-8 py-2 mt-2 w-full disabled:opacity-60">
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
        <button type="button" onClick={onResendOtp} disabled={resendTimer > 0 || loading}
          className="text-sm text-blue-600 disabled:text-gray-400 cursor-pointer">
          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
        </button>
        <p onClick={() => setOtpSent(false)} className="text-sm text-gray-500 cursor-pointer hover:text-black">
          ← Go back
        </p>
      </form>
    );
  }

  // Login / Signup Form
  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800">
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {currentState === 'SignUp' && (
        <>
          <input onChange={e => setName(e.target.value)} value={name}
            type="text" required className="w-full px-3 py-2 border border-gray-800" placeholder="Full Name" />
          <input onChange={e => setPhone(e.target.value)} value={phone}
            type="tel" required className="w-full px-3 py-2 border border-gray-800" placeholder="Phone Number" />
        </>
      )}

      <input onChange={e => setEmail(e.target.value)} value={email}
        type="email" required className="w-full px-3 py-2 border border-gray-800" placeholder="Email" />

      {/* Password with show/hide toggle */}
      <div className="relative w-full">
        <input
          onChange={e => setPassword(e.target.value)} value={password}
          type={showPassword ? 'text' : 'password'}
          required
          className="w-full px-3 py-2 pr-10 border border-gray-800"
          placeholder="Password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
          tabIndex={-1}
        >
          {showPassword ? <EyeClosed /> : <EyeOpen />}
        </button>
      </div>

      <div className="w-full flex justify-between text-sm mt-[-8px]">
        <a href="#" className="cursor-pointer text-blue-600">Forgot your password?</a>
        <p onClick={() => switchState(currentState === 'Login' ? 'SignUp' : 'Login')}
          className="cursor-pointer text-blue-600">
          {currentState === 'Login' ? 'Create account' : 'Login Here'}
        </p>
      </div>

      <button className="bg-black text-white font-light px-8 py-2 mt-4 w-full disabled:opacity-60" disabled={loading}>
        {loading ? 'Processing...' : currentState === 'Login' ? 'Sign In' : 'Send OTP'}
      </button>
    </form>
  );
};

export default Login;