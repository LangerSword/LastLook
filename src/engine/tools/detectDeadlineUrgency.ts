export interface DeadlineUrgencyResult {
  deadline?: string;
  daysRemaining?: number;
  urgency: 'none' | 'low' | 'medium' | 'high' | 'critical';
  mode: 'careful' | 'fast' | 'emergency';
  recommendation: string;
}

export function detectDeadlineUrgency(deadline?: string): DeadlineUrgencyResult {
  if (!deadline) {
    return {
      urgency: 'none',
      mode: 'careful',
      recommendation: 'No deadline - take time for quality',
    };
  }

  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return {
      deadline,
      urgency: 'none',
      mode: 'careful',
      recommendation: 'Invalid deadline format',
    };
  }

  const diffMs = parsed.getTime() - Date.now();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.round(diffDays);

  let urgency: DeadlineUrgencyResult['urgency'];
  let mode: DeadlineUrgencyResult['mode'];
  let recommendation: string;

  if (diffDays <= 2) {
    urgency = 'critical';
    mode = 'emergency';
    recommendation = 'Focus on critical fixes only - missing links, requirements';
  } else if (diffDays <= 7) {
    urgency = 'high';
    mode = 'fast';
    recommendation = 'Focus on requirement coverage and evidence quality';
  } else {
    urgency = 'low';
    mode = 'careful';
    recommendation = 'Time for full review - improve fit, clarity, evidence';
  }

  return {
    deadline,
    daysRemaining,
    urgency,
    mode,
    recommendation,
  };
}