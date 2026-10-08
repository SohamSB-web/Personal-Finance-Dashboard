import React, { useState } from 'react';
import { api } from '../api';

export default function AuthPage({ onLoginSuccess }) {
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState(1); // 1 = Phone input, 2 = OTP verification
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!phone || phone.trim().length < 8) {
      setError('Please enter a valid phone number with country code (e.g. +91 9876543210)');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(phone.trim());
      setInfo(res.message || 'OTP sent successfully to your phone via WhatsApp/SMS');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!code || code.trim().length < 4) {
      setError('Please enter the OTP code received');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(phone.trim(), code.trim(), name.trim());
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Invalid OTP code. Please check and re-enter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-badge">₹</div>
          <h2>Personal Finance</h2>
          <p className="auth-subtitle">
            {step === 1 ? 'Sign in or register with instant WhatsApp / SMS OTP' : 'Verify your one-time passcode'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {info && <div className="alert alert-success">{info}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="input-affix">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  autoFocus
                />
              </div>
              <small className="helper-text">
                Include country code (e.g., <strong>+91</strong> for India, <strong>+1</strong> for US)
              </small>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Sending OTP via Minimoth...' : 'Send OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="phone-preview">
              <span>Code sent to: <strong>{phone}</strong></span>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setStep(1);
                  setCode('');
                  setError('');
                }}
              >
                Change
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="name">Your Name (Optional)</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Sharma"
              />
            </div>

            <div className="form-group">
              <label htmlFor="code">6-Digit OTP Code</label>
              <input
                id="code"
                type="text"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="otp-input"
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Enter Dashboard'}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-block mt-2"
              onClick={handleSendOtp}
              disabled={loading}
            >
              Resend OTP
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span className="badge-shield">⚡ Powered by Minimoth OTP API</span>
        </div>
      </div>
    </div>
  );
}
