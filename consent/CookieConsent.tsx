import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ConsentStatus = "pending" | "accepted" | "declined";

export function getCookieConsent(): ConsentStatus {
  const stored = localStorage.getItem("cookie_consent");
  if (stored === "accepted" || stored === "declined") return stored;
  return "pending";
}

export function getVisitorId(): string | null {
  if (getCookieConsent() !== "accepted") return null;
  let id = localStorage.getItem("visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("visitor_id", id);
  }
  return id;
}

export default function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>("pending");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const current = getCookieConsent();
    setStatus(current);
    if (current === "pending") {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    const id = crypto.randomUUID();
    localStorage.setItem("visitor_id", id);
    setStatus("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    localStorage.removeItem("visitor_id");
    setStatus("declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && status === "pending" && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4"
          data-testid="cookie-consent-banner"
        >
          <div className="max-w-4xl mx-auto bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  We use cookies to understand how visitors interact with our site. 
                  This helps us improve your experience. No personal data is shared with third parties.
                  You can opt out at any time.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleDecline}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-white/10 rounded-lg transition-colors"
                  data-testid="cookie-decline-btn"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all"
                  data-testid="cookie-accept-btn"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
