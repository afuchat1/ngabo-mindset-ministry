import { createFileRoute } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apostle Ngabo Alex | NGABO (MMA) Network & Ministries" },
      { name: "description", content: "Ministering, coaching and conferences empowering ministers, schools and businesses in Sweden and Uganda for the age of AI." },
      { property: "og:title", content: "Apostle Ngabo Alex | NGABO (MMA)" },
      { property: "og:description", content: "Empowering ministers and societies to embrace social media and AI. Conferences in Sweden and Uganda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-visible")),
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Placeholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`placeholder-img flex items-center justify-center text-sm font-semibold uppercase tracking-widest text-muted-foreground ${className}`}>
      {label}
    </div>
  );
}

function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return <section id={id} className={`px-6 py-24 md:px-20 md:py-32 ${className}`}>{children}</section>;
}

const clients = ["Students", "Teachers", "Organizations", "Ministers", "Businesses", "Churches"];
const services = [
  { t: "Counseling", d: "Personal guidance that helps your mindset advance." },
  { t: "Ministering & Teaching", d: "Imparting knowledge that edifies and transforms." },
  { t: "Business Coaching", d: "Skills of exchange for building and growing." },
  { t: "Investing in the AI Era", d: "Teaching communities how to invest right in these times." },
];

function Index() {
  useReveal();
  return (
    <main className="overflow-hidden bg-background font-sans text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-background/80 px-6 py-4 backdrop-blur md:px-20">
        <a href="#top" className="text-lg font-black text-primary">NGABO (MMA)</a>
        <div className="hidden gap-8 text-sm font-bold md:flex">
          <a href="#about" className="hover:text-primary">About</a>
          <a href="#conferences" className="hover:text-primary">Conferences</a>
          <a href="#clients" className="hover:text-primary">Clients</a>
          <a href="#contact" className="hover:text-primary">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <header id="top" className="grid min-h-screen md:grid-cols-[55%_45%]">
        <div className="relative flex flex-col justify-center px-6 pb-16 pt-28 md:px-20">
          <h1 className="animate-rise text-6xl font-black leading-[0.9] tracking-tight text-primary md:text-8xl lg:text-9xl">
            Ngabo<br />Alex
          </h1>
          <p className="animate-rise mt-8 max-w-md text-2xl font-extrabold leading-tight md:text-3xl" style={{ animationDelay: ".2s" }}>
            Advance Your Mindset — In the Age of AI
          </p>
          <p className="animate-rise mt-6 max-w-md leading-relaxed" style={{ animationDelay: ".35s" }}>
            <strong>Apostle. Coach. Teacher.</strong> Empowering ministers and encouraging societies to embrace social media in the advancing times of AI technology.
          </p>
          <a href="#contact" className="animate-rise mt-10 inline-flex w-fit items-center gap-3 rounded-full bg-primary px-8 py-4 font-bold text-primary-foreground transition-transform hover:scale-105" style={{ animationDelay: ".5s" }}>
            Book Apostle Ngabo <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#about" aria-label="Scroll down" className="absolute bottom-8 right-8 hidden animate-bob md:block">
            <ArrowDown className="h-10 w-10" strokeWidth={1} />
          </a>
        </div>
        <div className="relative min-h-[60vh] overflow-hidden">
          <Placeholder label="Portrait photo" className="animate-zoom absolute inset-0" />
        </div>
      </header>

      {/* About */}
      <Section id="about" className="grid items-center gap-16 md:grid-cols-2">
        <Placeholder label="About photo" className="reveal aspect-[4/5] rounded-3xl" />
        <div className="reveal">
          <p className="font-bold uppercase tracking-widest text-primary">About</p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">NGABO (MMA) Network & Ministries</h2>
          <p className="mt-6 text-lg leading-relaxed">
            We specialize in empowering ministers and encouraging societies, so that they may embrace their usage of social media in the advancing times of AI technology that we are confronting.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Since 2011, Apostle Ngabo Alex has been innovating training and coaching leadership skills — so that a person's knowledge may allow their character to develop, improve, invest right and prosper in these days of internet, social media, knowledge and AI evolution.
          </p>
          <div className="mt-10 flex gap-12">
            <div><p className="text-5xl font-black text-primary">2011</p><p className="text-sm font-bold">Serving since</p></div>
            <div><p className="text-5xl font-black text-primary">2</p><p className="text-sm font-bold">Countries</p></div>
          </div>
        </div>
      </Section>

      {/* Services */}
      <Section className="bg-primary text-primary-foreground">
        <h2 className="reveal max-w-3xl text-4xl font-black leading-tight md:text-6xl">Services that move your mindset forward</h2>
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-primary-foreground/20 md:grid-cols-2">
          {services.map((s, i) => (
            <div key={s.t} className="reveal bg-primary p-10 transition-colors hover:bg-primary-foreground/10" style={{ transitionDelay: `${i * 0.1}s` }}>
              <p className="text-sm font-bold opacity-70">0{i + 1}</p>
              <h3 className="mt-3 text-2xl font-extrabold">{s.t}</h3>
              <p className="mt-3 opacity-90">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Conferences */}
      <Section id="conferences">
        <div className="reveal max-w-3xl">
          <p className="font-bold uppercase tracking-widest text-primary">Conferences</p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Transforming schools into their visualized dreams</h2>
          <p className="mt-6 text-lg">Holding conferences that transform schools in Sweden and Uganda.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {["Sweden", "Uganda"].map((c) => (
            <div key={c} className="reveal group relative overflow-hidden rounded-3xl">
              <Placeholder label={`Conference — ${c}`} className="aspect-[4/3] transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute bottom-6 left-6 rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">{c}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Clients */}
      <Section id="clients" className="bg-muted">
        <div className="reveal max-w-3xl">
          <p className="font-bold uppercase tracking-widest text-primary">Our Clients</p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Edified, skilled & certified</h2>
          <p className="mt-6 text-lg">Our clients are edified, learning skills, acquiring knowledge and getting certificated.</p>
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          {clients.map((c, i) => (
            <span key={c} className="reveal rounded-full border-2 border-foreground px-6 py-3 text-lg font-bold transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground" style={{ transitionDelay: `${i * 0.08}s` }}>
              {c}
            </span>
          ))}
        </div>
        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((n) => <Placeholder key={n} label={`Photo ${n}`} className="reveal aspect-square rounded-2xl" />)}
        </div>
      </Section>

      {/* Contact */}
      <Section id="contact" className="text-center">
        <h2 className="reveal text-5xl font-black leading-[0.95] text-primary md:text-8xl">Let's advance<br />together</h2>
        <p className="reveal mx-auto mt-8 max-w-xl text-lg">Book Apostle Ngabo Alex for counseling, ministering, teaching, coaching or your next conference.</p>
        <a href="mailto:info@example.com" className="reveal mt-10 inline-flex items-center gap-3 rounded-full bg-primary px-10 py-5 text-lg font-bold text-primary-foreground transition-transform hover:scale-105">
          Get in touch <ArrowRight className="h-5 w-5" />
        </a>
      </Section>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} NGABO (MMA) Network & Ministries
      </footer>
    </main>
  );
}
