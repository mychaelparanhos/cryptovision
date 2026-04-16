import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "What exactly is CryptoVision?",
    a: 'CryptoVision is a real-time analytics platform for crypto futures traders. We aggregate liquidation data, funding rates, open interest and order flow from Binance, Bybit and OKX into a single interface. Think of it as the dashboard you wish Coinglass and TradingView had a child together to build.',
  },
  {
    q: "What do I get on the free plan?",
    a: "The full aggregated liquidation heatmap, funding rates and open interest across all three exchanges and 200+ pairs. Data is delayed by 15 minutes. No credit card required, no trial expiration — it stays free.",
  },
  {
    q: "Which exchanges do you support?",
    a: "Binance, Bybit and OKX — the three exchanges that account for over 80% of crypto futures volume. We aggregate their data so you see cross-exchange patterns that are invisible when you look at one venue at a time.",
  },
  {
    q: "Is CryptoVision financial advice?",
    a: "No. CryptoVision is a data tool. We show you what is happening across exchanges — liquidation clusters, funding divergences, OI shifts. We do not tell you what to trade, when to trade, or how much to risk. We do not hold your funds, execute trades, or manage positions on your behalf.",
  },
  {
    q: "What are Rich Alerts?",
    a: 'Standard alerts tell you "price crossed X." Rich Alerts include a mini-chart snapshot, current open interest delta, funding rate, and recent liquidation activity for that pair — delivered to Telegram. You get the context to act without switching to five tabs first. Available on Signal Feed and above.',
  },
  {
    q: "Can I pay with crypto?",
    a: "Yes. We accept BTC, ETH and USDT payments on all paid plans. Select crypto at checkout and you will receive a payment address. Annual plans paid in crypto receive the same 2-months-free discount.",
  },
  {
    q: "Where does your data come from?",
    a: "Directly from the official APIs of Binance, Bybit and OKX. We do not scrape, we do not use third-party aggregators, and we do not interpolate. What you see is what the exchanges report, processed and unified in real time.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. All plans are month-to-month unless you choose annual billing. Cancel from your dashboard — no emails, no calls, no retention flows. Your access continues until the end of the billing period.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
          Frequently asked questions
        </h2>

        <Accordion className="mt-8">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-[var(--border)]">
              <AccordionTrigger className="text-left text-[var(--text-primary)] hover:text-[var(--accent-amber)] hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
