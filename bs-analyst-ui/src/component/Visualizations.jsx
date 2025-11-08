import React, { useState } from "react";

export default function Visualizations({ apiBase, token, companies }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateChart = async () => {
    if (!selectedCompanyId) return;

    setLoading(true);
    
    // Ask the LLM to extract financial data
    const question = `Extract the following financial metrics from the balance sheet and format as JSON:
    {
      "years": ["2023", "2024"],
      "revenue": [value1, value2],
      "assets": [value1, value2],
      "liabilities": [value1, value2],
      "equity": [value1, value2]
    }
    Only return the JSON, nothing else.`;

    const formData = new URLSearchParams();
    formData.append("question", question);
    formData.append("company_id", selectedCompanyId);

    try {
      const response = await fetch(`${apiBase}/ask`, {
        method: "POST",
        headers: {
          "X-Token": token,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();
      
      // Try to parse the answer as JSON
      try {
        const jsonMatch = data.answer.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setChartData(parsed);
        } else {
          alert("Could not extract chart data. Try uploading a balance sheet first.");
        }
      } catch (e) {
        alert("Could not parse financial data. The document may not contain structured data.");
      }
    } catch (error) {
      alert("Error generating chart");
    }

    setLoading(false);
  };

  return (
    <div className="card">
      <h3>Financial Visualizations</h3>
      
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

      <button onClick={handleGenerateChart} disabled={!selectedCompanyId || loading}>
        {loading ? "Generating..." : "Generate Charts"}
      </button>

      {chartData && (
        <div className="charts">
          <div className="chart">
            <h4>Revenue</h4>
            <SimpleBarChart
              labels={chartData.years}
              data={chartData.revenue}
              color="#2563eb"
            />
          </div>
          
          <div className="chart">
            <h4>Assets vs Liabilities</h4>
            <SimpleBarChart
              labels={chartData.years}
              data={chartData.assets}
              data2={chartData.liabilities}
              color="#22c55e"
              color2="#ef4444"
              label1="Assets"
              label2="Liabilities"
            />
          </div>

          <div className="chart">
            <h4>Equity</h4>
            <SimpleBarChart
              labels={chartData.years}
              data={chartData.equity}
              color="#8b5cf6"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Simple bar chart component (CSS-based)
function SimpleBarChart({ labels, data, data2, color = "#2563eb", color2 = "#ef4444", label1 = "Value", label2 = "Value 2" }) {
  const maxValue = Math.max(...data, ...(data2 || []));

  return (
    <div className="simple-chart">
      {labels.map((label, idx) => (
        <div key={idx} className="chart-group">
          <div className="chart-label">{label}</div>
          <div className="chart-bars">
            <div className="bar-container">
              <div
                className="bar"
                style={{
                  width: `${(data[idx] / maxValue) * 100}%`,
                  backgroundColor: color,
                }}
              >
                <span className="bar-value">{data[idx]}</span>
              </div>
              <span className="bar-label">{label1}</span>
            </div>
            {data2 && (
              <div className="bar-container">
                <div
                  className="bar"
                  style={{
                    width: `${(data2[idx] / maxValue) * 100}%`,
                    backgroundColor: color2,
                  }}
                >
                  <span className="bar-value">{data2[idx]}</span>
                </div>
                <span className="bar-label">{label2}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}