import { Link } from "react-router-dom";
import { LogoIcon } from "@/components/common/Logo";
import Button from "@/components/common/Button";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md place-items-center px-4 py-20 text-center">
      <LogoIcon tone="onLight" className="mb-4 w-24" />
      <h1 className="text-3xl font-extrabold">الصفحة دي مش موجودة</h1>
      <p className="mb-6 mt-2 text-ink-soft">يمكن اللينك غلط. ارجع للرئيسية واختار وجباتك.</p>
      <Button as={Link} to="/">الرئيسية</Button>
    </div>
  );
}
