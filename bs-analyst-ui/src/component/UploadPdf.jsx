import React, { useState } from "react";

export default function UploadPdf({ apiBase, token, companies }) {
  const [companyId, setCompanyId] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const upload = async () => {
    if (!file || !companyId) {
      setStatus("Pick a file and a company");
      return;
    }
    setStatus("Uploading...");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("company_id", companyId);

    const res = await fetch(`${apiBase}/ingest-pdf`, {
      method: "POST",
      headers: {
        "X-Token": token,
      },
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus("Error: " + (data.detail || "upload failed"));
    } else {
      setStatus(
        `Uploaded. Document ${data.document_id}, chunks: ${data.num_chunks}`
      );
    }
  };

  return (
    <div className="card">
      <label>
        Company
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          <option value="">-- select --</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        PDF file
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      </label>
      <button onClick={upload}>Upload & Ingest</button>
      {status && <p className="status">{status}</p>}
    </div>
  );
}
