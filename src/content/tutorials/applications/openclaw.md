---
title: "OpenClaw on Jetson"
description: "Run a fully local AI personal assistant on Jetson with OpenClaw and WhatsApp, no cloud APIs needed."
category: "Applications"
section: "AI Agents"
order: 1
tags: ["openclaw", "whatsapp", "agent", "vllm", "local-llm", "jetson-orin", "jetson-thor", "personal-assistant", "tool-calling", "nemotron"]
isNew: true
---

🦞 [OpenClaw](https://openclaw.ai) is a personal digital assistant that runs directly on your device. Unlike typical chatbots, OpenClaw can actively manage files, browse the web, and control applications, integrating with messaging platforms like WhatsApp, Discord, and Telegram to perform tasks on your behalf. It memorizes who you are, your patterns, and your preferences over time, and you can give it all sorts of tools to help automate parts of your life.

> **Looking for inspiration?** Check out what people have built with OpenClaw at [openclaw.ai/showcase](https://openclaw.ai/showcase). It'll give you a good idea of what's possible.

In this tutorial, we'll walk you through setting up OpenClaw with **everything running 100% locally** on a Jetson, no cloud APIs needed. All you need is a **Jetson** and a **phone with WhatsApp**. By the end, you'll have a fully working AI agent that you can talk to through your phone, and it can actually do things for you.

<div class="admonition warning">
<p class="admonition-title">⚠️ Before You Begin: Security Disclaimer</p>
<p>OpenClaw is a powerful agent that can take real actions on your device. You'll want to make sure that people outside your device aren't able to talk to your agent. If you follow this tutorial as written, that's taken care of, the gateway binds to localhost only.</p>
<p>However, if you install skills, execute prompts you find on the internet, or link OpenClaw to your email or other services, make sure you have some additional safety layers in place to avoid <strong>prompt injection attacks</strong>. We'll be using local models in this tutorial, and local models can be more susceptible to prompt injection than the larger cloud models. Just something to be aware of, be thoughtful about what you give your agent access to.</p>
</div>

---

## Prerequisites

| Requirement | Details |
|---|---|
| **Device** | Jetson AGX Thor or Jetson AGX Orin |
| **JetPack** | JP 6 (L4T r36.x) for Orin · JP 7 (L4T r38.x) for Thor |
| **Storage** | NVMe SSD recommended for model weights |
| **Accounts** | [Hugging Face](https://huggingface.co/) (free), for model download |
| **Phone** | Any phone with WhatsApp installed |

---

## Step 1: Serve a Local Model with vLLM

Before setting up OpenClaw, we need to host a model locally. For this tutorial we'll use **vLLM** as the serving engine.

Any model should work here as long as it's capable of **tool calling**. Tool calling is very important for OpenClaw. It's how the agent takes actions on your behalf.

> **Tip:** In our testing, we found **Mixture of Experts (MoE)** models work exceptionally well with OpenClaw, models like **Nemotron 3 Nano 30B-A3B**, **Qwen 3.5 35B-A3B**, and **GLM 4.7 Flash**. That said, any model that supports tool calling should work. Just make sure you serve it correctly with vLLM so it can handle tool use without messing up the output format.

### Export your Hugging Face token

Some models require you to accept a license agreement on Hugging Face before using them. Export your token so vLLM can download the model:

```bash
export HF_TOKEN=your_huggingface_token_here
```

### Serve the model

For this tutorial, we'll go with **Nemotron 3 Nano 30B-A3B**. Select your device below:

<div class="device-tabs">
<div class="device-tab-bar">
<button class="device-tab active" data-target="thor-vllm">AGX Thor</button>
<button class="device-tab" data-target="orin-vllm">AGX Orin</button>
</div>
<div class="device-panel" data-panel="thor-vllm">

```bash
sudo docker run -it --rm --pull always \
  --runtime=nvidia --network host \
  -e HF_TOKEN=$HF_TOKEN \
  -e VLLM_USE_FLASHINFER_MOE_FP4=1 \
  -e VLLM_FLASHINFER_MOE_BACKEND=throughput \
  -v $HOME/.cache/huggingface:/root/.cache/huggingface \
  ghcr.io/nvidia-ai-iot vllm:latest-jetson-thor \
  bash -c "wget -q -O /tmp/nano_v3_reasoning_parser.py \
  --header=\"Authorization: Bearer \$HF_TOKEN\" \
  https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-NVFP4/resolve/main/nano_v3_reasoning_parser.py \
  && vllm serve nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-NVFP4 \
  --gpu-memory-utilization 0.8 \
  --trust-remote-code \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder \
  --reasoning-parser-plugin /tmp/nano_v3_reasoning_parser.py \
  --reasoning-parser nano_v3 \
  --kv-cache-dtype fp8"
```

</div>
<div class="device-panel" data-panel="orin-vllm" style="display:none">

```bash
sudo docker run -it --rm --pull always \
  --runtime=nvidia --network host \
  -e HF_TOKEN=$HF_TOKEN \
  -e VLLM_USE_FLASHINFER_MOE_FP4=1 \
  -e VLLM_FLASHINFER_MOE_BACKEND=throughput \
  -v $HOME/.cache/huggingface:/root/.cache/huggingface \
  ghcr.io/nvidia-ai-iot/vllm:latest-jetson-orin \
  bash -c "wget -q -O /tmp/nano_v3_reasoning_parser.py \
  --header=\"Authorization: Bearer \$HF_TOKEN\" \
  https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-NVFP4/resolve/main/nano_v3_reasoning_parser.py \
  && vllm serve stelterlab/NVIDIA-Nemotron-3-Nano-30B-A3B-AWQ \
  --gpu-memory-utilization 0.8 \
  --trust-remote-code \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder \
  --reasoning-parser-plugin /tmp/nano_v3_reasoning_parser.py \
  --reasoning-parser nano_v3 \
  --kv-cache-dtype fp8"
```

</div>
</div>

> **Note:** You will need an **AGX Thor** or **AGX Orin** to run the models mentioned above. If you're on a different Jetson (like Orin Nano Super), any smaller model should work fine as long as it supports tool calling, however it may not be as capable as these larger models.

### Verify the model is serving

Once vLLM is up and running, open a **separate terminal** and verify:

```bash
curl -s http://127.0.0.1:8000/v1/models
```

You should see your model listed in the response. Once you see it, you're ready to move on.

---

## Step 2: Install Node.js 22+

OpenClaw requires **Node.js 22** or newer. Let's get that installed:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Quick sanity check:

```bash
node --version   # should be v22.x.x or higher
```

---

## Step 3: Install OpenClaw

Now let's install OpenClaw itself:

```bash
sudo npm install -g openclaw@latest
```

And verify it's there:

```bash
openclaw --version
```

---

## Step 4: Run the Onboarding Wizard

This is where the fun begins! OpenClaw has an interactive wizard that sets up everything for you: model provider, gateway, WhatsApp, workspace, and hooks.

```bash
openclaw onboard --skip-daemon
```

> **Why `--skip-daemon`?** The systemd daemon installer has a known issue on headless/SSH sessions. We'll skip it here and start the gateway manually in Step 5 instead.

The wizard will walk you through several steps. Here's what to expect:

### Model / Auth provider

One of the first things you'll be asked is to select a model provider. We're linking OpenClaw to our local Nemotron 3 Nano through vLLM. Select **vLLM** and then configure:

| Setting | Value |
|---|---|
| **Base URL** | `http://127.0.0.1:8000/v1` (keep the default) |
| **API key** | Any random string (e.g. `vllm-local`), just don't leave it empty |
| **Model name** | The **exact** model name that vLLM is serving (e.g. `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-NVFP4`) |

### Channel selection (WhatsApp)

There are different ways to talk to your OpenClaw agent. The simplest is through WhatsApp, which is what we'll be using in this tutorial.

Select **WhatsApp** as the channel. A QR code will show up in your terminal. Grab your phone:

1. Open **WhatsApp > Settings > Linked Devices**
2. Tap **Link a Device**
3. Scan the QR code

Give it a few seconds and you should see:

```
Linked after restart; web session ready.
```

It will then ask for your phone number. Enter your WhatsApp phone number in international format (e.g. `+15551234567`).

### Skills

Next up is skills. These are all the skills that can be installed through the onboarding wizard. If any appeal to you, feel free to install them. For this tutorial, we'll be skipping all of them. Don't worry, you can very easily add any skill later.

### API keys for cloud services

The next step will ask you for a bunch of API keys for different services (Brave Search, Perplexity, etc.). Since we're going fully local, we can safely say **no** to all of them. If you want to use any of these cloud services later, you can freely add your API key and it will be registered for use.

### Hooks

Hooks let you automate actions when agent commands are issued. For example, saving session context to memory when you issue `/new` or `/reset`. Feel free to select or deselect whichever you like. For this tutorial we'll be selecting all of them since they can be very useful.

### Bot hatching

Finally, when it asks "How do you want to hatch your bot?", feel free to say **"I'll do this later"** since we'll be interacting with our bot through WhatsApp.

And voilà, OpenClaw is installed and configured!

---

## Step 5: Start the Gateway

Now we need to get the gateway running. In the same terminal, run:

```bash
nohup openclaw gateway run > /tmp/openclaw-gateway.log 2>&1 &
```

> **What's happening here?** This runs the gateway in the background and logs everything to `/tmp/openclaw-gateway.log` in case we need it for debugging later.

Give it a few seconds to start up, then check the status:

```bash
openclaw channels status --probe
```

You should see something like this:

```
Gateway reachable.
- WhatsApp default: enabled, configured, linked, running, connected, dm:pairing
```

If you see that, everything is working and you're good to go!

---

## Step 6: Talk to Your Agent Through WhatsApp

This is the moment of truth! OpenClaw links as a secondary device to your WhatsApp account (similar to WhatsApp Web). From here, you can start communicating with your agent by opening **your own chat** in WhatsApp ("Message yourself"). It should reply back, and you should see the messages right there in the conversation.

> **Tip:** The first message may take a moment as the model warms up. Don't worry, subsequent messages will be much faster.

Here's an example of what it looks like:

<img src="/images/tutorials/openclaw-whatsapp-demo.png" alt="OpenClaw WhatsApp conversation example" class="tutorial-img" style="max-width: 400px;" />

That's it. You now have a **fully local AI agent** running on your Jetson, accessible through WhatsApp, with zero cloud dependencies. Pretty cool, right?

From here, the sky is the limit. Once you start adding skills and connecting services, you can have it search things for you, monitor prices and notify you when they drop, or automate parts of your daily workflow. Some people have even jokingly had OpenClaw join conversations to talk as them. Really, the more tools you give it, the more it can do for you.

---

## Useful WhatsApp Commands

Once you're chatting with your agent, these built-in commands can come in handy. They work directly in the chat without invoking the LLM:

| Command | What it does |
|---|---|
| `/status` | Show session info, token usage, and context size |
| `/help` | List all available commands |
| `/new` | Start a fresh session (clears conversation history) |
| `/stop` | Stop the current agent run |
| `/model` | Switch models (if you have multiple configured) |

---

## Managing the Gateway

Here are some handy commands for managing the gateway day-to-day:

<details class="nv-details">
<summary>Start / Stop / Restart</summary>
<div class="nv-details-content">

```bash
# Start the gateway
nohup openclaw gateway run > /tmp/openclaw-gateway.log 2>&1 &

# Stop the gateway
pkill -f "openclaw gateway run"

# Restart (stop + start)
pkill -f "openclaw gateway run"; sleep 2
nohup openclaw gateway run > /tmp/openclaw-gateway.log 2>&1 &
```

</div>
</details>

<details class="nv-details">
<summary>Viewing logs and checking status</summary>
<div class="nv-details-content">

```bash
# View logs (live)
tail -f /tmp/openclaw-gateway.log

# Or use OpenClaw's built-in log viewer (while gateway is running)
openclaw logs --follow

# Check status
openclaw channels status --probe
```

</div>
</details>

---

## Troubleshooting

If you run into issues, here are the most common ones and how to fix them:

| Problem | Fix |
|---|---|
| `openclaw: command not found` | `sudo npm install -g openclaw@latest` |
| vLLM model not detected | Check `curl http://127.0.0.1:8000/v1/models` and make sure vLLM is running |
| WhatsApp QR expired | Re-run `openclaw channels login --channel whatsapp` |
| WhatsApp shows "disconnected" | Restart the gateway (stop + start) |
| Agent not responding | Check `openclaw logs --follow` for errors; send `/new` in WhatsApp to reset the session |
| Gateway won't start | Run `openclaw doctor` to diagnose and auto-fix issues |
| Port already in use | `pkill -f "openclaw gateway run"` and try again |

---

## Unlink WhatsApp (Cleanup)

If you ever want to remove the OpenClaw link from your WhatsApp account:

On your phone: **WhatsApp > Settings > Linked Devices** → tap the OpenClaw session → **Log Out**.

---

## What to Do Next

- Explore [OpenClaw's showcase](https://openclaw.ai/showcase) for ideas on what to build
- Try installing skills to give your agent new capabilities
- Experiment with different models. Swap in any tool-calling model and see how it performs
- Check out the [OpenClaw website](https://openclaw.ai) for documentation and community resources
