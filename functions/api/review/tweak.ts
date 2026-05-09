interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

interface TweakParams {
  tool: string;
  text: string;
  memory?: {
    profile?: { name?: string; currentFocus?: string; preferredTone?: string };
    projects?: { name: string; oneLiner: string }[];
    achievements?: { title: string; description: string }[];
  };
  context?: { inputSummary?: { applicationType?: string } };
  options?: { tone?: string; targetWords?: number; targetSeconds?: number };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as TweakParams;

    if (!body.text || !body.tool) {
      return new Response(JSON.stringify({ error: 'text and tool are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = applyTweak(body);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[api/review/tweak] internal error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function applyTweak(input: TweakParams) {
  const { tool, text, memory, context, options } = input;
  const changes: string[] = [];
  const whyItHelps: string[] = [];

  let result = text;
  const projects = memory?.projects || [];
  const profile = memory?.profile;

  switch (tool) {
    case 'strengthenFit': {
      const focus = profile?.currentFocus || 'your current work';
      const appType = context?.inputSummary?.applicationType || 'opportunity';
      const fitSentence = `This ${appType} fits ${focus} because I want to take the next step.`;
      if (!text.toLowerCase().includes('fits') && !text.toLowerCase().includes('because')) {
        result = text + ' ' + fitSentence;
        changes.push('Added specific fit explanation');
        whyItHelps.push('Shows concrete alignment');
      }
      break;
    }

    case 'explainProject': {
      for (const project of projects) {
        if (!project.name || !project.oneLiner) continue;
        if (text.toLowerCase().includes(project.name.toLowerCase()) && 
            !text.toLowerCase().includes(project.oneLiner.toLowerCase())) {
          result = result.replace(
            new RegExp(`\\b${project.name}\\b`, 'gi'),
            `${project.name} — ${project.oneLiner}`
          );
          changes.push(`Explained ${project.name}`);
          whyItHelps.push('Evaluators now understand what it is');
        }
      }
      break;
    }

    case 'makeLessGeneric': {
      const genericReplacements: Record<string, string> = {
        'learn from smart people': 'get feedback from builders',
        'exciting opportunity': 'unique chance to build',
        'build faster': 'ship more reliably',
        'make an impact': 'create tools people use',
      };
      let hasGeneric = false;
      for (const [phrase, replacement] of Object.entries(genericReplacements)) {
        if (text.toLowerCase().includes(phrase)) {
          result = result.replace(new RegExp(phrase, 'gi'), replacement);
          hasGeneric = true;
        }
      }
      if (hasGeneric) {
        changes.push('Replaced generic phrases');
        whyItHelps.push('Uses specific language');
      }
      break;
    }

    case 'addEvidence': {
      const achievements = memory?.achievements || [];
      for (const achievement of achievements) {
        if (!achievement.title) continue;
        if (!text.toLowerCase().includes(achievement.title.toLowerCase())) {
          result = result + ` ${achievement.title}: ${achievement.description}`;
          changes.push(`Added: ${achievement.title}`);
          whyItHelps.push('Shows concrete evidence');
          break;
        }
      }
      break;
    }

    case 'shorten': {
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length > 50) {
        const half = Math.ceil(words.length / 2);
        result = words.slice(0, half).join(' ');
        changes.push('Shortened by half');
        whyItHelps.push('More concise');
      }
      break;
    }

    case 'expand': {
      const words = text.split(/\s+/).filter(Boolean);
      const target = options?.targetWords || 150;
      if (words.length < target) {
        const project = projects.find(p => p.oneLiner);
        if (project) {
          result = result + ` A key project is ${project.name} — ${project.oneLiner}.`;
          changes.push('Expanded with project detail');
          whyItHelps.push('Meets target with real evidence');
        }
      }
      break;
    }

    case 'videoScript': {
      const targetSeconds = options?.targetSeconds || 60;
      const targetWords = Math.round((targetSeconds / 60) * 145);
      const words = text.split(/\s+/).filter(Boolean);
      
      if (words.length > targetWords) {
        const reduced = Math.ceil(words.length * 0.6);
        result = words.slice(0, reduced).join(' ');
        changes.push('Trimmed to video length');
        whyItHelps.push(`Fits ~${targetSeconds}s`);
      } else if (words.length < targetWords * 0.7) {
        result = result + ' This connects directly to what I want to build next.';
        changes.push('Expanded for video');
        whyItHelps.push('Fills the window');
      }
      break;
    }

    case 'improveOpening': {
      const name = profile?.name || 'I';
      if (!text.toLowerCase().startsWith(name.toLowerCase()) && !text.toLowerCase().startsWith("i'm")) {
        result = `${name} am ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
        changes.push('Improved opening');
        whyItHelps.push('Opens with identity');
      }
      break;
    }

    case 'improveClosing': {
      if (!text.match(/\.( farewell|Thanks|Thank you|Looking forward)$/i)) {
        result = text + ' Looking forward to connecting.';
        changes.push('Added closing');
        whyItHelps.push('Ends professionally');
      }
      break;
    }

    case 'fixTone': {
      const targetTone = options?.tone || profile?.preferredTone || 'confident';
      
      if (targetTone === 'confident') {
        result = result
          .replace(/\bi think\b/gi, '')
          .replace(/\bmaybe\b/gi, '')
          .replace(/\bi hope\b/gi, 'I will');
        changes.push('Removed hedging');
        whyItHelps.push('More confident');
      }
      break;
    }

    default:
      return {
        updatedText: text,
        whatChanged: ['No changes'],
        whyItHelps: ['Unknown tool'],
        wordCount: text.split(/\s+/).filter(Boolean).length,
        speakingTimeSeconds: Math.round(text.split(/\s+/).length / 145 * 60),
      };
  }

  if (changes.length === 0) {
    changes.push('Already meets requirements');
    whyItHelps.push('No changes needed');
  }

  const wordCount = result.split(/\s+/).filter(Boolean).length;
  const speakingTimeSeconds = Math.round((wordCount / 145) * 60);

  return {
    updatedText: result,
    whatChanged: changes,
    whyItHelps,
    wordCount,
    speakingTimeSeconds,
  };
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};