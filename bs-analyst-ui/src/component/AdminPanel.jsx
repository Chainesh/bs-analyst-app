import React, { useState, useEffect } from "react";

export default function AdminPanel({ apiBase, token }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [message, setMessage] = useState("");

  // New user form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("analyst");

  // New company form
  const [newCompany, setNewCompany] = useState("");

  // Grant access form
  const [grantUserId, setGrantUserId] = useState("");
  const [grantCompanyId, setGrantCompanyId] = useState("");

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  function loadUsers() {
    fetch(`${apiBase}/users`, {
      headers: { "X-Token": token },
    })
      .then((r) => r.json())
      .then(setUsers)
      .catch(console.error);
  }

  function loadCompanies() {
    fetch(`${apiBase}/companies`, {
      headers: { "X-Token": token },
    })
      .then((r) => r.json())
      .then(setCompanies)
      .catch(console.error);
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    const params = new URLSearchParams({
      username: newUsername,
      password: newPassword,
      role: newRole,
    });
    try {
      const res = await fetch(`${apiBase}/users?${params}`, {
        method: "POST",
        headers: { "X-Token": token },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`User created: ${data.username} (${data.role})`);
        setNewUsername("");
        setNewPassword("");
        setNewRole("analyst");
        loadUsers();
      } else {
        setMessage(`Error: ${data.detail || "Failed to create user"}`);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  }

  async function handleCreateCompany(e) {
    e.preventDefault();
    const params = new URLSearchParams({ name: newCompany });
    try {
      const res = await fetch(`${apiBase}/companies?${params}`, {
        method: "POST",
        headers: { "X-Token": token },
      });
      const data = await res.json();
      setMessage(data.message === "created" 
        ? `Company created: ${data.name}` 
        : `Company already exists: ${data.name}`);
      setNewCompany("");
      loadCompanies();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  }

  async function handleGrantAccess(e) {
    e.preventDefault();
    const params = new URLSearchParams({
      user_id: grantUserId,
      company_id: grantCompanyId,
    });
    try {
      const res = await fetch(`${apiBase}/grant-access?${params}`, {
        method: "POST",
        headers: { "X-Token": token },
      });
      const data = await res.json();
      setMessage(data.message === "granted" 
        ? "Access granted successfully" 
        : "User already has access");
      setGrantUserId("");
      setGrantCompanyId("");
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  }

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      {message && <div className="message">{message}</div>}

      <div className="admin-grid">
        {/* Create User */}
        <div className="card">
          <h3>Create User</h3>
          <form onSubmit={handleCreateUser}>
            <label>
              Username
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                placeholder="Enter username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
            </label>
            <label>
              Role
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="analyst">Analyst</option>
                <option value="ceo">CEO</option>
                <option value="group_admin">Group Admin</option>
              </select>
            </label>
            <button type="submit">Create User</button>
          </form>
        </div>

        {/* Create Company */}
        <div className="card">
          <h3>Create Company</h3>
          <form onSubmit={handleCreateCompany}>
            <label>
              Company Name
              <input
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                required
                placeholder="Enter company name"
              />
            </label>
            <button type="submit">Create Company</button>
          </form>
        </div>

        {/* Grant Access */}
        <div className="card">
          <h3>Grant Access</h3>
          <form onSubmit={handleGrantAccess}>
            <label>
              User
              <select
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
                required
              >
                <option value="">Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.role})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Company
              <select
                value={grantCompanyId}
                onChange={(e) => setGrantCompanyId(e.target.value)}
                required
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Grant Access</button>
          </form>
        </div>
      </div>

      {/* Lists */}
      <div className="admin-grid" style={{ marginTop: "1.5rem" }}>
        {/* Users List */}
        <div className="card">
          <h3>All Users</h3>
          <div className="list">
            {users.map((u) => (
              <div key={u.id} className="list-item">
                <span>
                  <strong>{u.username}</strong>
                </span>
                <span className="badge">{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Companies List */}
        <div className="card">
          <h3>All Companies</h3>
          <div className="list">
            {companies.map((c) => (
              <div key={c.id} className="list-item">
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}