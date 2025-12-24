import { React, esmDevSuffix, html } from "./lib/html.js";
import { initializeApp } from "./appLogic.js";
import { StatusBar } from "./components/StatusBar.js";
import { TabNavigation } from "./components/TabNavigation.js";
import { CharacterTab } from "./components/CharacterTab.js";
import { FilterTab } from "./components/FilterTab.js";
import { LogPanel } from "./components/LogPanel.js";

const { createRoot } = await import(
  `https://esm.sh/react-dom@18/client${esmDevSuffix}`
);
const { useEffect } = React;

function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  return html`
    <div>
      <h1>Dwarf Stats</h1>
      <${StatusBar} />
      <${TabNavigation} />
      <input id="fileInput" type="file" accept=".sav" hidden />
      <input id="dirInput" type="file" webkitdirectory multiple hidden />
      <${CharacterTab} />
      <${FilterTab} />
      <${LogPanel} />
    </div>
  `;
}

const root = createRoot(document.getElementById("root"));
root.render(html`<${App} />`);
