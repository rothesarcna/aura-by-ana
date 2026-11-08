import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

window.confirm = () => true;
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
});
