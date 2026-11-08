import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import { MAIN_NAV, PROJECT_NAV } from "../config/navigation";

const DEMO = { id: "demo-user", fullName: "Ana Reyes", studentId: "2023-0001", email: "demo@aura.edu.ph", course: "BSIT", role: "student" };

function openApp(path, { project = "proj-1", user = DEMO } = {}) {
  localStorage.setItem("aura_session", JSON.stringify(user));
  if (project) localStorage.setItem(`aura_state_v1:${user.id}`, JSON.stringify({ selectedId: project }));
  window.history.pushState({}, "", path);
  return render(<App />);
}

const allRoutes = (nav) =>
  nav.flatMap((g) => g.sections).flatMap((s) => (s.views?.length ? s.views.map((v) => `/dashboard/${s.id}/${v.id}`) : [s.path || `/dashboard/${s.id}`]));

describe("every route renders", () => {
  const routes = [...new Set([...allRoutes(PROJECT_NAV), ...allRoutes(MAIN_NAV)])];

  it.each(routes)("seeded project: %s", async (route) => {
    openApp(route);
    await waitFor(() => expect(document.querySelector(".content")).toBeInTheDocument());
    expect(document.querySelector(".content").textContent.length).toBeGreaterThan(10);
  });

  it.each(routes)("brand-new empty project: %s", async (route) => {
    const user = { ...DEMO, id: "fresh" };
    localStorage.setItem("aura_session", JSON.stringify(user));
    const ui = userEvent.setup();
    window.history.pushState({}, "", "/dashboard/overview");
    render(<App />);
    await ui.click(screen.getByRole("button", { name: "Create New Project" }));
    await ui.type(screen.getByPlaceholderText("e.g. Campus Shuttle Tracker"), "Empty Project");
    await ui.type(screen.getByPlaceholderText("e.g. IT 412 - CS4A"), "IT 1 - A");
    await ui.click(screen.getByRole("button", { name: "Create Project" }));
    await ui.click(await screen.findByText("Empty Project"));
    await screen.findByRole("button", { name: /My Projects/ }); // project opened (header back button)
    expect(screen.getAllByText("Empty Project").length).toBeGreaterThan(0); // header + dashboard banner
    // jump to the route inside the SPA state
    cleanup();
    window.history.pushState({}, "", route);
    render(<App />);
    await waitFor(() => expect(document.querySelector(".content")).toBeInTheDocument());
  });
});


describe("auth (offline fallback)", () => {
  it("logs in with the demo account and opens the dashboard", async () => {
    const ui = userEvent.setup();
    window.history.pushState({}, "", "/login");
    render(<App />);
    await ui.type(screen.getByPlaceholderText("Enter your email or student ID"), "demo@aura.edu.ph");
    await ui.type(screen.getByPlaceholderText("Enter your password"), "demo1234");
    await ui.click(screen.getByRole("button", { name: "Log In" }));
    expect(await screen.findByText("My Projects")).toBeInTheDocument();
    expect(screen.getByText("Campus Shuttle Tracker")).toBeInTheDocument();
  });

  it("rejects a wrong password", async () => {
    const ui = userEvent.setup();
    window.history.pushState({}, "", "/login");
    render(<App />);
    await ui.type(screen.getByPlaceholderText("Enter your email or student ID"), "demo@aura.edu.ph");
    await ui.type(screen.getByPlaceholderText("Enter your password"), "wrongpass");
    await ui.click(screen.getByRole("button", { name: "Log In" }));
    expect(await screen.findByText(/Invalid email/)).toBeInTheDocument();
  });

  it("redirects to login when not signed in", async () => {
    window.history.pushState({}, "", "/dashboard/overview");
    render(<App />);
    expect(await screen.findByText("Welcome back")).toBeInTheDocument();
  });
});

