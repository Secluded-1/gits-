import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export default function Header({ right }: { right?: ReactNode }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 md:px-20">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-slate-900">
          GITS
        </Link>
        <div className="flex items-center gap-3">{right}</div>
      </div>
    </header>
  );
}
