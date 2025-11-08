import React, { useState, useEffect } from "react";

export default function AdminPanel({ apiBase, token }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  // Create user form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("analyst");
  
  // Create company form
  const [newCompanyName, setNewCompanyName] = useState("");
  
  // Grant access form
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchUsers = () => {
    fetch(`${apiBase}/users`, {
      headers: { "X-Token": token },
    })
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setUsers([]));
  };

  const fetchCompanies = () => {
    fetch(`${apiBase}/companies`, {
      headers: { "X-Token": token },
    })
      .then((r) => r.json())
      .then(setCompanies)
      .catch(() => setCompanies([]));
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append("username", newUsername);
    formData.append("password", newPassword);
    formData.append("role", newRole);

    fetch(`${apiBase}/users`, {
      method: "POST",
      headers: {
        "X-Token": token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        setMessage(`User created: ${data.username}`);
        setNewUsername("");
        setNewPassword("");
        fetchUsers();
      })
      .catch((err) => setMessage("Error creating user"));
  };

  const handleCreateCompany = (e) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append("name", newCompanyName);

    fetch(`${apiBase}/companies`, {
      method: "POST",
      headers: {
        "X-Token": token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        setMessage(`Company created: ${data.name}`);
        setNewCompanyName("");
        fetchCompanies();
      })
      .catch((err) => setMessage("Error creating company"));
  };

  const handleGrantAccess = (e) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append("user_id", selectedUserId);
    formData.append("company_id", selectedCompanyId);

    fetch(`${apiBase}/grant-access`, {
      method: "POST",
      headers: {
        "X-Token": token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch((err) => setMessage("Error granting access"));
  };

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
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
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
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                required
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
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
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
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
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

        {/* Users List */}
        <div className="card">
          <h3>Users ({users.length})</h3>
          <div className="list">
            {users.map((u) => (
              <div key={u.id} className="list-item">
                <strong>{u.username}</strong>
                <span className="badge">{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Companies List */}
        <div className="card">
          <h3>Companies ({companies.length})</h3>
          <div className="list">
            {companies.map((c) => (
              <div key={c.id} className="list-item">
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}