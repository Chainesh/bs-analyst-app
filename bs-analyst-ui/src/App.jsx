import React, { useState, useEffect } from "react";
import Login from "./component/Login.jsx";
import UploadPdf from "./component/UploadPdf.jsx";
import Ask from "./component/Ask.jsx";
import AdminPanel from "./component/AdminPanel.jsx";
import DocumentManager from "./component/DocumentManager.jsx";
import Visualizations from "./component/Visualizations.jsx";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [companies, setCompanies] = useState([]);
  const [seedDone, setSeedDone] = useState(false);
  const [activeTab, setActiveTab] = useState("query");

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
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav">
        <button
          className={activeTab === "query" ? "active" : ""}
          onClick={() => setActiveTab("query")}
        >
          Query & Upload
        </button>
        <button
          className={activeTab === "visualizations" ? "active" : ""}
          onClick={() => setActiveTab("visualizations")}
        >
          Visualizations
        </button>
        <button
          className={activeTab === "documents" ? "active" : ""}
          onClick={() => setActiveTab("documents")}
        >
          Documents
        </button>
        {role === "group_admin" && (
          <button
            className={activeTab === "admin" ? "active" : ""}
            onClick={() => setActiveTab("admin")}
          >
            Admin
          </button>
        )}
      </nav>

      <main className="main-content">
        {activeTab === "query" && (
          <div className="main-grid">
            <div className="left-pane">
              <h2>Upload PDF</h2>
              <UploadPdf apiBase={API_BASE} token={token} companies={companies} />
            </div>
            <div className="right-pane">
              <h2>Ask a question</h2>
              <Ask apiBase={API_BASE} token={token} companies={companies} />
            </div>
          </div>
        )}

        {activeTab === "visualizations" && (
          <div className="single-pane">
            <Visualizations apiBase={API_BASE} token={token} companies={companies} />
          </div>
        )}

        {activeTab === "documents" && (
          <div className="single-pane">
            <DocumentManager apiBase={API_BASE} token={token} companies={companies} />
          </div>
        )}

        {activeTab === "admin" && role === "group_admin" && (
          <div className="single-pane">
            <AdminPanel apiBase={API_BASE} token={token} />
          </div>
        )}
      </main>
    </div>
  );
}