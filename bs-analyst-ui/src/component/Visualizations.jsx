import React, { useState } from "react";

export default function Visualizations({ apiBase, token, companies }) {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [query, setQuery] = useState("");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sample queries for financial data
  const sampleQueries = [
    "Show quarterly revenue breakdown",
    "List top expenses by category",
    "Display asset distribution",
  ];

  async function handleVisualize(e) {
    e.preventDefault();
    if (!query.trim() || !selectedCompany) return;

    setLoading(true);
    setChartData(null);

    // For demonstration, generate mock data
    // In production, this would call your API
    setTimeout(() => {
      const mockData = generateMockChartData(query);
      setChartData(mockData);
      setLoading(false);
    }, 800);
  }

  function generateMockChartData(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("revenue") || lowerQuery.includes("quarterly")) {
      return {
        title: "Quarterly Revenue",
        data: [
          { label: "Q1 2024", value: 2500000, color: "#2563eb" },
          { label: "Q2 2024", value: 3100000, color: "#3b82f6" },
          { label: "Q3 2024", value: 2800000, color: "#60a5fa" },
          { label: "Q4 2024", value: 3500000, color: "#93c5fd" },
        ],
      };
    }
    
    if (lowerQuery.includes("expense") || lowerQuery.includes("cost")) {
      return {
        title: "Expenses by Category",
        data: [
          { label: "Salaries", value: 1200000, color: "#ef4444" },
          { label: "Marketing", value: 450000, color: "#f97316" },
          { label: "Operations", value: 680000, color: "#f59e0b" },
          { label: "R&D", value: 320000, color: "#eab308" },
        ],
      };
    }
    
    if (lowerQuery.includes("asset")) {
      return {
        title: "Asset Distribution",
        data: [
          { label: "Cash", value: 5000000, color: "#22c55e" },
          { label: "Investments", value: 3200000, color: "#10b981" },
          { label: "Property", value: 2800000, color: "#14b8a6" },
          { label: "Equipment", value: 1500000, color: "#06b6d4" },
        ],
      };
    }

    return {
      title: "Sample Financial Data",
      data: [
        { label: "Category A", value: 1000000, color: "#8b5cf6" },
        { label: "Category B", value: 1500000, color: "#a78bfa" },
        { label: "Category C", value: 800000, color: "#c4b5fd" },
      ],
    };
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  }

  return (
    <div className="card">
      <h2>Data Visualizations</h2>
      <p className="status">
        Visualize financial data from your documents (Demo Mode)
      </p>

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

      <form onSubmit={handleVisualize}>
        <label>
          What would you like to visualize?
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Show quarterly revenue breakdown"
            required
          />
        </label>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuery(sq)}
              style={{ background: "#e2e8f0", color: "#0f172a" }}
            >
              {sq}
            </button>
          ))}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Visualization"}
        </button>
      </form>

      {chartData && (
        <div className="charts">
          <div className="chart">
            <h3>{chartData.title}</h3>
            <div className="simple-chart">
              {chartData.data.map((item, i) => {
                const maxValue = Math.max(...chartData.data.map((d) => d.value));
                const widthPercent = (item.value / maxValue) * 100;
                
                return (
                  <div key={i} className="chart-group">
                    <div className="chart-label">{item.label}</div>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{
                          width: `${widthPercent}%`,
                          background: item.color,
                        }}
                      >
                        <span className="bar-value">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}