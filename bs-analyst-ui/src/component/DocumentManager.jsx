import React, { useState, useEffect } from "react";

export default function DocumentManager({ apiBase, token, companies }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchDocuments();
    }
  }, [selectedCompanyId]);

  const fetchDocuments = () => {
    setLoading(true);
    fetch(`${apiBase}/documents?company_id=${selectedCompanyId}`, {
      headers: { "X-Token": token },
    })
      .then((r) => r.json())
      .then((data) => {
        setDocuments(data);
        setLoading(false);
      })
      .catch(() => {
        setDocuments([]);
        setLoading(false);
      });
  };

  const handleDelete = (docId) => {
    if (!confirm("Delete this document?")) return;

    fetch(`${apiBase}/documents/${docId}`, {
      method: "DELETE",
      headers: { "X-Token": token },
    })
      .then(() => fetchDocuments())
      .catch(() => alert("Error deleting document"));
  };

  return (
    <div className="card">
      <h3>Document Manager</h3>
      <label>
        Select Company
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
        >
          <option value="">-- Select --</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {loading && <p className="status">Loading...</p>}

      {!loading && selectedCompanyId && (
        <div className="doc-list">
          <h4>Documents ({documents.length})</h4>
          {documents.length === 0 && (
            <p className="status">No documents uploaded yet</p>
          )}
          {documents.map((doc) => (
            <div key={doc.id} className="doc-item">
              <div className="doc-info">
                <strong>{doc.filename}</strong>
                <span className="doc-meta">
                  {doc.size_kb} KB • {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}