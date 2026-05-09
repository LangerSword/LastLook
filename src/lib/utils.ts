export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function speakingTime(words: number): number {
  return Math.round((words / 145) * 60);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function statusColor(status: string): string {
  if (status.toLowerCase().includes('ready with')) return 'text-ok';
  if (status.toLowerCase().includes('needs')) return 'text-warn';
  return 'text-err';
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-ok';
  if (score >= 60) return 'text-warn';
  return 'text-err';
}
