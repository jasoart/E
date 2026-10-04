This directory serves speech runtime code from the same website. No inference service or CDN script is used.

The application adapter in `entry.mjs` is new code. It overrides Kokoro's voice-tensor loading to use an immutable model revision or the site's own files, sets local ONNX Runtime paths, and releases models after a failed initialization. The upstream packages themselves are not modified.

Upstream components:

- Kokoro.js 1.2.1, Hexgrad and contributors: Apache-2.0. Source: https://github.com/hexgrad/kokoro/tree/664c76a704021239ba59c84dcbaa4d3dece01fe9/kokoro.js
- Transformers.js 3.8.1, Hugging Face and contributors: Apache-2.0. Source: https://github.com/huggingface/transformers.js/tree/3.8.1
- Phonemizer.js 1.2.1, Xenova and contributors: Apache-2.0 wrapper. Source: https://github.com/xenova/phonemizer.js/tree/6835144b7ee9043129222549c1ed2f6a27216278
- Phonemizer's embedded eSpeak NG engine/data carry their upstream GPL-3.0 terms, separately from the wrapper. Source and build materials: https://github.com/espeak-ng/espeak-ng and the Phonemizer.js source above. The GPL text is retained in `licenses/ESPEAK-GPL-3.0.txt`.
- ONNX Runtime Web 1.22.0-dev.20250409-89f8206ba4, Microsoft and contributors: MIT. Source: https://github.com/microsoft/onnxruntime/tree/89f8206ba4

Full license texts are in `licenses/`; the bundler also retains upstream comments in `kokoro.bundle.mjs.LEGAL.txt`. esbuild 0.25.12 is a build-time dependency (MIT), rather than a browser dependency. npm package integrity checks and exact versions are retained in `package-lock.json`; runtime output hashes are in `runtime-manifest.json`.

Model weights and voice tensors are not included in this directory. The requested `onnx-community/Kokoro-82M-v1.0-ONNX` repository declares Apache-2.0. Runtime downloads use revision `1939ad2a8e416c0acfeecc08a694d14ef25f2231`, not a moving `main` revision. The fp32 model file is 325,532,232 bytes; its Hugging Face LFS SHA-256 is `8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb`.
