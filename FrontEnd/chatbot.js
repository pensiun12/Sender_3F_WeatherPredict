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

  // CHATBOT PAGE
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatContainer = document.getElementById("chatContainer");
  const introMessage = document.getElementById("introMessage");

  let introHidden = false; // status intro

  // Tambah pesan ke UI
  function addChatMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("chat-bubble", sender); // pakai class 'chat-bubble user/bot'
    msgDiv.textContent = text;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Sembunyikan introMessage jika belum
  function hideIntroMessage() {
    if (!introHidden && introMessage) {
      introMessage.classList.add("hidden");
      introHidden = true;
    }
  }

  // Kirim pesan user ke server
  function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    hideIntroMessage(); // sembunyikan intro
    addChatMessage("user", message);
    userInput.value = "";

    fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  // Kirim greeting awal
  function sendInitialGreeting() {
    fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "__greeting__" })
    })
    .then(res => res.json())
    .then(data => {
      addChatMessage("bot", data.reply);
    })
    .catch((err) => {
      console.error("Error greeting:", err);
      addChatMessage("bot", "Gagal memuat cuaca awal.");
    });
  }

  // Event listener tombol & enter
  sendBtn?.addEventListener("click", sendMessage);
  userInput?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  sendInitialGreeting();
});
