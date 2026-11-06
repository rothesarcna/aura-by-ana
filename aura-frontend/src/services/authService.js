import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';
const SESSION_KEY = "aura_session";

export async function registerStudent(userData) {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Registration failed");
  }
}

export async function loginStudent(identifier, password) {
  try {
    const response = await axios.post(`${API_URL}/login`, { identifier, password });
    const safeUser = response.data;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Login failed");
  }
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export async function updateProfile({ fullName, email }) {
  // TODO: Implement Spring Boot endpoint for profile updates
  const session = getCurrentUser();
  if (!session) throw new Error("Not logged in.");
  
  const next = { ...session, fullName, email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

export async function changePassword(current, next) {
  const session = getCurrentUser();
  if (!session) throw new Error("Not logged in.");

  try {
    await axios.put(`${API_URL}/change-password`, {
      userId: session.id,
      currentPassword: current,
      newPassword: next
    });
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to change password.");
  }
}