import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Slice {
  name: string;
  value: number;
}

interface Props {
  data: Slice[];
}

const COLORS = ['#FF5A1F', '#F7A35C', '#FDBA74', '#FCD34D', '#FB7185', '#A3E635'];

export default function ApplicationTypeChart({ data }: Props) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} innerRadius={50} paddingAngle={3}>
            {data.map((entry, idx) => (
              <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}
            itemStyle={{ color: 'var(--text)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
