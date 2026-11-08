import axios from "axios";

/*
 * AURA auth service.
 *
 * Online mode  : talks to the Spring Boot API at API_URL (same contract as before).
 * Offline mode : if the API cannot be reached at all (server not running, no
 *                network), the same functions fall back to accounts stored in
 *                this browser's localStorage, so the whole front end can be
 *                demoed and tested without a backend.
 *
 * NOTE: offline accounts are for demo/testing only. They live in localStorage
 * and must never be treated as real security.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/auth";
const SESSION_KEY = "aura_session";
const USERS_KEY = "aura_offline_users";

// axios only has no `response` when the server could not be reached.
const isOffline = (error) => !error.response;

/* ---------- helpers for offline mode ---------- */

async function sha256(text) {
  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `plain:${text}`;
}

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

const writeUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const toSafeUser = ({ passwordHash: _hash, ...safe }) => safe;
const saveSession = (user) => localStorage.setItem(SESSION_KEY, JSON.stringify(user));

async function ensureDemoUser() {
  const users = readUsers();
  if (users.some((u) => u.email === "demo@aura.edu.ph")) return users;
  users.push({
    id: "demo-user",
    fullName: "Ana Reyes",
    studentId: "2023-0001",
    email: "demo@aura.edu.ph",
    course: "BSIT",
    role: "student",
    passwordHash: await sha256("demo1234"),
    passwordChangedAt: null,
  });
  writeUsers(users);
  return users;
}

/* ---------- public API ---------- */

export async function registerStudent(userData) {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    if (!isOffline(error)) {
      throw new Error(error.response?.data?.error || "Registration failed");
    }
    // Offline fallback
    const users = await ensureDemoUser();
    const email = (userData.email || "").trim().toLowerCase();
    const studentId = (userData.studentId || "").trim();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error("An account with that email already exists.");
    }
    if (users.some((u) => u.studentId === studentId)) {
      throw new Error("An account with that student ID already exists.");
    }
    const { password, ...rest } = userData;
    const user = {
      ...rest,
      email,
      studentId,
      id: `u-${Date.now().toString(36)}`,
      role: "student",
      passwordHash: await sha256(password),
      passwordChangedAt: null,
    };
    users.push(user);
    writeUsers(users);
    return toSafeUser(user);
  }
}

export async function loginStudent(identifier, password) {
  try {
    const response = await axios.post(`${API_URL}/login`, { identifier, password });
    const safeUser = response.data;
    saveSession(safeUser);
    return safeUser;
  } catch (error) {
    if (!isOffline(error)) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
    // Offline fallback
    const users = await ensureDemoUser();
    const id = identifier.trim().toLowerCase();
    const hash = await sha256(password);
    const found = users.find(
      (u) => (u.email.toLowerCase() === id || (u.studentId || "").toLowerCase() === id) && u.passwordHash === hash
    );
    if (!found) throw new Error("Invalid email/student ID or password.");
    const safe = toSafeUser(found);
    saveSession(safe);
    return safe;
  }
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export async function updateProfile({ fullName, email, studentId }) {
  // TODO: replace with a Spring Boot endpoint (e.g. PUT /api/auth/profile) when it exists.
  const session = getCurrentUser();
  if (!session) throw new Error("Not logged in.");

  const patch = { fullName, email, ...(studentId !== undefined ? { studentId } : {}) };
  const next = { ...session, ...patch };
  saveSession(next);

  // keep the offline account record in sync
  const users = readUsers();
  const i = users.findIndex((u) => u.id === session.id);
  if (i >= 0) {
    users[i] = { ...users[i], ...patch };
    writeUsers(users);
  }
  return next;
}

export async function changePassword(current, next) {
  const session = getCurrentUser();
  if (!session) throw new Error("Not logged in.");

  const stamp = new Date().toISOString();
  try {
    await axios.put(`${API_URL}/change-password`, {
      userId: session.id,
      currentPassword: current,
      newPassword: next,
    });
  } catch (error) {
    if (!isOffline(error)) {
      throw new Error(error.response?.data?.error || "Failed to change password.");
    }
    // Offline fallback
    const users = readUsers();
    const i = users.findIndex((u) => u.id === session.id);
    if (i < 0) throw new Error("Account not found.");
    if (users[i].passwordHash !== (await sha256(current))) {
      throw new Error("Current password is incorrect.");
    }
    users[i] = { ...users[i], passwordHash: await sha256(next), passwordChangedAt: stamp };
    writeUsers(users);
  }
  const updated = { ...session, passwordChangedAt: stamp };
  saveSession(updated);
  return updated;
}

export async function deleteAccount() {
  const session = getCurrentUser();
  if (!session) return;
  // TODO: call a Spring Boot endpoint once one exists (e.g. DELETE /api/auth/account).
  writeUsers(readUsers().filter((u) => u.id !== session.id));
  logout();
}
