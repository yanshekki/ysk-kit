import { useMutation } from '@tanstack/react-query';
import type { LlmCompleteCommand } from '@ysk-kit/contracts';
import type { YskClient } from '@ysk-kit/sdk';

export function createLlmHooks(client: YskClient) {
  return {
    useLlmComplete: () =>
      useMutation({
        mutationFn: (body: LlmCompleteCommand) => client.llm.complete(body),
      }),
  };
}
