import os
import logging
import asyncio
from flask import Flask, request
from telegram import Update, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

TOKEN = "9272871777:AAGp-nfdwn-92-WW7Yza0NPK-5ChUiWBUzk"
WEBAPP_URL = "https://xeroox0215-ctrl.github.io/myshop/"

app = Flask(__name__)

# Инициализация бота без updater (так как мы используем Webhook)
application = Application.builder().token(TOKEN).updater(None).build()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[KeyboardButton("🛒 Открыть магазин", web_app=WebAppInfo(url=WEBAPP_URL))]]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, is_persistent=True)
    
    text = (
        f"👋 Привет, *{update.effective_user.first_name}*!\n\n"
        "Добро пожаловать в *Xero Shop* — магазин цифровых товаров.\n\n"
        "👇 *Нажми на кнопку ниже*, чтобы открыть магазин."
    )
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")

application.add_handler(CommandHandler("start", start))

@app.route('/')
def health():
    return "Bot is running!", 200

@app.route(f'/{TOKEN}', methods=['POST'])
def webhook():
    """Обработка вебхука от Telegram (синхронно для Flask)"""
    if request.method == "POST":
        try:
            # Получаем данные от Telegram
            update_data = request.get_json(force=True)
            
            # Создаем объект Update
            update = Update.de_json(data=update_data, bot=application.bot)
            
            # Запускаем обработку в event loop
            asyncio.run(application.process_update(update))
            
            return "ok", 200
        except Exception as e:
            logging.error(f"Error processing update: {e}")
            return "error", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
