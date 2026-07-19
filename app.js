/* SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";

  const translations = {
    en: { source:"Source",language:"Language",eyebrow:"THE PASTA HAS JUDGED YOUR THREADS",title:"Offer a plugin. Receive Folia's verdict.",lead:"Your JAR never leaves this browser. The ritual scans bytecode references, refuses unsafe conversions, and only writes folia-supported: true when the conservative gate is clean.",uploadTitle:"Place the sacred JAR upon the altar",uploadHint:"Drag and drop a Bukkit / Paper plugin JAR, or select one from your device.",dropPrimary:"Drop plugin.jar here",dropSecondary:"or click to choose a file",privacy:"Local processing only. No upload, analytics, or server execution.",verdict:"VERDICT",classes:"Classes scanned",findings:"Findings",signatures:"Signatures removed",download:"Download patched JAR",another:"Judge another JAR",warning:"Static analysis is not proof of thread safety. Test the result on a disposable Folia server before production use.",principle1Title:"Private by construction",principle1Body:"JAR bytes remain in browser memory and are never executed.",principle2Title:"Refusal is a feature",principle2Body:"Unsafe or ambiguous plugins are rejected instead of silently mislabeled.",principle3Title:"Copyleft source",principle3Body:"The web application is licensed under AGPL-3.0-or-later.",footer:"Inspired by FoliaCode. Not affiliated with Mojang Studios or PaperMC.",processing:"Reading the offering…",readyTitle:"The threads appear calm",readyBadge:"PATCH READY",readySummary:"No known blocking API references were found. The manifest can be marked for Folia, but runtime verification is still required.",blockedTitle:"The noodle oracle refuses",blockedBadge:"MANUAL WORK",blockedSummary:"Known or ambiguous Folia-sensitive references remain. No patched JAR will be produced.",manifestMissing:"No plugin.yml or paper-plugin.yml was found.",invalidJar:"The selected file is not a readable JAR archive.",tooLarge:"The JAR is larger than 100 MB.",saved:"Patched JAR generated locally.",noFinding:"No known blocking references detected." },
    ja: { source:"ソース",language:"言語",eyebrow:"パスタはあなたのスレッドを裁いた",title:"プラグインを捧げ、Foliaの神託を受けよ。",lead:"JARはブラウザの外へ送信されません。バイトコード参照を検査し、危険な変換を拒否し、保守的な判定を通過した場合だけ folia-supported: true を追記します。",uploadTitle:"聖なるJARを祭壇に置く",uploadHint:"Bukkit / PaperプラグインのJARをドロップするか、端末から選択してください。",dropPrimary:"plugin.jar をここにドロップ",dropSecondary:"またはクリックして選択",privacy:"完全ローカル処理。アップロード、解析計測、サーバー実行はありません。",verdict:"神託",classes:"検査したクラス",findings:"検出項目",signatures:"削除した署名",download:"パッチ済みJARを保存",another:"別のJARを裁く",warning:"静的解析はスレッド安全性の証明ではありません。本番投入前に使い捨てのFoliaサーバーで検証してください。",principle1Title:"構造的にプライベート",principle1Body:"JARはブラウザメモリ内に留まり、内部クラスは実行されません。",principle2Title:"拒否は機能",principle2Body:"曖昧なプラグインを黙って対応済みにせず、変換を拒否します。",principle3Title:"コピーレフト",principle3Body:"WebアプリはAGPL-3.0-or-laterで公開されます。",footer:"FoliaCodeに着想を得ています。Mojang StudiosおよびPaperMCとは無関係です。",processing:"供物を読み取っています…",readyTitle:"スレッドは静かなようだ",readyBadge:"パッチ可能",readySummary:"既知の致命的API参照は検出されませんでした。Folia対応フラグを追記できますが、実環境検証は必要です。",blockedTitle:"麺の神託は拒絶した",blockedBadge:"手動修正が必要",blockedSummary:"Foliaで危険または曖昧な参照が残っています。パッチ済みJARは生成しません。",manifestMissing:"plugin.yml または paper-plugin.yml が見つかりません。",invalidJar:"読み取り可能なJARではありません。",tooLarge:"JARが100MBを超えています。",saved:"パッチ済みJARをローカル生成しました。",noFinding:"既知の致命的参照は検出されませんでした。" },
    de: { source:"Quellcode",language:"Sprache",eyebrow:"DIE PASTA HAT DEINE THREADS GERICHTET",title:"Opfere ein Plugin. Empfange Folias Urteil.",lead:"Die JAR-Datei verlässt diesen Browser nicht. Das Ritual prüft Bytecode-Referenzen, verweigert unsichere Umwandlungen und setzt folia-supported: true nur nach einer konservativen Prüfung.",uploadTitle:"Lege die heilige JAR auf den Altar",uploadHint:"Eine Bukkit-/Paper-Plugin-JAR hierher ziehen oder auswählen.",dropPrimary:"plugin.jar hier ablegen",dropSecondary:"oder zum Auswählen klicken",privacy:"Nur lokale Verarbeitung. Kein Upload, keine Analyse, keine Serverausführung.",verdict:"URTEIL",classes:"Geprüfte Klassen",findings:"Befunde",signatures:"Entfernte Signaturen",download:"Gepatchte JAR herunterladen",another:"Weitere JAR prüfen",warning:"Statische Analyse beweist keine Thread-Sicherheit. Vor dem Produktiveinsatz auf einem entbehrlichen Folia-Server testen.",principle1Title:"Privat durch Konstruktion",principle1Body:"JAR-Bytes bleiben im Browser und werden niemals ausgeführt.",principle2Title:"Ablehnung ist ein Merkmal",principle2Body:"Unsichere Plugins werden abgelehnt statt stillschweigend falsch markiert.",principle3Title:"Copyleft-Quellcode",principle3Body:"Die Webanwendung steht unter AGPL-3.0-or-later.",footer:"Inspiriert von FoliaCode. Keine Verbindung zu Mojang Studios oder PaperMC.",processing:"Das Opfer wird gelesen…",readyTitle:"Die Threads wirken ruhig",readyBadge:"PATCH BEREIT",readySummary:"Keine bekannten blockierenden API-Referenzen gefunden. Laufzeitprüfung bleibt erforderlich.",blockedTitle:"Das Nudel-Orakel verweigert",blockedBadge:"MANUELLE ARBEIT",blockedSummary:"Folia-sensitive Referenzen bleiben bestehen. Es wird keine gepatchte JAR erzeugt.",manifestMissing:"Keine plugin.yml oder paper-plugin.yml gefunden.",invalidJar:"Die Datei ist kein lesbares JAR-Archiv.",tooLarge:"Die JAR ist größer als 100 MB.",saved:"Gepatchte JAR wurde lokal erzeugt.",noFinding:"Keine bekannten blockierenden Referenzen erkannt." },
    "zh-TW": { source:"原始碼",language:"語言",eyebrow:"義大利麵已審判你的執行緒",title:"獻上外掛，接受 Folia 的神諭。",lead:"JAR 不會離開此瀏覽器。儀式會檢查位元組碼參照、拒絕不安全的轉換，只有通過保守檢查時才寫入 folia-supported: true。",uploadTitle:"將神聖的 JAR 放上祭壇",uploadHint:"拖放 Bukkit／Paper 外掛 JAR，或從裝置選取。",dropPrimary:"將 plugin.jar 拖到這裡",dropSecondary:"或點擊選擇檔案",privacy:"僅在本機處理，不上傳、不追蹤、不執行伺服器程式。",verdict:"神諭",classes:"已掃描類別",findings:"發現項目",signatures:"已移除簽章",download:"下載修補後的 JAR",another:"審判另一個 JAR",warning:"靜態分析無法證明執行緒安全。正式使用前請在可拋棄的 Folia 伺服器測試。",principle1Title:"從架構確保隱私",principle1Body:"JAR 位元只存在瀏覽器記憶體中，且不會執行。",principle2Title:"拒絕也是功能",principle2Body:"不安全或模糊的外掛會被拒絕，不會被錯誤標記。",principle3Title:"Copyleft 原始碼",principle3Body:"此 Web 應用程式採 AGPL-3.0-or-later。",footer:"靈感來自 FoliaCode，與 Mojang Studios 或 PaperMC 無關。",processing:"正在讀取祭品…",readyTitle:"執行緒看來平靜",readyBadge:"可產生修補",readySummary:"未發現已知的阻擋 API 參照；仍需進行實際執行驗證。",blockedTitle:"麵條神諭拒絕了",blockedBadge:"需要手動處理",blockedSummary:"仍有 Folia 敏感參照，因此不會產生修補後的 JAR。",manifestMissing:"找不到 plugin.yml 或 paper-plugin.yml。",invalidJar:"所選檔案不是可讀取的 JAR。",tooLarge:"JAR 大於 100 MB。",saved:"已在本機產生修補後的 JAR。",noFinding:"未偵測到已知的阻擋參照。" },
    "zh-CN": { source:"源代码",language:"语言",eyebrow:"意大利面已审判你的线程",title:"献上插件，接受 Folia 的神谕。",lead:"JAR 不会离开此浏览器。仪式会检查字节码引用、拒绝不安全转换，并且仅在通过保守检查时写入 folia-supported: true。",uploadTitle:"将神圣的 JAR 放上祭坛",uploadHint:"拖放 Bukkit／Paper 插件 JAR，或从设备中选择。",dropPrimary:"将 plugin.jar 拖到这里",dropSecondary:"或点击选择文件",privacy:"仅在本地处理，不上传、不追踪、不执行服务器程序。",verdict:"神谕",classes:"已扫描类",findings:"发现项",signatures:"已移除签名",download:"下载修补后的 JAR",another:"审判另一个 JAR",warning:"静态分析不能证明线程安全。生产使用前请在一次性 Folia 服务器中测试。",principle1Title:"从架构确保隐私",principle1Body:"JAR 字节只保留在浏览器内存中，并且不会执行。",principle2Title:"拒绝也是功能",principle2Body:"不安全或模糊的插件会被拒绝，而不是被错误标记。",principle3Title:"Copyleft 源代码",principle3Body:"本 Web 应用采用 AGPL-3.0-or-later。",footer:"灵感来自 FoliaCode，与 Mojang Studios 或 PaperMC 无关。",processing:"正在读取祭品…",readyTitle:"线程似乎很平静",readyBadge:"可生成补丁",readySummary:"未发现已知的阻断 API 引用；仍需运行时验证。",blockedTitle:"面条神谕拒绝了",blockedBadge:"需要手动处理",blockedSummary:"仍存在 Folia 敏感引用，因此不会生成修补后的 JAR。",manifestMissing:"未找到 plugin.yml 或 paper-plugin.yml。",invalidJar:"所选文件不是可读取的 JAR。",tooLarge:"JAR 大于 100 MB。",saved:"已在本地生成修补后的 JAR。",noFinding:"未检测到已知的阻断引用。" },
    it: { source:"Sorgente",language:"Lingua",eyebrow:"LA PASTA HA GIUDICATO I TUOI THREAD",title:"Offri un plugin. Ricevi il verdetto di Folia.",lead:"Il JAR non lascia mai il browser. Il rituale analizza i riferimenti del bytecode, rifiuta conversioni non sicure e scrive folia-supported: true solo dopo un controllo conservativo.",uploadTitle:"Posa il JAR sacro sull'altare",uploadHint:"Trascina un plugin Bukkit/Paper oppure selezionalo dal dispositivo.",dropPrimary:"Rilascia plugin.jar qui",dropSecondary:"oppure fai clic per scegliere",privacy:"Elaborazione esclusivamente locale. Nessun upload, tracciamento o esecuzione server.",verdict:"VERDETTO",classes:"Classi analizzate",findings:"Rilevamenti",signatures:"Firme rimosse",download:"Scarica il JAR modificato",another:"Giudica un altro JAR",warning:"L'analisi statica non prova la sicurezza dei thread. Verifica il risultato su un server Folia usa e getta.",principle1Title:"Privato per costruzione",principle1Body:"I byte del JAR restano nel browser e non vengono eseguiti.",principle2Title:"Il rifiuto è una funzione",principle2Body:"I plugin ambigui vengono rifiutati invece di essere etichettati erroneamente.",principle3Title:"Sorgente copyleft",principle3Body:"L'applicazione web è distribuita con AGPL-3.0-or-later.",footer:"Ispirato a FoliaCode. Non affiliato a Mojang Studios o PaperMC.",processing:"Lettura dell'offerta…",readyTitle:"I thread sembrano tranquilli",readyBadge:"PATCH PRONTA",readySummary:"Nessun riferimento API bloccante noto. È comunque necessaria la verifica runtime.",blockedTitle:"L'oracolo della pasta rifiuta",blockedBadge:"LAVORO MANUALE",blockedSummary:"Restano riferimenti sensibili a Folia. Non verrà prodotto alcun JAR modificato.",manifestMissing:"plugin.yml o paper-plugin.yml non trovato.",invalidJar:"Il file non è un archivio JAR leggibile.",tooLarge:"Il JAR supera 100 MB.",saved:"JAR modificato generato localmente.",noFinding:"Nessun riferimento bloccante noto rilevato." },
    es: { source:"Código",language:"Idioma",eyebrow:"LA PASTA HA JUZGADO TUS HILOS",title:"Ofrece un plugin. Recibe el veredicto de Folia.",lead:"El JAR nunca sale del navegador. El ritual analiza referencias de bytecode, rechaza conversiones inseguras y solo escribe folia-supported: true tras superar una comprobación conservadora.",uploadTitle:"Coloca el JAR sagrado sobre el altar",uploadHint:"Arrastra un plugin Bukkit/Paper o selecciónalo desde el dispositivo.",dropPrimary:"Suelta plugin.jar aquí",dropSecondary:"o haz clic para elegir",privacy:"Procesamiento exclusivamente local. Sin subida, analítica ni ejecución en servidor.",verdict:"VEREDICTO",classes:"Clases analizadas",findings:"Hallazgos",signatures:"Firmas eliminadas",download:"Descargar JAR parcheado",another:"Juzgar otro JAR",warning:"El análisis estático no demuestra seguridad de hilos. Prueba el resultado en un servidor Folia desechable.",principle1Title:"Privado por diseño",principle1Body:"Los bytes del JAR permanecen en el navegador y nunca se ejecutan.",principle2Title:"Rechazar es una función",principle2Body:"Los plugins ambiguos se rechazan en vez de etiquetarse incorrectamente.",principle3Title:"Código copyleft",principle3Body:"La aplicación web usa AGPL-3.0-or-later.",footer:"Inspirado en FoliaCode. Sin afiliación con Mojang Studios ni PaperMC.",processing:"Leyendo la ofrenda…",readyTitle:"Los hilos parecen tranquilos",readyBadge:"PARCHE LISTO",readySummary:"No se encontraron referencias API bloqueantes conocidas. Sigue siendo necesaria una verificación en ejecución.",blockedTitle:"El oráculo de la pasta se niega",blockedBadge:"TRABAJO MANUAL",blockedSummary:"Quedan referencias sensibles a Folia. No se generará un JAR parcheado.",manifestMissing:"No se encontró plugin.yml ni paper-plugin.yml.",invalidJar:"El archivo no es un JAR legible.",tooLarge:"El JAR supera los 100 MB.",saved:"JAR parcheado generado localmente.",noFinding:"No se detectaron referencias bloqueantes conocidas." }
  };

  const rules = [
    { id:"bukkit-runnable", severity:"CRITICAL", needles:["org/bukkit/scheduler/BukkitRunnable"], label:"BukkitRunnable scheduler usage" },
    { id:"legacy-scheduler", severity:"CRITICAL", needles:["org/bukkit/scheduler/BukkitScheduler", "runTask"], label:"Legacy Bukkit scheduler call" },
    { id:"sync-scheduler", severity:"CRITICAL", needles:["scheduleSync"], label:"Synchronous scheduler call" },
    { id:"primary-thread", severity:"HIGH", needles:["isPrimaryThread"], label:"Primary-thread assumption" },
    { id:"teleport", severity:"HIGH", needles:["org/bukkit/entity/Entity", "teleport"], label:"Synchronous entity teleport reference" },
    { id:"chunk-sync", severity:"HIGH", needles:["getChunkAt"], label:"Potential synchronous chunk access" }
  ];

  const $ = (id) => document.getElementById(id);
  const state = { language: localStorage.getItem("pasta-language") || detectLanguage(), output: null, outputName: "" };
  const els = { language:$("language"), dropZone:$("dropZone"), fileInput:$("fileInput"), status:$("status"), results:$("results"), resultTitle:$("result-title"), resultBadge:$("resultBadge"), resultSummary:$("resultSummary"), classCount:$("classCount"), findingCount:$("findingCount"), signatureCount:$("signatureCount"), findingList:$("findingList"), download:$("downloadButton"), reset:$("resetButton") };

  function detectLanguage() {
    const n = navigator.language;
    if (n.startsWith("ja")) return "ja";
    if (n.startsWith("de")) return "de";
    if (n === "zh-TW" || n === "zh-HK" || n === "zh-Hant") return "zh-TW";
    if (n.startsWith("zh")) return "zh-CN";
    if (n.startsWith("it")) return "it";
    if (n.startsWith("es")) return "es";
    return "en";
  }
  function t(key) { return (translations[state.language] || translations.en)[key] || translations.en[key] || key; }
  function applyLanguage(lang) {
    state.language = translations[lang] ? lang : "en";
    localStorage.setItem("pasta-language", state.language);
    document.documentElement.lang = state.language;
    els.language.value = state.language;
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  }
  applyLanguage(state.language);

  els.language.addEventListener("change", (e) => applyLanguage(e.target.value));
  els.dropZone.addEventListener("click", () => els.fileInput.click());
  els.dropZone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); els.fileInput.click(); } });
  ["dragenter","dragover"].forEach((eventName) => els.dropZone.addEventListener(eventName, (e) => { e.preventDefault(); els.dropZone.classList.add("dragging"); }));
  ["dragleave","drop"].forEach((eventName) => els.dropZone.addEventListener(eventName, (e) => { e.preventDefault(); els.dropZone.classList.remove("dragging"); }));
  els.dropZone.addEventListener("drop", (e) => processFile(e.dataTransfer.files[0]));
  els.fileInput.addEventListener("change", (e) => processFile(e.target.files[0]));
  els.reset.addEventListener("click", reset);
  els.download.addEventListener("click", downloadOutput);

  function reset() {
    state.output = null; state.outputName = ""; els.fileInput.value = ""; els.status.textContent = ""; els.results.classList.add("hidden"); els.download.disabled = true; els.findingList.replaceChildren();
  }

  async function processFile(file) {
    reset();
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".jar")) return fail(t("invalidJar"));
    if (file.size > 100 * 1024 * 1024) return fail(t("tooLarge"));
    if (!window.JSZip) return fail("Archive engine failed to load.");
    els.status.textContent = t("processing");
    try {
      const zip = await JSZip.loadAsync(file, { checkCRC32: true });
      const names = Object.keys(zip.files);
      const manifestName = names.find((name) => /(^|\/)plugin\.yml$/i.test(name)) || names.find((name) => /(^|\/)paper-plugin\.yml$/i.test(name));
      if (!manifestName) return showBlocked([], 0, 0, t("manifestMissing"));

      const classNames = names.filter((name) => name.endsWith(".class") && !zip.files[name].dir);
      const matched = new Map();
      for (let i = 0; i < classNames.length; i += 1) {
        const name = classNames[i];
        const bytes = await zip.files[name].async("uint8array");
        const text = new TextDecoder("latin1").decode(bytes);
        for (const rule of rules) {
          if (rule.needles.every((needle) => text.includes(needle))) {
            if (!matched.has(rule.id)) matched.set(rule.id, { ...rule, classes: [] });
            const record = matched.get(rule.id);
            if (record.classes.length < 8) record.classes.push(name.replace(/\.class$/, "").replaceAll("/", "."));
          }
        }
        if (i % 40 === 0) await new Promise(requestAnimationFrame);
      }
      const findings = [...matched.values()];
      const signatures = names.filter((name) => /^META-INF\/.*\.(SF|RSA|DSA)$/i.test(name));
      if (findings.length) return showBlocked(findings, classNames.length, signatures.length);

      signatures.forEach((name) => zip.remove(name));
      const manifest = await zip.files[manifestName].async("string");
      zip.file(manifestName, patchYaml(manifest));
      zip.file("META-INF/pasta-report.json", JSON.stringify({ tool:"Pasta", version:"0.1.0", source:file.name, generatedAt:new Date().toISOString(), classesScanned:classNames.length, findings:[], note:"Static compatibility gate only; runtime verification required." }, null, 2));
      state.output = await zip.generateAsync({ type:"blob", compression:"DEFLATE", compressionOptions:{ level:6 }, platform:"UNIX" });
      state.outputName = file.name.replace(/\.jar$/i, "") + "-folia.jar";
      showReady(classNames.length, signatures.length);
    } catch (error) {
      console.error(error);
      fail(t("invalidJar"));
    }
  }

  function patchYaml(text) {
    const eol = text.includes("\r\n") ? "\r\n" : "\n";
    const cleaned = text.split(/\r?\n/).filter((line) => !/^\s*folia-supported\s*:/i.test(line)).join(eol).replace(/\s+$/, "");
    return `${cleaned}${eol}folia-supported: true${eol}`;
  }

  function showReady(classCount, signatureCount) {
    els.results.classList.remove("hidden");
    els.resultTitle.textContent = t("readyTitle");
    els.resultBadge.textContent = t("readyBadge");
    els.resultBadge.className = "badge success";
    els.resultSummary.textContent = t("readySummary");
    els.classCount.textContent = classCount.toLocaleString();
    els.findingCount.textContent = "0";
    els.signatureCount.textContent = signatureCount.toLocaleString();
    els.findingList.innerHTML = `<div class="finding" style="border-color:var(--success)"><strong>${escapeHtml(t("noFinding"))}</strong></div>`;
    els.download.disabled = false;
    els.status.textContent = t("saved");
    els.results.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function showBlocked(findings, classCount, signatureCount, override) {
    state.output = null;
    els.results.classList.remove("hidden");
    els.resultTitle.textContent = t("blockedTitle");
    els.resultBadge.textContent = t("blockedBadge");
    els.resultBadge.className = "badge danger";
    els.resultSummary.textContent = override || t("blockedSummary");
    els.classCount.textContent = classCount.toLocaleString();
    els.findingCount.textContent = findings.length.toLocaleString();
    els.signatureCount.textContent = signatureCount.toLocaleString();
    els.findingList.replaceChildren(...findings.map(renderFinding));
    els.download.disabled = true;
    els.status.textContent = "";
    els.results.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function renderFinding(finding) {
    const node = document.createElement("div"); node.className = "finding";
    const classes = finding.classes.length ? finding.classes.join(", ") : "";
    node.innerHTML = `<strong>${escapeHtml(finding.severity)} — ${escapeHtml(finding.label)}</strong><span>${escapeHtml(classes)}</span>`;
    return node;
  }
  function fail(message) { els.status.textContent = message; }
  function downloadOutput() {
    if (!state.output) return;
    const url = URL.createObjectURL(state.output); const a = document.createElement("a"); a.href = url; a.download = state.outputName; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]); }
})();
