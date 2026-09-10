import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <h2>Agency Dashboard</h2>
      </div>
      <div className="navbar-user">
        <span className="user-name">{user?.name}</span>
        <span className={`role-badge role-${user?.role?.toLowerCase()}`}>
          {user?.role}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
