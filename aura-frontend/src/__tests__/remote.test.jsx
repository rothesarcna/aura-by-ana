import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../App";
import { installFakeServer } from "./fakeServer";

// Numeric id = an account created by the real backend, so the dashboard talks to the API instead of localStorage.
const USER = { id: "7", fullName: "Ana Reyes", studentId: "2023-0001", email: "ana@x.ph", course: "BSIT", role: "student" };

let server;
beforeEach(() => {
  server = installFakeServer();
  localStorage.setItem("aura_session", JSON.stringify(USER));
});

const open = (path) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};
const reopen = (path) => {
  cleanup();
  return open(path);
};

async function createProjectAndSelect(ui, title = "Shuttle Tracker") {
  open("/dashboard/overview");
  await ui.click(await screen.findByRole("button", { name: "Create New Project" }));
  await ui.type(screen.getByPlaceholderText("e.g. Campus Shuttle Tracker"), title);
  await ui.type(screen.getByPlaceholderText("e.g. IT 412 - CS4A"), "IT 412 - CS4A");
  await ui.click(screen.getByRole("button", { name: "Create Project" }));
  await ui.click(await screen.findByText(title));
  await screen.findByRole("button", { name: /My Projects/ });
}

describe("server-backed dashboard", () => {
  it("sends the signed-in user's id with every request", async () => {
    open("/dashboard/overview");
    await screen.findByText("My Projects");
    expect(server.requests.length).toBeGreaterThan(0);
    expect(server.requests.every((r) => r.headers["X-User-Id"] === "7")).toBe(true);
  });

  it("creates a project on the server and lists it", async () => {
    const ui = userEvent.setup();
    await createProjectAndSelect(ui);
    expect(server.projects).toHaveLength(1);
    expect(server.projects[0].title).toBe("Shuttle Tracker");
    expect(server.members.filter((m) => m.projectId === server.projects[0].id)).toHaveLength(1); // creator joined
  });

  it("adds a component with a deadline and shows it after a reload", async () => {
    const ui = userEvent.setup();
    await createProjectAndSelect(ui);
    reopen("/dashboard/components/list"); // the selected project is remembered
    await ui.click(await screen.findByRole("button", { name: "+ Add component" }));
    await ui.type(screen.getByPlaceholderText(/Chapter 4/), "Chapter 2");
    await ui.click(screen.getByRole("button", { name: "Add component" }));
    expect(await screen.findByText("Due date is required.")).toBeInTheDocument(); // blocked before it reaches the server
    expect(server.components).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/Due date/), { target: { value: "2026-12-01" } });
    await ui.click(screen.getByRole("button", { name: "Add component" }));
    expect(await screen.findByText("Chapter 2")).toBeInTheDocument();
    expect(server.components[0]).toMatchObject({ name: "Chapter 2", dueDate: "2026-12-01" });

    reopen("/dashboard/components/list");
    expect(await screen.findByText("Chapter 2")).toBeInTheDocument();
  });

  it("walks feedback -> linked task -> changed instructions -> recorded change", async () => {
    const ui = userEvent.setup();
    await createProjectAndSelect(ui);
    const pid = server.projects[0].id;
    server.components.push({ id: 900, projectId: pid, name: "Chapter 2", description: null, type: "Chapter", status: "Pending", dueDate: "2026-12-01", progress: 0, ownerId: null, archived: false });

    reopen("/dashboard/feedback/add");
    await ui.type(await screen.findByPlaceholderText(/What needs to change/), "Group the studies by theme.");
    await ui.click(screen.getByRole("button", { name: "Save" }));
    // the save is asynchronous now, so wait for the list page (the typed text is still in the form until then)
    expect(await screen.findByText("Group the studies by theme.", { selector: "p" })).toBeInTheDocument();
    expect(server.feedback[0]).toMatchObject({ componentId: 900, status: "Open", version: 1 });

    // turn the feedback into a linked task
    await ui.click(screen.getByText("Group the studies by theme.", { selector: "p" }));
    await ui.type(await screen.findByPlaceholderText(/Rewrite the objectives/), "Reorganize section 2.3");
    await ui.click(screen.getByRole("button", { name: "Add action" }));
    expect(await screen.findByText("Reorganize section 2.3")).toBeInTheDocument();
    expect(server.tasks[0]).toMatchObject({ title: "Reorganize section 2.3", feedbackId: server.feedback[0].id });

    // the instructor changes their mind: the old text is kept as an earlier version
    await ui.click(screen.getByRole("button", { name: "Instructions changed?" }));
    const box = screen.getByLabelText("New instructions");
    await ui.clear(box);
    await ui.type(box, "Group by theme and state the research gap.");
    await ui.click(screen.getByRole("button", { name: "Save as new version" }));
    expect(await screen.findByText("Version history")).toBeInTheDocument();
    expect(screen.getByText("Version 2 of 2")).toBeInTheDocument();
    expect(server.feedback.map((f) => f.status)).toEqual(["Superseded", "Open"]);
    expect(screen.getByText("Group the studies by theme.", { selector: "p" })).toBeInTheDocument(); // old text still readable
    expect(screen.getByText(/linked to an earlier version/)).toBeInTheDocument(); // task stays with v1

    // document a change made in response
    await ui.type(screen.getByPlaceholderText("What did you change in response?"), "Reorganized section 2.3 by theme");
    await ui.click(screen.getByRole("button", { name: "Record change" }));
    expect(await screen.findByText(/Revision: Reorganized section 2.3 by theme/)).toBeInTheDocument();
    expect(server.history.some((h) => h.type === "Revision")).toBe(true);
  });

  it("moves a component through the revision board and ticks tasks", async () => {
    const ui = userEvent.setup();
    await createProjectAndSelect(ui);
    const pid = server.projects[0].id;
    server.components.push({ id: 901, projectId: pid, name: "Prototype", description: null, type: "Prototype", status: "For Revision", dueDate: "2026-12-01", progress: 20, ownerId: null, archived: false });
    server.tasks.push({ id: 902, projectId: pid, componentId: 901, feedbackId: null, title: "Fix login bug", description: null, status: "To Do", assigneeId: null, dueDate: null, archived: false });

    reopen("/dashboard/revisions/for-revision");
    const resubmit = await screen.findByRole("button", { name: "Resubmit" });
    expect(resubmit).toBeDisabled();
    await ui.click(screen.getByLabelText("Fix login bug"));
    await waitFor(() => expect(server.tasks[0].status).toBe("Done"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Resubmit" })).toBeEnabled());
    await ui.click(screen.getByRole("button", { name: "Resubmit" }));
    await waitFor(() => expect(server.components[0].status).toBe("Resubmitted"));
  });

  it("shows the server's message when a request is rejected", async () => {
    const ui = userEvent.setup();
    await createProjectAndSelect(ui);
    reopen("/dashboard/components/list");
    await ui.click(await screen.findByRole("button", { name: "+ Add component" }));
    await ui.type(screen.getByPlaceholderText(/Chapter 4/), "Chapter 9");
    fireEvent.change(screen.getByLabelText(/Due date/), { target: { value: "2026-12-01" } });
    server.failNext = { status: 400, error: "The assignee must be an active member of this project." };
    await ui.click(screen.getByRole("button", { name: "Add component" }));
    const banner = await screen.findByRole("alert");
    expect(within(banner).getByText(/assignee must be an active member/)).toBeInTheDocument();
    await ui.click(within(banner).getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("tells the user when the server cannot be reached", async () => {
    const { api } = await import("../services/apiClient");
    api.defaults.adapter = () => Promise.reject(Object.assign(new Error("Network Error"), { request: {} }));
    open("/dashboard/overview");
    expect(await screen.findByText(/Cannot reach the AURA server/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("deletes a project through the API", async () => {
    const ui = userEvent.setup();
    await createProjectAndSelect(ui, "Throwaway");
    await ui.click(screen.getByRole("button", { name: /My Projects/ }));
    const card = (await screen.findByText("Throwaway")).closest(".card");
    await ui.click(within(card).getByLabelText("Project Options"));
    await ui.click(within(card).getByText("Delete Project"));
    await waitFor(() => expect(screen.queryByText("Throwaway")).not.toBeInTheDocument());
    expect(server.projects[0].archived).toBe(true);
  });
});
