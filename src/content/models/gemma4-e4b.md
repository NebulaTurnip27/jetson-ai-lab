---
title: "Gemma 4 E4B"
model_id: "gemma4-e4b"
short_description: "Google's Gemma 4 E4B variant with Q4_K_M GGUF support on Jetson through llama.cpp"
family: "Google Gemma4"
icon: "💎"
is_new: true
order: 2
type: "Text"
memory_requirements: "8GB RAM"
precision: "Q4_K_M GGUF"
model_size: "5.3GB"
hf_checkpoint: "ggml-org/gemma-4-E4B-it-GGUF"
huggingface_url: "https://huggingface.co/google/gemma-4-E4B-it"
minimum_jetson: "Orin Nano"
supported_inference_engines:
  - engine: "llama.cpp"
    type: "Container"
    run_command_orin: "sudo docker run -it --rm --pull always --runtime=nvidia --network host -v $HOME/.cache/huggingface:/root/.cache/huggingface ghcr.io/nvidia-ai-iot/llama_cpp:gemma4-jetson-orin llama-server -hf ggml-org/gemma-4-E4B-it-GGUF:Q4_K_M"
    run_command_thor: "sudo docker run -it --rm --pull always --runtime=nvidia --network host -v $HOME/.cache/huggingface:/root/.cache/huggingface ghcr.io/nvidia-ai-iot/llama_cpp:gemma4-jetson-thor llama-server -hf ggml-org/gemma-4-E4B-it-GGUF:Q4_K_M"
---

Gemma 4 E4B is a lightweight Gemma 4 model that can be served locally on Jetson with `llama.cpp`. In Google's launch material, E4B is framed as the stronger edge-focused sibling to E2B, combining on-device efficiency with materially better coding, reasoning, and multimodal performance.

- Local coding assistants on Orin Nano, Orin NX, or AGX Orin
- Multimodal document and screen-understanding with optional voice input
- Tool-using assistants that need better reasoning than E2B
- A balanced default for edge AI demos or products that need better quality without moving to the larger models

## Inputs and Outputs

**Input:** Text, image, and audio

**Output:** Text

## Supported Platforms

- Jetson Orin
- Jetson Thor

## Inference Engine

This model is configured to run on Jetson with `llama.cpp`.

## Official Highlights

- Google's model card describes E4B as a dense multimodal model with **4.5B effective parameters** and **8B parameters including embeddings**.
- It supports **128K context**, **text/image/audio input**, **function calling**, and configurable **thinking mode**.
- In Google's published benchmark table, E4B lands well above E2B on reasoning, coding, and vision tasks, making it the better general-purpose edge choice when memory allows.
- Like E2B, E4B includes official support for **automatic speech recognition** and **speech translation** on short audio clips.
