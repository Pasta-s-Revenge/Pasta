/* SPDX-License-Identifier: AGPL-3.0-or-later */
self.PastaClassfile = (() => {
  "use strict";
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();

  function parseClass(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(0) !== 0xcafebabe) throw new Error("Bad class magic");
    const cpCount = view.getUint16(8);
    const cp = new Array(cpCount);
    let o = 10;
    for (let i = 1; i < cpCount; i++) {
      const tag = view.getUint8(o++);
      const entry = { tag };
      if (tag === 1) { const length=view.getUint16(o);o+=2;entry.value=decoder.decode(bytes.subarray(o,o+length));o+=length; }
      else if (tag === 3 || tag === 4) o += 4;
      else if (tag === 5 || tag === 6) { o += 8; cp[i]=entry; i++; continue; }
      else if (tag === 7) { entry.nameIndex=view.getUint16(o);o+=2; }
      else if (tag === 8 || tag === 16 || tag === 19 || tag === 20) { entry.index=view.getUint16(o);o+=2; }
      else if (tag === 9 || tag === 10 || tag === 11) { entry.classIndex=view.getUint16(o);entry.nameTypeIndex=view.getUint16(o+2);o+=4; }
      else if (tag === 12) { entry.nameIndex=view.getUint16(o);entry.descIndex=view.getUint16(o+2);o+=4; }
      else if (tag === 15) { entry.kind=view.getUint8(o);entry.refIndex=view.getUint16(o+1);o+=3; }
      else if (tag === 17 || tag === 18) { entry.bootstrapIndex=view.getUint16(o);entry.nameTypeIndex=view.getUint16(o+2);o+=4; }
      else throw new Error("Unsupported constant-pool tag " + tag);
      cp[i]=entry;
    }
    const cpEnd=o;
    const utf8=(index)=>cp[index]?.tag===1?cp[index].value:"";
    const classNameAt=(index)=>{const e=cp[index];return e?.tag===7?utf8(e.nameIndex):"";};
    o += 2; const thisClass=view.getUint16(o);o+=2; const superClass=view.getUint16(o);o+=2;
    const interfaces=view.getUint16(o);o+=2+interfaces*2;
    const fields=view.getUint16(o);o+=2;
    for(let i=0;i<fields;i++){o+=6;const ac=view.getUint16(o);o+=2;for(let j=0;j<ac;j++){o+=2;const l=view.getUint32(o);o+=4+l;}}
    const methodCount=view.getUint16(o);o+=2;const methods=[];
    for(let i=0;i<methodCount;i++){
      const access=view.getUint16(o),nameIndex=view.getUint16(o+2),descIndex=view.getUint16(o+4);o+=6;const ac=view.getUint16(o);o+=2;const method={access,nameIndex,descIndex,code:null,codeStart:0,lines:[]};
      for(let j=0;j<ac;j++){
        const attrName=utf8(view.getUint16(o));const len=view.getUint32(o+2);const data=o+6;
        if(attrName==="Code"){
          const codeLength=view.getUint32(data+4);const codeStart=data+8;method.codeStart=codeStart;method.code=bytes.subarray(codeStart,codeStart+codeLength);
          let p=codeStart+codeLength;const ex=view.getUint16(p);p+=2+ex*8;const nested=view.getUint16(p);p+=2;
          for(let n=0;n<nested;n++){const nName=utf8(view.getUint16(p));const nLen=view.getUint32(p+2);const nData=p+6;if(nName==="LineNumberTable"){const count=view.getUint16(nData);for(let q=0;q<count;q++)method.lines.push({pc:view.getUint16(nData+2+q*4),line:view.getUint16(nData+4+q*4)});}p=nData+nLen;}
        }
        o=data+len;
      }
      methods.push(method);
    }
    return { bytes, view, cp, cpEnd, methods, className:classNameAt(thisClass), superName:superClass?classNameAt(superClass):"", utf8 };
  }

  class ConstantPoolBuilder {
    constructor(parsed, additions) {
      this.parsed=parsed;this.additions=additions;this.countAdded=0;this.utf8Map=new Map();this.classMap=new Map();this.ntMap=new Map();this.methodMap=new Map();
      for(let i=1;i<parsed.cp.length;i++){const e=parsed.cp[i];if(!e)continue;if(e.tag===1)this.utf8Map.set(e.value,i);if(e.tag===7)this.classMap.set(parsed.utf8(e.nameIndex),i);if(e.tag===12)this.ntMap.set(parsed.utf8(e.nameIndex)+"\0"+parsed.utf8(e.descIndex),i);if(e.tag===10){const r=resolveMethodRef(parsed.cp,i);if(r)this.methodMap.set(r.owner+"\0"+r.name+"\0"+r.desc,i);}}
    }
    index(){const value=this.parsed.cp.length+this.countAdded;this.countAdded++;if(value>=65535)throw new Error("Constant pool overflow");return value;}
    utf8(value){if(this.utf8Map.has(value))return this.utf8Map.get(value);const data=encoder.encode(value);const out=new Uint8Array(3+data.length);out[0]=1;writeU2(out,1,data.length);out.set(data,3);const index=this.index();this.additions.push(out);this.utf8Map.set(value,index);return index;}
    clazz(name){if(this.classMap.has(name))return this.classMap.get(name);const out=new Uint8Array(3);out[0]=7;writeU2(out,1,this.utf8(name));const index=this.index();this.additions.push(out);this.classMap.set(name,index);return index;}
    nameType(name,desc){const key=name+"\0"+desc;if(this.ntMap.has(key))return this.ntMap.get(key);const out=new Uint8Array(5);out[0]=12;writeU2(out,1,this.utf8(name));writeU2(out,3,this.utf8(desc));const index=this.index();this.additions.push(out);this.ntMap.set(key,index);return index;}
    methodRef(owner,name,desc){const key=owner+"\0"+name+"\0"+desc;if(this.methodMap.has(key))return this.methodMap.get(key);const out=new Uint8Array(5);out[0]=10;writeU2(out,1,this.clazz(owner));writeU2(out,3,this.nameType(name,desc));const index=this.index();this.additions.push(out);this.methodMap.set(key,index);return index;}
  }

  function resolveMethodRef(cp,index){const e=cp[index];if(!e||(e.tag!==10&&e.tag!==11))return null;const c=cp[e.classIndex],nt=cp[e.nameTypeIndex];if(!c||!nt)return null;const utf=(i)=>cp[i]?.tag===1?cp[i].value:"";return{tag:e.tag,owner:utf(c.nameIndex),name:utf(nt.nameIndex),desc:utf(nt.descIndex)};}
  function formatRef(ref){return ref.owner.replaceAll("/",".")+"."+ref.name+ref.desc;}
  function returnType(desc){return desc.slice(desc.indexOf(")")+1);}
  function lineFor(lines,pc){let line=0;for(const item of lines){if(item.pc<=pc)line=item.line;else break;}return line;}
  function nextMeaningfulOpcode(code,offset){while(offset<code.length){const op=code[offset];if(op!==0x00)return op;offset+=instructionLength(code,offset);}return -1;}
  function writeU2(bytes,offset,value){bytes[offset]=(value>>>8)&255;bytes[offset+1]=value&255;}
  function instructionLength(code, pc) {
    const op=code[pc];
    if (op===0xaa) { const pad=(4-((pc+1)&3))&3;const base=pc+1+pad;if(base+12>code.length)return code.length-pc;const low=readI4(code,base+4),high=readI4(code,base+8);return 1+pad+12+Math.max(0,high-low+1)*4; }
    if (op===0xab) { const pad=(4-((pc+1)&3))&3;const base=pc+1+pad;if(base+8>code.length)return code.length-pc;const pairs=readI4(code,base+4);return 1+pad+8+Math.max(0,pairs)*8; }
    if (op===0xc4) return code[pc+1]===0x84?6:4;
    if ([0x10,0x12,0x15,0x16,0x17,0x18,0x19,0x36,0x37,0x38,0x39,0x3a,0xa9,0xbc].includes(op)) return 2;
    if ([0x11,0x13,0x14,0x84,0x99,0x9a,0x9b,0x9c,0x9d,0x9e,0x9f,0xa0,0xa1,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,0xa8,0xb2,0xb3,0xb4,0xb5,0xb6,0xb7,0xb8,0xbb,0xbd,0xc0,0xc1,0xc6,0xc7].includes(op)) return 3;
    if (op===0xc5) return 4;
    if ([0xb9,0xba,0xc8,0xc9].includes(op)) return 5;
    return 1;
  }
  function readI4(bytes,o){return (bytes[o]<<24)|(bytes[o+1]<<16)|(bytes[o+2]<<8)|bytes[o+3];}
  return {parseClass,ConstantPoolBuilder,resolveMethodRef,formatRef,returnType,lineFor,nextMeaningfulOpcode,writeU2,instructionLength};
})();
