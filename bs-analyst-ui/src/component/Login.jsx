import React, { useState } from "react";

export default function Login({ onLogin, apiBase }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const res = await fetch(`${apiBase}/login?username=${username}&password=${password}`, {
        method: "POST",
      });
      if (!res.ok) {
        setMessage("❌ Invalid credentials. Please try again.");
        return;
      }
      const data = await res.json();
      setMessage("✅ Welcome, " + username + "!");
      onLogin(data.token, data.role);
    } catch (err) {
      console.error(err);
      setMessage("Server error. Make sure backend is running.");
    }
  };

  return (
    <div className="login-box">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">Login</button>
      </form>
      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}
