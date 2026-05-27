import { useState } from "react";
import {
  checkBuilderPassword,
  isBuilderAuthenticated,
  setBuilderAuthenticated
} from "./auth";

export default function BuilderAuth({ children }) {
  const [authenticated, setAuthenticated] = useState(isBuilderAuthenticated());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setChecking(true);

    const valid = await checkBuilderPassword(password);

    setChecking(false);

    if (!valid) {
      setPassword("");
      setError("Incorrect password.");
      return;
    }

    setBuilderAuthenticated();
    setAuthenticated(true);
  };

  if (authenticated) {
    return children;
  }

  return (
    <div className="builder-auth-page">
      <form className="builder-auth-card" onSubmit={handleSubmit}>
        <h1>Scenario Builder</h1>
        <p>Enter password to access the builder.</p>

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoFocus
        />

        {error && <p className="builder-auth-error">{error}</p>}

        <button type="submit" disabled={checking}>
          {checking ? "Checking..." : "Unlock Builder"}
        </button>
      </form>
    </div>
  );
}