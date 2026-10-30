import { Navigate, useLocation, useParams } from "react-router-dom";
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

function renderPage(sid, vid) {
  switch (sid) {
    case "overview": return <Overview view={vid} />;
    case "components": return <Components view={vid} />;
    case "feedback": return <Feedback view={vid} />;
    case "revisions": return <Revisions view={vid} />;
    case "files": return <Files view={vid} />;
    case "history": return <History view={vid} />;
    case "team": return <Team view={vid} />;
    case "account": return <Account view={vid} />;
    case "notifications": return <Notifications view={vid} />;
    case "settings": return <Settings view={vid} />;
    case "help": return <Help view={vid} />;
    default: return null;
  }
}

export function DashboardHome() {
  const { settings } = useProject();
  return <Navigate to={settings.landing} replace />;
}

export default function SectionPage() {
  const { section: sid, view: vid } = useParams();
  const { pathname } = useLocation();

  const section = findSection(sid);
  if (!section) return <Navigate to="/dashboard" replace />;

  const view = section.views.find((v) => v.id === vid);
  if (!view) return <Navigate to={`/dashboard/${sid}/${section.views[0].id}`} replace />;

  return (
    <div key={pathname}>
      <div className="page-head">
        <h1>{view.label}</h1>
        <p>{section.icon} {section.label}</p>
      </div>
      {renderPage(sid, vid)}
    </div>
  );
}