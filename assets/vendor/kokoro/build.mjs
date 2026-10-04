import esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const directory = path.dirname(fileURLToPath(import.meta.url));
const dependencies = path.join(directory, "node_modules");
await esbuild.build({
  entryPoints: [path.join(directory, "entry.mjs")],
  outfile: path.join(directory, "kokoro.bundle.mjs"),
  bundle: true, format: "esm", platform: "browser", minify: true,
  legalComments: "linked", conditions: ["onnxruntime-web-use-extern-wasm"],
});
for (const name of ["ort-wasm-simd-threaded.jsep.mjs", "ort-wasm-simd-threaded.jsep.wasm"]) {
  await fs.copyFile(path.join(dependencies, "onnxruntime-web", "dist", name), path.join(directory, name));
}
for (const [name, filename] of [["kokoro-js", "KOKORO-APACHE-2.0.txt"], ["phonemizer", "PHONEMIZER-APACHE-2.0.txt"], ["@huggingface/transformers", "TRANSFORMERS-APACHE-2.0.txt"]]) {
  await fs.copyFile(path.join(dependencies, name, "LICENSE"), path.join(directory, "licenses", filename));
}
const files = [];
for (const name of ["kokoro.bundle.mjs", "kokoro.bundle.mjs.LEGAL.txt", "ort-wasm-simd-threaded.jsep.mjs", "ort-wasm-simd-threaded.jsep.wasm"]) {
  const buffer = await fs.readFile(path.join(directory, name));
  files.push({ name, bytes: buffer.length, sha256: createHash("sha256").update(buffer).digest("hex") });
}
const versions = {};
for (const name of ["kokoro-js", "phonemizer", "@huggingface/transformers", "onnxruntime-web", "esbuild"]) {
  versions[name] = JSON.parse(await fs.readFile(path.join(dependencies, name, "package.json"), "utf8")).version;
}
await fs.writeFile(path.join(directory, "runtime-manifest.json"), JSON.stringify({ schema: 1, versions, files }, null, 2) + "\n");
