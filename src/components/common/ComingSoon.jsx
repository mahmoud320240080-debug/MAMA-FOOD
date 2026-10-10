import { LogoIcon } from "./Logo";

export default function ComingSoon({ title, phase }) {
  return (
    <div className="grid place-items-center rounded-4xl bg-white px-6 py-16 text-center shadow-soft">
      <LogoIcon tone="onLight" className="mb-4 w-20" />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-ink-soft">الصفحة دي هتتبني في {phase}</p>
    </div>
  );
}
