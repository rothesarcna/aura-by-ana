import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerStudent } from "../services/authService";
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
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError("");
    const found = validate();
    if (Object.keys(found).length) return setErrors(found);

    try {
      const { confirmPassword, ...data } = form;
      registerStudent(data);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setServerError(err.message);
    }
  };

  const field = (name, label, type = "text", placeholder = "") => (
    <div className="auth-field">
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
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-logo">AURA</h1>
        <p className="auth-tagline">Know What to Do Next.</p>
        <h2>Student Registration</h2>

        {serverError && <div className="auth-alert error">{serverError}</div>}

        {field("fullName", "Full Name", "text", "Juan Dela Cruz")}
        {field("studentId", "Student ID", "text", "2023-00001")}
        {field("email", "Email", "email", "you@school.edu.ph")}
        {field("course", "Course / Program", "text", "BSIT")}
        {field("password", "Password", "password")}
        {field("confirmPassword", "Confirm Password", "password")}

        <button type="submit" className="auth-btn">Create Account</button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}