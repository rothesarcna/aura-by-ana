import { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { Card, Empty, formatDate } from "../../components/ui";

const KIND_BY_VIEW = { uploaded: "file", links: "link", references: "reference" };
const ICON = { file: "📄", link: "🔗", reference: "📚" };
const LABEL = { file: "file", link: "document link", reference: "reference material" };

const formatSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function FileRow({ f }) {
  const { data, actions } = useProject();
  return (
    <div className="file-row">
      <span className="file-icon">{ICON[f.kind]}</span>
      <div className="file-main">
        {f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a> : <strong>{f.name}</strong>}
        <small className="muted">{f.addedBy} · {formatDate(f.date)}{f.size && ` · ${f.size}`}</small>
      </div>
      <select
        value={f.componentId}
        onChange={(e) => actions.setFileComponent(f.id, e.target.value)}
        aria-label="Connected component"
      >
        <option value="">— Not connected —</option>
        {data.components.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button className="btn ghost small" onClick={() => actions.removeFile(f.id)} aria-label="Remove">✕</button>
    </div>
  );
}

function AddForm({ kind }) {
  const { data, actions } = useProject();
  const [form, setForm] = useState({ name: "", url: "", size: "", componentId: "" });
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError(kind === "file" ? "Choose a file first." : "Enter a title.");
    let url = form.url.trim();
    if (kind !== "file") {
      try {
        url = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).href;
      } catch {
        return setError("Enter a valid URL.");
      }
    }
    actions.addFile({ kind, name: form.name.trim(), url, size: form.size, componentId: form.componentId });
    setForm({ name: "", url: "", size: "", componentId: "" });
    setError("");
    e.target.reset();
  };

  return (
    <Card title={`Add ${LABEL[kind]}`}>
      <form className="form row" onSubmit={submit}>
        {error && <div className="alert error full">{error}</div>}
        {kind === "file" ? (
          <label>File
            <input
              type="file"
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) setForm({ ...form, name: f.name, size: formatSize(f.size) });
              }}
            />
          </label>
        ) : (
          <>
            <label>Title<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>URL<input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></label>
          </>
        )}
        <label>Connect to component
          <select value={form.componentId} onChange={(e) => setForm({ ...form, componentId: e.target.value })}>
            <option value="">— Not connected —</option>
            {data.components.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button className="btn" type="submit">Add</button>
      </form>
    </Card>
  );
}

export default function Files({ view }) {
  const { data } = useProject();
  const { files, components } = data;

  if (view === "by-component") {
    const groups = [
      ...components.map((c) => ({ key: c.id, title: c.name, items: files.filter((f) => f.componentId === c.id) })),
      { key: "none", title: "Not connected to a component", items: files.filter((f) => !f.componentId) },
    ];
    return (
      <>
        {groups.map((g) => (
          <Card key={g.key} title={`${g.title} (${g.items.length})`}>
            {g.items.length ? g.items.map((f) => <FileRow key={f.id} f={f} />) : <Empty text="No files connected." />}
          </Card>
        ))}
      </>
    );
  }

  const kind = KIND_BY_VIEW[view];
  const items = files.filter((f) => f.kind === kind);
  return (
    <>
      <AddForm kind={kind} />
      <Card title={`All ${LABEL[kind]}s (${items.length})`}>
        {items.length ? items.map((f) => <FileRow key={f.id} f={f} />) : <Empty text="Nothing added yet." />}
      </Card>
    </>
  );
}