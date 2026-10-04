#!/usr/bin/env python3
"""Check the exact Transformers.js 3.8.1 WASM int4 operator, without a model.

Run after installing onnx==1.17.0 and onnxruntime-web into temporary paths:
  python tests/q4_wasm_smoke.py --runtime-dir /tmp/q4-runtime/node_modules/onnxruntime-web

This is a host WASM operator test. It does not test Safari, an iPhone, or Danube.
"""

import argparse
import json
from pathlib import Path
import subprocess
import tempfile

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper


EXPECTED_RUNTIME = "1.22.0-dev.20250409-89f8206ba4"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--runtime-dir", type=Path, required=True)
    args = parser.parse_args()
    runtime_dir = args.runtime_dir.resolve()
    installed = json.loads((runtime_dir / "package.json").read_text())["version"]
    if installed != EXPECTED_RUNTIME:
        raise SystemExit(f"Expected ORT Web {EXPECTED_RUNTIME}; found {installed}")

    # Signed symmetric int4 uses zero point 8. 0x99 = two weights of +1;
    # 0xaa = two weights of +2. A is 32 ones, so output must be [32, 64].
    packed = np.empty((2, 1, 16), dtype=np.uint8)
    packed[0] = 0x99
    packed[1] = 0xAA
    scales = np.ones((2,), dtype=np.float32)
    node = helper.make_node(
        "MatMulNBits", ["A", "B", "scales"], ["Y"], domain="com.microsoft",
        K=32, N=2, bits=4, block_size=32, accuracy_level=0,
    )
    graph = helper.make_graph(
        [node], "q4-wasm-compatibility",
        [helper.make_tensor_value_info("A", TensorProto.FLOAT, [1, 32])],
        [helper.make_tensor_value_info("Y", TensorProto.FLOAT, [1, 2])],
        [numpy_helper.from_array(packed, name="B"),
         numpy_helper.from_array(scales, name="scales")],
    )
    model = helper.make_model(
        graph, opset_imports=[helper.make_opsetid("", 21),
                             helper.make_opsetid("com.microsoft", 1)],
    )
    model.ir_version = 10
    onnx.checker.check_model(model)

    # Loading ORT through the installed package directory resolves its actual
    # WASM binaries; no CDN, native ONNX provider, or project dependency is used.
    script = r"""
const fs = require('node:fs');
const path = require('node:path');
const [modelPath, runtimeDir] = process.argv.slice(2);
const ort = require(runtimeDir);
(async () => {
  ort.env.wasm.numThreads = 1;
  const session = await ort.InferenceSession.create(fs.readFileSync(modelPath), {
    executionProviders: ['wasm'],
  });
  try {
    const out = await session.run({
      A: new ort.Tensor('float32', new Float32Array(32).fill(1), [1, 32]),
    });
    const actual = Array.from(out.Y.data);
    const expected = [32, 64];
    const passed = actual.length === expected.length &&
      actual.every((value, i) => Math.abs(value - expected[i]) < 1e-6);
    const version = JSON.parse(fs.readFileSync(path.join(runtimeDir, 'package.json'))).version;
    console.log(JSON.stringify({version, backend: 'wasm', numThreads: 1,
      op: 'com.microsoft::MatMulNBits', bits: 4, blockSize: 32,
      actual, expected, passed}));
    if (!passed) process.exitCode = 1;
  } finally {
    await session.release();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    with tempfile.TemporaryDirectory(prefix="danube-q4-smoke-") as temp:
        model_path = Path(temp) / "toy_q4.onnx"
        script_path = Path(temp) / "smoke.cjs"
        onnx.save(model, model_path)
        script_path.write_text(script)
        subprocess.run(["node", str(script_path), str(model_path), str(runtime_dir)], check=True)


if __name__ == "__main__":
    main()
