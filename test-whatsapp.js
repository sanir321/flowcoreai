async function run() {
  const messages = [
    "What are your working hours?",
    "I am having an issue with my recent payment, can I talk to a human?",
    "What services does flowcore offer?"
  ];

  for (const msg of messages) {
    const payload = {
      workspace_id: "eb8e551d-cde7-46c3-bafe-817afaeabedd",
      customer_jid: "1234567890@s.whatsapp.net",
      customer_name: "Test WA User",
      message: msg,
      channel: "whatsapp",
      agent_type: "customer_support",
      is_test: true
    };

    const res = await fetch("https://bnpdrelienfnlkceluip.supabase.co/functions/v1/agent-orchestrator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucGRyZWxpZW5mbmxrY2VsdWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg1ODI0MiwiZXhwIjoyMDkyNDM0MjQyfQ.OURQfh3fe0ZFpHzKfis3ym6-v0Ug2qbwBdIEalJr6CU"
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log(`\n--- Message: "${msg}" ---`);
    console.log("Status:", res.status);
    console.log("Response:", text);
  }
}
run();
