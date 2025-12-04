/**
 * Worker Builder Utility
 * Helper to create Web Workers from functions or files
 */

/**
 * Safe Worker Factory
 * Creates a Web Worker from a function, safe for SSR.
 */
export const createWorker = (workerFn: () => void): Worker | null => {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  const code = workerFn.toString();
  const blob = new Blob([`(${code})()`], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

/**
 * Example of a heavy calculation task
 */
export const heavyCalculation = () => {
  self.onmessage = (message: MessageEvent) => {
    const { data } = message;
    console.log('Worker received data:', data);

    // Simulate heavy computation
    const start = performance.now();
    let result = 0;
    for (let i = 0; i < 100000000; i++) {
      result += Math.random();
    }
    const end = performance.now();

    self.postMessage({
      result,
      time: end - start,
      originalData: data,
    });
  };
};
