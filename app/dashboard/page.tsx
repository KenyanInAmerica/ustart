// Main dashboard page — placeholder layout for the 5 upcoming feature sections.
// Each block reserves space and labels exactly where the feature will be dropped in.
export default function DashboardPage() {
  return (
    <>
      {/* Feature 2: Greeting & User State */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px]">
        Overview
      </p>
      <div className="bg-[#0C1220] border border-dashed border-white/[0.12] rounded-[14px] p-12 text-center mb-4">
        <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/20 mb-2">
          Feature 2
        </p>
        <p className="text-[13px] text-white/20">
          Greeting &amp; user state — name, plan, time-aware welcome
        </p>
      </div>

      {/* Feature 3: Start Here */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Get Started
      </p>
      <div className="bg-[#0C1220] border border-dashed border-white/[0.12] rounded-[14px] p-12 text-center mb-4">
        <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/20 mb-2">
          Feature 3
        </p>
        <p className="text-[13px] text-white/20">
          Start Here — onboarding progress strip
        </p>
      </div>

      {/* Feature 4: Content Cards */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Your Content
      </p>
      <div className="bg-[#0C1220] border border-dashed border-white/[0.12] rounded-[14px] p-12 text-center mb-4">
        <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/20 mb-2">
          Feature 4
        </p>
        <p className="text-[13px] text-white/20">
          Content cards — Lite, Parent Pack, Explore, Concierge with access gating
        </p>
      </div>

      {/* Feature 5: Community */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Community
      </p>
      <div className="bg-[#0C1220] border border-dashed border-white/[0.12] rounded-[14px] p-12 text-center mb-4">
        <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/20 mb-2">
          Feature 5
        </p>
        <p className="text-[13px] text-white/20">
          Community gate — rules, checkbox, WhatsApp link reveal
        </p>
      </div>

      {/* Feature 6: Account Strip */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Account
      </p>
      <div className="bg-[#0C1220] border border-dashed border-white/[0.12] rounded-[14px] p-12 text-center mb-4">
        <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/20 mb-2">
          Feature 6
        </p>
        <p className="text-[13px] text-white/20">
          Account &amp; billing strip — links to Stripe customer portal
        </p>
      </div>
    </>
  );
}
