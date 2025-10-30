export default function InfoItem({
  label,
  value,
  type = "text",
}: {
  label: string;
  value: string | number;
  type?: "text" | "code" | "time";
}) {
  const renderValue = () => {
    switch (type) {
      case "code":
        return <code>{value}</code>;
      case "time":
        return <time dateTime={String(value)}>{value}</time>;
      default:
        return value;
    }
  };

  return (
    <div>
      <dt className="text-muted-foreground text-sm font-medium text-balance">
        {label}
      </dt>
      <dd className="text-foreground text-base font-normal">{renderValue()}</dd>
    </div>
  );
}
