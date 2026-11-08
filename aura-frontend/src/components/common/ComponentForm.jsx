import { useState } from "react";
import { STATUSES } from "../../data/mockData";
import { Card } from "../ui";

// Add / edit form for a project component (chapter, diagram, prototype, slides...)
export default function ComponentForm({ initial, members = [], onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "Pending",
    due: initial?.due ?? "",
    owner: initial?.owner ?? "",
    progress: initial?.progress ?? 0,
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Component name is required.");
    const progress = Number(form.progress);
    if (!form.due) return setError("Due date is required.");
    if (Number.isNaN(progress) || progress < 0 || progress > 100) return setError("Progress must be between 0 and 100.");
    onSave({ ...form, name: form.name.trim(), description: form.description.trim(), progress });
  };

  return (
    <Card title={initial ? "Edit component" : "Add component"}>
      <form className="form row" onSubmit={submit}>
        {error && <div className="alert error full">{error}</div>}
        <label className="full">
          Name *
          <input value={form.name} onChange={set("name")} placeholder="e.g. Chapter 4: Results and Discussion" />
        </label>
        <label className="full">
          Description
          <textarea rows={2} value={form.description} onChange={set("description")} />
        </label>
        <label>
          Status
          <select value={form.status} onChange={set("status")}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Due date *
          <input type="date" value={form.due} onChange={set("due")} />
        </label>
        <label>
          Owner
          <select value={form.owner} onChange={set("owner")}>
            <option value="">— Unassigned —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Progress ({form.progress}%)
          <input type="range" min="0" max="100" step="5" value={form.progress} onChange={set("progress")} />
        </label>
        <div className="btn-row full" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn">
            {initial ? "Save changes" : "Add component"}
          </button>
        </div>
      </form>
    </Card>
  );
}
