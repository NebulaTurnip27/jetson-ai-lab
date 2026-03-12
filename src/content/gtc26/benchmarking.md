---
title: Benchmarking Cosmos Reason on Jetson Thor
description: Measure the real-world performance of Blackwell GPU features. See the impact of NVFP4 and speculative decoding on VLM inference.
labNumber: 2
duration: "~20 min"
type: Hands-On
order: 5
---

## 📊 What We're Measuring

We'll benchmark Thor's performance across three configurations to demonstrate the power of Blackwell GPU features:

- **⏱️ Time to First Token** — How fast the model starts responding. Critical for real-time robotics.
- **🚀 Throughput (tok/s)** — Tokens generated per second. Measures raw generation speed.
- **📉 Inter-Token Latency** — Time between tokens. Affects streaming smoothness.

---

## 🌌 NVIDIA Cosmos-Reason1: Physical AI VLM

**Cosmos-Reason1** is NVIDIA's Vision Language Model built for Physical AI applications. It excels at spatial reasoning — understanding where objects are and how they relate.

**Why Cosmos-Reason1 for Physical AI**

| **Robotics:** | Understands object positions for manipulation tasks |
| **Autonomous Vehicles:** | Spatial awareness for navigation |
| **Industrial:** | Defect detection and quality inspection |
| **Drones:** | Scene understanding for autonomous flight |

---

## 🔬 Benchmark 1: Baseline Performance

First, let's establish baseline performance without optimizations.

### Step 1: Prepare Your Jetson Thor

```bash
# Set to MAXN mode for maximum performance
sudo nvpmodel -m 0

# Reboot for clean state
sudo reboot
```

### Step 2: Launch vLLM Container

Open **Terminal 1** (Serving):

```bash
sudo docker run --rm -it \
  --network host \
  --shm-size=16g \
  --ulimit memlock=-1 \
  --ulimit stack=67108864 \
  --runtime=nvidia \
  --name=vllm \
  ghcr.io/nvidia-ai-iot/vllm:latest-jetson-thor
```

### Step 3: Serve Cosmos-Reason1

Inside the container:

```bash
vllm serve nvidia/Cosmos-Reason1-7B \
  --port 8000 \
  --host 0.0.0.0 \
  --trust-remote-code \
  --gpu-memory-utilization 0.8
```

Wait for: `Application startup complete.`

### Step 4: Run Benchmark

Open **Terminal 2** and access the container:

```bash
sudo docker exec -it vllm bash
```

Run the VLM benchmark:

```bash
vllm bench serve \
  --dataset-name hf \
  --dataset-path lmarena-ai/vision-arena-bench-v0.1 \
  --hf-split train \
  --model nvidia/Cosmos-Reason1-7B \
  --num-prompts 30 \
  --percentile-metrics ttft,tpot,itl,e2el \
  --hf-output-len 128 \
  --max-concurrency 1
```

**📝 Record your results!** Note the Output throughput (tok/s) and Mean TTFT (ms).

---

## 🔥 Benchmark 2: NVFP4 Quantization

Now let's see the Blackwell FP4 advantage. Stop the previous server (Ctrl+C) and serve the FP4 version:

```bash
vllm serve nvidia/Cosmos-Reason1-7B-NVFP4 \
  --port 8000 \
  --host 0.0.0.0 \
  --trust-remote-code \
  --gpu-memory-utilization 0.8
```

Run the same benchmark:

```bash
vllm bench serve \
  --dataset-name hf \
  --dataset-path lmarena-ai/vision-arena-bench-v0.1 \
  --hf-split train \
  --model nvidia/Cosmos-Reason1-7B-NVFP4 \
  --num-prompts 30 \
  --percentile-metrics ttft,tpot,itl,e2el \
  --hf-output-len 128 \
  --max-concurrency 1
```

**Expected FP4 Improvements:** ~40-50% higher throughput (tok/s), ~50% lower memory usage.

---

## ⚡ Benchmark 3: Speculative Decoding

Finally, let's enable EAGLE-3 speculative decoding for maximum throughput:

```bash
vllm serve nvidia/Cosmos-Reason1-7B-NVFP4 \
  --port 8000 \
  --host 0.0.0.0 \
  --trust-remote-code \
  --gpu-memory-utilization 0.8 \
  --speculative-config '{"model": "nvidia/Cosmos-Reason1-7B-speculator.eagle3", "num_speculative_tokens": 3, "method": "eagle3"}'
```

Run benchmark:

```bash
vllm bench serve \
  --dataset-name hf \
  --dataset-path lmarena-ai/vision-arena-bench-v0.1 \
  --hf-split train \
  --model nvidia/Cosmos-Reason1-7B-NVFP4 \
  --num-prompts 30 \
  --percentile-metrics ttft,tpot,itl,e2el \
  --hf-output-len 128 \
  --max-concurrency 1
```

**Expected Speculative Decoding Boost:** 2-3x faster token generation, 0% quality loss.

---

## 📈 Compare Your Results

Fill in your benchmark results:

| Configuration | Throughput (tok/s) | TTFT (ms) | Speedup |
|---------------|--------------------|-----------|---------|
| Baseline (FP16) | ___ | ___ | 1.0x |
| NVFP4 Quantization | ___ | ___ | ~1.5x |
| FP4 + EAGLE-3 | ___ | ___ | ~2-3x |

### Why These Optimizations Matter for Physical AI

- **🤖 Robotics** — Faster inference = faster reaction times. A robot that can process visual input 2x faster can operate at higher speeds safely.
- **🚗 Autonomous Vehicles** — Lower TTFT means quicker decisions. At 60mph, reducing TTFT by 100ms means acting 9 feet sooner.
- **🔋 Power Efficiency** — FP4 reduces memory bandwidth and compute. Same task, less power — critical for battery-powered edge devices.

---

## 🎉 Key Takeaways

**Blackwell GPU Features on Jetson Thor**

1. **NVFP4 delivers ~1.5x throughput with 50% memory savings** — Native Blackwell hardware acceleration
2. **EAGLE-3 speculative decoding adds another 1.5-2x boost** — Zero quality loss — draft + verify in parallel
3. **Combined: 2-3x faster than baseline for Physical AI** — The Thor advantage for real-world robotics
