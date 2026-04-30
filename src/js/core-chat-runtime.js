(function () {
    const CHAT_EXPANDED_STORAGE_KEY = 'osrsClone.chatExpanded';
    const CHAT_MAX_LINES = 120;

    function getDocumentRef(options = {}) {
        return options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function getWindowRef(options = {}) {
        return options.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function getNavigatorRef(options = {}) {
        return options.navigatorRef || (typeof navigator !== 'undefined' ? navigator : {});
    }

    function getChatLogElement(options = {}) {
        const documentRef = getDocumentRef(options);
        return documentRef && typeof documentRef.getElementById === 'function'
            ? documentRef.getElementById('chat-log')
            : null;
    }

    function getChatPrefix(type) {
        if (type === 'info') return '[Info]';
        if (type === 'warn') return '[Warn]';
        return '[Game]';
    }

    function addChatMessage(message, type = 'game', options = {}) {
        const documentRef = getDocumentRef(options);
        const logEl = getChatLogElement({ ...options, documentRef });
        if (!documentRef || !logEl || typeof documentRef.createElement !== 'function') return false;

        const line = documentRef.createElement('div');
        line.className = `chat-line ${type}`;

        const prefix = documentRef.createElement('span');
        prefix.className = 'chat-prefix';
        prefix.innerText = getChatPrefix(type);

        const body = documentRef.createElement('span');
        body.innerText = message;

        line.appendChild(prefix);
        line.appendChild(body);
        logEl.appendChild(line);

        while (logEl.children && logEl.children.length > CHAT_MAX_LINES) {
            logEl.removeChild(logEl.firstChild);
        }

        logEl.scrollTop = logEl.scrollHeight;
        return true;
    }

    function getChatLogCopyText(options = {}) {
        const logEl = getChatLogElement(options);
        if (!logEl || !logEl.children) return '';
        const lines = Array.from(logEl.children)
            .map((node) => (node && node.innerText ? node.innerText.trim() : ''))
            .filter(Boolean);
        return lines.join('\n');
    }

    async function copyChatLogTextToClipboard(options = {}) {
        const documentRef = getDocumentRef(options);
        const navigatorRef = getNavigatorRef(options);
        const chatText = getChatLogCopyText({ ...options, documentRef });
        const addMessage = typeof options.addChatMessage === 'function'
            ? options.addChatMessage
            : (message, type) => addChatMessage(message, type, { ...options, documentRef });
        if (!chatText) {
            addMessage('Chat log is empty.', 'warn');
            return false;
        }

        if (navigatorRef.clipboard && typeof navigatorRef.clipboard.writeText === 'function') {
            try {
                await navigatorRef.clipboard.writeText(chatText);
                addMessage(`Copied ${chatText.split('\n').length} chat line(s).`, 'info');
                return true;
            } catch (error) {
                // Fall through to legacy copy path.
            }
        }

        if (!documentRef || !documentRef.body || typeof documentRef.createElement !== 'function') {
            addMessage('Copy failed. Select chat text and press Ctrl+C.', 'warn');
            return false;
        }

        const fallbackInput = documentRef.createElement('textarea');
        fallbackInput.value = chatText;
        fallbackInput.setAttribute('readonly', 'readonly');
        fallbackInput.style.position = 'fixed';
        fallbackInput.style.left = '-9999px';
        fallbackInput.style.opacity = '0';
        documentRef.body.appendChild(fallbackInput);
        fallbackInput.focus();
        fallbackInput.select();

        let copied = false;
        try {
            copied = typeof documentRef.execCommand === 'function' && documentRef.execCommand('copy');
        } catch (error) {
            copied = false;
        }

        documentRef.body.removeChild(fallbackInput);
        if (copied) {
            addMessage(`Copied ${chatText.split('\n').length} chat line(s).`, 'info');
            return true;
        }

        addMessage('Copy failed. Select chat text and press Ctrl+C.', 'warn');
        return false;
    }

    function setChatBoxExpanded(expanded, options = {}) {
        const documentRef = getDocumentRef(options);
        const windowRef = getWindowRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return false;
        const chatBox = documentRef.getElementById('chat-box');
        const expandBtn = documentRef.getElementById('chat-expand-toggle');
        if (!chatBox || !expandBtn) return false;

        const shouldExpand = !!expanded;
        chatBox.classList.toggle('chat-expanded', shouldExpand);
        expandBtn.innerText = shouldExpand ? 'Collapse' : 'Expand';
        expandBtn.setAttribute('aria-expanded', shouldExpand ? 'true' : 'false');
        try {
            if (windowRef.localStorage) windowRef.localStorage.setItem(CHAT_EXPANDED_STORAGE_KEY, shouldExpand ? '1' : '0');
        } catch (error) {
            // Ignore persistence failures in private mode or restricted contexts.
        }
        return true;
    }

    function initChatControls(options = {}) {
        const documentRef = getDocumentRef(options);
        const windowRef = getWindowRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return false;
        const chatBox = documentRef.getElementById('chat-box');
        if (!chatBox) return false;
        const copyBtn = documentRef.getElementById('chat-copy-btn');
        const expandBtn = documentRef.getElementById('chat-expand-toggle');

        let savedExpanded = false;
        try {
            savedExpanded = !!(windowRef.localStorage && windowRef.localStorage.getItem(CHAT_EXPANDED_STORAGE_KEY) === '1');
        } catch (error) {
            savedExpanded = false;
        }
        setChatBoxExpanded(savedExpanded, { ...options, documentRef, windowRef });

        if (copyBtn && typeof copyBtn.addEventListener === 'function') {
            copyBtn.addEventListener('click', (event) => {
                event.preventDefault();
                void copyChatLogTextToClipboard({
                    ...options,
                    documentRef,
                    windowRef,
                    addChatMessage: options.addChatMessage
                });
            });
        }
        if (expandBtn && typeof expandBtn.addEventListener === 'function') {
            expandBtn.addEventListener('click', (event) => {
                event.preventDefault();
                setChatBoxExpanded(!chatBox.classList.contains('chat-expanded'), { ...options, documentRef, windowRef });
            });
        }
        return true;
    }

    function showPlayerOverheadText(options = {}) {
        const state = options.playerOverheadText || null;
        if (!state) return null;
        state.text = options.text || '';
        const durationMs = Number.isFinite(options.durationMs) ? options.durationMs : 2800;
        const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
        state.expiresAt = nowMs + durationMs;
        return state;
    }

    window.CoreChatRuntime = {
        addChatMessage,
        getChatLogCopyText,
        copyChatLogTextToClipboard,
        setChatBoxExpanded,
        initChatControls,
        showPlayerOverheadText
    };
})();
