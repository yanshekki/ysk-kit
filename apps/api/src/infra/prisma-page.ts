export const prismaIdCursor = (
  cursor: string | undefined,
): { cursor: { id: string }; skip: 1 } | Record<string, never> =>
  cursor ? { cursor: { id: cursor }, skip: 1 } : {};
