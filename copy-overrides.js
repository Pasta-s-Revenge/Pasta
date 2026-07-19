/* SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";
  const i18n = window.PASTA_I18N;
  if (!i18n) return;

  const pastaGod = {
    en: "Offer plugin JARs to the Pasta god.",
    ja: "プラグインJARをパスタ神へ捧げる。",
    de: "Opfere dem Pasta-Gott Plugin-JARs.",
    "zh-TW": "將外掛 JAR 獻給義大利麵之神。",
    "zh-CN": "将插件 JAR 献给意面之神。",
    it: "Offri i plugin JAR al dio della pasta.",
    es: "Ofrece los JAR de plugins al dios de la pasta."
  };

  Object.entries(pastaGod).forEach(([lang, text]) => {
    if (i18n[lang]) i18n[lang].uploadTitle = text;
  });

  if (i18n.ja) {
    i18n.ja.title = "旧式Bukkitプラグインを、Folia対応へ。";
  }

  const style = document.createElement("style");
  style.textContent = `
    html[lang="ja"] #hero-title {
      max-width: 12.5em;
      font-size: clamp(3rem, 7vw, 6.6rem);
      line-height: 1.02;
      letter-spacing: -.055em;
      word-break: keep-all;
      overflow-wrap: normal;
    }
    @media (max-width: 720px) {
      html[lang="ja"] #hero-title {
        max-width: 10.5em;
        font-size: clamp(2.65rem, 13vw, 4.6rem);
      }
    }
  `;
  document.head.append(style);
})();
