import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { findSection } from "../../config/navigation";
import { useProject } from "../../context/ProjectContext";

import Overview from "../dashboard/Overview";
import Components from "../../components/common/Components";
import Feedback from "../feedback/Feedback";
import Revisions from "../revisions/Revisions";
import Files from "../submissions/Files";
import History from "../revisions/History";
import Team from "../team/Team";
import Account from "../account/Account";
import Notifications from "../dashboard/Notifications";
import Settings from "../account/Settings";
import Help from "../help/Help";
import ProjectSettings from "./ProjectSettings";
import { Card, Empty } from "../../components/ui";

function renderPage(sid, vid) {
  switch (sid) {
    case "overview": return <Overview />;
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
    case "project-settings": return <ProjectSettings />;
    default: return null;
  }
}

export function DashboardHome() {
  const { settings } = useProject();
  return <Navigate to={settings?.landing || "/dashboard/overview"} replace />;
}

export default function SectionPage() {
  const { section: sid, view: vid } = useParams();
  const { pathname } = useLocation();
  const { selectedProject } = useProject();

  const section = findSection(sid);
  if (!section) return <Navigate to="/dashboard/overview" replace />;

  // Project pages need a selected project, otherwise they would be empty.
  if (section.scope === "project" && !selectedProject) {
    return (
      <Card title="Open a project first">
        <Empty text="This page belongs to a project. Open one from My Projects to see its sections, feedback, revisions, files, history and team." />
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <Link className="btn" to="/dashboard/overview" style={{ color: "#fff" }}>
            Go to My Projects
          </Link>
        </div>
      </Card>
    );
  }

  const hasViews = section.views && section.views.length > 0;

  // The title + tabs are drawn once by the dashboard shell, so pages only render their content.
  if (hasViews && !section.views.some((v) => v.id === vid)) {
    return <Navigate to={`/dashboard/${sid}/${section.views[0].id}`} replace />;
  }

  return <div key={pathname}>{renderPage(sid, hasViews ? vid : undefined)}</div>;
}