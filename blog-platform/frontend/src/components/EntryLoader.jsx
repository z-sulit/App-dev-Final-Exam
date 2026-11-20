import { useEffect, useRef } from 'react';

const STAGES = [
  { delay: 450, value: 0.52 },
  { delay: 1050, value: 0.78 },
  { delay: 1650, value: 0.95 },
  { delay: 2050, value: 1 },
];

export default function EntryLoader({ onDone }) {
  const progressRef = useRef(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const el = progressRef.current;
    let finished = false;
    let doneTimer = null;
    let rafId = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      onDoneRef.current?.();
    };

    const handleSakugaDone = () => {
      doneTimer = window.setTimeout(finish, 450);
    };

    el?.addEventListener('sakuga:done', handleSakugaDone);
    el?.reset?.();
    rafId = window.requestAnimationFrame(() => {
      el?.set?.(0.22);
    });

    const stageTimers = STAGES.map(({ delay, value }) =>
      window.setTimeout(() => {
        el?.set?.(value);
      }, delay)
    );

    const fallbackTimer = window.setTimeout(finish, 3800);

    return () => {
      el?.removeEventListener('sakuga:done', handleSakugaDone);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      stageTimers.forEach((id) => window.clearTimeout(id));
      if (doneTimer !== null) window.clearTimeout(doneTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className="entry-loader-overlay" role="status" aria-live="polite">
      <div className="entry-loader-brand">BLOGBLOBLOG</div>
      <p className="entry-loader-subtitle">Loading Auth (:4000) &amp; Blog API (:5000)</p>
      <div className="entry-loader-progress-wrap">
        <sakuga-progress ref={progressRef} label="Loading BLOGBLOBLOG"></sakuga-progress>
      </div>
    </div>
  );
}
