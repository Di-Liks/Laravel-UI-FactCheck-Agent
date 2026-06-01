(function () {
    const VERDICT_LABELS = {
        SUPPORTED: 'Подтверждено',
        REFUTED: 'Опровергнуто',
        PARTIALLY_SUPPORTED: 'Частично подтверждено',
        NOT_ENOUGH_INFO: 'Недостаточно данных',
        IRRELEVANT: 'Не по теме',
        CONFLICTING: 'Противоречивые данные',
    };

    const VERDICT_STYLES = {
        SUPPORTED: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
        REFUTED: 'bg-red-500/15 text-red-400 ring-red-500/30',
        PARTIALLY_SUPPORTED: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
        NOT_ENOUGH_INFO: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',
        IRRELEVANT: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',
        CONFLICTING: 'bg-orange-500/15 text-orange-400 ring-orange-500/30',
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text ?? '';
        return div.innerHTML;
    }

    function formatConfidence(value) {
        if (value == null) return '';
        return `${Math.round(value * 100)}%`;
    }

    function renderVerdictBadge(verdict) {
        const label = VERDICT_LABELS[verdict] ?? verdict;
        const style = VERDICT_STYLES[verdict] ?? VERDICT_STYLES.NOT_ENOUGH_INFO;
        return `<span class="inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}">${escapeHtml(label)}</span>`;
    }

    function renderList(items, emptyText = '—') {
        if (!items?.length) {
            return `<span class="text-slate-500">${emptyText}</span>`;
        }
        return `<ul class="list-inside list-disc space-y-0.5 text-slate-300">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    }

    function renderVerificatorCard(item) {
        return `
            <article class="rounded-lg border border-slate-700/80 bg-slate-800/50 p-3">
                <div class="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <p class="text-sm font-medium text-slate-200">${escapeHtml(item.fact)}</p>
                    <div class="flex items-center gap-2">
                        ${renderVerdictBadge(item.verdict)}
                        ${item.confidence != null ? `<span class="text-xs text-slate-500">${formatConfidence(item.confidence)}</span>` : ''}
                    </div>
                </div>
                ${item.explanation ? `<p class="mb-2 text-sm text-slate-400">${escapeHtml(item.explanation)}</p>` : ''}
                ${item.evidenceQuote ? `<blockquote class="mb-2 border-l-2 border-indigo-500/50 pl-3 text-sm italic text-slate-400">${escapeHtml(item.evidenceQuote)}</blockquote>` : ''}
                <details class="text-xs text-slate-500">
                    <summary class="cursor-pointer hover:text-slate-400">Детали сопоставления</summary>
                    <div class="mt-2 space-y-2">
                        <div><span class="font-medium text-slate-400">Совпало:</span> ${renderList(item.matchedElements)}</div>
                        <div><span class="font-medium text-slate-400">Противоречит:</span> ${renderList(item.contradictedElements)}</div>
                        <div><span class="font-medium text-slate-400">Не найдено:</span> ${renderList(item.missingElements)}</div>
                    </div>
                </details>
            </article>
        `;
    }

    function renderDecomposerSection(responses) {
        if (!responses?.length) return '';

        const blocks = responses.map((decomp) => {
            const claims = (decomp.atomicClaims ?? [])
                .map((c) => `<li class="text-sm text-slate-400"><span class="text-slate-500">${escapeHtml(c.type)}</span> — ${escapeHtml(c.text)}</li>`)
                .join('');

            return `
                <div class="rounded-lg border border-slate-700/60 bg-slate-800/30 p-3">
                    ${decomp.mainClaim ? `<p class="mb-2 text-sm text-slate-300">${escapeHtml(decomp.mainClaim)}</p>` : ''}
                    ${claims ? `<ul class="space-y-1">${claims}</ul>` : ''}
                </div>
            `;
        }).join('');

        return `
            <details class="mt-3">
                <summary class="cursor-pointer text-sm font-medium text-slate-400 hover:text-slate-300">Разбор утверждения</summary>
                <div class="mt-2 space-y-2">${blocks}</div>
            </details>
        `;
    }

    function renderAgentResponse(data) {
        const summary = data.summatorResponse
            ? `<div class="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">${escapeHtml(data.summatorResponse)}</div>`
            : '';
        const verifications = (data.verificatorResponses ?? []).map(renderVerificatorCard).join('');
        const verificationBlock = verifications
            ? `<div class="mt-4 space-y-2"><h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Проверка фактов</h3>${verifications}</div>`
            : '';
        return `${summary}${verificationBlock}${renderDecomposerSection(data.decomposerResponses)}`;
    }

    function createMessageBubble(role, html) {
        const isUser = role === 'user';
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
        const bubble = document.createElement('div');
        bubble.className = isUser
            ? 'max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white'
            : 'max-w-full rounded-2xl rounded-bl-md border border-slate-700/80 bg-slate-800 px-4 py-3 text-sm';
        bubble.innerHTML = html;
        wrapper.appendChild(bubble);
        return wrapper;
    }

    function createTypingIndicator() {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex justify-start';
        wrapper.innerHTML = `
            <div class="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-700/80 bg-slate-800 px-4 py-3">
                <span class="h-2 w-2 animate-bounce rounded-full bg-slate-500"></span>
                <span class="h-2 w-2 animate-bounce rounded-full bg-slate-500"></span>
                <span class="h-2 w-2 animate-bounce rounded-full bg-slate-500"></span>
            </div>
        `;
        return wrapper;
    }

    const root = document.getElementById('fact-check-chat');
    if (!root || typeof axios === 'undefined') return;

    const checkUrl = root.dataset.checkUrl;
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const messagesEl = document.getElementById('chat-messages');
    const submitBtn = document.getElementById('chat-submit');
    const sendIcon = document.getElementById('send-icon');
    const loadingIcon = document.getElementById('loading-icon');
    const welcomeEl = messagesEl.querySelector('[data-welcome]');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    function setLoading(loading) {
        submitBtn.disabled = loading;
        input.disabled = loading;
        sendIcon.classList.toggle('hidden', loading);
        loadingIcon.classList.toggle('hidden', !loading);
    }

    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fact = input.value.trim();
        if (!fact) return;

        welcomeEl?.remove();
        messagesEl.appendChild(createMessageBubble('user', escapeHtml(fact)));
        const typing = createTypingIndicator();
        messagesEl.appendChild(typing);
        scrollToBottom();
        input.value = '';
        setLoading(true);

        try {
            const { data } = await axios.post(checkUrl, { fact }, {
                headers: csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {},
            });
            typing.remove();
            messagesEl.appendChild(createMessageBubble('agent', renderAgentResponse(data)));
        } catch (err) {
            typing.remove();
            const message =
                err.response?.data?.message ??
                (err.response?.status === 422
                    ? 'Проверьте текст утверждения.'
                    : 'Не удалось получить ответ. Попробуйте позже.');
            messagesEl.appendChild(createMessageBubble('agent', `<p class="text-red-400">${escapeHtml(message)}</p>`));
        } finally {
            setLoading(false);
            scrollToBottom();
            input.focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            form.requestSubmit();
        }
    });
})();
