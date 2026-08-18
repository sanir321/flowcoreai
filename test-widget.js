async function run() {
  const payload = {
    workspace_id: "eb8e551d-cde7-46c3-bafe-817afaeabedd",
    session_token: "d9b2d63d-a233-4123-8478-0df713c7432e",
    message: "hi what is flowcore?",
    customer_name: "Test User"
  };

  const res = await fetch("https://7flowcore.vercel.app/api/widget/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-widget-token": "d9b2d63d-a233-4123-8478-0df713c7432e"
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
run();
