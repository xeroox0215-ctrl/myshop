import os
import logging
import asyncio
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

TOKEN = "9272871777:AAGp-nfdwn-92-WW7Yza0NPK-5ChUiWBUzk"
WEBAPP_URL = "https://xeroox0215-ctrl.github.io/myshop/"
ADMIN_ID = 1494459013

app = Flask(__name__)
app.config['SECRET_KEY'] = 'xero_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

application = Application.builder().token(TOKEN).updater(None).build()

# --- СОКЕТЫ ---
@socketio.on('join')
def on_join(data):
    join_room(str(data['ticket_id']))

@socketio.on('send_msg')
def handle_msg(data):
    emit('receive_msg', data, room=str(data['ticket_id']))
    if data['from'] != 'Админ':
        try:
            asyncio.run(application.bot.send_message(
                chat_id=ADMIN_ID, 
                text=f"💬 Сообщение от {data['user_name']} (Тикет #{data['ticket_id']}):\n{data['text']}"
            ))
        except Exception as e:
            print(f"Ошибка ТГ: {e}")

# --- БОТ (ИСПРАВЛЕНО НА INLINE) ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Используем Inline-кнопку вместо Reply-кнопки
    keyboard = [[InlineKeyboardButton("🛒 Открыть магазин", web_app=WebAppInfo(url=WEBAPP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"👋 Привет, {update.effective_user.first_name}!\n\nЖми на кнопку ниже.",
        reply_markup=reply_markup
    )

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
