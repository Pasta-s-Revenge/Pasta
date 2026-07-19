/* SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";
  const load = (src) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.append(script);
  });
  load("i18n.js")
    .then(() => load("copy-overrides.js"))
    .then(() => load("app-core.js"))
    .catch((error) => {
      console.error(error);
      const status = document.getElementById("status");
      if (status) status.textContent = "Application assets failed to load.";
    });
})();
