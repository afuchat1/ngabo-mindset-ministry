import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/ngabo-logo.jpg";

type AuthDestination = "loading" | "signed-out" | "admin" | "member" | "pending";

function Typewriter({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[i % words.length] ?? "";
    let t: ReturnType<typeof setTimeout>;
    if (!del && text === word) t = setTimeout(() => setDel(true), 1600);
    else if (del && text === "") { setDel(false); setI((n) => n + 1); return; }
    else t = setTimeout(() => setText(del ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)), del ? 50 : 100);
    return () => clearTimeout(t);
  }, [text, del, i, words]);
  return <span>{text}<span className="ml-1 inline-block w-[3px] animate-pulse bg-primary align-middle" style={{ height: "0.9em" }} /></span>;
}

export function SiteHeader({ authDestination, dashboardHref, minimal = false }: { authDestination: AuthDestination; dashboardHref: string; minimal?: boolean }) {
  const [p, setP] = useState(0);
  const compact = p > 0.05;
  useEffect(() => {
    if (minimal) return;
    let raf = 0;
    const update = () => { raf = 0; setP(Math.min(window.scrollY / 300, 1)); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [minimal]);
  if (minimal) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[76px] max-w-5xl items-center gap-3 px-4 py-2 sm:px-6">
          <a href="#top" aria-label="NGABO (MMA) home" className="shrink-0">
            <img src={logoImage} alt="NGABO (MMA) logo" className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14" />
          </a>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight text-primary sm:text-3xl">NGABO</h1>
            <p className="min-h-[1.1em] text-[10px] font-extrabold uppercase tracking-wider text-foreground sm:text-xs"><Typewriter words={["(MMA) Net Work", "Ministries"]} /></p>
          </div>
        </div>
      </header>
    );
  }
  if (minimal) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 h-[76px] border-b border-border/40 bg-background/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-full max-w-6xl grid-cols-[48px_minmax(0,1fr)] items-center gap-3 px-4 sm:px-6">
          <a href="#top" aria-label="NGABO (MMA) home" className="pointer-events-auto block">
            <img src={logoImage} alt="NGABO (MMA) logo" className="h-11 w-11 rounded-full object-cover shadow-sm transition-transform duration-300 hover:scale-105" />
          </a>
          <div className="min-w-0">
            <h1 className="animate-in fade-in slide-in-from-left-2 text-xl font-black leading-tight tracking-wide text-primary sm:text-2xl">NGABO</h1>
            <p className="min-h-[1.1rem] whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
              <Typewriter words={["(MMA) Net Work", "Ministries"]} />
            </p>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <div aria-hidden className="text-[40px] font-black leading-none md:text-9xl"><span className="invisible">NGABO</span></div>
      <div aria-hidden className="mt-2 min-h-[1.2em] text-xs font-extrabold uppercase md:text-5xl"><span className="invisible">(MMA) NET WORK</span></div>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="absolute inset-x-0 top-0 h-24 bg-background/90 shadow-sm backdrop-blur" style={{ opacity: p }} />
        <div
          className="relative grid grid-cols-[76px_minmax(0,1fr)_76px] items-center gap-x-1 px-4 md:grid-cols-[96px_minmax(0,1fr)_96px] md:px-6"
          style={{ top: 64 - p * 48, "--header-progress": p } as CSSProperties}
        >
          <div className="relative flex h-12 items-center md:h-14">
            <a href="#top" aria-label="NGABO (MMA) home" className={`pointer-events-auto absolute left-0 transition-opacity duration-200 motion-reduce:transition-none ${!minimal && compact ? "pointer-events-none opacity-0" : "opacity-100"}`} tabIndex={!minimal && compact ? -1 : 0} aria-hidden={!minimal && compact}>
              <img src={logoImage} alt="NGABO (MMA) logo" className="h-12 w-12 rounded-full object-cover shadow-md transition-transform hover:scale-105 md:h-14 md:w-14" />
            </a>
            {!minimal && (authDestination === "loading" ? <Button size="sm" variant="outline" disabled className={`pointer-events-auto absolute left-0 h-9 px-2 transition-all duration-200 motion-reduce:transition-none md:px-3 ${compact ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`} tabIndex={-1} aria-hidden={!compact}>Checking…</Button> : authDestination === "signed-out" ? <Button asChild size="sm" variant="outline" className={`pointer-events-auto absolute left-0 h-9 px-2 transition-all duration-200 motion-reduce:transition-none md:px-3 ${compact ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`} tabIndex={compact ? 0 : -1} aria-hidden={!compact}><a href="/auth?mode=signup">Register</a></Button> : <Button asChild size="sm" variant="outline" className={`pointer-events-auto absolute left-0 h-9 px-2 transition-all duration-200 motion-reduce:transition-none md:px-3 ${compact ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`} tabIndex={compact ? 0 : -1} aria-hidden={!compact}><Link to={dashboardHref}>{authDestination === "admin" ? "Admin" : "Dashboard"}</Link></Button>)}
          </div>
          <h1 className="text-[length:calc(40px*(1-var(--header-progress)*0.2))] font-black leading-none text-primary md:text-[length:calc(128px*(1-var(--header-progress)*0.62))]">NGABO</h1>
          {!minimal && (authDestination === "loading" ? <Button size="sm" disabled className="pointer-events-auto h-9 justify-self-end">Checking session…</Button> : authDestination === "signed-out" ? <Button asChild size="sm" className="pointer-events-auto h-9 justify-self-end"><Link to="/auth">Login</Link></Button> : authDestination === "admin" ? <Button asChild size="sm" className="pointer-events-auto h-9 justify-self-end"><Link to="/admin">Admin</Link></Button> : <Button asChild size="sm" className="pointer-events-auto h-9 justify-self-end"><Link to={dashboardHref}>{authDestination === "member" ? "Dashboard" : "Status"}</Link></Button>)}
          <p className="col-start-2 mt-2 min-h-[1.2em] whitespace-nowrap text-[length:calc(12px*(1-var(--header-progress)*0.2))] font-extrabold uppercase md:text-[length:calc(48px*(1-var(--header-progress)*0.62))]"><Typewriter words={["(MMA) Net Work", "Ministries"]} /></p>
        </div>
      </div>
    </>
  );
}
