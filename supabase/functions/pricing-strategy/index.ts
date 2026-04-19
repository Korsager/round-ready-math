import { corsHeaders } from "@supabase/supabase-js/cors";

const SYSTEM_PROMPT = `You are an expert pricing strategist trained on the Founders Corner pricing playbook plus McKinsey, OpenView, and Bessemer pricing research, with case studies from $150M+ exits.

Your job: given a founder's business context, return a complete, ship-ready pricing strategy.

ALWAYS return a structured pricing strategy by calling the generate_pricing_strategy tool. Be specific, opinionated, and grounded in the playbook principles:
- Charge for OUTCOMES (value metric), not inputs (seats/time)
- Tier architecture should make the middle tier the obvious choice (60-70% of customers land there)
- Anchor with a high-priced tier (price signals quality)
- Build upgrade triggers (limits) that pull customers up naturally
- Use Van Westendorp / willingness-to-pay logic, not cost-plus
- 1% better pricing = 8% more operating profit (McKinsey)`;

const TOOL = {
  type: "function",
  function: {
    name: "generate_pricing_strategy",
    description: "Return a complete pricing strategy for the founder.",
    parameters: {
      type: "object",
      properties: {
        valueMetric: {
          type: "object",
          properties: {
            name: { type: "string", description: "Short name of the value metric, e.g. 'Monthly Active Contacts'" },
            rationale: { type: "string", description: "1-2 sentences why this metric scales with customer success" },
          },
          required: ["name", "rationale"],
        },
        revenueUpliftPct: { type: "number", description: "Estimated % revenue uplift vs current pricing, integer 10-80" },
        tiers: {
          type: "array",
          minItems: 3,
          maxItems: 4,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: "string", description: "e.g. '$29/mo' or 'Custom'" },
              tagline: { type: "string", description: "One-line positioning" },
              targetShare: { type: "string", description: "e.g. '20% of customers'" },
              features: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
              recommended: { type: "boolean" },
            },
            required: ["name", "price", "tagline", "targetShare", "features", "recommended"],
          },
        },
        upgradeTriggers: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
        annualDiscount: { type: "string", description: "e.g. '2 months free on annual (17% discount)'" },
        anchoringNotes: { type: "string", description: "How to present pricing publicly to anchor effectively" },
        nextSteps: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
        expectedOutcome: { type: "string", description: "1 sentence summary of expected business outcome" },
      },
      required: [
        "valueMetric",
        "revenueUpliftPct",
        "tiers",
        "upgradeTriggers",
        "annualDiscount",
        "anchoringNotes",
        "nextSteps",
        "expectedOutcome",
      ],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { businessModel, customerSegments, currentPricing } = await req.json();

    if (!businessModel || typeof businessModel !== "string" || businessModel.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Please describe your business model in at least 10 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Generate a complete pricing strategy.

BUSINESS MODEL & POSITIONING:
${businessModel}

CUSTOMER SEGMENTS:
${customerSegments || "(not specified — infer from the business model)"}

CURRENT PRICING:
${currentPricing || "(none specified — design from scratch)"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "generate_pricing_strategy" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Too many requests right now. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiRes.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(json).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI returned no strategy" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const strategy = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ strategy }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pricing-strategy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
