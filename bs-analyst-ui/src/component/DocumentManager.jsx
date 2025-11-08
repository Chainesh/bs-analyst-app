import React, { useState, useEffect } from "react";

export default function DocumentManager({ apiBase, token, companies }) {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (selectedCompany) {
      loadDocuments();
    }
  }, [selectedCompany]);

  async function loadDocuments() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(
        `${apiBase}/documents?company_id=${selectedCompany}`,
        {
          headers: { "X-Token": token },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setDocuments(data);
      } else {
        setMessage(data.detail || "Failed to load documents");
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(docId) {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`${apiBase}/documents/${docId}`, {
        method: "DELETE",
        headers: { "X-Token": token },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Document deleted successfully");
        loadDocuments();
      } else {
        setMessage(data.detail || "Failed to delete document");
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  }

  return (
    <div className="card">
      <h2>Document Manager</h2>

      <label>
        Select Company
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          <option value="">Choose a company...</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {message && <div className="message">{message}</div>}

      {loading && <p className="status">Loading documents...</p>}

      {selectedCompany && !loading && (
        <div className="doc-list">
          {documents.length === 0 ? (
            <p className="status">No documents found for this company.</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="doc-item">
                <div className="doc-info">
                  <strong>{doc.filename}</strong>
                  <span className="doc-meta">
                    {doc.size_kb} KB •{" "}
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString()
                      : "Unknown date"}
                  </span>
                </div>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(doc.id)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}