exports.handler = async function(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      },
      body: ""
    };
  }

  const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      gemini_configured: hasKey,
      model: model,
      available_models: ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash", "gemini-3.8-pro"],
      engine_type: hasKey ? "ai_native" : "hybrid_fallback"
    })
  };
};
