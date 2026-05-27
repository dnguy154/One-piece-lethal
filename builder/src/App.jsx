import ScenarioBuilder from "./ScenarioBuilder";
import BuilderAuth from "./BuilderAuth";
import "./App.css";

export default function App() {
  return (
    <BuilderAuth>
      <ScenarioBuilder />
    </BuilderAuth>
  );
}