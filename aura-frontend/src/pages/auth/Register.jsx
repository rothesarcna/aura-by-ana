import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerStudent } from "../../services/authService";

// Static asset imports
import auraLogo from "../../assets/aura.png";
import auraV2Logo from "../../assets/aura_v2.png";
import anaLogo from "../../assets/ana.png";

import "./Auth.css";

const initialForm = {
  fullName: "",
  studentId: "",
  email: "",
  course: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.studentId.trim()) e.studentId = "Student ID is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.course.trim()) e.course = "Course/program is required.";
    if (form.password.length < 8) e.password = "At least 8 characters.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const found = validate();
    if (Object.keys(found).length) {
      return setErrors(found);
    }

    try {
      const { confirmPassword, ...data } = form;
      await registerStudent(data);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setServerError(err.message || "Registration failed. Please try again.");
    }
  };

  const renderField = (name, label, type = "text", placeholder = "") => (
    <div className="auth-field" key={name}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        placeholder={placeholder}
        onChange={handleChange}
        className={errors[name] ? "invalid" : ""}
      />
      {errors[name] && <span className="auth-error">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="auth-layout">
      {/* Top Navigation Header */}
      <header className="auth-header">
        <div className="auth-header-brand">
          <img src={anaLogo} alt="ANA Logo" className="auth-header-logo" />
          <span className="auth-header-title">AURA Platform</span>
        </div>
        <div className="auth-header-nav">
          <a href="#about" className="nav-link">About</a>
          <a href="#help" className="nav-link">Help</a>
          <span className="status-badge">
            <span className="status-dot"></span> System Operational
          </span>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="auth-body">
        {/* Left Hero Section */}
        <section className="auth-hero-left">
          <img src={auraV2Logo} alt="AURA Logo" className="hero-brand-logo-large" />

          <h2 className="hero-tagline">
            Keep track of feedback. Know what to do next.
          </h2>

          <h1 className="hero-title">
            Actionable Feedback &amp; Revision Tracking
          </h1>

          <p className="hero-subtitle">
            A centralized platform for managing academic project feedback, converting instructor comments into actionable tasks, and tracking revision progress.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="feature-text">
                <h3>Actionable Tasks</h3>
                <p>Convert feedback comments directly into clear revision tasks.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className="feature-text">
                <h3>Revision Tracking</h3>
                <p>Monitor submission updates and task completion in real-time.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="feature-text">
                <h3>Instructor Reviews</h3>
                <p>Stay aligned with evaluator expectations and rubric criteria.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon icon-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className="feature-text">
                <h3>Progress Analytics</h3>
                <p>Track project quality score growth across iterations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Auth Card Section */}
        <section className="auth-hero-right">
          <form className="auth-card" onSubmit={handleSubmit} noValidate>
            <div className="auth-card-header">
              <img src={auraLogo} alt="AURA Logo" className="auth-card-logo" />
              <h2>Student Registration</h2>
              <p className="auth-card-sub">Create your account to get started</p>
            </div>

            {serverError && <div className="auth-alert error">{serverError}</div>}

            {renderField("fullName", "Full Name", "text", "Juan Dela Cruz")}
            {renderField("studentId", "Student ID", "text", "2023-00001")}
            {renderField("email", "Email", "email", "you@school.edu.ph")}
            {renderField("course", "Course / Program", "text", "BSIT")}
            {renderField("password", "Password", "password")}
            {renderField("confirmPassword", "Confirm Password", "password")}

            <button type="submit" className="auth-btn">Create Account</button>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}