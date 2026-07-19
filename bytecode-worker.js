/* SPDX-License-Identifier: AGPL-3.0-or-later */
"use strict";
importScripts(
  "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
  "worker-classfile.js",
  "worker-rules.js"
);

const TOOL_VERSION = "0.2.0";
const BRIDGE_PATH = "dev/pastasrevenge/runtime/FoliaBridge.class";
const C = self.PastaClassfile;
const R = self.PastaRules;

self.onmessage = async (event) => {
  if (event.data?.type !== "transform") return;
  try {
    const result = await transformJar(event.data.name, new Uint8Array(event.data.buffer));
    if (result.jarBuffer) self.postMessage(result, [result.jarBuffer]);
    else self.postMessage(result);
  } catch (error) {
    console.error(error);
    self.postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
};

function progress(percent, stage, phase, detail = "") {
  self.postMessage({ type: "progress", percent, stage, phase, detail });
}

async function transformJar(name, inputBytes) {
  const started = performance.now();
  progress(2, "opening", "opening", name);
  const sha256 = await digest(inputBytes);
  const zip = await JSZip.loadAsync(inputBytes, { checkCRC32: true, createFolders: true });
  const names = Object.keys(zip.files);
  const manifestName = names.find((n) => /(^|\/)plugin\.yml$/i.test(n)) || names.find((n) => /(^|\/)paper-plugin\.yml$/i.test(n));
  const signatures = names.filter((n) => /^META-INF\/.*\.(SF|RSA|DSA|EC)$/i.test(n));
  const classNames = names.filter((n) => n.endsWith(".class") && !zip.files[n].dir && !n.startsWith("META-INF/versions/"));
  const nestedNames = names.filter((n) => n.endsWith(".jar") && !zip.files[n].dir);
  const findings = [];
  const classRecords = [];

  if (!manifestName) {
    return resultWithoutJar(name, sha256, started, findings, classNames.length, nestedNames.length, "No plugin.yml or paper-plugin.yml was found.");
  }

  progress(8, "scanning", "scanning", classNames.length + " classes");
  for (let start = 0; start < classNames.length; start += 16) {
    const batchNames = classNames.slice(start, start + 16);
    const batchBytes = await Promise.all(batchNames.map((entry) => zip.files[entry].async("uint8array")));
    for (let i = 0; i < batchNames.length; i++) {
      try { classRecords.push({ entry: batchNames[i], bytes: batchBytes[i], parsed: C.parseClass(batchBytes[i]) }); }
      catch (error) { findings.push(R.manualFinding("MEDIUM", "Malformed class", batchNames[i], "", 0, 0, "Unreadable class file", "Class parser refused this entry: " + error.message)); }
    }
    progress(8 + 25 * Math.min(1, (start + batchNames.length) / Math.max(1, classNames.length)), "scanning", "scanning", Math.min(start + batchNames.length, classNames.length) + " / " + classNames.length);
  }

  const superByClass = new Map(classRecords.map((r) => [r.parsed.className, r.parsed.superName]));
  const runnableClasses = new Set(["org/bukkit/scheduler/BukkitRunnable"]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [klass, parent] of superByClass) {
      if (parent && runnableClasses.has(parent) && !runnableClasses.has(klass)) { runnableClasses.add(klass); changed = true; }
    }
  }

  progress(35, "transforming", "transforming", "Resolving call sites");
  let patchedCount = 0;
  for (let index = 0; index < classRecords.length; index++) {
    const record = classRecords[index];
    const transformed = R.transformClass(record.bytes, record.parsed, runnableClasses, record.entry);
    findings.push(...transformed.findings);
    patchedCount += transformed.patched;
    if (transformed.patched) zip.file(record.entry, transformed.bytes);
    if (index % 20 === 0) progress(35 + 35 * ((index + 1) / Math.max(1, classRecords.length)), "transforming", "transforming", (index + 1) + " / " + classRecords.length);
  }

  // Nested archives are inspected one level deep and reported. Repacking them is intentionally conservative.
  for (const nestedName of nestedNames) {
    try {
      const nestedBytes = await zip.files[nestedName].async("uint8array");
      const nestedZip = await JSZip.loadAsync(nestedBytes);
      const nestedClasses = Object.keys(nestedZip.files).filter((n) => n.endsWith(".class") && !nestedZip.files[n].dir).slice(0, 5000);
      for (let j = 0; j < nestedClasses.length; j += 32) {
        const entries = nestedClasses.slice(j, j + 32);
        const bytes = await Promise.all(entries.map((n) => nestedZip.files[n].async("uint8array")));
        for (let k = 0; k < entries.length; k++) {
          try { findings.push(...R.scanOnly(bytes[k], entries[k], nestedName)); } catch (_) { /* ignore malformed nested dependency */ }
        }
      }
    } catch (error) {
      findings.push(R.manualFinding("INFO", "Nested archive", nestedName, "", 0, 0, "Unreadable nested JAR", error.message));
    }
  }

  const manualCount = findings.filter((f) => f.status === "manual" && f.severity !== "INFO").length;
  const outcome = manualCount === 0 ? "clean" : patchedCount > 0 ? "partial" : "blocked";
  const manifestText = await zip.files[manifestName].async("string");
  const plugin = parsePluginYaml(manifestText);
  zip.file(manifestName, patchYaml(manifestText, manualCount === 0));

  const score = compatibilityScore(findings, outcome);
  const report = {
    schema: "dev.pastasrevenge.report/v1",
    tool: { name: "Pasta's Revenge", version: TOOL_VERSION, engine: "offset-stable-classfile-transformer" },
    generatedAt: new Date().toISOString(),
    input: { name, size: inputBytes.length, sha256 },
    plugin,
    outcome,
    score,
    metrics: {
      classes: classRecords.length,
      patched: patchedCount,
      manual: manualCount,
      informational: findings.filter((f) => f.severity === "INFO").length,
      nestedJars: nestedNames.length,
      signaturesRemoved: outcome === "blocked" ? 0 : signatures.length,
      elapsedMs: Math.round(performance.now() - started)
    },
    guarantees: {
      localOnly: true,
      pluginExecuted: false,
      offsetStableRewrites: true,
      foliaSupportedFlagAdded: manualCount === 0,
      runtimeVerificationRequired: true
    },
    findings
  };

  let jarBuffer = null;
  let jarName = "";
  if (outcome !== "blocked") {
    signatures.forEach((entry) => zip.remove(entry));
    if (patchedCount > 0) {
      const response = await fetch("runtime/FoliaBridge.class");
      if (!response.ok) throw new Error("Runtime bridge asset is unavailable");
      zip.file(BRIDGE_PATH, new Uint8Array(await response.arrayBuffer()));
    }
    zip.file("META-INF/pasta-report.json", JSON.stringify(report, null, 2));
    progress(78, "packing", "packing", "DEFLATE");
    const generated = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 }, platform: "UNIX", streamFiles: true }, (meta) => progress(78 + meta.percent * 0.2, "packing", "packing", Math.round(meta.percent) + "%"));
    jarBuffer = generated.buffer.slice(generated.byteOffset, generated.byteOffset + generated.byteLength);
    jarName = name.replace(/\.jar$/i, "") + (outcome === "clean" ? "-folia.jar" : "-folia-partial.jar");
    report.metrics.elapsedMs = Math.round(performance.now() - started);
  }
  return { type: "result", report, jarBuffer, jarName };
}

