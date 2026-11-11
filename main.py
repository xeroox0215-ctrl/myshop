import os
import logging
import asyncio
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room
from telegram import Update, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

TOKEN = "9272871777:AAGp-nfdwn-92-WW7Yza0NPK-5ChUiWBUzk"
WEBAPP_URL = "https://xeroox0215-ctrl.github.io/myshop/"
ADMIN_ID = 1494459013

app = Flask(__name__)
app.config['SECRET_KEY'] = 'xero_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

application = Application.builder().token(TOKEN).updater(None).build()

# --- СОКЕТЫ (ЧАТ В РЕАЛЬНОМ ВРЕМЕНИ) ---
@socketio.on('join')
def on_join(data):
    ticket_id = data['ticket_id']
    join_room(str(ticket_id))
    print(f"Клиент подключился к тикету {ticket_id}")

@socketio.on('send_msg')
def handle_msg(data):
    ticket_id = data['ticket_id']
    text = data['text']
    from_user = data['from']
    user_name = data['user_name']
    
    # Пересылаем всем в комнате
    emit('receive_msg', {'text': text, 'from': from_user, 'user_name': user_name}, room=str(ticket_id))
    
    # Если пишет юзер, уведомляем админа в ТГ
    if from_user != 'Админ':
        try:
            asyncio.run(application.bot.send_message(
                chat_id=ADMIN_ID, 
                text=f"💬 Новое сообщение в тикете #{ticket_id} от {user_name}:\n{text}"
            ))
        except Exception as e:
            print(f"Ошибка отправки в ТГ: {e}")

# --- БОТ ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[KeyboardButton("🛒 Открыть магазин", web_app=WebAppInfo(url=WEBAPP_URL))]]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, is_persistent=True)
    await update.message.reply_text(f"Привет, {update.effective_user.first_name}! Жми кнопку.", reply_markup=reply_markup)

application.add_handler(CommandHandler("start", start))

@app.route('/')
def health():
    return "Bot is running!", 200

@app.route(f'/{TOKEN}', methods=['POST'])
def webhook():
    if request.method == "POST":
        update = Update.de_json(data=request.get_json(force=True), bot=application.bot)
        asyncio.run(application.process_update(update))
        return "ok", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    socketio.run(app, host="0.0.0.0", port=port)
