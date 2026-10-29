import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import heroImage from "@/assets/apostle-ngabo-hero.jpg.asset.json";
import aboutImage from "@/assets/about.jpg.asset.json";
import swedenImage from "@/assets/Sweden.jpg.asset.json";
import ugandaImage from "@/assets/Uganda.jpg.asset.json";
import clientImageOne from "@/assets/IMG-20261028-WA0002.jpg.asset.json";
import clientImageTwo from "@/assets/IMG-20261028-WA0003.jpg.asset.json";
import clientImageThree from "@/assets/IMG-20261029-WA0000.jpg.asset.json";
import clientImageFour from "@/assets/IMG-20261029-WA0006.jpg.asset.json";

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
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

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

function ShrinkTitle() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => { raf = 0; setP(Math.min(window.scrollY / 300, 1)); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      {/* spacers keep the layout where the big title sits */}
      <div aria-hidden className="text-7xl font-black leading-none md:text-9xl"><span className="invisible">NGABO</span></div>
      <div aria-hidden className="mt-2 min-h-[1.2em] text-2xl font-extrabold uppercase md:text-5xl"><span className="invisible">(MMA) NET WORK</span></div>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
        <div className="absolute inset-x-0 top-0 h-20 bg-background/90 shadow-sm backdrop-blur" style={{ opacity: p }} />
        <div className="animate-rise relative mt-16" style={{ animationDelay: ".2s" }}>
          <div
            className="relative origin-top"
            style={{ transform: `translateY(${-p * 64}px) scale(${1 - p * 0.62})` }}
          >
            <h1 className="text-7xl font-black leading-none tracking-tight text-primary md:text-9xl">NGABO</h1>
            <p className="mt-2 min-h-[1.2em] text-2xl font-extrabold uppercase md:text-5xl"><Typewriter words={["(MMA) Net Work", "Ministries"]} /></p>
          </div>
        </div>
      </div>
    </>
  );
}

function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
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
  { t: "Business Coaching", d: "Equipping, building and growing the cultural skills of exchange, accountability, responsibility and marketing." },
  { t: "Investing in the AI Era", d: "Teaching communities how to invest right in these times of social media, AI and take knowledge generation." },
  { t: "Networking & Shareholding", d: "Bringing together and uniting the collective and cooperative energies, investments and resources of our community, society etc." },
];

function Index() {
  useReveal();
  return (
    <main className="overflow-hidden bg-background font-sans text-foreground">

      {/* Hero */}
      <header id="top" className="flex min-h-screen flex-col items-center px-6 pb-16 pt-16 text-center md:px-20">
        <ShrinkTitle />
        <div className="animate-zoom relative mt-10 aspect-[3/4] w-full max-w-2xl overflow-hidden rounded-t-[50%] rounded-b-3xl" style={{ animationDelay: ".35s" }}>
          <img
            src={heroImage.url}
            alt="Apostle Ngabo Alex"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        </div>
        <p className="animate-rise mt-10 max-w-xl leading-relaxed" style={{ animationDelay: ".5s" }}>
          <strong>Apostle. Coach. Teacher.</strong> Empowering ministers and encouraging societies to embrace social media in the advancing times of AI technology.
        </p>
        <a href="#contact" className="animate-rise mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-bold text-primary-foreground transition-transform hover:scale-105" style={{ animationDelay: ".6s" }}>
          Book Apostle Ngabo <ArrowRight className="h-4 w-4" />
        </a>
        <a href="#about" aria-label="Scroll down" className="mt-10 animate-bob"><ArrowDown className="h-10 w-10" strokeWidth={1} /></a>
      </header>

      {/* About */}
      <Section id="about" className="grid items-center gap-16 md:grid-cols-2">
        <Photo src={aboutImage.url} alt="Apostle Ngabo Alex with young people" className="reveal aspect-[4/5] rounded-3xl" />
        <div className="reveal">
          <p className="font-bold uppercase tracking-widest text-primary">About</p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">NGABO (MMA) Network & Ministries</h2>
          <p className="mt-6 text-lg leading-relaxed">
            We specialize in empowering ministers and encouraging societies, so that they may embrace their usage of social media in the advancing times of AI technology that we are confronting.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Since 2011, Apostle Ngabo Alex has been innovating training and coaching leadership skills, so that a person's knowledge may allow their character to develop, improve, invest right and prosper in these days of internet, social media, knowledge and AI evolution.
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
          {[{ name: "Sweden", image: swedenImage }, { name: "Uganda", image: ugandaImage }].map(({ name: c, image }) => (
            <div key={c} className="reveal group relative overflow-hidden rounded-3xl">
              <Photo src={image.url} alt={`Apostle Ngabo teaching in ${c}`} className="aspect-[4/3] transition-transform duration-700 group-hover:scale-105" />
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
          {[
            { image: clientImageOne, alt: "Apostle Ngabo with a group around a laptop" },
            { image: clientImageTwo, alt: "Apostle Ngabo interviewing community members" },
            { image: clientImageThree, alt: "Apostle Ngabo visiting a community venue" },
            { image: clientImageFour, alt: "Apostle Ngabo in a group discussion" },
          ].map(({ image, alt }) => <Photo key={image.asset_id} src={image.url} alt={alt} className="reveal aspect-square rounded-2xl" />)}
        </div>
      </Section>

      {/* Contact */}
      <Section id="contact" className="text-center">
        <h2 className="reveal text-5xl font-black leading-[0.95] text-primary md:text-8xl">Let's advance<br />together</h2>
        <p className="reveal mx-auto mt-8 max-w-xl text-lg">Book Apostle Ngabo Alex for counseling, ministering, teaching, coaching or your next conference.</p>
        <a href="mailto:apostlengabo@gmail.com" className="reveal mt-10 inline-flex items-center gap-3 rounded-full bg-primary px-10 py-5 text-lg font-bold text-primary-foreground transition-transform hover:scale-105">
          Get in touch <ArrowRight className="h-5 w-5" />
        </a>
      </Section>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        © 2011 to {new Date().getFullYear()} NGABO (MMA) Network & Ministries
      </footer>
    </main>
  );
}
