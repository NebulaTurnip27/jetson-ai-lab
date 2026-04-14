---
title: "Gemma 4 E2B"
model_id: "gemma4-e2b"
short_description: "Google's compact frontier Gemma 4 model for efficient multimodal and agentic workloads"
family: "Google Gemma4"
icon: "💎"
is_new: true
order: 1
type: "Multimodal"
vision_capable: true
memory_requirements: "8GB RAM"
precision: "Q8_0 GGUF"
model_size: "5.0GB"
hf_checkpoint: "ggml-org/gemma-4-E2B-it-GGUF"
huggingface_url: "https://huggingface.co/google/gemma-4-E2B-it"
minimum_jetson: "Orin Nano"
serving:
  entries:
    - engine: "llama.cpp"
      type: "Container"
      modules_supported:
        - thor_t5000
        - thor_t4000
        - orin_agx_64
        - orin_nx_16
        - orin_nano_8
      serve_command_orin: |-
        sudo docker run -it --rm --pull always \
          --runtime=nvidia --network host \
          -v $HOME/.cache/huggingface:/root/.cache/huggingface \
          ghcr.io/nvidia-ai-iot/llama_cpp:gemma4-jetson-orin \
          llama-server -hf ggml-org/gemma-4-E2B-it-GGUF:Q8_0
      serve_command_thor: |-
        sudo docker run -it --rm --pull always \
          --runtime=nvidia --network host \
          -v $HOME/.cache/huggingface:/root/.cache/huggingface \
          ghcr.io/nvidia-ai-iot/llama_cpp:gemma4-jetson-thor \
          llama-server -hf ggml-org/gemma-4-E2B-it-GGUF:Q8_0
---

Gemma 4 E2B is the smallest variant in the Gemma 4 family. Google positions E2B as an edge-first model for low-latency, low-memory deployments where efficiency matters more than absolute model size.

- Offline voice assistants and smart home controllers
- Robotics copilots that combine speech and image understanding
- Lightweight OCR and document QA on constrained Jetson devices
- Local agent pipelines that need structured tool calling with a small footprint

## Inputs and Outputs

**Input:** Text, image, and audio

**Output:** Text

## Supported Platforms

- Jetson Orin
- Jetson Thor

## Inference Engine

This model is configured to run on Jetson with `llama.cpp`.

## Official Highlights

- Google's model card describes E2B as a dense multimodal model with **2.3B effective parameters** and **5.1B parameters including embeddings**.
- It supports **128K context**, **text/image/audio input**, and native **function calling** for agentic workflows.
- The official Gemma 4 launch notes that E2B was engineered for **offline mobile and IoT use**, including devices like Jetson Orin Nano.
- Google also documents built-in **ASR** and **speech translation** support on E2B, with audio clips up to **30 seconds**.
