// The Moneta brand mark: the goose logo with "Moneta" set in the brand font
// (Zalando Sans, regular weight, -4% letter spacing). For brand moments only, like the chat
// header or a landing page; nav labels and UI text stay in Inter.
import goose from "../assets/goose-glasses-circle.svg";

const sizes = {
  sm: { logo: "size-6", text: "text-[19px] leading-6" },
  md: { logo: "size-8", text: "text-[26px] leading-8" },
  lg: { logo: "size-12", text: "text-[40px] leading-[48px]" },
};

export function Wordmark({ size = "sm", label = "Moneta" }: { size?: keyof typeof sizes; label?: string }) {
  const s = sizes[size];
  return (
    <span className="inline-flex items-center gap-2">
      {/* The circle goose (assets/goose-glasses-circle.svg), like the nav tab */}
      <img src={goose} alt="" className={`shrink-0 ${s.logo}`} />
      <span className={`font-brand font-normal tracking-brand text-fg [font-optical-sizing:auto] ${s.text}`}>{label}</span>
    </span>
  );
}
