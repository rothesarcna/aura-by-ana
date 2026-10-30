const USERS_KEY = "aura_users";
const SESSION_KEY = "aura_session";

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");

export function registerStudent({ fullName, studentId, email, course, password }) {
  const users = getUsers();

  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  if (users.some((u) => u.studentId === studentId)) {
    throw new Error("This Student ID is already registered.");
  }

  const user = {
    id: Date.now(),
    role: "student",
    fullName,
    studentId,
    email,
    course,
    password, // TEMPORARY: plain text for mock only. Backend must hash this.
  };

  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  return user;
}

export function loginStudent(identifier, password) {
  const id = identifier.trim().toLowerCase();
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === id || u.studentId.toLowerCase() === id
  );

  if (!user || user.password !== password) {
    throw new Error("Invalid email/Student ID or password.");
  }

  const { password: _pw, ...safeUser } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  return safeUser;
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateProfile({ fullName, email }) {
  const session = getCurrentUser();
  if (!session) throw new Error("Not logged in.");

  const users = getUsers();
  if (users.some((u) => u.id !== session.id && u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("That email is already in use.");
  }

  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users.map((u) => (u.id === session.id ? { ...u, fullName, email } : u)))
  );
  const next = { ...session, fullName, email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

export function changePassword(current, next) {
  const session = getCurrentUser();
  if (!session) throw new Error("Not logged in.");

  const users = getUsers();
  const me = users.find((u) => u.id === session.id);
  if (!me || me.password !== current) throw new Error("Current password is incorrect.");

  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users.map((u) => (u.id === me.id ? { ...u, password: next } : u)))
  );
}