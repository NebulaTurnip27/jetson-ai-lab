---
title: "Cosmos Reasoning 2B on Jetson"
description: "Run NVIDIA Cosmos Reasoning 2B on Jetson devices using vLLM or llama.cpp, and connect it to Live VLM WebUI for real-time vision inference."
category: "Multimodal"
section: "Vision Language Models"
order: 2
tags: ["vlm", "vision", "cosmos", "cosmos-reasoning", "vllm", "llamacpp", "fp8", "gguf", "jetson-orin", "jetson-thor", "ngc", "live-vlm-webui", "multimodal", "reasoning"]
model: "vllm"
isNew: true
---

[NVIDIA Cosmos Reasoning 2B](https://huggingface.co/nvidia/Cosmos-Reason2-2B) is a compact vision-language model with built-in chain-of-thought reasoning capabilities. Despite its small 2B parameter size, it can perform spatial reasoning, anomaly detection, and detailed scene analysis, making it well-suited for edge deployment on Jetson.

This tutorial walks through serving **Cosmos Reasoning 2B** on Jetson with **vLLM** (AGX Orin / Thor) or **llama.cpp** (recommended for Orin Nano), and connecting it to **[Live VLM WebUI](https://github.com/NVIDIA-AI-IOT/live-vlm-webui)** for real-time webcam-based inference.

> **Orin Nano users:** For Jetson Orin Nano, we recommend using [llama.cpp](/tutorials/llamacpp) with a GGUF checkpoint instead of vLLM. Skip to the **Orin Nano** tab in [Step 3: Serve](#step-3-serve).

---

## Prerequisites

**Supported Devices:**
- Jetson AGX Thor Developer Kit
- Jetson AGX Orin (64GB / 32GB)
- Jetson Orin Nano (via llama.cpp)

**JetPack Version:**
- JetPack 6 (L4T r36.x) — for Orin devices
- JetPack 7 (L4T r38.x) — for Thor

**Storage:** NVMe SSD **required**
- ~5 GB for the 2B FP8 model weights (~17 GB for the 8B model)
- ~8 GB for the vLLM container image

**Accounts:**
- [NVIDIA NGC](https://ngc.nvidia.com/) account (free) — needed for NGC CLI and model download

---

## Overview

| | Jetson AGX Thor | Jetson AGX Orin | Jetson Orin Nano |
|---|---|---|---|
| **Recommended Engine** | vLLM | vLLM | llama.cpp |
| **Container** | `ghcr.io/nvidia-ai-iot/vllm:latest-jetson-thor` | `ghcr.io/nvidia-ai-iot/vllm:latest-jetson-orin` | `ghcr.io/nvidia-ai-iot/llama_cpp:latest-jetson-orin` |
| **Model Format** | FP8 via NGC | FP8 via NGC | GGUF (Q8_0) |
| **Max Model Length** | 8192 tokens | 8192 tokens | 8192 tokens |

---

## Running the Model

Select your Jetson device below for the full setup and serve instructions.

<div class="device-tabs">
<div class="device-tab-bar">
<button class="device-tab active" data-target="thor">AGX Thor</button>
<button class="device-tab" data-target="orin">AGX Orin</button>
<button class="device-tab" data-target="nano">Orin Nano</button>
</div>
<div class="device-panel" data-panel="thor">

### Step 1: Install the NGC CLI

```bash
mkdir -p ~/Projects/CosmosReasoning && cd ~/Projects/CosmosReasoning
wget -O ngccli_arm64.zip https://api.ngc.nvidia.com/v2/resources/nvidia/ngc-apps/ngc_cli/versions/4.13.0/files/ngccli_arm64.zip
unzip ngccli_arm64.zip && chmod u+x ngc-cli/ngc
export PATH="$PATH:$(pwd)/ngc-cli"
ngc config set
```

You will need an [NGC account](https://ngc.nvidia.com/) with access to the `nim` org and a valid API key.

### Step 2: Download the FP8 Model

```bash
ngc registry model download-version "nim/nvidia/cosmos-reason2-2b:1208-fp8-static-kv8"
MODEL_PATH="$(pwd)/cosmos-reason2-2b_v1208-fp8-static-kv8"
```

For the 8B model instead: `ngc registry model download-version "nim/nvidia/cosmos-reason2-8b:1208-fp8-static-kv8"`

### Step 3: Serve

```bash
sudo sysctl -w vm.drop_caches=3

docker run --rm -it --runtime nvidia --network host --ipc host \
  -v "$MODEL_PATH:/models/cosmos-reason:ro" \
  ghcr.io/nvidia-ai-iot/vllm:latest-jetson-thor \
  vllm serve /models/cosmos-reason \
    --max-model-len 8192 \
    --media-io-kwargs '{"video": {"num_frames": -1}}' \
    --reasoning-parser qwen3 \
    --gpu-memory-utilization 0.8
```

</div>
<div class="device-panel" data-panel="orin" style="display:none">

### Step 1: Install the NGC CLI

```bash
mkdir -p ~/Projects/CosmosReasoning && cd ~/Projects/CosmosReasoning
wget -O ngccli_arm64.zip https://api.ngc.nvidia.com/v2/resources/nvidia/ngc-apps/ngc_cli/versions/4.13.0/files/ngccli_arm64.zip
unzip ngccli_arm64.zip && chmod u+x ngc-cli/ngc
export PATH="$PATH:$(pwd)/ngc-cli"
ngc config set
```

You will need an [NGC account](https://ngc.nvidia.com/) with access to the `nim` org and a valid API key.

### Step 2: Download the FP8 Model

```bash
ngc registry model download-version "nim/nvidia/cosmos-reason2-2b:1208-fp8-static-kv8"
MODEL_PATH="$(pwd)/cosmos-reason2-2b_v1208-fp8-static-kv8"
```

For the 8B model instead: `ngc registry model download-version "nim/nvidia/cosmos-reason2-8b:1208-fp8-static-kv8"`

### Step 3: Serve

```bash
sudo sysctl -w vm.drop_caches=3

docker run --rm -it --runtime nvidia --network host \
  -v "$MODEL_PATH:/models/cosmos-reason:ro" \
  ghcr.io/nvidia-ai-iot/vllm:latest-jetson-orin \
  vllm serve /models/cosmos-reason \
    --max-model-len 8192 \
    --media-io-kwargs '{"video": {"num_frames": -1}}' \
    --reasoning-parser qwen3 \
    --gpu-memory-utilization 0.8
```

</div>
<div class="device-panel" data-panel="nano" style="display:none">

No NGC download or setup needed — the GGUF model is pulled automatically from Hugging Face on first run.

### Serve

```bash
sudo docker run -it --rm --pull always --runtime=nvidia --network host \
  -v $HOME/.cache/huggingface:/root/.cache/huggingface \
  ghcr.io/nvidia-ai-iot/llama_cpp:latest-jetson-orin \
  llama-server -hf Kbenkhaled/Cosmos-Reason2-2B-GGUF:Q8_0 -c 8192 --port 8000
```

The OpenAI-compatible API will be available at `http://localhost:8000`, matching the vLLM default. The built-in web UI is also served on the same port.

</div>
</div>

### Verify the server is running

From another terminal on the Jetson:

```bash
curl http://localhost:8000/v1/models
```

You should see the model listed in the response.

### Test with a Quick API Call

```bash
curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "/models/cosmos-reason",
    "messages": [
      {
        "role": "user",
        "content": "What capabilities do you have?"
      }
    ],
    "max_tokens": 128
  }' | python3 -m json.tool
```

> **Tip:** The model name used in the API request must match what vLLM reports. Verify with `curl http://localhost:8000/v1/models`.

---

## Connect to Live VLM WebUI

[Live VLM WebUI](https://github.com/NVIDIA-AI-IOT/live-vlm-webui) provides a real-time webcam-to-VLM interface. With vLLM serving Cosmos Reasoning 2B, you can stream your webcam and get live AI analysis with reasoning.

### Install Live VLM WebUI

The easiest method is pip (Open another terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env
cd ~/Projects/CosmosReasoning
uv venv .live-vlm --python 3.12
source .live-vlm/bin/activate
uv pip install live-vlm-webui
live-vlm-webui
```

Or use Docker:

```bash
git clone https://github.com/nvidia-ai-iot/live-vlm-webui.git
cd live-vlm-webui
./scripts/start_container.sh
```

### Configure the WebUI

1. Open **`https://localhost:8090`** in your browser
2. Accept the self-signed certificate (click **Advanced** → **Proceed**)
3. In the **VLM API Configuration** section on the left sidebar:
   - Set **API Base URL** to `http://localhost:8000/v1`
   - Click the **Refresh** button to detect the model
   - Select the Cosmos Reasoning 2B model from the dropdown
4. Select your camera and click **Start**

The WebUI will now stream your webcam frames to Cosmos Reasoning 2B and display the model's analysis in real-time.

---

## Troubleshooting

### Out of memory on Orin

**Problem:** vLLM crashes with CUDA out-of-memory errors.

**Solution:**
1. Free system memory before starting:
   ```bash
   sudo sysctl -w vm.drop_caches=3
   ```
2. Lower `--gpu-memory-utilization` further (try `0.45` or `0.40`)
3. Reduce `--max-model-len` further (try `128`)
4. Make sure no other GPU-intensive processes are running

### Model not found in WebUI

**Problem:** The model doesn't appear in the Live VLM WebUI dropdown.

**Solution:**
1. Verify vLLM is running: `curl http://localhost:8000/v1/models`
2. Make sure the WebUI API Base URL is set to `http://localhost:8000/v1` (not `https`)
3. If vLLM and WebUI are in separate containers, use `http://<jetson-ip>:8000/v1` instead of `localhost`

### vLLM fails to load model

**Problem:** vLLM reports the model path doesn't exist or can't be loaded.

**Solution:**
- Verify the NGC download completed successfully: `ls ~/Projects/CosmosReasoning/cosmos-reason2-2b_v1208-fp8-static-kv8/` (or `cosmos-reason2-8b_v1208-fp8-static-kv8/` for the 8B model)
- Make sure the volume mount path is correct in your `docker run` command
- Check that the model directory is mounted as read-only (`:ro`) and the path inside the container matches what you pass to `vllm serve`

---

## Summary

You now have **NVIDIA Cosmos Reasoning 2B** running on your Jetson:

- **Jetson AGX Thor / AGX Orin**: FP8 model served with vLLM for maximum performance
- **Jetson Orin Nano**: GGUF model served with llama.cpp for efficient edge inference

Both paths expose an OpenAI-compatible API that can be connected to [Live VLM WebUI](https://github.com/NVIDIA-AI-IOT/live-vlm-webui) for real-time webcam-based vision inference.

---

## Additional Resources

- **Cosmos Reasoning 2B on NVIDIA Build**: [https://huggingface.co/nvidia/Cosmos-Reason2-2B](https://huggingface.co/nvidia/Cosmos-Reason2-2B)
- **NGC Model Catalog**: [https://catalog.ngc.nvidia.com/](https://catalog.ngc.nvidia.com/)
- **Live VLM WebUI**: [https://github.com/NVIDIA-AI-IOT/live-vlm-webui](https://github.com/NVIDIA-AI-IOT/live-vlm-webui)
- **vLLM Containers for Jetson**: [Supported Models](/models)
- **NGC CLI Installers**: [https://org.ngc.nvidia.com/setup/installers/cli](https://org.ngc.nvidia.com/setup/installers/cli)
