/* SPDX-License-Identifier: AGPL-3.0-or-later */
self.PastaRules = (() => {
  "use strict";
  const C = self.PastaClassfile;
  const BRIDGE_OWNER = "dev/pastasrevenge/runtime/FoliaBridge";

  function transformClass(original, parsed, runnableClasses, archive) {
    const mutable = new Uint8Array(original);
    const additions = [];
    const pool = new C.ConstantPoolBuilder(parsed, additions);
    const findings = [];
    let patched = 0;

    for (const method of parsed.methods) {
      if (!method.code) continue;
      let pc = 0;
      while (pc < method.code.length) {
        const opcode = method.code[pc];
        const len = C.instructionLength(method.code, pc);
        if ((opcode === 0xb6 || opcode === 0xb7 || opcode === 0xb8 || opcode === 0xb9) && pc + 2 < method.code.length) {
          const refIndex = (method.code[pc + 1] << 8) | method.code[pc + 2];
          const ref = C.resolveMethodRef(parsed.cp, refIndex);
          if (ref) {
            const decision = decideRewrite(ref, opcode, method.code, pc, len, runnableClasses);
            if (decision?.kind === "patch") {
              const methodRef = pool.methodRef(BRIDGE_OWNER, decision.bridgeName, decision.bridgeDesc);
              const absolute = method.codeStart + pc;
              mutable[absolute] = 0xb8;
              mutable[absolute + 1] = methodRef >>> 8;
              mutable[absolute + 2] = methodRef & 0xff;
              if (opcode === 0xb9) { mutable[absolute + 3] = 0; mutable[absolute + 4] = 0; }
              patched++;
              findings.push({ status:"patched", severity:decision.severity, category:decision.category, className:parsed.className.replaceAll("/","."), methodName:parsed.utf8(method.nameIndex), methodDescriptor:parsed.utf8(method.descIndex), line:C.lineFor(method.lines,pc), offset:pc, archive, original:C.formatRef(ref), replacement:BRIDGE_OWNER.replaceAll("/",".")+"."+decision.bridgeName+decision.bridgeDesc, reason:decision.reason });
            } else if (decision?.kind === "manual") {
              findings.push(manualFinding(decision.severity, decision.category, parsed.className.replaceAll("/","."), parsed.utf8(method.nameIndex), C.lineFor(method.lines,pc), pc, C.formatRef(ref), decision.reason, archive));
            } else {
              const warning = detectUnsupported(ref);
              if (warning) findings.push(manualFinding(warning.severity, warning.category, parsed.className.replaceAll("/","."), parsed.utf8(method.nameIndex), C.lineFor(method.lines,pc), pc, C.formatRef(ref), warning.reason, archive));
            }
          }
        }
        pc += Math.max(1, len);
      }
    }

    for (let i = 1; i < parsed.cp.length; i++) {
      const entry = parsed.cp[i];
      if (entry?.tag === 15) {
        const ref = C.resolveMethodRef(parsed.cp, entry.refIndex);
        const sensitive = ref && (decideRewrite(ref, 0, new Uint8Array(), 0, 0, runnableClasses) || detectUnsupported(ref));
        if (sensitive) findings.push(manualFinding("HIGH", "Method reference", parsed.className.replaceAll("/","."), "<constant-pool>", 0, 0, C.formatRef(ref), "The call is stored in an invokedynamic method handle and cannot be offset-stably rewritten.", archive));
      }
    }

    if (!patched) return { bytes: original, patched, findings };
    const addedLength = additions.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(mutable.length + addedLength);
    output.set(mutable.subarray(0, 8), 0);
    C.writeU2(output, 8, parsed.cp.length + pool.countAdded);
    output.set(mutable.subarray(10, parsed.cpEnd), 10);
    let cursor = parsed.cpEnd;
    for (const part of additions) { output.set(part, cursor); cursor += part.length; }
    output.set(mutable.subarray(parsed.cpEnd), cursor);
    return { bytes: output, patched, findings };
  }

  function scanOnly(bytes, entry, archive) {
    const parsed = C.parseClass(bytes);
    const findings = [];
    for (const method of parsed.methods) {
      if (!method.code) continue;
      for (let pc=0; pc<method.code.length;) {
        const opcode=method.code[pc], len=C.instructionLength(method.code,pc);
        if ((opcode===0xb6||opcode===0xb7||opcode===0xb8||opcode===0xb9) && pc+2<method.code.length) {
          const ref=C.resolveMethodRef(parsed.cp,(method.code[pc+1]<<8)|method.code[pc+2]);
          const warning=ref&&detectUnsupported(ref,true);
          if(warning)findings.push(manualFinding(warning.severity,warning.category,parsed.className.replaceAll("/","."),parsed.utf8(method.nameIndex),C.lineFor(method.lines,pc),pc,C.formatRef(ref),"Nested JAR: "+warning.reason,archive));
        }
        pc+=Math.max(1,len);
      }
    }
    return findings;
  }

  function decideRewrite(ref, opcode, code, pc, len, runnableClasses) {
    const discarded = C.nextMeaningfulOpcode(code, pc + len) === 0x57;
    const scheduler = {
      runTask:"runTask", runTaskLater:"runTaskLater", runTaskTimer:"runTaskTimer",
      runTaskAsynchronously:"runTaskAsynchronously", runTaskLaterAsynchronously:"runTaskLaterAsynchronously", runTaskTimerAsynchronously:"runTaskTimerAsynchronously",
      scheduleSyncDelayedTask:"scheduleSyncDelayedTask", scheduleSyncRepeatingTask:"scheduleSyncRepeatingTask",
      scheduleAsyncDelayedTask:"scheduleAsyncDelayedTask", scheduleAsyncRepeatingTask:"scheduleAsyncRepeatingTask"
    };
    if (ref.owner === "org/bukkit/scheduler/BukkitScheduler" && scheduler[ref.name]) {
      if (C.returnType(ref.desc) !== "V" && !discarded) return {kind:"manual",severity:"CRITICAL",category:"Scheduler",reason:"The returned BukkitTask/task ID is used. Folia schedulers expose a different task lifecycle, so preserving semantics requires source-level migration."};
      return {kind:"patch",severity:"CRITICAL",category:"Scheduler",bridgeName:scheduler[ref.name],bridgeDesc:"(Lorg/bukkit/scheduler/BukkitScheduler;"+ref.desc.slice(1),reason:"Receiver and arguments are preserved; the injected bridge routes the call to GlobalRegionScheduler or AsyncScheduler and falls back on Bukkit."};
    }
    const runnable = {
      runTask:"runnableRunTask", runTaskLater:"runnableRunTaskLater", runTaskTimer:"runnableRunTaskTimer",
      runTaskAsynchronously:"runnableRunTaskAsynchronously", runTaskLaterAsynchronously:"runnableRunTaskLaterAsynchronously", runTaskTimerAsynchronously:"runnableRunTaskTimerAsynchronously"
    };
    if (runnableClasses.has(ref.owner) && runnable[ref.name] && ref.desc.startsWith("(Lorg/bukkit/plugin/Plugin;")) {
      if (!discarded) return {kind:"manual",severity:"CRITICAL",category:"BukkitRunnable",reason:"The BukkitTask result is used. Replacing it with a Folia task would change cancellation and identity semantics."};
      return {kind:"patch",severity:"CRITICAL",category:"BukkitRunnable",bridgeName:runnable[ref.name],bridgeDesc:"(Lorg/bukkit/scheduler/BukkitRunnable;"+ref.desc.slice(1),reason:"The runnable receiver is preserved and dispatched through the injected Folia scheduler bridge."};
    }
    if (ref.owner === "org/bukkit/entity/Entity" && ref.name === "teleport" && ref.desc === "(Lorg/bukkit/Location;)Z") {
      if (!discarded) return {kind:"manual",severity:"HIGH",category:"Entity",reason:"The synchronous boolean teleport result is used. teleportAsync returns a future and cannot preserve this control flow automatically."};
      return {kind:"patch",severity:"HIGH",category:"Entity",bridgeName:"entityTeleport",bridgeDesc:"(Lorg/bukkit/entity/Entity;Lorg/bukkit/Location;)Z",reason:"The discarded synchronous result is replaced by a teleportAsync bridge with Paper fallback."};
    }
    if (ref.owner === "org/bukkit/block/Block") {
      const block = {
        "setType(Lorg/bukkit/Material;)V":["blockSetType","(Lorg/bukkit/block/Block;Lorg/bukkit/Material;)V"],
        "setType(Lorg/bukkit/Material;Z)V":["blockSetTypePhysics","(Lorg/bukkit/block/Block;Lorg/bukkit/Material;Z)V"],
        "setBlockData(Lorg/bukkit/block/data/BlockData;)V":["blockSetBlockData","(Lorg/bukkit/block/Block;Lorg/bukkit/block/data/BlockData;)V"],
        "setBlockData(Lorg/bukkit/block/data/BlockData;Z)V":["blockSetBlockDataPhysics","(Lorg/bukkit/block/Block;Lorg/bukkit/block/data/BlockData;Z)V"],
        "breakNaturally()Z":["blockBreakNaturally","(Lorg/bukkit/block/Block;)Z"],
        "breakNaturally(Lorg/bukkit/inventory/ItemStack;)Z":["blockBreakNaturallyWithTool","(Lorg/bukkit/block/Block;Lorg/bukkit/inventory/ItemStack;)Z"],
        "applyBoneMeal(Lorg/bukkit/block/BlockFace;)Z":["blockApplyBoneMeal","(Lorg/bukkit/block/Block;Lorg/bukkit/block/BlockFace;)Z"]
      }[ref.name+ref.desc];
      if (block) {
        if (C.returnType(ref.desc) !== "V" && !discarded) return {kind:"manual",severity:"HIGH",category:"Region ownership",reason:"The block operation's boolean result is used, but region scheduling completes later."};
        return {kind:"patch",severity:"HIGH",category:"Region ownership",bridgeName:block[0],bridgeDesc:block[1],reason:"The mutation is routed to the RegionScheduler owning the block location, with direct Paper fallback."};
      }
    }
    return null;
  }

  function detectUnsupported(ref, nested = false) {
    if (ref.owner === "org/bukkit/Bukkit" && ref.name === "isPrimaryThread") return {severity:"HIGH",category:"Thread model",reason:"Folia has multiple region tick threads; a single primary-thread assumption is invalid."};
    if ((ref.owner === "org/bukkit/World" || ref.owner === "org/bukkit/Chunk") && /getChunkAt|loadChunk|unloadChunk/.test(ref.name) && !/Async/.test(ref.name)) return {severity:"HIGH",category:"Chunk access",reason:"Synchronous chunk access may cross a region boundary and requires contextual migration."};
    if (ref.owner === "org/bukkit/scheduler/BukkitScheduler") return {severity:"CRITICAL",category:"Scheduler",reason:"This scheduler operation is unsupported by the automatic bridge and requires task-lifecycle review."};
    if (ref.owner.includes("BukkitRunnable") && /cancel|isCancelled/.test(ref.name)) return {severity:"HIGH",category:"BukkitRunnable",reason:"Cancellation state cannot be mapped safely without escape and lifecycle analysis."};
    if (nested && (ref.owner.startsWith("org/bukkit/") && /set|teleport|spawn|createExplosion/.test(ref.name))) return {severity:"INFO",category:"Nested dependency",reason:"Potential Folia-sensitive Bukkit operation inside a nested dependency."};
    return null;
  }

  function manualFinding(severity,category,className,methodName,line,offset,original,reason,archive=""){return{status:"manual",severity,category,className,methodName,line,offset,archive,original,replacement:"",reason};}
  return {transformClass,scanOnly,manualFinding};
})();
