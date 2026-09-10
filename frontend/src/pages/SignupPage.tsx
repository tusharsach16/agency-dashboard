import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("DEVELOPER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>Create Account</h1>
        <p className="login-subtitle">Sign up to join the agency dashboard</p>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <div className="form-group" style={{ textAlign: "left", marginTop: "8px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
            Select Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="input-select"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
          >
            <option value="DEVELOPER">Developer</option>
            <option value="PM">Project Manager (PM)</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {error && <p className="error">{error}</p>}
        
        <button type="submit" disabled={loading} style={{ marginTop: "12px" }}>
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p style={{ marginTop: "16px", fontSize: "14px", color: "#6b7280" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
