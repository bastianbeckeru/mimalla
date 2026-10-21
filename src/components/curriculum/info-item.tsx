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
      <dt className="text-balance font-medium text-muted-foreground text-sm">
        {label}
      </dt>
      <dd className="font-normal text-base text-foreground">{renderValue()}</dd>
    </div>
  );
}
