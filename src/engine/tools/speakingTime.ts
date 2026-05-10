export interface SpeakingTimeResult {
  seconds: number;
  minutes: number;
  range: string;
}

export function estimateSpeakingTime(text: string, wordsPerMinute: number = 145): SpeakingTimeResult {
  const words = text.split(/\s+/).filter(Boolean).length;
  const seconds = Math.round((words / wordsPerMinute) * 60);
  const minutes = Math.round(seconds / 60);

  let range: string;
  if (seconds < 30) range = 'very short (<30s)';
  else if (seconds < 60) range = 'short (30-60s)';
  else if (seconds < 90) range = 'good (60-90s)';
  else if (seconds < 120) range = 'long (90-120s)';
  else range = 'very long (>120s)';

  return { seconds, minutes, range };
}