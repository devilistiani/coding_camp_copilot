type Variant = "dark" | "light";

interface MarkdownProps {
  text: string;
  variant?: Variant;
}

const theme: Record<Variant, {
  base: string;
  strong: string;
  bullet: string;
  heading: string;
}> = {
  dark: {
    base: "text-slate-300",
    strong: "text-white",
    bullet: "text-[#FF4444]",
    heading: "text-white",
  },
  light: {
    base: "text-slate-700",
    strong: "text-slate-900",
    bullet: "text-[#CC0000]",
    heading: "text-slate-900",
  },
};

export function Markdown({ text, variant = "dark" }: MarkdownProps) {
  const t = theme[variant];

  return (
    <div className="space-y-0.5">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
          return (
            <p key={i} className={`font-semibold ${t.heading} mt-3 mb-0.5`}>
              {line.slice(2, -2)}
            </p>
          );
        }

        if (line.match(/^\d+\./)) {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className={`ml-4 ${t.base} text-sm`}>
              {parts.map((p, j) =>
                j % 2 === 1 ? <strong key={j} className={t.strong}>{p}</strong> : p,
              )}
            </p>
          );
        }

        if (line.startsWith("- ")) {
          const inner = line.slice(2).split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className={`ml-4 flex gap-2 ${t.base} text-sm`}>
              <span className={`${t.bullet} flex-shrink-0`}>•</span>
              <span>
                {inner.map((p, j) =>
                  j % 2 === 1 ? <strong key={j} className={t.strong}>{p}</strong> : p,
                )}
              </span>
            </p>
          );
        }

        if (line.trim() === "") return <div key={i} className="h-1" />;

        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className={`${t.base} text-sm leading-relaxed`}>
            {parts.map((p, j) =>
              j % 2 === 1 ? <strong key={j} className={t.strong}>{p}</strong> : p,
            )}
          </p>
        );
      })}
    </div>
  );
}
