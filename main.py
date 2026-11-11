import os
import logging
import asyncio
from flask import Flask, request, jsonify
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

# Глобальное хранилище на сервере
active_tickets = {}
active_orders = []

# --- СОКЕТЫ ---
@socketio.on('join')
def on_join(data):
    ticket_id = str(data['ticket_id'])
    join_room(ticket_id)
    if ticket_id in active_tickets:
        emit('ticket_history', active_tickets[ticket_id]['messages'], room=request.sid)

@socketio.on('join_admin')
def on_join_admin():
    join_room('admins')
    emit('all_orders', active_orders) # Отправляем все заказы при подключении

@socketio.on('send_ticket_msg')
def handle_ticket_msg(data):
    ticket_id = str(data['ticket_id'])
    msg_obj = {'from': data['from'], 'text': data['text'], 'user_name': data['user_name']}

    if ticket_id not in active_tickets:
        active_tickets[ticket_id] = { "user_name": data['user_name'], "user_id": data.get('user_id'), "messages": [] }
    
    active_tickets[ticket_id]['messages'].append(msg_obj)
    emit('receive_ticket_msg', msg_obj, room=ticket_id)
    
    if str(data.get('user_id')) != str(ADMIN_ID):
        try:
            asyncio.run(application.bot.send_message(
                chat_id=ADMIN_ID, 
                text=f"💬 Тикет #{ticket_id[-4:]} от {data['user_name']}:\n{data['text']}"
            ))
        except Exception as e:
            print(f"Ошибка ТГ: {e}")

@socketio.on('new_order')
def handle_new_order(data):
    global active_orders
    active_orders.append(data)
    
    # Рассылаем админам
    emit('receive_order', data, room='admins')
    
    try:
        asyncio.run(application.bot.send_message(
            chat_id=ADMIN_ID, 
            text=f"🛒 Новый заказ от {data['userName']}\nТовар: {data['item']}\nКод: {data['txCode']}"
        ))
    except Exception as e:
        print(f"Ошибка ТГ: {e}")

@app.route('/get_tickets', methods=['GET'])
def get_tickets():
    return jsonify(active_tickets)

@app.route('/get_orders', methods=['GET'])
def get_orders():
    return jsonify(active_orders)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("🛒 Открыть магазин", web_app=WebAppInfo(url=WEBAPP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(f"Привет! Жми кнопку.", reply_markup=reply_markup)

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
