import React, { useState } from "react";

export default function Ask({ apiBase, token, companies }) {
  const [question, setQuestion] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState(null);

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim() || !companyId) {
      alert("Please enter a question and select a company");
      return;
    }

    setAsking(true);
    setAnswer(null);

    const params = new URLSearchParams({
      question: question.trim(),
      company_id: companyId,
    });

    try {
      const res = await fetch(`${apiBase}/ask?${params}`, {
        method: "POST",
        headers: { "X-Token": token },
      });
      const data = await res.json();
      if (res.ok) {
        setAnswer(data);
      } else {
        setAnswer({
          error: data.detail || "Failed to get answer",
        });
      }
    } catch (err) {
      setAnswer({
        error: `Error: ${err.message}`,
      });
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="card">
      <form onSubmit={handleAsk}>
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
          Your Question
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What is the revenue for Q2?"
            required
          />
        </label>

        <button type="submit" disabled={asking}>
          {asking ? "Searching..." : "Ask Question"}
        </button>
      </form>

      {answer && (
        <>
          {answer.error ? (
            <div className="message error">{answer.error}</div>
          ) : (
            <>
              <div className="answer-block">
                <h3>Answer</h3>
                <p>{answer.answer}</p>
                {answer.llm && (
                  <div className="status">
                    Model: {answer.llm} • Chunks used: {answer.chunks_used}
                  </div>
                )}
              </div>

              {answer.context && (
                <div className="context-block">
                  <h3>Retrieved Context</h3>
                  <pre>{answer.context}</pre>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}