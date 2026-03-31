import type { SupportedEngineEntry } from './inferenceCommands';

function normEngine(name: string): string {
	return name.toLowerCase().replace(/[.\-_]/g, '');
}

function pickRunSample(e: SupportedEngineEntry): string {
	return e.run_command_orin || e.run_command_thor || e.run_command || '';
}

export interface ClientCallExample {
	engineLabel: string;
	intro: string;
	command: string;
	/** Syntax highlighting / continuation handling */
	lang?: 'shell' | 'python';
	/** When false, engineLabel is still used for analytics but not shown as a heading */
	showEngineHeading?: boolean;
}

export interface ClientExampleOptions {
	modelId: string;
	hfCheckpoint?: string;
}

function openaiSdkPythonExample(
	port: number,
	model: string,
	kind: 'compat' | 'ollama',
	userContent: string,
): string {
	const keyLine =
		kind === 'ollama'
			? '    api_key="ollama",  # required by the client; Ollama ignores it'
			: '    api_key="not-needed",  # vLLM / llama.cpp typically do not enforce a key';
	const contentEsc = userContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	return `from openai import OpenAI

client = OpenAI(
    base_url="http://\${JETSON_HOST}:${port}/v1",
${keyLine}
)

completion = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "${contentEsc}"}],
)
print(completion.choices[0].message.content)`;
}

/**
 * Minimal HTTP + OpenAI Python SDK examples (not per Jetson module — caller may be another machine).
 */
export function buildClientCallExamples(
	engines: SupportedEngineEntry[],
	opts: ClientExampleOptions,
): ClientCallExample[] {
	const out: ClientCallExample[] = [];
	const seen = new Set<string>();

	for (const e of engines) {
		const key = normEngine(e.engine);
		if (seen.has(key)) continue;

		const runSample = pickRunSample(e);

		if (key === 'vllm') {
			seen.add(key);
			const model =
				opts.hfCheckpoint?.trim() ||
				opts.modelId.replace(/-/g, '_') ||
				'your-model-id';
			out.push({
				engineLabel: 'vLLM (OpenAI-compatible HTTP API)',
				lang: 'shell',
				intro: '',
				showEngineHeading: false,
				command: `curl -s http://\${JETSON_HOST}:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
			});
			out.push({
				engineLabel: 'Python (OpenAI SDK)',
				lang: 'python',
				intro: '',
				showEngineHeading: true,
				command: openaiSdkPythonExample(8000, model, 'compat', 'Hello!'),
			});
			continue;
		}

		if (key === 'llamacpp') {
			seen.add('llamacpp');
			const aliasMatch = runSample.match(/--alias\s+(\S+)/);
			const modelName = aliasMatch?.[1] || 'my_model';
			out.push({
				engineLabel: 'llama.cpp server (OpenAI-compatible API)',
				lang: 'shell',
				intro:
					'After llama-server is running with --network host, call it from another machine on the LAN (set <code class="text-xs bg-nvidia-gray-100 px-1 rounded">${JETSON_HOST}</code> or use the field). Default port is often 8080 unless you set --port.',
				command: `curl -s http://\${JETSON_HOST}:8080/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${modelName}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
			});
			out.push({
				engineLabel: 'Python (OpenAI SDK)',
				lang: 'python',
				intro: '',
				showEngineHeading: true,
				command: openaiSdkPythonExample(8080, modelName, 'compat', 'Hello!'),
			});
			continue;
		}

		if (key === 'ollama') {
			seen.add('ollama');
			const tag =
				opts.hfCheckpoint?.split('/').pop() ||
				opts.modelId.replace(/_/g, '-') ||
				'your-model';
			out.push({
				engineLabel: 'Ollama HTTP API',
				lang: 'shell',
				intro:
					'With ollama serve running on the Jetson, generate from another host (set <code class="text-xs bg-nvidia-gray-100 px-1 rounded">${JETSON_HOST}</code> or use the field; match model name to what you pulled on device).',
				command: `curl -s http://\${JETSON_HOST}:11434/api/generate -d '{
  "model": "${tag}",
  "prompt": "Why is the sky blue?",
  "stream": false
}'`,
			});
			out.push({
				engineLabel: 'Python (OpenAI SDK · Ollama /v1)',
				lang: 'python',
				intro: '',
				showEngineHeading: true,
				command: openaiSdkPythonExample(11434, tag, 'ollama', 'Why is the sky blue?'),
			});
		}
	}

	return out;
}
