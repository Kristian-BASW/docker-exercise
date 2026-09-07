import "./index.css";

import minion from "./assets/minion.png";

export function App() {
  return (
    <div className="app">
      <div className="logo-container">
        <img src={minion} alt="Minion" className="logo bun-logo" />
      </div>

      <h1>Minions + React</h1>
      <p>
        Hello from the minions
      </p>
    </div>
  );
}

export default App;
