export const STATUSES = ["Pending", "Submitted", "Under Review", "For Revision", "Resubmitted", "Approved"];
export const APPROVALS = ["Not Requested", "Pending", "Approved", "Rejected"];

export const defaultSettings = {
  landing: "/dashboard/overview/summary",
  theme: "light",
  compact: false,
  notify: { feedback: true, reminder: true, deadline: true, approval: true, team: true },
  privacy: { showActivity: true, showEmail: false },
};

export const seed = {
  project: {
    title: "Smart Campus Navigation System",
    type: "Capstone Project",
    adviser: "Dr. Maria Santos",
    startDate: "2026-08-01",
    description:
      "A mobile-friendly campus navigation system that helps students and visitors find rooms, offices, and events.",
  },
  components: [
    { id: "c1", name: "Chapter 1: Introduction", description: "Background, problem statement, objectives, scope and limitations.", status: "Approved", approval: "Approved", progress: 100, due: "2026-09-15", owner: "m1" },
    { id: "c2", name: "Chapter 2: Review of Related Literature", description: "Related studies, synthesis, and research gap.", status: "For Revision", approval: "Pending", progress: 70, due: "2026-11-05", owner: "m2" },
    { id: "c3", name: "Chapter 3: Methodology", description: "Research design, respondents, sampling, instruments, and treatment of data.", status: "Under Review", approval: "Pending", progress: 60, due: "2026-11-12", owner: "m3" },
    { id: "c4", name: "System Design (DFD & ERD)", description: "Context diagram, DFD levels, and entity relationship diagram.", status: "Submitted", approval: "Not Requested", progress: 45, due: "2026-11-20", owner: "m1" },
    { id: "c5", name: "Prototype Development", description: "Working prototype of the navigation app.", status: "Pending", approval: "Not Requested", progress: 15, due: "2026-12-10", owner: "m2" },
    { id: "c6", name: "Title Defense Slides", description: "Presentation deck for the title defense.", status: "Resubmitted", approval: "Pending", progress: 85, due: "2026-10-25", owner: "m3" },
  ],
  revisions: [
    { id: "r1", componentId: "c2", title: "Chapter 2 – Revision 2", status: "For Revision", tasks: [
      { id: "t1", text: "Add 5 more recent studies (2022–2026)", done: true },
      { id: "t2", text: "Fix APA 7 citations in section 2.3", done: false },
      { id: "t3", text: "Rewrite synthesis by theme and state the research gap", done: false },
    ]},
    { id: "r2", componentId: "c3", title: "Chapter 3 – Revision 1", status: "Under Review", tasks: [
      { id: "t4", text: "Justify the sample size", done: true },
    ]},
    { id: "r3", componentId: "c4", title: "System Design – Draft 1", status: "Submitted", tasks: [
      { id: "t5", text: "Include the context diagram", done: true },
    ]},
    { id: "r4", componentId: "c5", title: "Prototype – Initial Plan", status: "Pending", tasks: [
      { id: "t6", text: "Draft the prototype timeline", done: false },
    ]},
    { id: "r5", componentId: "c6", title: "Defense Slides – Revision 2", status: "Resubmitted", tasks: [
      { id: "t7", text: "Reduce text on slides 4–7", done: true },
    ]},
    { id: "r6", componentId: "c1", title: "Chapter 1 – Final", status: "Approved", tasks: [
      { id: "t8", text: "Narrow the scope in the problem statement", done: true },
    ]},
  ],
  feedback: [
    { id: "f1", componentId: "c2", type: "feedback", status: "Open", author: "Dr. Maria Santos", date: "2026-10-26T09:00:00Z", text: "Your synthesis only summarizes sources. Group the studies by theme and make the research gap explicit.", replies: [] },
    { id: "f2", componentId: "c3", type: "clarification", status: "Open", author: "Alex Rivera", date: "2026-10-27T10:30:00Z", text: "Should the sampling method be purposive or stratified for the survey respondents?", replies: [] },
    { id: "f3", componentId: "c2", type: "feedback", status: "Open", author: "Dr. Maria Santos", date: "2026-10-26T09:05:00Z", text: "Citations in section 2.3 do not follow APA 7th edition.", replies: [] },
    { id: "f4", componentId: "c1", type: "feedback", status: "Resolved", author: "Dr. Maria Santos", date: "2026-09-08T08:00:00Z", text: "Narrow the scope in the problem statement.", replies: [
      { id: "p1", author: "Alex Rivera", date: "2026-09-10T14:00:00Z", text: "Updated the scope in section 1.3." },
    ]},
    { id: "f5", componentId: "c6", type: "feedback", status: "Resolved", author: "Dr. Maria Santos", date: "2026-10-15T11:00:00Z", text: "Reduce text on slides 4–7.", replies: [] },
    { id: "f6", componentId: "c4", type: "clarification", status: "Resolved", author: "Alex Rivera", date: "2026-10-13T09:00:00Z", text: "Does the DFD need to go down to Level 2?", replies: [
      { id: "p2", author: "Dr. Maria Santos", date: "2026-10-14T09:30:00Z", text: "Level 1 is enough for now." },
    ]},
  ],
  files: [
    { id: "x1", name: "Chapter2_Draft_v2.docx", kind: "file", url: "", componentId: "c2", size: "412 KB", addedBy: "Ben Cruz", date: "2026-10-24T08:00:00Z" },
    { id: "x2", name: "Survey_Questionnaire.pdf", kind: "file", url: "", componentId: "c3", size: "1.2 MB", addedBy: "Carla Mendoza", date: "2026-10-18T08:00:00Z" },
    { id: "x3", name: "DFD_Level0.png", kind: "file", url: "", componentId: "c4", size: "240 KB", addedBy: "Alex Rivera", date: "2026-10-12T08:00:00Z" },
    { id: "x4", name: "Project Folder (Google Drive)", kind: "link", url: "https://drive.google.com", componentId: "", size: "", addedBy: "Alex Rivera", date: "2026-08-02T08:00:00Z" },
    { id: "x5", name: "Chapter 3 Working Document", kind: "link", url: "https://docs.google.com", componentId: "c3", size: "", addedBy: "Carla Mendoza", date: "2026-10-05T08:00:00Z" },
    { id: "x6", name: "APA 7th Edition Guide", kind: "reference", url: "https://apastyle.apa.org", componentId: "c2", size: "", addedBy: "Ben Cruz", date: "2026-10-01T08:00:00Z" },
    { id: "x7", name: "Writing Guide (Purdue OWL)", kind: "reference", url: "https://owl.purdue.edu", componentId: "", size: "", addedBy: "Alex Rivera", date: "2026-08-10T08:00:00Z" },
  ],
  history: [
    { id: "h1", hash: "a1f3c9e", type: "revision", message: "Resubmitted Defense Slides – Revision 2", author: "Carla Mendoza", date: "2026-10-28T09:00:00Z", componentId: "c6", changes: { added: 14, removed: 9 } },
    { id: "h2", hash: "b72d0e4", type: "feedback", message: "Requested clarification on sampling method", author: "Alex Rivera", date: "2026-10-27T10:30:00Z", componentId: "c3", changes: { added: 0, removed: 0 } },
    { id: "h3", hash: "9c4e1ab", type: "feedback", message: "Adviser feedback: Chapter 2 synthesis needs rework", author: "Dr. Maria Santos", date: "2026-10-26T09:00:00Z", componentId: "c2", changes: { added: 0, removed: 0 } },
    { id: "h4", hash: "5d8a7f2", type: "change", message: "Uploaded Chapter2_Draft_v2.docx", author: "Ben Cruz", date: "2026-10-24T08:00:00Z", componentId: "c2", changes: { added: 120, removed: 45 } },
    { id: "h5", hash: "e03b6c8", type: "submission", message: "Chapter 3 submitted for review", author: "Carla Mendoza", date: "2026-10-20T08:00:00Z", componentId: "c3", changes: { added: 210, removed: 30 } },
    { id: "h6", hash: "47fa92d", type: "submission", message: "System Design draft submitted", author: "Alex Rivera", date: "2026-10-12T08:00:00Z", componentId: "c4", changes: { added: 88, removed: 0 } },
    { id: "h7", hash: "c19e5b3", type: "approval", message: "Chapter 1 approved by adviser", author: "Dr. Maria Santos", date: "2026-09-18T08:00:00Z", componentId: "c1", changes: { added: 0, removed: 0 } },
    { id: "h8", hash: "2b6d7a0", type: "change", message: "Narrowed scope in problem statement", author: "Alex Rivera", date: "2026-09-10T08:00:00Z", componentId: "c1", changes: { added: 18, removed: 26 } },
  ],
  members: [
    { id: "m1", name: "Alex Rivera", role: "Team Leader", email: "alex@school.edu.ph", responsibilities: ["Coordinate with the adviser", "Manage deadlines", "Write Chapter 1 and system design"] },
    { id: "m2", name: "Ben Cruz", role: "Researcher / Writer", email: "ben@school.edu.ph", responsibilities: ["Literature review", "Citations and references", "Documentation"] },
    { id: "m3", name: "Carla Mendoza", role: "Developer", email: "carla@school.edu.ph", responsibilities: ["Methodology and instruments", "Prototype development", "Defense slides"] },
  ],
  tasks: [
    { id: "k1", title: "Add 5 recent studies to Chapter 2", assignee: "m2", componentId: "c2", status: "In Progress", due: "2026-11-02" },
    { id: "k2", title: "Fix APA 7 citations", assignee: "m2", componentId: "c2", status: "To Do", due: "2026-11-03" },
    { id: "k3", title: "Finalize sampling method", assignee: "m3", componentId: "c3", status: "In Progress", due: "2026-11-08" },
    { id: "k4", title: "Draft DFD Level 1", assignee: "m1", componentId: "c4", status: "Done", due: "2026-10-30" },
    { id: "k5", title: "Set up prototype project", assignee: "m3", componentId: "c5", status: "To Do", due: "2026-11-15" },
    { id: "k6", title: "Polish defense slides", assignee: "m3", componentId: "c6", status: "Done", due: "2026-10-25" },
  ],
  notifications: [
    { id: "n1", category: "feedback", text: "New feedback on Chapter 2: Review of Related Literature", date: "2026-10-26T09:00:00Z", read: false },
    { id: "n2", category: "feedback", text: "Clarification needed: sampling method (Chapter 3)", date: "2026-10-27T10:30:00Z", read: false },
    { id: "n3", category: "reminder", text: "Chapter 2 – Revision 2 still has 2 unfinished tasks", date: "2026-10-28T08:00:00Z", read: false },
    { id: "n4", category: "deadline", text: "Chapter 2 is due on Nov 5", date: "2026-10-30T07:00:00Z", read: false },
    { id: "n5", category: "approval", text: "Chapter 1 was approved by Dr. Maria Santos", date: "2026-09-18T08:00:00Z", read: true },
    { id: "n6", category: "approval", text: "Chapter 3 approval request is still pending", date: "2026-10-21T08:00:00Z", read: false },
    { id: "n7", category: "team", text: "Carla Mendoza resubmitted the Defense Slides", date: "2026-10-28T09:00:00Z", read: false },
    { id: "n8", category: "team", text: "Ben Cruz uploaded Chapter2_Draft_v2.docx", date: "2026-10-24T08:00:00Z", read: true },
  ],
};