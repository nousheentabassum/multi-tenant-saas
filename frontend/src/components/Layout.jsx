import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Layout.module.css";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const nav = [
    { to: "/", label: "Dashboard" },
    { to: "/my-tasks", label: "My tasks" },
    { to: "/projects", label: "Projects" },
    { to: "/tasks", label: "Tasks" },
    { to: "/analytics", label: "Analytics" },
    { to: "/users", label: "Team" },
    { to: "/audit", label: "Audit Log" },
  ];

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>◇</span>
          <span>TaskFlow</span>
        </div>
        <nav className={styles.nav}>
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.linkActive}` : styles.link
              }
              end={to === "/"}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.user}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>{user?.role}</span>
          </div>
          <button type="button" onClick={handleLogout} className={styles.logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
