import { useState } from "react";
import { Button } from "@/components/ui/button";

export function WhatsAppContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-4 z-50 flex flex-col items-start gap-3 md:left-6">
      <div
        id="whatsapp-contact-link"
        aria-hidden={!open}
        className={`transition-all duration-300 ease-out motion-reduce:transition-none ${open ? "translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-4 opacity-0"}`}
      >
        <Button asChild className="h-11 bg-whatsapp px-4 font-bold text-whatsapp-foreground shadow-lg hover:bg-whatsapp/90">
          <a href="https://wa.me/447405314342" target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
            Contact AP Ngabo
          </a>
        </Button>
      </div>
      <Button
        type="button"
        size="icon"
        aria-label={open ? "Close WhatsApp contact" : "Open WhatsApp contact"}
        aria-expanded={open}
        aria-controls="whatsapp-contact-link"
        title="WhatsApp"
        onClick={() => setOpen(value => !value)}
        className="h-14 w-14 rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg hover:bg-whatsapp/90 [&_svg]:size-7"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.1.55 4.16 1.6 5.97L0 24l6.24-1.64a11.94 11.94 0 0 0 5.81 1.48h.01c6.58 0 11.94-5.36 11.94-11.95a11.87 11.87 0 0 0-3.48-8.41ZM12.06 21.82a9.91 9.91 0 0 1-5.05-1.38l-.36-.21-3.7.97.99-3.61-.24-.37a9.9 9.9 0 0 1-1.52-5.27c0-5.48 4.46-9.94 9.94-9.94a9.88 9.88 0 0 1 7.03 2.91 9.88 9.88 0 0 1 2.91 7.03c0 5.48-4.46 9.87-10 9.87Zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.08 4.5.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
        </svg>
      </Button>
    </div>
  );
}