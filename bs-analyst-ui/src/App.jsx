import React, { useState, useEffect } from "react";
import Login from "./component/Login.jsx";
import UploadPdf from "./component/UploadPdf.jsx";
import Ask from "./component/Ask.jsx";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [companies, setCompanies] = useState([]);
  const [seedDone, setSeedDone] = useState(false);

  // Step 1: ensure /seed/admin exists before login
  useEffect(() => {
    fetch(`${API_BASE}/seed/admin`, { method: "POST" })
      .then((res) => res.json())
      .then(() => setSeedDone(true))
      .catch(() => setSeedDone(true));
  }, []);

  // Step 2: fetch companies once logged in
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/companies`, {
      headers: {
        "X-Token": token,
      },
    })
      .then((r) => r.json())
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, [token]);

  if (!seedDone) {
    return (
      <div className="app-shell">
        <h2>Initializing system…</h2>
        <p>Setting up admin user, please wait.</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="app-shell">
        <Login
          onLogin={(tok, role) => {
            setToken(tok);
            setRole(role);
          }}
          apiBase={API_BASE}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Balance Sheet Analyst</h1>
        <div className="user-block">
          <span>{role}</span>
          <button onClick={() => setToken("")}>Logout</button>
          {role && <span className="welcome-toast">Welcome, {role}!</span>}
        </div>
      </header>
      <main className="main-grid">
        <div className="left-pane">
          <h2>Upload PDF</h2>
          <UploadPdf apiBase={API_BASE} token={token} companies={companies} />
        </div>
        <div className="right-pane">
          <h2>Ask a question</h2>
          <Ask apiBase={API_BASE} token={token} companies={companies} />
        </div>
      </main>
    </div>
  );
}