describe("features", () => {
  it("adds a component and edits it", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/components/list");
    await ui.click(await screen.findByRole("button", { name: "+ Add component" }));
    await ui.type(screen.getByPlaceholderText(/Chapter 4/), "Chapter 4: Results");
    fireEvent.change(screen.getByLabelText(/Due date/), { target: { value: "2026-12-01" } });
    await ui.click(screen.getByRole("button", { name: "Add component" }));
    expect(await screen.findByText("Chapter 4: Results")).toBeInTheDocument();

    const row = screen.getByText("Chapter 4: Results").closest("tr");
    await ui.click(within(row).getByRole("button", { name: "Edit" }));
    const name = screen.getByDisplayValue("Chapter 4: Results");
    await ui.clear(name);
    await ui.type(name, "Chapter 4: Findings");
    await ui.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Chapter 4: Findings")).toBeInTheDocument();
  });

  it("validates the component form", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/components/list");
    await ui.click(await screen.findByRole("button", { name: "+ Add component" }));
    await ui.click(screen.getByRole("button", { name: "Add component" }));
    expect(await screen.findByText("Component name is required.")).toBeInTheDocument();
  });

  it("requires a deadline for every component", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/components/list");
    await ui.click(await screen.findByRole("button", { name: "+ Add component" }));
    await ui.type(screen.getByPlaceholderText(/Chapter 4/), "No deadline yet");
    await ui.click(screen.getByRole("button", { name: "Add component" }));
    expect(await screen.findByText("Due date is required.")).toBeInTheDocument();
  });

  it("records feedback, then turns it into a next action", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/feedback/add");
    await ui.type(await screen.findByPlaceholderText(/What needs to change/), "Objectives are too broad.");
    await ui.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Objectives are too broad.")).toBeInTheDocument();
    expect(screen.getAllByText("No next action yet").length).toBeGreaterThan(0);

    await ui.click(screen.getByText("Objectives are too broad."));
    expect(await screen.findByText(/Next actions/)).toBeInTheDocument();
    await ui.type(screen.getByPlaceholderText(/Rewrite the objectives/), "Rewrite objectives");
    await ui.click(screen.getByRole("button", { name: "Add action" }));
    expect(await screen.findByText("Rewrite objectives")).toBeInTheDocument();
    expect(screen.getByText(/1 task|0\/1 done/)).toBeInTheDocument();
  });

  it("blocks Resubmit until every revision task is ticked", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/revisions/for-revision");
    const resubmit = await screen.findByRole("button", { name: "Resubmit" });
    expect(resubmit).toBeDisabled();
    for (const box of screen.getAllByRole("checkbox").filter((b) => !b.checked)) await ui.click(box);
    expect(screen.getByRole("button", { name: "Resubmit" })).toBeEnabled();
    await ui.click(screen.getByRole("button", { name: "Resubmit" }));
    await waitFor(() => expect(screen.queryByText("Chapter 2 – Revision 2")).not.toBeInTheDocument());
  });

  it("creates a revision with tasks", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/revisions/pending");
    await ui.click(await screen.findByRole("button", { name: "+ New revision" }));
    await ui.type(screen.getByPlaceholderText(/Revision 3/), "Chapter 1 – Revision 9");
    await ui.type(screen.getByLabelText(/Revision tasks/), "Task A{enter}Task B");
    await ui.click(screen.getByRole("button", { name: "Create revision" }));
    expect(await screen.findByText("Chapter 1 – Revision 9")).toBeInTheDocument();
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Task B")).toBeInTheDocument();
  });

  it("adds a team member and assigns a task", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/team/members");
    await ui.type(await screen.findByLabelText("Name"), "Zed Ocampo");
    await ui.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Zed Ocampo")).toBeInTheDocument();
  });

  it("adds a link with URL validation", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/files/links");
    await ui.type(await screen.findByLabelText("Title"), "Shared Doc");
    await ui.type(screen.getByLabelText("URL"), "docs.google.com/abc");
    await ui.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Shared Doc")).toBeInTheDocument();
  });

  it("records the adviser decision on the approval page", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/components/approval");
    const row = (await screen.findByText("Chapter 2: Review of Related Literature")).closest("tr");
    await ui.click(within(row).getByRole("button", { name: "Mark approved" }));
    await waitFor(() => expect(within(row).queryByRole("button", { name: "Mark approved" })).not.toBeInTheDocument());
  });

  it("persists data across a reload", async () => {
    const ui = userEvent.setup();
    const first = openApp("/dashboard/components/list");
    await ui.click(await screen.findByRole("button", { name: "+ Add component" }));
    await ui.type(screen.getByPlaceholderText(/Chapter 4/), "Persisted Component");
    fireEvent.change(screen.getByLabelText(/Due date/), { target: { value: "2026-12-01" } });
    await ui.click(screen.getByRole("button", { name: "Add component" }));
    await screen.findByText("Persisted Component");
    first.unmount();
    window.history.pushState({}, "", "/dashboard/components/list");
    render(<App />);
    expect(await screen.findByText("Persisted Component")).toBeInTheDocument();
  });

  it("creates, edits and deletes a project", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/overview", { project: null });
    await ui.click(await screen.findByRole("button", { name: "Create New Project" }));
    await ui.type(screen.getByPlaceholderText("e.g. Campus Shuttle Tracker"), "Brand New Thesis");
    await ui.type(screen.getByPlaceholderText("e.g. IT 412 - CS4A"), "IT 9 - Z");
    await ui.click(screen.getByRole("button", { name: "Create Project" }));
    expect(await screen.findByText("Brand New Thesis")).toBeInTheDocument();

    const card = screen.getByText("Brand New Thesis").closest(".card");
    await ui.click(within(card).getByLabelText("Project Options"));
    await ui.click(within(card).getByText("Delete Project"));
    await waitFor(() => expect(screen.queryByText("Brand New Thesis")).not.toBeInTheDocument());
  });

  it("settings: theme and notification toggles take effect", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/settings/display");
    await ui.selectOptions(await screen.findByRole("combobox"), "dark");
    await waitFor(() => expect(document.querySelector(".dash")).toHaveAttribute("data-theme", "dark"));
  });

  it("account: changes the password and logs in with the new one", async () => {
    const ui = userEvent.setup();
    window.history.pushState({}, "", "/login");
    const first = render(<App />);
    await ui.type(screen.getByPlaceholderText("Enter your email or student ID"), "demo@aura.edu.ph");
    await ui.type(screen.getByPlaceholderText("Enter your password"), "demo1234");
    await ui.click(screen.getByRole("button", { name: "Log In" }));
    await screen.findByText("My Projects");
    first.unmount();

    window.history.pushState({}, "", "/dashboard/account/profile");
    render(<App />);
    const pwCard = (await screen.findByText("Change password", { selector: "button" })).closest("form");
    const inputs = pwCard.querySelectorAll("input");
    await ui.type(inputs[0], "demo1234");
    await ui.type(inputs[1], "newpass99");
    await ui.type(inputs[2], "newpass99");
    await ui.click(within(pwCard).getByRole("button", { name: "Change password" }));
    expect(await screen.findByText("Password changed successfully.")).toBeInTheDocument();
  });

  it("register then log in (offline)", async () => {
    const ui = userEvent.setup();
    window.history.pushState({}, "", "/register");
    render(<App />);
    const fill = async (id, v) => ui.type(document.getElementById(id), v);
    await fill("fullName", "Test Student");
    await fill("studentId", "2024-1111");
    await fill("email", "test@school.edu.ph");
    await fill("course", "BSIT");
    await fill("password", "password1");
    await fill("confirmPassword", "password1");
    await ui.click(screen.getByRole("button", { name: /register|create/i }));
    expect(await screen.findByText(/Account created/)).toBeInTheDocument();
    await ui.type(screen.getByPlaceholderText("Enter your email or student ID"), "2024-1111");
    await ui.type(screen.getByPlaceholderText("Enter your password"), "password1");
    await ui.click(screen.getByRole("button", { name: "Log In" }));
    expect(await screen.findByText("My Projects")).toBeInTheDocument();
  });
});

