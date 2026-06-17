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

    const SUMMARY_VERDICT_BG = {
        FALSE: 'bg-red-500/25 border-red-500/50',
        TRUE: 'bg-emerald-500/25 border-emerald-500/50',
        PARTIALLY_TRUE: 'bg-amber-400/25 border-amber-400/50',
    };

    const AGENT_BUBBLE_STYLES = {
        TRUE: 'border-emerald-500/40 bg-emerald-500/12',
        FALSE: 'border-red-500/40 bg-red-500/12',
        PARTIALLY_TRUE: 'border-amber-400/40 bg-amber-400/12',
        SUPPORTED: 'border-emerald-500/40 bg-emerald-500/12',
        REFUTED: 'border-red-500/40 bg-red-500/12',
        PARTIALLY_SUPPORTED: 'border-amber-400/40 bg-amber-400/12',
        CONFLICTING: 'border-orange-400/40 bg-orange-500/12',
        NOT_ENOUGH_INFO: 'border-slate-600/80 bg-slate-800',
        IRRELEVANT: 'border-slate-600/80 bg-slate-800',
    };

    function parseSummatorResponse(text) {
        if (!text) {
            return { verdict: null, confidence: null, claim: '', facts: '', analysis: '', factCheckText: '' };
        }

        const verdictMatch = text.match(/^Вердикт:\s*(.+)$/m);
        const confidenceMatch = text.match(/^Уверенность:\s*(.+)$/m);
        const sections = {
            claim: [],
            facts: [],
            analysis: [],
            factCheckText: [],
        };

        let currentSection = null;

        for (const line of text.split(/\r?\n/)) {
            const trimmed = line.trim();

            if (/^Проверяемое утверждение:?$/i.test(trimmed)) {
                currentSection = 'claim';
                continue;
            }

            if (/^Разобранные факты:?$/i.test(trimmed)) {
                currentSection = 'facts';
                continue;
            }

            if (/^Сводный анализ:?$/i.test(trimmed)) {
                currentSection = 'analysis';
                continue;
            }

            if (/^Проверка фактов:?$/i.test(trimmed)) {
                currentSection = 'factCheckText';
                continue;
            }

            if (/^-{3,}$/.test(trimmed)) {
                currentSection = null;
                continue;
            }

            if (currentSection) {
                sections[currentSection].push(line);
            }
        }

        return {
            verdict: verdictMatch?.[1]?.trim() ?? null,
            confidence: confidenceMatch?.[1]?.trim() ?? null,
            claim: sections.claim.join('\n').trim(),
            facts: sections.facts.join('\n').trim(),
            analysis: sections.analysis.join('\n').trim(),
            factCheckText: sections.factCheckText.join('\n').trim(),
        };
    }

    function truncateText(text, maxLen = 280) {
        if (!text || text.length <= maxLen) return text ?? '';
        const cut = text.slice(0, maxLen);
        const lastSpace = cut.lastIndexOf(' ');
        return `${(lastSpace > 160 ? cut.slice(0, lastSpace) : cut).trim()}…`;
    }

    function firstParagraph(text) {
        if (!text) return '';
        return text.split(/\n\n+/)[0]?.trim() ?? text.trim();
    }

    function getSummaryVerdictStyle(verdict) {
        const key = verdict?.toUpperCase?.() ?? '';
        return SUMMARY_VERDICT_BG[key] ?? 'bg-slate-800/80 border-slate-600/50';
    }

    function resolveAgentVerdict(parsed, verificatorResponses) {
        const summaryVerdict = parsed.verdict?.toUpperCase?.();
        if (summaryVerdict) {
            return summaryVerdict;
        }

        const verdicts = (verificatorResponses ?? [])
            .map((item) => item.verdict?.toUpperCase?.())
            .filter(Boolean);

        if (!verdicts.length) {
            return '';
        }

        if (verdicts.includes('PARTIALLY_SUPPORTED')) {
            return 'PARTIALLY_SUPPORTED';
        }

        if (verdicts.includes('REFUTED') && verdicts.includes('SUPPORTED')) {
            return 'PARTIALLY_SUPPORTED';
        }

        return verdicts[0];
    }

    function getAgentBubbleStyle(verdict) {
        return AGENT_BUBBLE_STYLES[verdict] ?? 'border-slate-700/80 bg-slate-800';
    }

    function extractEvidenceQuotes(verificatorResponses) {
        const quotes = [];

        for (const item of verificatorResponses ?? []) {
            const quote = item.evidenceQuote?.trim();
            if (!quote || quotes.includes(quote)) {
                continue;
            }

            quotes.push(quote);
        }

        return quotes;
    }

    function renderSummaryQuotes(verificatorResponses, fallbackText) {
        const items = extractEvidenceQuotes(verificatorResponses);

        if (!items.length && fallbackText) {
            items.push(fallbackText);
        }

        if (!items.length) {
            return '';
        }

        if (items.length === 1) {
            return `
                <blockquote class="border-l-2 border-white/30 pl-3 text-sm leading-relaxed italic text-slate-100">
                    ${escapeHtml(items[0])}
                </blockquote>
            `;
        }

        return `
            <div class="space-y-2">
                ${items.map((item) => `
                    <blockquote class="border-l-2 border-white/30 pl-3 text-sm leading-relaxed italic text-slate-100">
                        ${escapeHtml(item)}
                    </blockquote>
                `).join('')}
            </div>
        `;
    }

    function renderVerificatorBrief(item) {
        const confidence =
            item.confidence != null
                ? `<span class="shrink-0 text-xs text-slate-400">${formatConfidence(item.confidence)}</span>`
                : '';

        const details = `
            <div class="mt-3 space-y-2 border-t border-slate-700/60 pt-3">
                ${item.explanation ? `<p class="text-sm text-slate-400">${escapeHtml(item.explanation)}</p>` : ''}
                ${item.evidenceQuote ? `<blockquote class="border-l-2 border-indigo-500/50 pl-3 text-sm italic text-slate-400">${escapeHtml(item.evidenceQuote)}</blockquote>` : ''}
                <div class="space-y-2 text-xs text-slate-500">
                    <div><span class="font-medium text-slate-400">Совпало:</span> ${renderList(item.matchedElements)}</div>
                    <div><span class="font-medium text-slate-400">Противоречит:</span> ${renderList(item.contradictedElements)}</div>
                    <div><span class="font-medium text-slate-400">Не найдено:</span> ${renderList(item.missingElements)}</div>
                </div>
            </div>
        `;

        return `
            <article class="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                        <div class="mb-1 flex flex-wrap items-center gap-2">
                            ${renderVerdictBadge(item.verdict)}
                        </div>
                        <p class="text-sm text-slate-200">${escapeHtml(item.fact)}</p>
                    </div>
                    ${confidence}
                </div>
                <details class="mt-2">
                    <summary class="cursor-pointer text-xs font-medium text-indigo-400 hover:text-indigo-300">Развернуть</summary>
                    ${details}
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
                <div class="rounded-lg border border-slate-700/60 bg-slate-900/30 p-3">
                    ${decomp.mainClaim ? `<p class="mb-2 text-sm text-slate-300">${escapeHtml(decomp.mainClaim)}</p>` : ''}
                    ${claims ? `<ul class="space-y-1">${claims}</ul>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="mt-3">
                <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Разбор утверждения</h3>
                <div class="space-y-2">${blocks}</div>
            </div>
        `;
    }

    function renderAgentResponse(data) {
        const parsed = parseSummatorResponse(data.summatorResponse);
        const claim = parsed.claim || data.originalClaim || '';
        const briefAnalysis = truncateText(firstParagraph(parsed.analysis));
        const verdictStyle = getSummaryVerdictStyle(parsed.verdict);
        const summaryFallback = parsed.facts || briefAnalysis || claim;

        const confidenceBlock = parsed.confidence
            ? `<span class="shrink-0 text-sm font-medium text-slate-200">Уверенность: ${escapeHtml(parsed.confidence)}</span>`
            : '';

        const visibleFacts = (data.verificatorResponses ?? []).filter(
            (item) => item.verdict !== 'REFUTED'
        );

        const factCards = visibleFacts.map(renderVerificatorBrief).join('');

        const detailedAnalysisBlock = parsed.analysis
            ? `
                <section class="space-y-2">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Сводный анализ</h3>
                    <div class="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                        ${escapeHtml(parsed.analysis)}
                    </div>
                </section>
            `
            : '';

        const detailedFactCheckBlock = factCards
            ? `
                <section class="space-y-2">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Проверка фактов</h3>
                    <div class="space-y-2">${factCards}</div>
                </section>
            `
            : parsed.factCheckText
                ? `
                    <section class="space-y-2">
                        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Проверка фактов</h3>
                        <div class="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                            ${escapeHtml(parsed.factCheckText)}
                        </div>
                    </section>
                `
                : '';

        const expandedSummary = detailedAnalysisBlock || detailedFactCheckBlock
            ? `
                <div class="mt-3 space-y-4 border-t border-white/10 pt-3">
                    ${detailedAnalysisBlock}
                    ${detailedFactCheckBlock}
                </div>
            `
            : '';

        const summaryBlock = data.summatorResponse || claim || factCards
            ? `
                <div class="rounded-xl border p-4 ${verdictStyle}">
                    <div class="mb-3 flex items-start justify-between gap-3">
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-300">Краткий ответ</p>
                        ${confidenceBlock}
                    </div>
                    ${renderSummaryQuotes(data.verificatorResponses, summaryFallback)}
                    ${expandedSummary ? `
                        <details class="mt-3">
                            <summary class="cursor-pointer text-xs font-medium text-indigo-300 hover:text-indigo-200">Подробный ответ</summary>
                            ${expandedSummary}
                        </details>
                    ` : ''}
                </div>
            `
            : '';

        const verificationOnlyBlock = !summaryBlock && factCards
            ? `
                <div class="space-y-2">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Проверка фактов</h3>
                    ${factCards}
                </div>
            `
            : '';

        return {
            html: `${summaryBlock}${verificationOnlyBlock}`,
            verdict: resolveAgentVerdict(parsed, data.verificatorResponses),
        };
    }

    function createMessageBubble(role, html, bubbleStyle) {
        const isUser = role === 'user';
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
        const bubble = document.createElement('div');
        bubble.className = isUser
            ? 'max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white'
            : `max-w-full rounded-2xl rounded-bl-md border px-4 py-3 text-sm ${bubbleStyle || 'border-slate-700/80 bg-slate-800'}`;
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
    const categorySelect = document.getElementById('chat-category');
    const categoryButtons = Array.from(document.querySelectorAll('[data-category-option]'));
    const input = document.getElementById('chat-input');
    const messagesEl = document.getElementById('chat-messages');
    const submitBtn = document.getElementById('chat-submit');
    const sendIcon = document.getElementById('send-icon');
    const loadingIcon = document.getElementById('loading-icon');
    const welcomeEl = messagesEl.querySelector('[data-welcome]');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    function updateCategoryButtons(selectedCategory) {
        categoryButtons.forEach((button) => {
            const isActive = button.dataset.value === selectedCategory;
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            button.className = isActive
                ? 'rounded-full bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm shadow-black/20 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50'
                : 'rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-400 transition hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50';
        });
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        categoryButtons.forEach((button) => {
            button.disabled = loading;
        });
        input.disabled = loading;
        sendIcon.classList.toggle('hidden', loading);
        loadingIcon.classList.toggle('hidden', !loading);
    }

    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    categoryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedCategory = button.dataset.value;
            categorySelect.value = selectedCategory;
            updateCategoryButtons(selectedCategory);
        });
    });

    updateCategoryButtons(categorySelect.value);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fact = input.value.trim();
        const category = categorySelect.value;
        if (!fact) return;

        welcomeEl?.remove();
        messagesEl.appendChild(createMessageBubble('user', escapeHtml(fact)));
        const typing = createTypingIndicator();
        messagesEl.appendChild(typing);
        scrollToBottom();
        input.value = '';
        setLoading(true);

        try {
            const { data } = await axios.post(checkUrl, { fact, category }, {
                headers: csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {},
            });
            const rendered = renderAgentResponse(data);
            typing.remove();
            messagesEl.appendChild(createMessageBubble('agent', rendered.html, getAgentBubbleStyle(rendered.verdict)));
        } catch (err) {
            typing.remove();
            const message =
                err.response?.data?.message ??
                (err.response?.status === 422
                    ? 'Проверьте текст утверждения.'
                    : 'Не удалось получить ответ. Попробуйте позже.');
            messagesEl.appendChild(createMessageBubble('agent', `<div class="rounded-xl border border-red-500/50 bg-red-500/10 p-4"><p class="text-red-400">${escapeHtml(message)}</p></div>`));
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
