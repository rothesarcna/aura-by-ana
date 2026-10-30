import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginStudent } from "../services/authService";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      return setError("Please fill in all fields.");
    }

    try {
      loginStudent(identifier, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-logo">AURA</h1>
        <p className="auth-tagline">Know What to Do Next.</p>
        <h2>Student Login</h2>

        {location.state?.registered && (
          <div className="auth-alert success">
            Account created! You can now log in.
          </div>
        )}
        {error && <div className="auth-alert error">{error}</div>}

        <div className="auth-field">
          <label htmlFor="identifier">Email or Student ID</label>
          <input
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="auth-btn">Log In</button>

        <p className="auth-switch">
          No account yet? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}