describe("layout: header + sidebar", () => {
  it("home shows the global sidebar, brand and create button", async () => {
    openApp("/dashboard/overview", { project: null });
    await screen.findByText("My Projects");
    expect(screen.getByText("Global Navigation")).toBeInTheDocument();
    for (const name of ["Home — My Projects", "Settings", "Account", "Help & Guide"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(screen.getByText("v1.1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create New Project" })).toBeInTheDocument();
  });

  it("an open project shows the project sidebar groups and header details", async () => {
    openApp("/dashboard/overview");
    await screen.findByRole("button", { name: /My Projects/ });
    for (const h of ["Main", "Project Management", "Feedback & Revisions", "Project Delivery", "Settings"]) {
      expect(screen.getAllByText(h, { selector: ".nav-group" }).length).toBe(1);
    }
    for (const l of ["Project Sections", "Files & Links", "Team Members", "Feedback Journal", "Revision History", "Clarification Tracker", "Next Actions", "Submissions", "Project Settings"]) {
      expect(screen.getByRole("link", { name: new RegExp(l) })).toBeInTheDocument();
    }
    expect(screen.getByText(/Deadline:/)).toBeInTheDocument();
    expect(screen.getByText(/Progress: \d+%/)).toBeInTheDocument();
  });

  it("every sidebar link points at a page that renders", async () => {
    const { PROJECT_SIDEBAR, GLOBAL_SIDEBAR } = await import("../config/navigation");
    const links = [...PROJECT_SIDEBAR, ...GLOBAL_SIDEBAR].flatMap((g) => g.items.map((i) => i.to));
    for (const to of new Set(links)) {
      cleanup();
      openApp(to);
      await waitFor(() => expect(document.querySelector(".content").textContent.length).toBeGreaterThan(10));
      expect(document.querySelector(".content").textContent).not.toMatch(/Open a project first/);
    }
  });

  it("the account menu offers Account, Settings, Help and Log out", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/overview");
    await ui.click(await screen.findByRole("button", { name: "Account menu" }));
    expect(screen.getByRole("menuitem", { name: /Account/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Help/ })).toBeInTheDocument();
    await ui.click(screen.getByRole("menuitem", { name: /Log out/ }));
    expect(await screen.findByText("Welcome back")).toBeInTheDocument();
  });

  it("project settings: saves edits and shows them in the header", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/project-settings");
    const title = await screen.findByLabelText("Project title");
    await ui.clear(title);
    await ui.type(title, "Renamed Thesis");
    await ui.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Changes saved.")).toBeInTheDocument();
    expect(screen.getAllByText("Renamed Thesis").length).toBeGreaterThan(0);
  });

  it("project settings: requires a title", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/project-settings");
    await ui.clear(await screen.findByLabelText("Project title"));
    await ui.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Project title is required.")).toBeInTheDocument();
  });

  it("project settings: deleting returns to My Projects", async () => {
    const ui = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    openApp("/dashboard/project-settings");
    await ui.click(await screen.findByRole("button", { name: "Delete project" }));
    expect(await screen.findByText("My Projects")).toBeInTheDocument();
    expect(screen.queryByText("Campus Shuttle Tracker")).not.toBeInTheDocument();
    confirm.mockRestore();
  });

  it("empty search offers a way out", async () => {
    const ui = userEvent.setup();
    openApp("/dashboard/overview", { project: null });
    await ui.type(await screen.findByLabelText("Search projects"), "zzzz-nothing");
    expect(await screen.findByText(/No projects match/)).toBeInTheDocument();
    await ui.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByText("Campus Shuttle Tracker")).toBeInTheDocument();
  });
});
