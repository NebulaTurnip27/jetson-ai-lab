#!/usr/bin/env python3
"""
OpenClaw Endurance Test — Single Agent

Runs a short demo (5 prompts, no pause) by default. Use --full for the long test.
Logs results to ~/endurance_test.md.

Usage:
    python3 endurance-test.py
    python3 endurance-test.py --full
"""

import argparse
import json
import os
import subprocess
import time
from datetime import datetime

DEFAULT_OUTPUT = os.path.expanduser("~/endurance_test.md")
DEFAULT_INTERVAL = 0  # seconds between prompts (no pause for short demo)
FULL_INTERVAL = 240  # seconds between prompts for --full mode

FULL_SCENARIOS = [
    {
        "name": "Memory & Continuity",
        "session": "+1000000001",
        "prompts": [
            "My name is Marco and I live in Barcelona. Remember this.",
            "I have a dog called Luna and a cat called Pixel. Remember this too.",
            "What is my name and where do I live?",
            "What are my pets' names?",
            "Write a short haiku about my life in Barcelona with my pets.",
            "Now tell me everything you remember about me.",
        ],
    },
    {
        "name": "Reasoning & Logic",
        "session": "+1000000002",
        "prompts": [
            "If all roses are flowers and some flowers fade quickly, can we say all roses fade quickly? Explain briefly.",
            "A farmer has 17 sheep. All but 9 die. How many are left?",
            "I have two coins that total 30 cents and one of them is not a nickel. What are the two coins?",
            "If it takes 5 machines 5 minutes to make 5 widgets, how long does it take 100 machines to make 100 widgets?",
            "Three friends split a hotel bill of $30, paying $10 each. The clerk realizes it should be $25 and gives $5 to the bellboy. The bellboy keeps $2 and gives $1 back to each friend. Each friend paid $9 (total $27) plus $2 the bellboy kept = $29. Where is the missing dollar?",
        ],
    },
    {
        "name": "Creative Writing",
        "session": "+1000000003",
        "prompts": [
            "Write a 4-line poem about a robot discovering the ocean for the first time.",
            "Now continue that poem — the robot decides to swim. 4 more lines.",
            "Write a one-paragraph sci-fi story about a Jetson Orin Nano that becomes sentient.",
            "Rewrite that story but make it funny.",
            "Write a recipe for 'Artificial Intelligence Soup' — be creative with the ingredients.",
        ],
    },
    {
        "name": "Technical Knowledge",
        "session": "+1000000004",
        "prompts": [
            "Explain what a KV cache is in transformer models, in 2 sentences.",
            "What is the difference between Q4_K_M and Q8_0 quantization?",
            "Why does the Jetson Orin Nano use unified memory? What are the trade-offs?",
            "Explain flash attention in one paragraph.",
            "What is the difference between a dense model and a mixture-of-experts model?",
        ],
    },
    {
        "name": "Multilingual",
        "session": "+1000000005",
        "prompts": [
            "Say 'The future is local AI' in Spanish, French, German, and Japanese.",
            "Write a short greeting in Mandarin Chinese and explain the characters.",
            "Translate 'I am running on a Jetson Orin Nano' to Portuguese and Italian.",
            "What does 'carpe diem' mean and where does it come from?",
        ],
    },
    {
        "name": "Session Status Tool",
        "session": "+1000000006",
        "prompts": [
            "Check your session status and tell me how many tokens you have used so far.",
            "What model are you running on?",
            "Check your session status again. How has the token count changed since my first question?",
        ],
    },
    {
        "name": "Edge Cases",
        "session": "+1000000007",
        "prompts": [
            "Respond with exactly 5 words.",
            "What is 7823 * 419?",
            "List the first 10 prime numbers.",
            "Respond only with 'yes' or 'no': Is 2+2=5?",
            "What day of the week was January 1, 2000?",
            "Count from 1 to 20 but skip all multiples of 3.",
        ],
    },
    {
        "name": "Long Conversation Stress",
        "session": "+1000000008",
        "prompts": [
            "Let's play a word association game. I say 'ocean'. What's your word?",
            "Good. My next word is 'mountain'. Your turn.",
            "Now 'robot'. Go.",
            "Now 'dream'. Go.",
            "Now 'code'. Go.",
            "Now 'star'. Go.",
            "Now 'silence'. Go.",
            "Now 'fire'. Go.",
            "How many words have we exchanged in this game? List them all from memory.",
        ],
    },
]

SHORT_SCENARIOS = [
    {
        "name": "Memory & Continuity",
        "session": "+1000000001",
        "prompts": [
            "My name is Marco, I live in Barcelona, and I have a dog called Luna. Remember this.",
            "What is my name, where do I live, and what is my dog's name?",
        ],
    },
    {
        "name": "Reasoning & Logic",
        "session": "+1000000002",
        "prompts": [
            "A farmer has 17 sheep. All but 9 die. How many are left?",
        ],
    },
    {
        "name": "Creative Writing",
        "session": "+1000000003",
        "prompts": [
            "Write a 4-line poem about a robot discovering the ocean for the first time.",
        ],
    },
    {
        "name": "Session Status Tool",
        "session": "+1000000006",
        "prompts": [
            "Check your session status and tell me how many tokens you have used so far.",
        ],
    },
]


