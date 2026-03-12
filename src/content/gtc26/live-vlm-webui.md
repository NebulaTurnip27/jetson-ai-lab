---
title: Live VLM WebUI - Real-Time Vision AI
description: Experience real-time vision inference with a WebRTC-based interface. Test VLMs with live camera feeds and interactive prompt engineering.
labNumber: 3
duration: "~20 min"
type: Intermediate
order: 6
---

![Live VLM WebUI Interface](https://github.com/NVIDIA-AI-IOT/live-vlm-webui/raw/main/docs/images/chrome_app-running_light-theme.jpg)

## 🎥 Overview

[Live VLM WebUI](https://github.com/NVIDIA-AI-IOT/live-vlm-webui) provides real-time VLM testing with:

- 🎥 **WebRTC webcam streaming** for live video input
- 🔌 **OpenAI-compatible API** — works with Ollama, vLLM, or cloud APIs
- ✍️ **Interactive prompt editor** with 8 preset prompts
- ⚡ **Async processing** — smooth video while VLM processes frames

---

## 📋 Prerequisites

**Supported Devices:** Jetson AGX Thor Developer Kit, Jetson AGX Orin (64GB / 32GB), Jetson Orin Nano (8GB)

**Requirements:** JetPack 6 or JetPack 7, NVMe SSD (recommended), USB webcam or built-in camera

---

## 🔧 Step 1: Setup VLM Backend (Ollama)

Install Ollama as the VLM backend:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download a VLM model
ollama pull gemma3:4b
```

**⚠️ Jetson Thor (JetPack 7.0) Users:** Use Ollama 0.12.9 instead:

```bash
curl -fsSL https://ollama.com/install.sh | OLLAMA_VERSION=0.12.9 sh
```

### Other VLM Models to Try

```bash
ollama pull llama3.2-vision:11b
ollama pull qwen2.5-vl:7b
```

---

## 📦 Step 2: Install Live VLM WebUI

```bash
git clone https://github.com/nvidia-ai-iot/live-vlm-webui.git
cd live-vlm-webui

./scripts/start_container.sh
```

---

## 🖥️ Step 3: Access the Web Interface

Open your browser:

- **Local:** `https://localhost:8090`
- **Network:** `https://<JETSON_IP>:8090`

### Accept the SSL Certificate

1. Click **Advanced**
2. Click **Proceed to &lt;IP&gt; (unsafe)**
3. Allow camera access when prompted

### Configure and Start

1. **Verify VLM API Configuration:**
   - API Endpoint: `http://localhost:11434/v1` (Ollama)
   - Model: `gemma3:4b`
2. **Click "Start Camera and Start VLM Analysis"**

The interface will begin streaming video and analyzing frames based on your selected prompt!

---

## ✍️ Real-Time Prompt Engineering

Live VLM WebUI includes **8 preset prompts** ready to use:

| Prompt | Example |
|--------|---------|
| 📸 Scene Description | "Describe what you see in this image in one sentence." |
| 🔍 Object Detection | "List all objects you can see, separated by commas." |
| 🏃 Activity Recognition | "Describe the person's activity and what they are doing." |
| ⚠️ Safety Monitoring | "Are there any safety hazards visible? Answer with 'ALERT' or 'SAFE'." |
| 😊 Emotion Detection | "Describe the facial expressions and emotions of people visible." |
| 📝 OCR / Text Recognition | "Read and transcribe any text visible in the image." |

### Custom Prompts

You can also enter your own prompts. Try experimenting with:

- Structured output formats (JSON, CSV)
- Multi-language instructions
- Domain-specific queries for your use case

**💡 Pro Tip:** Many models including `gemma3:4b` support multiple languages. Try prompting in different languages!

---

## 📊 Performance by Platform

| Platform | Model | Inference Speed |
|----------|-------|------------------|
| Jetson Thor 128GB | llama3.2-vision:11b | 1-2 sec/frame |
| Jetson AGX Orin 64GB | gemma3:4b | 3-4 sec/frame |
| Jetson Orin Nano 8GB | gemma3:4b | 7-8 sec/frame |

---

## 🎉 Summary

- **Live VLM WebUI** enables real-time vision inference testing.
- **WebRTC streaming** provides low-latency video input.
- **OpenAI-compatible API** works with Ollama, vLLM, or cloud services.
- Use **preset or custom prompts** for interactive experimentation.
- Great for **prototyping robotics** and edge AI applications.

---

## 🔗 Additional Resources

- [GitHub Repository](https://github.com/NVIDIA-AI-IOT/live-vlm-webui)
- [Troubleshooting Guide](https://github.com/NVIDIA-AI-IOT/live-vlm-webui/blob/main/docs/troubleshooting.md)
- [Ollama Documentation](https://ollama.com/)
