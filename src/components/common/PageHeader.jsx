export default function PageHeader({ title, action }) {
  return (
    <div className="flex justify-between items-end mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <div className="h-1 w-8 bg-primary mt-1" />
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}