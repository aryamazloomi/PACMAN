export type DashboardPage =
  | "dashboard"
  | "neural"
  | "metrics"
  | "logs"
  | "config";

interface ArchiveSidebarProps {
  activeControllerName: string;
  activePage: DashboardPage;
  primaryActionLabel: string;
  onPageChange: (page: DashboardPage) => void;
  onPrimaryAction: () => void;
}

const navItems: Array<{ page: DashboardPage; label: string }> = [
  { page: "dashboard", label: "Core Dashboard" },
  { page: "neural", label: "Neural Architecture" },
  { page: "metrics", label: "Metric Analytics" },
  { page: "logs", label: "Simulation Logs" },
  { page: "config", label: "System Config" },
];

export function ArchiveSidebar({
  activeControllerName,
  activePage,
  primaryActionLabel,
  onPageChange,
  onPrimaryAction,
}: ArchiveSidebarProps) {
  return (
    <aside className="archive-sidebar">
      <div className="sidebar-top">
        <div className="brand-block">PAC-MAN ARCHIVE</div>
        <div className="system-card">
          <div className="system-icon" aria-hidden="true">
            +
          </div>
          <div>
            <strong>Neural-Net 01</strong>
            <p>Active controller: {activeControllerName}</p>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Dashboard pages">
          {navItems.map((item) => (
            <button
              key={item.page}
              type="button"
              className={
                item.page === activePage ? "nav-link nav-link-active" : "nav-link"
              }
              onClick={() => onPageChange(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="sidebar-footer">
        <button className="sidebar-primary-button" onClick={onPrimaryAction}>
          {primaryActionLabel}
        </button>
        <p className="sidebar-help">
          Core gameplay stays on the dashboard. Deeper architecture, metrics,
          logs, and config now live on their own pages.
        </p>
        <div className="sync-pill">ARCHIVE_SYNC_ACTIVE</div>
      </div>
    </aside>
  );
}
