# friends-vk-bot &ndash; Бот ВКонтакте

### Бот умеет
- отправлять прогноз погоды (используя OpenWeatherMap API)
- рассказывать о том, какие сегодня праздники (данные берутся с сайта calend.ru)
- играть в игру "Угадай слово", показывая картинки из выдачи Google (работает с помощью Google Custom Search API)
- распознавать голосовые сообщения и переводить их в текст (работает с помощью Google Text-to-Speech API)
- следить за опросами в беседе и уведомлять участников, которые ещё не проголосовали

### Настройка локального окружения

Необходимо установить:
- NodeJS v10
- Heroku CLI
- VS Studio 2018+ с пакетом для разработки на C++
- PostgreSQL
- ngrok
- ```npm install --global --production windows-build-tools@4.0.0```

Запуск сервера локально: ```npm run watch dev```

Туннелирование для доступа ВК API к локальному серверу: ```ngrok http <PORT>```

Все используемые переменные окружения описаны в `.env.example`

Схема БД и пример данных в папке `migrations`. Запуск миграций: `npm run migrate up`

Получение токена пользователя для ВК API: `https://oauth.vk.com/authorize?client_id=<APP_ID>&redirect_uri=https://oauth.vk.com/blank.html&display=popup&scope=friends,wall,offline,video&response_type=token`
