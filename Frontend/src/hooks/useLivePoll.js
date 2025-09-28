import { useEffect, useRef } from 'react';

/**
 * useLivePoll: Re-runs an async callback immediately and on an interval.
 * - Skips ticks while the tab is hidden.
 * - Prevents overlapping runs if the previous tick is still in-flight.
 *
 * @param {Function} callback - async function to execute for fetching/updating data
 * @param {Object} options
 * @param {number} options.intervalMs - polling interval in ms (default 5000)
 * @param {Array} options.deps - dependencies that should restart polling when changed
 */
export default function useLivePoll(callback, { intervalMs = 8000, deps = [] } = {}) {
  const cbRef = useRef(callback);

  // Keep latest callback without re-registering the interval on every render
  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let intervalId;
    let running = false;

    const run = async () => {
      if (running) return;
      running = true;
      try {
        await cbRef.current();
      } finally {
        running = false;
      }
    };

    // initial run
    run();

    // poll while visible
    intervalId = setInterval(() => {
      if (!document.hidden) {
        run();
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [intervalMs, ...deps]);
}