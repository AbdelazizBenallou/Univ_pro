export async function parallelQueue<T>(
  items: T[],
  concurrency: number,
  handler: (item: T, index: number) => Promise<any>,
): Promise<{ results: any[]; errors: { index: number; error: any }[] }> {
  const results: any[] = [];
  const errors: { index: number; error: any }[] = [];
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < items.length; i++) {
    const index = i;
    const p = handler(items[index], index)
      .then((result) => {
        results[index] = result;
      })
      .catch((error) => {
        errors.push({ index, error });
      })
      .finally(() => {
        executing.delete(p);
      });

    executing.add(p);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);

  return { results, errors };
}
