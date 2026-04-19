import CourseLayout from "@/components/course/CourseLayout";
import PricingPlaybook from "@/pages/PricingPlaybook";

export default function CoursePricing() {
  return (
    <CourseLayout
      step="pricing"
      title="1. Pricing"
      intro="Lock in your value metric, model, tiers, and price points. Strong pricing is the single biggest lever on revenue — get this right before forecasting."
    >
      {/* Reuse the existing playbook UI; it persists to its own localStorage key */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden -mx-3 sm:mx-0">
        <div className="[&_nav]:hidden">
          <PricingPlaybook />
        </div>
      </div>
    </CourseLayout>
  );
}
