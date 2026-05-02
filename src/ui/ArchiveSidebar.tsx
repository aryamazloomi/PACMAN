interface ArchiveSidebarProps {
  activeControllerName: string;
  hasBegun: boolean;
  onPrimaryAction: () => void;
}

const navItems = [
  { href: "#core-dashboard", label: "Core Dashboard" },
  { href: "#active-briefing", label: "Neural Architecture" },
  { href: "#runtime-analytics", label: "Metric Analytics" },
  { href: "#agent-library", label: "Model Dossiers" },
  { href: "#controller-panel", label: "System Config" },
];

export function ArchiveSidebar({
  activeControllerName,
  hasBegun,
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
        <nav className="sidebar-nav" aria-label="Dashboard sections">
          {navItems.map((item, index) => (
            <a
              key={item.href}
              className={index === 0 ? "nav-link nav-link-active" : "nav-link"}
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="sidebar-footer">
        <button className="sidebar-primary-button" onClick={onPrimaryAction}>
          {hasBegun ? "Restart Simulation" : "Initialize Simulation"}
        </button>
        <p className="sidebar-help">
          Use the archive search to compare controller behavior, theory, and
          practical tradeoffs.
        </p>
        <div className="sync-pill">ARCHIVE_SYNC_ACTIVE</div>
      </div>
    </aside>
  );
}
