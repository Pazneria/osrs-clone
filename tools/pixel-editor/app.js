(function () {
    const PixelSource = window.PixelSource;
    const canvas = document.getElementById("editorCanvas");
    const ctx = canvas.getContext("2d");
    const slotPreviewCanvas = document.getElementById("slotPreviewCanvas");
    const slotPreviewCtx = slotPreviewCanvas.getContext("2d");
    const largePreviewCanvas = document.getElementById("largePreviewCanvas");
    const largePreviewCtx = largePreviewCanvas.getContext("2d");
    const assetIdInput = document.getElementById("assetIdInput");
    const statusText = document.getElementById("statusText");
    const paletteList = document.getElementById("paletteList");
    const zoomSelect = document.getElementById("zoomSelect");
    const canvasViewport = document.getElementById("canvasViewport");
    const mirrorXInput = document.getElementById("mirrorXInput");
    const mirrorYInput = document.getElementById("mirrorYInput");
    const jsonFileInput = document.getElementById("jsonFileInput");
    const pngFileInput = document.getElementById("pngFileInput");
    const toolButtons = Array.from(document.querySelectorAll(".tool-btn"));

    const state = {
        source: PixelSource.createBlankPixelSource(""),
        grid: [],
        activeTool: "pencil",
        activeSymbol: "a",
        isPointerDown: false,
        lastPaintedKey: ""
    };

    function syncGridFromSource() {
        state.grid = PixelSource.rowsToGrid(state.source.pixels);
        const paletteKeys = Object.keys(state.source.palette).filter((key) => key !== PixelSource.TRANSPARENT_SYMBOL);
        state.activeSymbol = paletteKeys[0] || "a";
    }

    function currentSource() {
        return {
            id: assetIdInput.value.trim(),
            width: 32,
            height: 32,
            palette: Object.assign({}, state.source.palette),
            pixels: PixelSource.gridToRows(state.grid),
            model: Object.assign({}, state.source.model)
        };
    }

    function setStatus(message) {
        statusText.textContent = message;
    }

    function toHex(color) {
        const normalized = PixelSource.normalizeHexColor(color) || "#000000";
        return normalized.slice(0, 7);
    }

    function renderCanvas() {
        ctx.clearRect(0, 0, 32, 32);
        for (let y = 0; y < 32; y += 1) {
            for (let x = 0; x < 32; x += 1) {
                const symbol = state.grid[y][x];
                const color = state.source.palette[symbol];
                if (!color || color === "transparent") continue;
                ctx.fillStyle = toHex(color);
                ctx.fillRect(x, y, 1, 1);
            }
        }

        ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
        ctx.lineWidth = 1 / 32;
        for (let i = 0; i <= 32; i += 1) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 32);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(32, i);
            ctx.stroke();
        }

        renderPreview(slotPreviewCtx, slotPreviewCanvas, 32);
        renderPreview(largePreviewCtx, largePreviewCanvas, 32);
    }

    function renderPreview(previewCtx, previewCanvas, size) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.imageSmoothingEnabled = false;
        previewCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
    }

    function renderPalette() {
        paletteList.innerHTML = "";
        const keys = Object.keys(state.source.palette);
        keys.forEach((symbol) => {
            const entry = document.createElement("div");
            entry.className = `palette-entry${symbol === state.activeSymbol ? " active" : ""}`;

            const swatch = document.createElement("div");
            swatch.className = "palette-swatch";
            swatch.style.background = symbol === PixelSource.TRANSPARENT_SYMBOL ? "linear-gradient(135deg, transparent 45%, rgba(201,170,110,0.55) 45%, rgba(201,170,110,0.55) 55%, transparent 55%)" : toHex(state.source.palette[symbol]);

            const meta = document.createElement("div");
            meta.className = "palette-meta";
            const label = document.createElement("strong");
            label.textContent = symbol === PixelSource.TRANSPARENT_SYMBOL ? "Transparent" : `Symbol ${symbol}`;
            const detail = document.createElement("span");
            detail.textContent = symbol === PixelSource.TRANSPARENT_SYMBOL ? "." : state.source.palette[symbol];
            meta.append(label, detail);

            const controls = document.createElement("div");
            controls.className = "palette-controls";

            if (symbol !== PixelSource.TRANSPARENT_SYMBOL) {
                const colorInput = document.createElement("input");
                colorInput.type = "color";
                colorInput.value = toHex(state.source.palette[symbol]);
                colorInput.addEventListener("input", (event) => {
                    state.source.palette[symbol] = event.target.value.toLowerCase();
                    renderPalette();
                    renderCanvas();
                });

                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.textContent = "Del";
                removeButton.addEventListener("click", (event) => {
                    event.stopPropagation();
                    removePaletteSymbol(symbol);
                });

                controls.append(colorInput, removeButton);
                entry.addEventListener("click", () => {
                    state.activeSymbol = symbol;
                    renderPalette();
                });
            }

            entry.append(swatch, meta, controls);
            paletteList.appendChild(entry);
        });
    }

    function removePaletteSymbol(symbol) {
        if (!state.source.palette[symbol]) return;
        delete state.source.palette[symbol];
        for (let y = 0; y < 32; y += 1) {
            for (let x = 0; x < 32; x += 1) {
                if (state.grid[y][x] === symbol) {
                    state.grid[y][x] = PixelSource.TRANSPARENT_SYMBOL;
                }
            }
        }
        const remaining = Object.keys(state.source.palette).filter((key) => key !== PixelSource.TRANSPARENT_SYMBOL);
        state.activeSymbol = remaining[0] || "a";
        renderPalette();
        renderCanvas();
    }

    function pointFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(((event.clientX - rect.left) / rect.width) * 32);
        const y = Math.floor(((event.clientY - rect.top) / rect.height) * 32);
        if (x < 0 || x >= 32 || y < 0 || y >= 32) return null;
        return { x, y };
    }

    function mirroredPoints(x, y) {
        const points = {};
        const candidates = [[x, y]];
        if (mirrorXInput.checked) candidates.push([31 - x, y]);
        if (mirrorYInput.checked) candidates.push([x, 31 - y]);
        if (mirrorXInput.checked && mirrorYInput.checked) candidates.push([31 - x, 31 - y]);
        candidates.forEach((point) => {
            points[`${point[0]}:${point[1]}`] = point;
        });
        return Object.values(points);
    }

    function setPixel(x, y, symbol) {
        const points = mirroredPoints(x, y);
        points.forEach((point) => {
            state.grid[point[1]][point[0]] = symbol;
        });
    }

    function floodFill(x, y, targetSymbol, replacementSymbol) {
        if (targetSymbol === replacementSymbol) return;
        const queue = [[x, y]];
        const visited = {};
        while (queue.length > 0) {
            const point = queue.shift();
            const key = `${point[0]}:${point[1]}`;
            if (visited[key]) continue;
            visited[key] = true;
            if (state.grid[point[1]][point[0]] !== targetSymbol) continue;
            setPixel(point[0], point[1], replacementSymbol);
            if (point[0] > 0) queue.push([point[0] - 1, point[1]]);
            if (point[0] < 31) queue.push([point[0] + 1, point[1]]);
            if (point[1] > 0) queue.push([point[0], point[1] - 1]);
            if (point[1] < 31) queue.push([point[0], point[1] + 1]);
        }
    }

    function applyTool(point) {
        const key = `${point.x}:${point.y}:${state.activeTool}`;
        if (state.lastPaintedKey === key && state.activeTool !== "fill" && state.activeTool !== "eyedropper") return;
        state.lastPaintedKey = key;

        if (state.activeTool === "eyedropper") {
            const symbol = state.grid[point.y][point.x];
            if (symbol !== PixelSource.TRANSPARENT_SYMBOL) {
                state.activeSymbol = symbol;
                state.activeTool = "pencil";
                syncToolButtons();
                renderPalette();
            }
            setStatus(`Picked ${symbol}`);
            return;
        }

        if (state.activeTool === "fill") {
            const replacement = state.activeTool === "erase" ? PixelSource.TRANSPARENT_SYMBOL : state.activeSymbol;
            floodFill(point.x, point.y, state.grid[point.y][point.x], replacement);
            renderCanvas();
            return;
        }

        const symbol = state.activeTool === "erase" ? PixelSource.TRANSPARENT_SYMBOL : state.activeSymbol;
        setPixel(point.x, point.y, symbol);
        renderCanvas();
    }

    function syncToolButtons() {
        toolButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.tool === state.activeTool);
        });
    }

    function chooseNextSymbol() {
        const allocator = PixelSource.makeSymbolAllocator(Object.keys(state.source.palette));
        return allocator.next();
    }

    function addPaletteColor() {
        const symbol = chooseNextSymbol();
        state.source.palette[symbol] = "#c8aa6e";
        state.activeSymbol = symbol;
        renderPalette();
    }

    function downloadFile(filename, contents, type) {
        const blob = new Blob([contents], { type });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function normalizeAndCommit(sourceLike) {
        const validation = PixelSource.validatePixelSource(sourceLike, { requireId: false });
        if (validation.errors.length > 0) {
            throw new Error(validation.errors.join("; "));
        }
        state.source = validation.normalized;
        assetIdInput.value = state.source.id;
        syncGridFromSource();
        renderPalette();
        renderCanvas();
    }

    function newDocument() {
        const next = PixelSource.createBlankPixelSource(assetIdInput.value.trim());
        normalizeAndCommit(next);
        setStatus("New 32x32 asset");
    }

    function openJsonFile(file) {
        const reader = new FileReader();
        reader.onload = function () {
            try {
                const parsed = JSON.parse(reader.result);
                normalizeAndCommit(parsed);
                setStatus(`Loaded ${file.name}`);
            } catch (error) {
                setStatus(`JSON error: ${error.message}`);
            }
        };
        reader.readAsText(file);
    }

    function rgbaToHex(r, g, b, a) {
        const parts = [r, g, b, a].map((value) => value.toString(16).padStart(2, "0"));
        return `#${parts.join("")}`;
    }

    function importPngFile(file) {
        const reader = new FileReader();
        reader.onload = function () {
            const image = new Image();
            image.onload = function () {
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = 32;
                tempCanvas.height = 32;
                const tempCtx = tempCanvas.getContext("2d");
                tempCtx.imageSmoothingEnabled = false;
                tempCtx.clearRect(0, 0, 32, 32);

                const scale = Math.min(32 / image.width, 32 / image.height);
                const drawWidth = Math.max(1, Math.min(32, Math.round(image.width * scale)));
                const drawHeight = Math.max(1, Math.min(32, Math.round(image.height * scale)));
                const offsetX = Math.floor((32 - drawWidth) / 2);
                const offsetY = Math.floor((32 - drawHeight) / 2);

                tempCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
                const imageData = tempCtx.getImageData(0, 0, 32, 32);
                const palette = { ".": "transparent" };
                const allocator = PixelSource.makeSymbolAllocator(["."]);
                const symbolByColor = {};
                const rows = [];

                for (let y = 0; y < 32; y += 1) {
                    let row = "";
                    for (let x = 0; x < 32; x += 1) {
                        const offset = (y * 32 + x) * 4;
                        const alpha = imageData.data[offset + 3];
                        if (alpha === 0) {
                            row += ".";
                            continue;
                        }
                        const hex = rgbaToHex(
                            imageData.data[offset],
                            imageData.data[offset + 1],
                            imageData.data[offset + 2],
                            alpha
                        );
                        if (!symbolByColor[hex]) {
                            const symbol = allocator.next();
                            symbolByColor[hex] = symbol;
                            palette[symbol] = hex;
                        }
                        row += symbolByColor[hex];
                    }
                    rows.push(row);
                }

                const derivedId = file.name.replace(/\.png$/i, "").replace(/-pixel$/i, "");
                normalizeAndCommit({
                    id: assetIdInput.value.trim() || derivedId,
                    width: 32,
                    height: 32,
                    palette,
                    pixels: rows,
                    model: {
                        depth: 4,
                        scale: 0.05,
                        groundVariant: "copy"
                    }
                });
                setStatus(`Imported ${file.name}`);
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    canvas.addEventListener("pointerdown", (event) => {
        state.isPointerDown = true;
        const point = pointFromEvent(event);
        if (!point) return;
        applyTool(point);
    });

    canvas.addEventListener("pointermove", (event) => {
        const point = pointFromEvent(event);
        if (point) {
            setStatus(`x:${point.x} y:${point.y} tool:${state.activeTool}`);
        }
        if (!state.isPointerDown || !point) return;
        if (state.activeTool === "fill" || state.activeTool === "eyedropper") return;
        applyTool(point);
    });

    ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
        canvas.addEventListener(eventName, () => {
            state.isPointerDown = false;
            state.lastPaintedKey = "";
        });
    });

    toolButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.activeTool = button.dataset.tool;
            syncToolButtons();
            setStatus(`Tool: ${state.activeTool}`);
        });
    });

    document.getElementById("addColorBtn").addEventListener("click", addPaletteColor);
    document.getElementById("newBtn").addEventListener("click", newDocument);
    document.getElementById("openJsonBtn").addEventListener("click", () => jsonFileInput.click());
    document.getElementById("importPngBtn").addEventListener("click", () => pngFileInput.click());
    document.getElementById("saveJsonBtn").addEventListener("click", () => {
        try {
            const validation = PixelSource.validatePixelSource(currentSource());
            if (validation.errors.length > 0) {
                throw new Error(validation.errors.join("; "));
            }
            const normalized = validation.normalized;
            normalizeAndCommit(normalized);
            const filename = `${normalized.id || "pixel_asset"}.json`;
            downloadFile(filename, `${JSON.stringify(normalized, null, 2)}\n`, "application/json");
            setStatus(`Saved ${filename}`);
        } catch (error) {
            setStatus(`Save failed: ${error.message}`);
        }
    });

    assetIdInput.addEventListener("input", () => {
        state.source.id = assetIdInput.value.trim();
    });

    zoomSelect.addEventListener("change", () => {
        canvasViewport.dataset.zoom = zoomSelect.value;
    });

    jsonFileInput.addEventListener("change", () => {
        if (jsonFileInput.files && jsonFileInput.files[0]) {
            openJsonFile(jsonFileInput.files[0]);
        }
        jsonFileInput.value = "";
    });

    pngFileInput.addEventListener("change", () => {
        if (pngFileInput.files && pngFileInput.files[0]) {
            importPngFile(pngFileInput.files[0]);
        }
        pngFileInput.value = "";
    });

    syncGridFromSource();
    syncToolButtons();
    renderPalette();
    renderCanvas();
})();
