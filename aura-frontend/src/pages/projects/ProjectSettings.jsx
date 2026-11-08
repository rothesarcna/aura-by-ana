import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import { STATUSES } from "../../data/mockData";

const toForm = (p) => ({
  title: p?.title || "",
  description: p?.description || "",
  subjectSection: p?.subjectSection || "",
  semester: p?.semester || "",
  professor: p?.professor || "",
  deadline: p?.deadline || "",
  members: p?.members ? p.members.join(", ") : "",
  status: p?.status || "Pending",
});

/*
 * Edit or delete the open project. Uses the same actions as the Edit / Delete menu on the
 * My Projects cards (updateProject / deleteProject), so local and server modes both work.
 */
export default function ProjectSettings() {
  const { selectedProject, actions } = useProject();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => toForm(selectedProject));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // if the project changes underneath us (switched project, server reload) show its values
  const projectId = selectedProject?.id;
  useEffect(() => {
    setForm(toForm(selectedProject));
    setSaved(false);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!selectedProject) return null;

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSaved(false);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Project title is required.");
    if (!form.subjectSection.trim()) return setError("Subject – Section is required.");
    setError("");
    setBusy(true);
    const result = await actions.updateProject(selectedProject.id, {
      title: form.title.trim(),
      status: form.status,
      description: form.description.trim(),
      semester: form.semester.trim(),
      subjectSection: form.subjectSection.trim(),
      professor: form.professor.trim(),
      deadline: form.deadline,
      members: form.members
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    });
    setBusy(false);
    // the server provider returns null after showing the server's error; the local one returns undefined
    if (result !== null) setSaved(true);
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${selectedProject.title}"? This removes the project and everything in it.`)) return;
    const result = await actions.deleteProject(selectedProject.id);
    if (result !== null && result !== false) navigate("/dashboard/overview");
  };

  return (
    <div className="settings-page">
      <form className="card settings-card" onSubmit={save} noValidate>
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        {saved && (
          <div className="alert success" role="status">
            Changes saved.
          </div>
        )}

        <label>
          Project title
          <input type="text" value={form.title} onChange={set("title")} required />
        </label>

        <label>
          Description
          <textarea rows="3" value={form.description} onChange={set("description")} />
        </label>

        <div className="settings-row">
          <label>
            Status
            <select value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Deadline
            <input type="date" value={form.deadline} onChange={set("deadline")} />
          </label>
        </div>

        <div className="settings-row">
          <label>
            Subject – Section
            <input type="text" value={form.subjectSection} onChange={set("subjectSection")} placeholder="e.g. IT 412 - CS4A" />
          </label>
          <label>
            Professor
            <input type="text" value={form.professor} onChange={set("professor")} placeholder="e.g. Dr. Maria Santos" />
          </label>
        </div>

        <div className="settings-row">
          <label>
            Semester
            <input type="text" value={form.semester} onChange={set("semester")} placeholder="e.g. 1st Semester 2026-2027" />
          </label>
          <label>
            Members (comma-separated)
            <input type="text" value={form.members} onChange={set("members")} placeholder="Ana Reyes, Marco Diaz" />
          </label>
        </div>

        <div className="settings-actions">
          <button type="button" className="btn danger-soft" onClick={remove}>
            Delete project
          </button>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}