import { Navigate, useParams } from "react-router-dom";
import { findSection } from "../../config/navigation";
import { useProject } from "../../context/ProjectContext";
import Overview from "./Overview";
import Components from "./Components";
import Feedback from "./Feedback";
import Revisions from "./Revisions";
import Files from "./Files";
import History from "./History";
import Team from "./Team";
import Account from "./Account";
import Notifications from "./Notifications";
import Settings from "./Settings";
import Help from "./Help";

const PAGES = {
  overview: Overview, components: Components, feedback: Feedback, revisions: Revisions,
  files: Files, history: History, team: Team, account: Account,
  notifications: Notifications, settings: Settings, help: Help,
};

export function DashboardHome() {
  const { settings } = useProject();
  return <Navigate to={settings.landing} replace />;
}

export default function SectionPage() {
  const { section: sid, view: vid } = useParams();
  const section = findSection(sid);
  if (!section) return <Navigate to="/dashboard" replace />;

  const view = section.views.find((v) => v.id === vid);
  if (!view) return <Navigate to={`/dashboard/${sid}/${section.views[0].id}`} replace />;

  const Page = PAGES[sid];
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