import { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  password: string;
  onStrengthChange: (isStrong: boolean) => void;
}

const COMMON_WEAK_PASSWORDS = [
  'password123', '12345678', 'qwertyuiop', '123456789', 'lastlook123', 'admin1234', 'password'
];

export default function PasswordStrengthMeter({ password, onStrengthChange }: Props) {
  const isCommon = COMMON_WEAK_PASSWORDS.some(p => password.toLowerCase().includes(p));
  
  const rules = [
    { label: 'At least 8 characters', check: password.length >= 8 },
    { label: 'Contains uppercase letter', check: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', check: /[a-z]/.test(password) },
    { label: 'Contains a number', check: /\d/.test(password) },
    { label: 'Contains a symbol', check: /[\W_]/.test(password) },
  ];

  const rulesPassed = rules.filter(r => r.check).length;
  const allRulesPassed = rulesPassed === rules.length && !isCommon;

  useEffect(() => {
    onStrengthChange(allRulesPassed);
  }, [allRulesPassed, onStrengthChange]);

  if (!password) return null;

  let strengthLabel = 'Weak';
  let strengthColor = 'bg-err';
  if (isCommon) {
    strengthLabel = 'Too Common';
    strengthColor = 'bg-err';
  } else if (allRulesPassed) {
    if (password.length >= 12) {
      strengthLabel = 'Strong';
      strengthColor = 'bg-ok';
    } else {
      strengthLabel = 'Good';
      strengthColor = 'bg-warn'; // or yc color
    }
  } else if (rulesPassed >= 3) {
    strengthLabel = 'Fair';
    strengthColor = 'bg-warn';
  }

  // 4 segments
  const segments = [
    isCommon ? false : rulesPassed >= 1,
    isCommon ? false : rulesPassed >= 3,
    isCommon ? false : allRulesPassed,
    isCommon ? false : (allRulesPassed && password.length >= 12)
  ];

  return (
    <div className="mt-2 space-y-2 animate-fade-in">
      <div className="flex items-center justify-between text-[11px] font-medium">
        <span className="text-ink-secondary">Password strength</span>
        <span className={strengthColor.replace('bg-', 'text-')}>{strengthLabel}</span>
      </div>
      
      <div className="flex gap-1 h-1.5">
        {segments.map((active, i) => (
          <div 
            key={i} 
            className={`flex-1 rounded-full transition-colors duration-300 ${active ? strengthColor : 'bg-edge'}`} 
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {rules.map((rule, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            {rule.check ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-ink-faint" />
            )}
            <span className={rule.check ? 'text-ink-secondary' : 'text-ink-muted'}>
              {rule.label}
            </span>
          </div>
        ))}
        {isCommon && (
          <div className="flex items-center gap-1.5 text-[11px] col-span-1 sm:col-span-2">
            <XCircle className="w-3.5 h-3.5 text-err" />
            <span className="text-err">Password is too common</span>
          </div>
        )}
        {allRulesPassed && password.length < 12 && (
           <div className="flex items-center gap-1.5 text-[11px] col-span-1 sm:col-span-2">
            <span className="text-ink-muted italic text-[10px] ml-5">Recommend 12+ characters</span>
          </div>
        )}
      </div>
    </div>
  );
}
