import React, { useState } from "react";

export default function Login({ onLogin, apiBase }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const params = new URLSearchParams({ username, password });

    try {
      const res = await fetch(`${apiBase}/login?${params}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        onLogin(data.token, data.role);
      } else {
        setError(data.detail || "Login failed");
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-box">
      <h2>Balance Sheet Analyst</h2>
      <p>Sign in to access your financial data</p>

      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
            autoFocus
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {error && <div className="message error">{error}</div>}

      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        Default admin: <strong>admin</strong> / <strong>admin</strong>
      </p>
    </div>
  );
}