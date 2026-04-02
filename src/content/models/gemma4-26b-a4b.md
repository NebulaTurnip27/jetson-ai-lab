---
title: "Gemma 4 26B-A4B"
model_id: "gemma4-26b-a4b"
short_description: "Google's 26B MoE frontier Gemma 4 model for fast high-end reasoning and multimodal workflows"
family: "Google Gemma4"
icon: "💎"
is_new: true
order: 3
type: "Text"
memory_requirements: "24GB RAM"
precision: "Q4_K_M GGUF"
model_size: "16.8GB"
hf_checkpoint: "ggml-org/gemma-4-26B-A4B-it-GGUF"
huggingface_url: "https://huggingface.co/google/gemma-4-26B-A4B-it"
minimum_jetson: "AGX Orin"
supported_inference_engines:
  - engine: "llama.cpp"
    type: "Container"
    run_command_orin: "sudo docker run -it --rm --pull always --runtime=nvidia --network host -v $HOME/.cache/huggingface:/root/.cache/huggingface ghcr.io/nvidia-ai-iot/llama_cpp:gemma4-jetson-orin llama-server -hf ggml-org/gemma-4-26B-A4B-it-GGUF:Q4_K_M"
    run_command_thor: "sudo docker run -it --rm --pull always --runtime=nvidia --network host -v $HOME/.cache/huggingface:/root/.cache/huggingface ghcr.io/nvidia-ai-iot/llama_cpp:gemma4-jetson-thor llama-server -hf ggml-org/gemma-4-26B-A4B-it-GGUF:Q4_K_M"
---

Gemma 4 26B-A4B is a larger Gemma 4 variant that can be served on Jetson with `llama.cpp`. Google presents this model as the latency-optimized high-end option in the family: a Mixture-of-Experts model that targets much better throughput than a dense model of similar total size.

- Long-context agents with tool use
- Local coding copilots and repository Q&A on higher-memory Jetson systems
- Document and chart understanding workloads
- Research-style assistants that need stronger reasoning than the edge-sized models

## Inputs and Outputs

**Input:** Text and image

**Output:** Text

## Supported Platforms

- Jetson AGX Orin
- Jetson Thor

## Inference Engine

This model is configured to run on Jetson with `llama.cpp`.

## Official Highlights

- Google's model card describes 26B-A4B as a **Mixture-of-Experts** model with **25.2B total parameters** and **3.8B active parameters** during inference.
- It supports **256K context**, **text/image input**, native **function calling**, and the same long-context reasoning features shared by the rest of Gemma 4.
- Google explicitly notes that the model runs much faster than its total parameter count suggests because only a subset of experts are active per token.
- In Google's benchmark table, 26B-A4B tracks close to 31B dense on many reasoning and coding tasks while keeping a stronger latency profile.