def ask(session, message):
    cmd = [
        "openclaw", "agent",
        "--to", session,
        "--message", message,
        "--json",
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        data = json.loads(proc.stdout)
        payloads = data.get("result", {}).get("payloads", [])
        meta = data.get("result", {}).get("meta", {}).get("agentMeta", {})
        duration = data.get("result", {}).get("meta", {}).get("durationMs", 0)
        usage = meta.get("usage", {})
        text = payloads[0]["text"] if payloads and payloads[0].get("text") else "[NO_REPLY]"
        return text, duration, usage.get("input", 0), usage.get("output", 0)
    except Exception as e:
        return f"[ERROR: {e}]", 0, 0, 0


def print_chat_block(now, scenario_name, prompt_num, total_prompts, prompt, text, duration, inp, out):
    print(f"\n[{now}] {scenario_name} — prompt {prompt_num}/{total_prompts}")
    print(f"User  : {prompt}")
    print(f"Agent : {text}")
    print(f"Stats : {duration}ms · {inp} input · {out} output")


def build_plan(scenarios):
    plan = []
    for scenario in scenarios:
        for prompt in scenario["prompts"]:
            plan.append(
                {
                    "scenario": scenario["name"],
                    "session": scenario["session"],
                    "prompt": prompt,
                }
            )
    return plan


def parse_args():
    parser = argparse.ArgumentParser(
        description="Run the OpenClaw single-agent endurance test."
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Run the full 43-prompt endurance test (4 min between prompts).",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=None,
        help="Seconds between prompts. Default: 0 (short demo). Use with --full for long run.",
    )
    parser.add_argument(
        "--max-prompts",
        type=int,
        default=None,
        help="Stop after this many prompts.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Markdown output path. Default: ~/endurance_test.md",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    scenarios = FULL_SCENARIOS if args.full else SHORT_SCENARIOS
    interval = args.interval if args.interval is not None else (FULL_INTERVAL if args.full else DEFAULT_INTERVAL)
    output = args.output or DEFAULT_OUTPUT

    plan = build_plan(scenarios)
    if args.max_prompts is not None:
        plan = plan[: args.max_prompts]

    total_prompts = len(plan)
    if total_prompts == 0:
        print("No prompts selected. Exiting.")
        return

    start = datetime.now()
    prompt_num = 0
    total_in, total_out, total_ms, errors = 0, 0, 0, 0

    print("OpenClaw Endurance Test")
    print(f"Mode      : {'full (43 prompts)' if args.full else 'short (5 prompts)'}")
    print(f"Prompts   : {total_prompts}")
    print(f"Interval  : {interval}s")
    print(f"Output    : {output}")
    print("Model     : qwen3.5:2b (Q8_0)")

    with open(output, "w", encoding="utf-8") as f:
        f.write("# OpenClaw Endurance Test\n\n")
        f.write(f"**Device:** Jetson Orin Nano (8GB)  \n")
        f.write(f"**Model:** qwen3.5:2b (Q8_0)  \n")
        f.write(f"**Start:** {start.strftime('%Y-%m-%d %H:%M')}  \n")
        f.write(f"**Mode:** {'Full (43 prompts)' if args.full else 'Short (5 prompts)'}  \n")
        f.write(f"**Scenarios:** {len(scenarios)}  \n")
        f.write(f"**Total prompts:** {total_prompts}  \n")
        f.write(f"**Interval:** {interval} seconds between prompts  \n\n---\n")

        current_scenario = None
        for item in plan:
            if item["scenario"] != current_scenario:
                current_scenario = item["scenario"]
                f.write(f"\n## {current_scenario}\n\nSession: `{item['session']}`\n")
                f.flush()

            prompt_num += 1
            now = datetime.now().strftime("%H:%M:%S")
            prompt = item["prompt"]
            text, duration, inp, out = ask(item["session"], prompt)

            print_chat_block(
                now,
                item["scenario"],
                prompt_num,
                total_prompts,
                prompt,
                text,
                duration,
                inp,
                out,
            )

            f.write(f"\n### [{now}] Prompt {prompt_num}/{total_prompts}\n\n")
            f.write(f"> {prompt}\n\n")
            f.write(f"{text}\n\n")
            f.write(f"*{duration}ms · {inp} in · {out} out*\n")
            f.flush()

            total_in += inp
            total_out += out
            total_ms += duration
            if "[ERROR" in text or "[NO_REPLY]" in text:
                errors += 1

            if prompt_num < total_prompts:
                time.sleep(interval)

        end = datetime.now()
        elapsed = end - start
        f.write(f"\n---\n\n## Summary\n\n")
        f.write(f"| Metric | Value |\n|---|---|\n")
        f.write(f"| Duration | {elapsed} |\n")
        f.write(f"| Prompts sent | {total_prompts} |\n")
        f.write(f"| Errors | {errors} |\n")
        f.write(f"| Total input tokens | {total_in:,} |\n")
        f.write(f"| Total output tokens | {total_out:,} |\n")
        f.write(f"| Total LLM time | {total_ms/1000:.1f}s |\n")
        f.write(f"| Avg response time | {total_ms/total_prompts/1000:.1f}s |\n")
        f.write(f"| Avg output tokens | {total_out//max(total_prompts,1)} |\n")

    print(f"\nDone! Results in {output}")


if __name__ == "__main__":
    main()
