import React, { useState } from 'react';

const BACKEND_CHATBOT_URL = "/api/chatbot";

const initialPrompt = `
You are Bharosa, a friendly chatbot for TrustedHands (https://trusted-hands.vercel.app), a trusted marketplace for freelance and gig services. 
Your job is to help users understand every feature and section of the website, including:
- Customer, Tasker, and Admin roles
- Service categories (Electrician, Plumber, Carpenter, AC Servicing, RO Servicing, Home Cleaning, Car Washing, Assignment Writing)
- Safety & Trust features (background verification, secure payments, rating/review system, 24/7 support, service quality guarantee)
- AMC Services (Annual Maintenance Contracts for businesses and societies)
- How to use the chat, booking, and payment features
- How to sign up, login, and switch roles
- Contact info: Punjab Engineering College, Sector-12, Chandigarh; support@trustedhands.com; +1 (555) 123-4567
Always answer in a helpful, clear, and friendly way. If asked about TrustedHands, explain its features in detail.
`;

export default function BharosaChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "user", parts: [{ text: initialPrompt }] }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    setLoading(true);
    const newMessages = [...messages, { role: "user", parts: [{ text }] }];
    setMessages(newMessages);

    try {
      const res = await fetch(BACKEND_CHATBOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: newMessages })
      });
      if (!res.ok) {
        let errorMsg = "Sorry, Bharosa couldn't connect to the backend chatbot API (" + res.status + "). Please check your backend deployment.";
        setMessages([...newMessages, { role: "model", parts: [{ text: errorMsg }] }]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response.";
      setMessages([...newMessages, { role: "model", parts: [{ text: reply }] }]);
    } catch (err) {
      setMessages([...newMessages, { role: "model", parts: [{ text: "Sorry, Bharosa couldn't connect. Please check your internet connection and API key." }] }]);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        style={{
          position: "fixed", bottom: 32, right: 32, zIndex: 9999,
          background: "#f97316", color: "#fff", borderRadius: "50%", width: 64, height: 64, fontSize: 32, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
        }}
        onClick={() => setOpen(!open)}
        aria-label="Open Bharosa Chatbot"
      >
        💬
      </button>
      {open && (
        <div style={{
          position: "fixed", bottom: 110, right: 32, zIndex: 9999,
          width: 350, maxHeight: 500, background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: 16, borderBottom: "1px solid #eee", background: "#f97316", color: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <strong>Bharosa Chatbot</strong>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {messages.slice(1).map((msg, i) => (
              <div key={i} style={{ marginBottom: 12, textAlign: msg.role === "user" ? "right" : "left" }}>
                <div style={{
                  display: "inline-block", background: msg.role === "user" ? "#f97316" : "#eee",
                  color: msg.role === "user" ? "#fff" : "#333", borderRadius: 8, padding: "8px 12px", maxWidth: "80%"
                }}>
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {loading && <div style={{ textAlign: "center", color: "#f97316" }}>Bharosa is typing...</div>}
          </div>
          <form
            style={{ display: "flex", borderTop: "1px solid #eee", padding: 8 }}
            onSubmit={e => { e.preventDefault(); if (input.trim()) { sendMessage(input); setInput(""); } }}
          >
            <input
              style={{ flex: 1, border: "none", outline: "none", padding: 8, fontSize: 16, borderRadius: 8, background: "#f9f9f9" }}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Bharosa anything..."
              disabled={loading}
            />
            <button type="submit" style={{ marginLeft: 8, background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600 }} disabled={loading}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
