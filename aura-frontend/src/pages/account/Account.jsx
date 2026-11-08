import { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { useNavigate } from "react-router-dom";
import { changePassword, deleteAccount, updateProfile } from "../../services/authService";
import { formatDate } from "../../components/ui";
import { Card } from "../../components/ui";

export default function Account({ view }) {
  const { user, setUser, selectedProject } = useProject();
  const navigate = useNavigate();

  // Split fullName into parts for the granular first, middle, last name inputs
  const nameParts = (user?.fullName ?? "").trim().split(" ");
  const initialFirst = nameParts[0] ?? "";
  const initialLast = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const initialMiddle = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

  const [form, setForm] = useState({
    firstName: initialFirst,
    middleName: initialMiddle,
    lastName: initialLast,
    email: user?.email ?? "",
    studentId: user?.studentId ?? ""
  });

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState(null); // { type, text }

  useEffect(() => {
    if (user) {
      const parts = (user.fullName ?? "").trim().split(" ");
      setForm({
        firstName: parts[0] ?? "",
        middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
        lastName: parts.length > 1 ? parts[parts.length - 1] : "",
        email: user.email ?? "",
        studentId: user.studentId ?? ""
      });
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        throw new Error("First and last names are required.");
      }
      if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        throw new Error("Enter a valid email address.");
      }

      const combinedFullName = `${form.firstName.trim()} ${form.middleName ? form.middleName.trim() + " " : ""}${form.lastName.trim()}`;

      const updated = await updateProfile({
        fullName: combinedFullName,
        email: form.email.trim(),
        studentId: form.studentId.trim()
      });
      setUser(updated);
      setMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      if (!pw.current) throw new Error("Enter your current password.");
      if (pw.next.length < 8) throw new Error("New password must be at least 8 characters.");
      if (pw.next !== pw.confirm) throw new Error("New passwords do not match.");
      const updated = await changePassword(pw.current, pw.next);
      setUser(updated);
      setPw({ current: "", next: "", confirm: "" });
      setMsg({ type: "success", text: "Password changed successfully." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const removeAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) return;
    const key = `aura_state_v1:${user?.id ?? user?.studentId ?? user?.email ?? "guest"}`;
    await deleteAccount();
    localStorage.removeItem(key);
    navigate("/login");
  };

  const alertBox = msg && <div className={`alert ${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>;

  return (
    <div className="account-page">
      {alertBox}

      <Card title="Your profile">
        <dl className="meta-grid">
          <div><dt>Full name</dt><dd>{user?.fullName || "User Name"}</dd></div>
          <div><dt>Student ID</dt><dd>{user?.studentId || "—"}</dd></div>
          <div><dt>Email</dt><dd>{user?.email || "—"}</dd></div>
          <div><dt>Course / Program</dt><dd>{user?.course || "BSIT"}</dd></div>
          <div><dt>Role</dt><dd className="cap">{user?.role || "Student"}</dd></div>
        </dl>
      </Card>

      <div className="grid-2">
        <div className="stack">
          <Card title="Personal information">
            <p className="muted">Your name comes from your class roster. Ask your instructor to correct it.</p>
            <form className="form wide" onSubmit={saveProfile}>
              <div className="form-grid cols-3">
                <label>
                  First name
                  <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </label>
                <label>
                  Middle name
                  <input type="text" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
                </label>
                <label>
                  Last name
                  <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </label>
              </div>
              <div className="form-grid cols-2">
                <label>
                  Email address
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
                <label>
                  Student ID number
                  <input type="text" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
                </label>
              </div>
              <div>
                <button className="btn small" type="submit">Save changes</button>
              </div>
            </form>
          </Card>

          <Card title="Password">
            <p className="muted">Keep your account secure with a strong password (at least 8 characters).</p>
            <form className="form wide" onSubmit={savePassword}>
              <label>
                Current password
                <input type="password" autoComplete="current-password" value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })} />
              </label>
              <label>
                New password
                <input type="password" autoComplete="new-password" value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              </label>
              <label>
                Confirm new password
                <input type="password" autoComplete="new-password" value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </label>
              <div>
                <button className="btn small" type="submit">Change password</button>
              </div>
              <small className="muted">
                Last changed: {user?.passwordChangedAt ? formatDate(user.passwordChangedAt) : "—"}
              </small>
            </form>
          </Card>
        </div>

        <div className="stack">
          <Card title="Team">
            <div className="stack">
              <div>
                <dt className="field-label">Project &amp; Group</dt>
                <dd className="field-value">
                  {selectedProject ? `${selectedProject.title} – ${selectedProject.subjectSection}` : "No Project Selected"}
                </dd>
              </div>
              <div>
                <dt className="field-label">Members</dt>
                <dd className="field-value">
                  {selectedProject?.members && selectedProject.members.length > 0 ? (
                    <ul className="bullets">
                      {selectedProject.members.map((member, idx) => (
                        <li key={idx}>{member}</li>
                      ))}
                    </ul>
                  ) : (
                    <span>{user?.fullName || "Student Developer"}</span>
                  )}
                </dd>
              </div>
            </div>
          </Card>

          <Card>
            <div className="danger-zone">
              <h4>⚠️ Danger zone</h4>
              <p>
                Deleting your account deactivates it immediately and signs you out. It will be permanently deleted after
                the administrator-configured retention period unless an administrator restores it before then.
              </p>
              <button type="button" className="btn danger small" onClick={removeAccount}>
                Delete my account
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}