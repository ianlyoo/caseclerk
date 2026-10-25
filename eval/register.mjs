// Lets plain Node (22.18+, built-in type stripping) run the TypeScript eval scripts:
//   node --import ./eval/register.mjs eval/triage.ts
import { register } from "node:module";

register("./loader.mjs", import.meta.url);
