// Desempacota os compêndios LevelDB do módulo original em JSON (src/<pack>/).
import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { readdirSync } from "node:fs";
import path from "node:path";
const [origem, destino] = process.argv.slice(2);
for (const pack of readdirSync(origem)) {
  await extractPack(path.join(origem, pack), path.join(destino, pack), { log: false, folders: true, clean: true });
  console.log("ok", pack);
}
