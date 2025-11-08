import React, { useState } from "react";

export default function UploadPdf({ apiBase, token, companies }) {
  const [file, setFile] = useState(null);
  const [companyId, setCompanyId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !companyId) {
      alert("Please select a file and company");
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("company_id", companyId);

    try {
      const res = await fetch(`${apiBase}/ingest-pdf`, {
        method: "POST",
        headers: { "X-Token": token },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          success: true,
          message: `✓ Uploaded successfully! Created ${data.num_chunks} chunks.`,
        });
        setFile(null);
        setCompanyId("");
        // Reset file input
        e.target.reset();
      } else {
        setResult({
          success: false,
          message: data.detail || "Upload failed",
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: `Error: ${err.message}`,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card">
      <form onSubmit={handleUpload}>
        <label>
          Select Company
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
          >
            <option value="">Choose a company...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          PDF File
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </label>

        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </form>

      {result && (
        <div className={result.success ? "message success" : "message error"}>
          {result.message}
        </div>
      )}
    </div>
  );
}