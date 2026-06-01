<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Проверка фактов</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @else
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.7.9/dist/axios.min.js"></script>
        <script src="{{ asset('js/chat-fallback.js') }}" defer></script>
    @endif
</head>
<body class="h-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
    <div class="flex h-full flex-col py-3 px-4 sm:px-6">
        <div
            id="fact-check-chat"
            class="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40"
            data-check-url="{{ url('/check') }}"
        >
            <header class="shrink-0 border-b border-slate-800 px-5 py-4">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-base font-semibold text-white">Агент проверки фактов</h1>
                        <p class="text-sm text-slate-400">Введите утверждение — разберём и проверим по источникам</p>
                    </div>
                </div>
            </header>

            <div
                id="chat-messages"
                class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-5"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
            >
                <div class="flex flex-1 items-center justify-center px-4 text-center" data-welcome>
                    <p class="max-w-md text-sm text-slate-400">
                        ИИ-помощник для проверки достоверности фактов
                    </p>
                </div>
            </div>

            <form id="chat-form" class="shrink-0 border-t border-slate-800 p-4 sm:p-5">
                <div class="flex items-end gap-2 sm:gap-3">
                    <label for="chat-input" class="sr-only">Утверждение для проверки</label>
                    <textarea
                        id="chat-input"
                        name="fact"
                        rows="2"
                        placeholder="Введите утверждение для проверки…"
                        class="min-h-[52px] max-h-32 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
                        required
                        oninvalid="this.setCustomValidity('Введите интересующий факт')"
                        oninput="this.setCustomValidity('')"
                    ></textarea>
                    <button
                        type="submit"
                        id="chat-submit"
                        class="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Отправить"
                    >
                        <svg id="send-icon" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        <svg id="loading-icon" class="hidden h-5 w-5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
