import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * خانة بحث: أيقونة + زرار مسح، ارتفاع 48px، والقيمة بتتبعت للأب بعد ما الكتابة تهدى (delay).
 * الكتابة في state محلي (الفوكس والمؤشر ما بيضيعوش)، وأي قيمة جاية من برّه (مسح الفلاتر، لينك) بتتكتب في الخانة.
 */
export default function SearchInput({ value = "", onChange, label, placeholder, delay = 250, autoFocus = false, className }) {
  const [text, setText] = useState(value);
  const inputRef = useRef(null);
  const emitted = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    setText(value);
  }, [value]);

  useEffect(() => {
    if (text === emitted.current) return undefined;
    const t = setTimeout(() => {
      emitted.current = text;
      onChangeRef.current(text);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  const clear = () => {
    setText("");
    emitted.current = "";
    onChangeRef.current("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        className={cn(
          "min-h-[48px] w-full rounded-2xl border-2 border-ink/10 bg-white pe-12 ps-11 text-base text-ink transition placeholder:text-ink-soft/60",
          "focus:border-brand-red focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        )}
      />
      {text && (
        <button
          type="button"
          onClick={clear}
          aria-label="مسح البحث"
          className="absolute end-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      )}
    </div>
  );
}
