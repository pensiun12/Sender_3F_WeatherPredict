document.addEventListener("DOMContentLoaded", () => {  
  // Toggle hamburger menu
  const topNav = document.querySelector('.top-menu');
  const hamburger = document.querySelector('#hamburger-menu');

  hamburger?.addEventListener("click", () => {
    topNav.classList.toggle('active');
  });

  document.addEventListener('click', function (e) {
    if (!hamburger?.contains(e.target) && !topNav?.contains(e.target)) {
      topNav.classList.remove('active');
    }
  });

  /* CHATBOT PAGE */
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatContainer = document.getElementById("chatContainer");

  sendBtn?.addEventListener("click", sendMessage);
  userInput?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // optional: mencegah line break
      sendMessage();
    }
  });

  function addChatMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = sender === "user" ? "chat-msg user" : "chat-msg bot";
    msgDiv.textContent = text;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addChatMessage("user", message);
    userInput.value = "";

    fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    })
      .then((res) => res.json())
      .then((data) => {
        addChatMessage("bot", data.reply);
      })
      .catch((err) => {
        console.error("Error:", err);
        addChatMessage("bot", "Terjadi kesalahan. Silakan coba lagi nanti.");
      });
  }
});