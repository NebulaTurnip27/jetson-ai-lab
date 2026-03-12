---
title: Introduction to GenAI on Jetson Thor
description: Experience the power of Blackwell GPU running LLMs and VLMs. Learn to leverage FP4 quantization and speculative decoding for maximum performance.
labNumber: 1
duration: "~20 min"
type: Hands-On
order: 4
---

## ⚡ Why Jetson Thor for Physical AI

**Jetson Thor** is NVIDIA's most powerful edge AI computer, purpose-built for **Physical AI** — autonomous machines that perceive, reason, and act in the real world.

| 2560 | 128GB | 2,070 |
|------|-------|-------|
| Blackwell GPU Cores | Unified Memory | TOPS (FP4) AI Performance |

With 128GB of unified memory, Thor can run **large VLMs and LLMs entirely on-device** — no cloud latency, no data leaving the edge. This is essential for robotics, autonomous vehicles, and industrial automation where real-time decisions matter.

---

## 🎯 The Blackwell Advantage

Jetson Thor features the **Blackwell GPU architecture**, bringing datacenter-class AI capabilities to edge devices. Two key features unlock unprecedented performance:

**🚀 NVFP4 Quantization** — Native 4-bit floating point support delivers **2x memory efficiency** with minimal accuracy loss. Run larger models, faster inference, lower power.

**⚡ Speculative Decoding (EAGLE-3)** — Draft models predict multiple tokens that the main model verifies in parallel. Up to **2-3x faster generation** with zero quality loss.

---

## 🚀 Running vLLM on Jetson Thor

**vLLM** is the production-grade inference engine optimized for Jetson Thor. It unlocks all Blackwell features including FP4 and speculative decoding.

### Step 1: Launch the vLLM Container

```bash
docker run --rm -it --runtime nvidia --network host \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  ghcr.io/nvidia-ai-iot/vllm:latest-jetson-thor
```

### Step 2: Serve a Model

Inside the container, serve a quantized model:

```bash
vllm serve RedHatAI/Qwen3-8B-quantized.w4a16 --trust-remote-code
```

The model is now accessible via OpenAI-compatible API at `http://localhost:8000`.

### Step 3: Test It

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "RedHatAI/Qwen3-8B-quantized.w4a16", "messages": [{"role": "user", "content": "What is Physical AI?"}]}'
```

---

## 🔥 FP4 Quantization: Blackwell's Secret Weapon

Blackwell introduces **native NVFP4** (4-bit floating point) support. This isn't just about saving memory — it's about **faster compute**.

**Why NVFP4 Matters for Physical AI**

- ✅ **2x memory efficiency** — fit larger models on-device
- ✅ **Higher throughput** — native hardware acceleration
- ✅ **Lower power** — critical for autonomous systems
- ✅ **Minimal accuracy loss** — near-FP16 quality

### Using NVFP4 Models on Thor

Look for models with `nvfp4` in the name. These are specifically optimized for Blackwell:

```bash
vllm serve nvidia/Llama-3.1-8B-Instruct-NVFP4 --trust-remote-code
```

When NVFP4 isn't available, **W4A16** (4-bit weights, 16-bit activations) is the next best option:

```bash
vllm serve RedHatAI/Qwen3-8B-quantized.w4a16 --trust-remote-code
```

---

## ⚡ Speculative Decoding with EAGLE-3

Speculative decoding is a game-changer for inference speed. A small **draft model** proposes multiple tokens, then the main model verifies them in a single forward pass.

- **Without Speculative Decoding:** ~40 tok/s
- **With EAGLE-3 Speculative Decoding:** ~90 tok/s

### Enable Speculative Decoding

Pair your main model with a matching EAGLE-3 speculator:

```bash
vllm serve RedHatAI/Qwen3-8B-quantized.w4a16 \
  --speculative-config '{"model": "RedHatAI/Qwen3-8B-speculator.eagle3", "num_speculative_tokens": 3, "method": "eagle3"}'
```

**💡 Pro Tip:** Find compatible speculator models at [RedHatAI Speculator Models](https://huggingface.co/collections/RedHatAI/speculator-models)

### Maximum Performance: FP4 + Speculative Decoding

Combine both techniques for the ultimate Thor experience:

```bash
vllm serve nvidia/Llama-3.1-8B-Instruct-NVFP4 \
  --speculative-config '{"model": "RedHatAI/Llama-3.1-8B-speculator.eagle3", "num_speculative_tokens": 3, "method": "eagle3"}'
```

---

## 🎉 Summary

**What Makes Jetson Thor the Physical AI Platform**

- **Blackwell GPU Architecture** — 2560 cores, 2,070 TOPS (FP4)
- **NVFP4 Native Support** — 2x memory efficiency
- **Speculative Decoding** — 2-3x faster generation
- **128GB Unified Memory** — Large models on-device