function resultWithoutJar(name, sha256, started, findings, classes, nested, reason) {
  findings.push(R.manualFinding("CRITICAL", "Plugin descriptor", name, "", 0, 0, "Missing descriptor", reason));
  return { type: "result", report: { schema:"dev.pastasrevenge.report/v1", tool:{name:"Pasta's Revenge",version:TOOL_VERSION}, generatedAt:new Date().toISOString(), input:{name,sha256}, plugin:{}, outcome:"blocked", score:0, metrics:{classes,patched:0,manual:1,nestedJars:nested,signaturesRemoved:0,elapsedMs:Math.round(performance.now()-started)}, findings }, jarBuffer:null, jarName:"" };
}

function parsePluginYaml(text) {
  const scalar=(key)=>{const m=text.match(new RegExp("^\\s*"+key.replace("-","\\-")+"\\s*:\\s*(.+?)\\s*$","mi"));if(!m)return"";return m[1].replace(/^['\"]|['\"]$/g,"");};
  return { name:scalar("name"), version:scalar("version"), main:scalar("main"), apiVersion:scalar("api-version"), alreadyFolia:/^\s*folia-supported\s*:\s*true\s*$/mi.test(text) };
}
function patchYaml(text,supported){const eol=text.includes("\r\n")?"\r\n":"\n";const clean=text.split(/\r?\n/).filter((line)=>!/^\s*folia-supported\s*:/i.test(line)).join(eol).replace(/\s+$/,"");return supported?clean+eol+"folia-supported: true"+eol:clean+eol;}
function compatibilityScore(findings,outcome){if(outcome==="blocked")return 0;let score=100;for(const f of findings)if(f.status==="manual")score-=f.severity==="CRITICAL"?28:f.severity==="HIGH"?16:f.severity==="MEDIUM"?8:1;return Math.max(outcome==="partial"?10:60,Math.min(100,score));}
async function digest(bytes){const hash=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");}
