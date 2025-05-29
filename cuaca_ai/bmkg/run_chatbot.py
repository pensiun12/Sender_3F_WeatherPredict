from chatbot_response import chatbot_response, initial_greeting_with_weather

# Tampilkan ringkasan cuaca saat chatbot pertama kali dijalankan
print("Bot:", initial_greeting_with_weather())

while True:
    msg = input("Kamu: ")
    res = chatbot_response(msg)
    print("Bot:", res)
