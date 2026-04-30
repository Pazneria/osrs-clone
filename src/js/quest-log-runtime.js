(function () {
    function getDocumentRef(options = {}) {
        return options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function getQuestRuntime(options = {}) {
        return options.QuestRuntime || (typeof window !== 'undefined' ? window.QuestRuntime : null) || null;
    }

    function escapeQuestLogHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getQuestStatusBadgeClass(status) {
        if (status === 'ready_to_complete') return 'border-[#3f6b37] bg-[#1c2d18] text-[#98d08a]';
        if (status === 'active') return 'border-[#6a5531] bg-[#2c2315] text-[#f0c97a]';
        if (status === 'completed') return 'border-[#3a444c] bg-[#111418] text-[#9fb0bf]';
        return 'border-[#3a444c] bg-[#111418] text-[#9fb0bf]';
    }

    function getQuestStatusLabel(status) {
        if (status === 'ready_to_complete') return 'Ready';
        if (status === 'active') return 'In Progress';
        if (status === 'completed') return 'Completed';
        return 'Available';
    }

    function buildQuestObjectiveRows(objectives) {
        const safeObjectives = Array.isArray(objectives) ? objectives : [];
        if (safeObjectives.length === 0) {
            return '<div class="text-[11px] leading-5 text-gray-400">No objectives listed yet.</div>';
        }

        return safeObjectives.map((objective) => `
            <div class="flex items-start justify-between gap-3 text-[11px] leading-5 ${objective.completed ? 'text-[#98d08a]' : 'text-[#f3e4c3]'}">
                <span>${escapeQuestLogHtml(objective.label)}</span>
                <span class="shrink-0 font-mono text-[10px] ${objective.completed ? 'text-[#98d08a]' : 'text-gray-300'}">${escapeQuestLogHtml(objective.progressText)}</span>
            </div>`).join('');
    }

    function buildQuestLogEntryHtml(entry = {}) {
        const guidanceLabel = entry.status === 'not_started' ? 'How To Start' : 'Next Step';
        const guidanceText = entry.status === 'not_started'
            ? (entry.startText || 'Talk to the quest giver to begin.')
            : (entry.nextStepText || entry.progressText || 'No next step is available right now.');

        return `
            <div class="rounded border border-[#3a444c] bg-[#0f1215] px-3 py-3 shadow-inner">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="text-[10px] uppercase tracking-[0.18em] text-[#c8aa6e]">${escapeQuestLogHtml(entry.questGiverName || 'Quest')}</div>
                        <div class="mt-1 text-sm font-bold text-[#ffcf8b]">${escapeQuestLogHtml(entry.title)}</div>
                    </div>
                    <div class="rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${getQuestStatusBadgeClass(entry.status)}">${escapeQuestLogHtml(getQuestStatusLabel(entry.status))}</div>
                </div>
                <div class="mt-2 text-[11px] leading-5 text-gray-300">${escapeQuestLogHtml(entry.summary)}</div>
                <div class="mt-3 border-t border-[#2a3138] pt-2">
                    <div class="text-[10px] uppercase tracking-[0.16em] text-[#c8aa6e]">${escapeQuestLogHtml(guidanceLabel)}</div>
                    <div class="mt-2 text-[11px] leading-5 text-gray-300">${escapeQuestLogHtml(guidanceText)}</div>
                </div>
                <div class="mt-3 border-t border-[#2a3138] pt-2">
                    <div class="text-[10px] uppercase tracking-[0.16em] text-[#c8aa6e]">Progress</div>
                    <div class="mt-2 text-[11px] leading-5 text-gray-300">${escapeQuestLogHtml(entry.progressText || 'No quest progress yet.')}</div>
                </div>
                <div class="mt-3 border-t border-[#2a3138] pt-2">
                    <div class="text-[10px] uppercase tracking-[0.16em] text-[#c8aa6e]">Objectives</div>
                    <div class="mt-2 grid gap-1">${buildQuestObjectiveRows(entry.objectives)}</div>
                </div>
                <div class="mt-3 border-t border-[#2a3138] pt-2">
                    <div class="text-[10px] uppercase tracking-[0.16em] text-[#c8aa6e]">Rewards</div>
                    <div class="mt-2 text-[11px] leading-5 text-gray-300">${escapeQuestLogHtml(entry.rewardsText || 'No rewards listed')}</div>
                </div>
            </div>`;
    }

    function buildQuestLogHtml(questEntries) {
        if (!Array.isArray(questEntries) || questEntries.length === 0) {
            return `
                <div class="flex h-full min-h-[220px] items-center justify-center rounded border border-[#3a444c] bg-[#0f1215] px-4 text-center text-[11px] leading-5 text-gray-400 shadow-inner">
                    No quests are defined yet.
                </div>`;
        }
        return questEntries.map((entry) => buildQuestLogEntryHtml(entry)).join('');
    }

    function getQuestEntries(options = {}) {
        if (Array.isArray(options.questEntries)) return options.questEntries;
        const questRuntime = getQuestRuntime(options);
        return questRuntime && typeof questRuntime.getQuestLogEntries === 'function'
            ? questRuntime.getQuestLogEntries()
            : [];
    }

    function renderQuestLog(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return '';
        const container = documentRef.getElementById(options.containerId || 'view-quests');
        if (!container) return '';

        const html = buildQuestLogHtml(getQuestEntries(options));
        container.innerHTML = html;
        return html;
    }

    window.QuestLogRuntime = {
        buildQuestLogEntryHtml,
        buildQuestLogHtml,
        escapeQuestLogHtml,
        getQuestStatusBadgeClass,
        getQuestStatusLabel,
        renderQuestLog
    };
})();
