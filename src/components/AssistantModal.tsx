import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useModal } from "@/contexts/ModalContext";
import { MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "4915253415522";
const BASE_MESSAGE =
  "Merhaba Mon Amie Chicken! Siparişim hakkında bilgi almak istiyorum.";
const MODAL_WIDTH = 340;
const MODAL_ESTIMATED_HEIGHT = 380;
const EDGE_PADDING = 12;

const ArrowIcon = () => (
  <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
    <path
      d="M1 1L13 5.5L1 10L3.6 5.5L1 1Z"
      fill="#6F6F6F"
      stroke="#6F6F6F"
      strokeLinejoin="round"
    />
  </svg>
);

const AssistantModal: React.FC = () => {
  const { isAssistantModalOpen, assistantAnchor, closeAssistantModal } =
    useModal();
  const [message, setMessage] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAssistantModalOpen) {
      setMessage("");
    }
  }, [isAssistantModalOpen]);

  useEffect(() => {
    if (!isAssistantModalOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        closeAssistantModal();
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAssistantModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [closeAssistantModal, isAssistantModalOpen]);

  const position = useMemo(() => {
    if (typeof window === "undefined" || !assistantAnchor) {
      return { top: 0, left: 0 };
    }

    let top = assistantAnchor.bottom + EDGE_PADDING;
    let left = assistantAnchor.left;

    if (top + MODAL_ESTIMATED_HEIGHT > window.innerHeight - EDGE_PADDING) {
      top = assistantAnchor.top - MODAL_ESTIMATED_HEIGHT - EDGE_PADDING;
    }

    if (left + MODAL_WIDTH > window.innerWidth - EDGE_PADDING) {
      left = window.innerWidth - MODAL_WIDTH - EDGE_PADDING;
    }

    if (left < EDGE_PADDING) {
      left = EDGE_PADDING;
    }

    if (top < EDGE_PADDING) {
      top = EDGE_PADDING;
    }

    return { top, left };
  }, [assistantAnchor]);

  if (
    typeof document === "undefined" ||
    !isAssistantModalOpen ||
    !assistantAnchor
  ) {
    return null;
  }

  const handleSubmit = () => {
    const finalMessage = (message.trim() || BASE_MESSAGE).slice(0, 512);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      finalMessage
    )}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    closeAssistantModal();
  };

  const handleMessageKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const content = (
    <div
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: MODAL_WIDTH,
        zIndex: 200,
      }}
    >
      <div
        ref={cardRef}
        className="rounded-3xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] border border-[#E6EBF0] overflow-hidden animate-in fade-in duration-200"
      >
        <div className="flex items-center justify-between bg-[#25D366] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-heading text-base font-semibold">WhatsApp</p>
              <p className="text-sm text-white/80">Mon Amie Chicken</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAssistantModal}
            className="rounded-full p-1.5 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#25D366]"
            aria-label="Pencereyi kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 bg-[#F5F7F9]">
          <div className="relative inline-block">
            <div className="rounded-3xl rounded-bl-lg bg-white p-5 mt-6 mx-5 text-sm leading-relaxed text-muted-foreground shadow-[0_12px_24px_rgba(0,0,0,0.05)]">
              <p className="font-medium text-foreground">Hallo! 👋</p>
              <p className="mt-2">
                Schön, dass Sie uns über WhatsApp kontaktieren.
              </p>
              <p className="mt-2">Wie können wir Ihnen helfen?</p>
            </div>
            <span className="absolute -bottom-3 left-6 h-5 w-5 rotate-45 rounded-br-sm bg-white shadow-sm" />
          </div>

          <div className="rounded-2xl border border-[#E0E5EA] bg-white p-3">
            <div className="flex items-center gap-2 rounded-full border border-[#E4E8EC] bg-[#F9F9F9] px-4 py-2 shadow-inner">
              <input
                id="assistant-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                placeholder="Type a message.."
                className={cn(
                  "w-full bg-transparent text-sm text-[#747577] outline-none",
                  "placeholder:text-[#B0B1B2]"
                )}
              />
              <button
                type="button"
                onClick={handleSubmit}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E1E1E1]"
                aria-label="Mesajı gönder"
              >
                <ArrowIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default AssistantModal;
