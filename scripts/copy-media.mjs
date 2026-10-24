import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = process.cwd();
const sourceRoot = resolve(root, "../../..");
const mediaRoot = resolve(root, "media");
const manifest = JSON.parse(await readFile(resolve(root, "db/demo-media.json"), "utf8"));

const files = manifest.map((entry) => {
  const source = resolve(sourceRoot, entry.source);
  const destination = resolve(mediaRoot, entry.file);
  if (!source.startsWith(`${sourceRoot}${sep}`) || !destination.startsWith(`${mediaRoot}${sep}`)) {
    throw new Error(`Chemin hors du catalogue autorisé : ${entry.file}`);
  }
  if (extname(source).toLowerCase() !== ".mp4" || extname(destination).toLowerCase() !== ".mp4") {
    throw new Error(`Un fichier MP4 est requis : ${entry.file}`);
  }
  return { source, destination, name: entry.file };
});

const missing = [];
for (const file of files) {
  try {
    await stat(file.source);
  } catch {
    missing.push(file.source);
  }
}
if (missing.length) {
  throw new Error(`Sources absentes ; aucune copie lancée :\n${missing.join("\n")}`);
}

await mkdir(mediaRoot, { recursive: true });
for (const file of files) {
  await copyFile(file.source, file.destination);
  console.log(`Copié : ${file.name}`);
}
console.log(`${files.length} vidéos copiées dans media/ ; les originaux restent intacts.`);
