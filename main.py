import os
import logging
from flask import Flask, request, render_template_string
from flask_socketio import SocketIO, emit
from telegram import Update, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

TOKEN = "9272871777:AAGp-nfdwn-92-WW7Yza0NPK-5ChUiWBUzk"
WEBAPP_URL = "https://xeroox0215-ctrl.github.io/myshop/"
ADMIN_ID = 1494459013  # Твой ID

app = Flask(__name__)
app.config['SECRET_KEY'] = 'xero_secret!'
socketio = SocketIO(app, cors_allowed_origins="*") # Разрешаем подключения с сайта

application = Application.builder().token(TOKEN).updater(None).build()

# --- Сокеты (Реальное время) ---
@socketio.on('connect')
def handle_connect():
    print('Клиент подключился к сокету')

@socketio.on('send_message')
def handle_message(data):
    # data = { ticket_id: 123, text: 'Привет', from: 'Пользователь' }
    # Пересылаем сообщение всем, кто в этом тикете
    socketio.emit('receive_message', data, room=f"ticket_{data['ticket_id']}")
    
    # Если пишет юзер, отправляем уведомление тебе в ТГ
    if data['from'] != 'Админ':
        try:
            import asyncio
            asyncio.run(application.bot.send_message(
                chat_id=ADMIN_ID, 
                text=f"💬 Новое сообщение в тикете #{data['ticket_id']} от {data['user_name']}:\n{data['text']}"
            ))
        except Exception as e:
            print(f"Ошибка отправки в ТГ: {e}")

@socketio.on('join_ticket')
def join_ticket(data):
    from flask_socketio import join_room
    room = f"ticket_{data['ticket_id']}"
    join_room(room)
    print(f"Клиент зашел в комнату {room}")

# --- Telegram Бот ---
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
        import asyncio
        update = Update.de_json(data=request.get_json(force=True), bot=application.bot)
        asyncio.run(application.process_update(update))
        return "ok", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    socketio.run(app, host="0.0.0.0", port=port)
