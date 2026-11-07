import { Navigate, useParams } from "react-router-dom";
import { findSection } from "../../config/navigation";
import { useProject } from "../../context/ProjectContext";

// Relative path fixes from src/pages/account/
import Overview from "../dashboard/Overview";
import Components from "../../components/common/Components";
import Feedback from "../feedback/Feedback";
import Revisions from "../revisions/Revisions";
import Files from "../submissions/Files";
import History from "../revisions/History";
import Team from "../team/Team";
import Account from "./Account";
import Notifications from "../dashboard/Notifications";
import Help from "../help/Help";

// Note: Settings is removed from PAGES here to prevent self-referencing circular imports
const PAGES = {
  overview: Overview,
  components: Components,
  feedback: Feedback,
  revisions: Revisions,
  files: Files,
  history: History,
  team: Team,
  account: Account,
  notifications: Notifications,
  help: Help,
};

export function DashboardHome() {
  const { settings } = useProject();
  return <Navigate to={settings?.landing || "/dashboard"} replace />;
}

export default function SectionPage() {
  const { section: sid, view: vid } = useParams();
  const section = findSection(sid);
  if (!section) return <Navigate to="/dashboard" replace />;

  const view = section.views?.find((v) => v.id === vid);
  if (!view) return <Navigate to={`/dashboard/${sid}/${section.views[0]?.id || ""}`} replace />;

  const Page = PAGES[sid];
  if (!Page) return null;

  return (
    <>
      <div className="page-head">
        <h1>{view.label}</h1>
        <p>{section.icon} {section.label}</p>
      </div>
      <Page view={vid} />
    </>
  );
}