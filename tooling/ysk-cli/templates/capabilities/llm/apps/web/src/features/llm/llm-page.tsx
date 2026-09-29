import { Button, Input } from '@ysk/ui';
import { createLlmHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const llmHooks = createLlmHooks(api);

export function LlmPage() {
  const complete = llmHooks.useLlmComplete();
  const [prompt, setPrompt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (prompt.trim().length === 0) return;
    complete.mutate(
      { messages: [{ role: 'user', content: prompt.trim() }] },
      { onError: (error) => setFormError(error.message) },
    );
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">LLM</h1>
      <p className="text-sm text-zinc-600">
        One-shot complete via SpaceXAI-compatible /v1/llm/complete.
      </p>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm" htmlFor="llm-prompt">
          Prompt
          <Input
            id="llm-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
        </label>
        <Button type="submit" disabled={complete.isPending}>
          Send
        </Button>
      </form>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      {complete.data ? (
        <div className="space-y-2 rounded-md border border-zinc-200 bg-white p-3 text-sm">
          <p className="whitespace-pre-wrap">{complete.data.text}</p>
          <p className="text-zinc-500">
            {complete.data.model} · {complete.data.usage.totalTokens} tokens
          </p>
        </div>
      ) : null}
    </section>
  );
}
