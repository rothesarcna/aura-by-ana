import { createContext, useContext } from "react";

/*
 * The context object and hook live here so both providers (localStorage and server-backed) can use them
 * without importing each other.
 */
export const ProjectContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useProject = () => useContext(ProjectContext);
