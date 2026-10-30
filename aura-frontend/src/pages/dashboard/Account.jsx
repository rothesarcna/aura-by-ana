import { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { changePassword, updateProfile } from "../../services/authService";
import { Card } from "../../components/ui";

export default function Account({ view }) {
  const { user, setUser } = useProject();
  const [form, setForm] = useState({ fullName: user?.fullName ?? "", email: user?.email ?? "" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState(null); // { type, text }

  const saveProfile = (e) => {
    e.preventDefault();
    try {
      if (!form.fullName.trim()) throw new Error("Name is required.");
      if (!/^\S+@\S+\.\S+$/.test(form.email)) throw new Error("Enter a valid email.");
      setUser(updateProfile({ fullName: form.fullName.trim(), email: form.email.trim() }));
      setMsg({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const savePassword = (e) => {
    e.preventDefault();
    try {
      if (pw.next.length < 8) throw new Error("New password must be at least 8 characters.");
      if (pw.next !== pw.confirm) throw new Error("Passwords do not match.");
      changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      setMsg({ type: "success", text: "Password changed." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const alert = msg && <div className={`alert ${msg.type}`}>{msg.text}</div>;

  if (view === "profile") {
    return (
      <Card title="Your profile">
        <dl className="meta-grid">
          <div><dt>Full name</dt><dd>{user?.fullName}</dd></div>
          <div><dt>Student ID</dt><dd>{user?.studentId}</dd></div>
          <div><dt>Email</dt><dd>{user?.email}</dd></div>
          <div><dt>Course / Program</dt><dd>{user?.course}</dd></div>
          <div><dt>Role</dt><dd className="cap">{user?.role}</dd></div>
        </dl>
      </Card>
    );
  }

  if (view === "name-email") {
    return (
      <Card title="Update name and email">
        <form className="form" onSubmit={saveProfile}>
          {alert}
          <label>Full name<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <button className="btn" type="submit">Save changes</button>
        </form>
      </Card>
    );
  }

  if (view === "password") {
    return (
      <Card title="Change password">
        <form className="form" onSubmit={savePassword}>
          {alert}
          <label>Current password<input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
          <label>New password<input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
          <label>Confirm new password<input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
          <button className="btn" type="submit">Update password</button>
        </form>
      </Card>
    );
  }

  return (
    <Card title="Account role">
      <p>Your role is <span className="badge badge-submitted cap">{user?.role}</span></p>
      <ul className="bullets">
        <li>Create and manage project components</li>
        <li>Record feedback and request clarification</li>
        <li>Complete revision tasks and resubmit revisions</li>
        <li>Upload files and add links or references</li>
        <li>Request adviser approval</li>
      </ul>
      <p className="muted">Instructors and advisers will have extra permissions (reviewing, requesting revisions, approving) once that role is added.</p>
    </Card>
  );
}