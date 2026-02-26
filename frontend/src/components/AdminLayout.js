import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const user = useMemo(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const menu = [
    { label: "Dashboard", icon: "📊", path: "/admin" },
    // Later:
    // { label: "Products", icon: "🧺", path: "/admin/products" },
    // { label: "Orders", icon: "📦", path: "/admin/orders" },
    // { label: "Offers", icon: "🏷️", path: "/admin/offers" },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const title =
    menu.find((m) => isActive(m.path))?.label || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow} />

      {/* SIDEBAR */}
      <aside style={{ ...styles.sidebar, width: collapsed ? 86 : 290 }}>
        <div>
          {/* Brand */}
          <div style={styles.brandRow}>
            <div style={styles.brandIcon}>🛠</div>

            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={styles.brandTitle}>Admin Panel</div>
                <div style={styles.brandSub}>Desi Farms</div>
              </div>
            )}

            <button
              onClick={() => setCollapsed((s) => !s)}
              style={styles.collapseBtn}
              title={collapsed ? "Expand" : "Collapse"}
              aria-label="Toggle sidebar"
            >
              {collapsed ? "➡️" : "⬅️"}
            </button>
          </div>

          {/* User */}
          <div style={styles.userCard}>
            <div style={styles.avatar}>👤</div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={styles.userName}>{user?.name || "Admin"}</div>
                <div style={styles.userRole}>Administrator</div>
              </div>
            )}
          </div>

          {/* Menu */}
          <div style={styles.menu}>
            {menu.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    ...styles.menuBtn,
                    ...(active ? styles.menuBtnActive : {}),
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span style={styles.menuIcon}>{item.icon}</span>
                  {!collapsed && <span style={styles.menuLabel}>{item.label}</span>}
                  {!collapsed && active && <span style={styles.activeDot} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom */}
        <div style={styles.bottom}>
          <button
            style={{
              ...styles.logoutBtn,
              justifyContent: collapsed ? "center" : "flex-start",
            }}
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
          >
            <span style={styles.menuIcon}>🚪</span>
            {!collapsed && <span style={styles.menuLabel}>Logout</span>}
          </button>

          {!collapsed && (
            <div style={styles.footerText}>
              © {new Date().getFullYear()} Desi Farms
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerTitle}>{title}</div>
            <div style={styles.headerSub}>
              Manage orders, products and offers.
            </div>
          </div>

          <div style={styles.headerActions}>
            

            <button
              style={styles.primaryBtn}
              onClick={() => navigate("/admin")}
              title="Dashboard"
            >
              📊 Dashboard
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={styles.contentCard}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "linear-gradient(135deg, #0b1220, #111a2e, #0f2b2a)",
    color: "#eaf2ff",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },

  glow: {
    position: "absolute",
    inset: "-240px",
    background:
      "radial-gradient(circle at 18% 18%, rgba(91,188,255,0.22), transparent 45%), radial-gradient(circle at 85% 30%, rgba(255,211,107,0.14), transparent 45%), radial-gradient(circle at 55% 85%, rgba(126,231,135,0.16), transparent 52%)",
    filter: "blur(10px)",
    pointerEvents: "none",
  },

  sidebar: {
    margin: "14px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    zIndex: 2,
    transition: "width 0.2s ease",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },

  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.25)",
    fontSize: 20,
  },

  brandTitle: {
    fontWeight: 900,
    letterSpacing: "0.2px",
    fontSize: 16,
  },

  brandSub: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 2,
  },

  collapseBtn: {
    marginLeft: "auto",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#eaf2ff",
    borderRadius: 12,
    height: 36,
    width: 42,
    cursor: "pointer",
  },

  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "16px",
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.10)",
    marginBottom: "14px",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
  },

  userName: {
    fontWeight: 900,
    fontSize: 14,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  userRole: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 2,
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  menuBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 12px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#eaf2ff",
    cursor: "pointer",
    fontWeight: 900,
    position: "relative",
    transition: "0.15s ease",
  },

  menuBtnActive: {
    background: "rgba(126,231,135,0.12)",
    border: "1px solid rgba(126,231,135,0.28)",
  },

  menuIcon: { width: 22, textAlign: "center" },
  menuLabel: { whiteSpace: "nowrap" },

  activeDot: {
    position: "absolute",
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(126,231,135,0.95)",
    boxShadow: "0 0 18px rgba(126,231,135,0.55)",
  },

  bottom: { display: "flex", flexDirection: "column", gap: 10 },

  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 12px",
    borderRadius: "14px",
    border: "1px solid rgba(255,80,80,0.25)",
    background: "rgba(255,80,80,0.12)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
  },

  footerText: {
    fontSize: 12,
    opacity: 0.65,
    textAlign: "center",
    marginTop: 2,
  },

  main: {
    flex: 1,
    padding: "14px",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
  },

  headerTitle: { fontSize: 20, fontWeight: 900, marginBottom: 4 },
  headerSub: { fontSize: 12, opacity: 0.75 },

  headerActions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  ghostBtn: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#eaf2ff",
    cursor: "pointer",
    padding: "0 14px",
    fontWeight: 900,
  },

  primaryBtn: {
    height: 40,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(90deg, #7ee787, #5bbcff)",
    color: "#071018",
    cursor: "pointer",
    padding: "0 14px",
    fontWeight: 900,
  },

  contentCard: {
    flex: 1,
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
    overflow: "auto",
  },
};