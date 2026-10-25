// Links the demo videos of db/demo-media.json into media/ (symbolic links: no copy, originals untouched, no disk used).
// Removes demo files of media/ that left the manifest; media/uploads/ and media/kayo/ are never touched.
import { lstat, mkdir, readFile, readdir, readlink, symlink, unlink } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = process.cwd();
const sourceRoot = resolve(root, "../../..");
const mediaRoot = resolve(root, "media");
const manifest = JSON.parse(await readFile(resolve(root, "db/demo-media.json"), "utf8"));

await mkdir(resolve(mediaRoot, "kayo"), { recursive: true });
const wanted = new Set();
for (const entry of manifest) {
  const source = resolve(sourceRoot, entry.source);
  const destination = resolve(mediaRoot, entry.file);
  if (!source.startsWith(`${sourceRoot}${sep}`) || !destination.startsWith(`${mediaRoot}${sep}`) || extname(destination) !== ".mp4") {
    throw new Error(`Chemin refusé : ${entry.file}`);
  }
  await lstat(source); // throws if the original is missing
  wanted.add(entry.file);
  const current = await lstat(destination).catch(() => null);
  if (current?.isSymbolicLink() && (await readlink(destination)) === source) continue;
  if (current) await unlink(destination);
  await symlink(source, destination);
  console.log(`Lié : ${entry.file}`);
}
for (const name of await readdir(mediaRoot)) {
  if (name.endsWith(".mp4") && !wanted.has(name)) {
    await unlink(resolve(mediaRoot, name));
    console.log(`Retiré : ${name}`);
  }
}
console.log(`${wanted.size} vidéos liées dans media/ ; les originaux restent à leur place.`);
