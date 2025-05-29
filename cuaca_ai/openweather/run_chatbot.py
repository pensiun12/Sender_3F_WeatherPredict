from chatbot_response import chatbot_response

print("ChatBot siap! (Ketik 'quit' untuk keluar)")
while True:
    user_input = input("Kamu: ")
    if user_input.lower() == "quit":
        break
    response = chatbot_response(user_input)
    print("Bot:", response)
