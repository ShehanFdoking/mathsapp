export default function MarkdownLite({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("###")) return <h4 key={i} className="font-semibold">{trimmed.replace(/^#+\s*/, "")}</h4>;
        if (trimmed.startsWith("##")) return <h3 key={i} className="font-bold text-base">{trimmed.replace(/^#+\s*/, "")}</h3>;
        if (trimmed.startsWith("#")) return <h2 key={i} className="font-bold text-lg">{trimmed.replace(/^#+\s*/, "")}</h2>;
        if (trimmed.startsWith("-") || trimmed.startsWith("*"))
          return <li key={i} className="ml-4 list-disc">{trimmed.replace(/^[-*]\s*/, "")}</li>;
        return <p key={i}>{trimmed.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
      })}
    </div>
  );
}
