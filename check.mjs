// Sanity check for the case data in index.html: `node check.mjs`
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const src = html.match(/<script id="data">([\s\S]*?)<\/script>/)[1];
const { CASES, SYS, LISTS, dict, norm } = vm.runInNewContext(src + ";({CASES, SYS, LISTS, dict, norm})");

const fail = [], owner = new Map();
for (const c of CASES) {
  if (c.c.length !== 6) fail.push(`${c.dx}: ${c.c.length} clues, need 6`);
  if (!SYS[c.s]) fail.push(`${c.dx}: unknown system "${c.s}"`);
  if (!c.t) fail.push(`${c.dx}: missing teaching point`);
  if (![1, 2, 3].includes(c.d)) fail.push(`${c.dx}: difficulty d must be 1, 2 or 3`);
  for (const k of c.keys) {
    if (owner.has(k)) fail.push(`"${k}" is an answer for both ${owner.get(k)} and ${c.dx}`);
    owner.set(k, c.dx);
  }
  // A clue must never contain the answer itself.
  c.c.forEach(([, txt], i) => {
    for (const k of c.keys) if (k.length > 4 && ` ${norm(txt)} `.includes(` ${k} `)) fail.push(`${c.dx}: clue ${i + 1} gives away "${k}"`);
  });
}
const ids = new Map();
for (const c of CASES) {
  if (ids.has(c.id)) fail.push(`${c.dx} and ${ids.get(c.id)} share the link code "${c.id}"; reword one diagnosis`);
  ids.set(c.id, c.dx);
}
const names = new Set(CASES.map(c => c.dx));
for (const l of LISTS) {
  for (const dx of l.dx) if (!names.has(dx)) fail.push(`list "${l.name}": no case called "${dx}"`);
  if (new Set(l.dx).size !== l.dx.length) fail.push(`list "${l.name}" has duplicates`);
}
for (const [a, b] of [["Coeliac disease", "celiac disease"], ["Sjögren's syndrome", "sjogren syndrome"], ["Necrotising fasciitis", "necrotizing fasciitis"], ["Addison's disease", "addison disease"]])
  if (norm(a) !== norm(b)) fail.push(`norm: "${a}" should match "${b}"`);

console.log(fail.length ? fail.join("\n") : `ok: ${CASES.length} cases, ${dict.size} accepted names`);
process.exit(fail.length ? 1 : 0);
