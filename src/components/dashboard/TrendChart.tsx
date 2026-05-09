import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Point {
  name: string;
  score: number;
}

interface Props {
  data: Point[];
}

export default function TrendChart({ data }: Props) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-soft)' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-soft)' }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}
            itemStyle={{ color: 'var(--text)' }}
          />
          <Area type="monotone" dataKey="score" stroke="#FF5A1F" strokeWidth={3} fillOpacity={1} fill="url(#trendFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
