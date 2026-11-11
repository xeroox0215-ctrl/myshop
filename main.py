import logging
import asyncio
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

TOKEN = "9272871777:AAGp-nfdwn-92-WW7Yza0NPK-5ChUiWBUzk"
WEBAPP_URL = "https://xeroox0215-ctrl.github.io/myshop/"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Убираем старую Reply-клавиатуру
    await update.message.reply_text("Загрузка...", reply_markup=ReplyKeyboardRemove())
    
    # Отправляем Inline-кнопку
    keyboard = [[InlineKeyboardButton("🛒 Открыть магазин", web_app=WebAppInfo(url=WEBAPP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"👋 Привет, {update.effective_user.first_name}!\n\nЖми на кнопку под этим сообщением.",
        reply_markup=reply_markup
    )

def main():
    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    
    # Удаляем вебхук перед запуском
    asyncio.run(application.bot.delete_webhook(drop_pending_updates=True))
    
    logging.info("Бот запущен через Polling")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
