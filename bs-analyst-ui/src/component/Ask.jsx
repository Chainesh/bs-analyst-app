import React, { useState } from "react";

export default function Ask({ apiBase, token, companies }) {
  const [companyId, setCompanyId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [context, setContext] = useState("");

  const ask = async () => {
    if (!companyId || !question) return;

    const params = new URLSearchParams();
    params.append("question", question);
    params.append("company_id", companyId);

    const res = await fetch(`${apiBase}/ask?${params.toString()}`, {
      method: "POST",
      headers: {
        "X-Token": token,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      setAnswer("Error: " + (data.detail || "failed"));
      setContext("");
      return;
    }
    setAnswer(data.answer);
    setContext(data.context);
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
        Question
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What is the total income for the year?"
        />
      </label>
      <button onClick={ask}>Ask</button>
      {answer && (
        <div className="answer-block">
          <h3>Answer</h3>
          <p>{answer}</p>
        </div>
      )}
      {context && (
        <div className="context-block">
          <h3>Source (redacted)</h3>
          <pre>{context}</pre>
        </div>
      )}
    </div>
  );
}
