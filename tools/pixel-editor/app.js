(function () {
    const PixelSource = window.PixelSource;
    const EDITOR_CANVAS_SIZE = 64;
    const EXPORT_CANVAS_SIZE = PixelSource.CANVAS_SIZE;
    const EXPORT_SCALE = EDITOR_CANVAS_SIZE / EXPORT_CANVAS_SIZE;

    if (!Number.isInteger(EXPORT_SCALE) || EXPORT_SCALE <= 0) {
        throw new Error("Editor canvas size must be an integer multiple of export canvas size.");
    }

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

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = EXPORT_CANVAS_SIZE;
    exportCanvas.height = EXPORT_CANVAS_SIZE;
    const exportCtx = exportCanvas.getContext("2d");

    canvas.width = EDITOR_CANVAS_SIZE;
    canvas.height = EDITOR_CANVAS_SIZE;

    const state = {
        source: PixelSource.createBlankPixelSource(""),
        grid: [],
        activeTool: "pencil",
        activeSymbol: "a",
        isPointerDown: false,
        lastPaintedKey: ""
    };

    function createBlankEditorGrid() {
        return PixelSource.rowsToGrid(PixelSource.createBlankRows(EDITOR_CANVAS_SIZE, EDITOR_CANVAS_SIZE));
    }

    function expandRowsToEditorGrid(rows) {
        const grid = createBlankEditorGrid();
        const safeRows = Array.isArray(rows) ? rows : [];
        for (let y = 0; y < Math.min(EXPORT_CANVAS_SIZE, safeRows.length); y += 1) {
            const row = typeof safeRows[y] === "string" ? safeRows[y] : "";
            for (let x = 0; x < Math.min(EXPORT_CANVAS_SIZE, row.length); x += 1) {
                const symbol = row.charAt(x) || PixelSource.TRANSPARENT_SYMBOL;
                for (let dy = 0; dy < EXPORT_SCALE; dy += 1) {
                    for (let dx = 0; dx < EXPORT_SCALE; dx += 1) {
                        grid[(y * EXPORT_SCALE) + dy][(x * EXPORT_SCALE) + dx] = symbol;
                    }
                }
            }
        }
        return grid;
    }

    function reduceBlockSymbol(grid, startX, startY) {
        const symbols = [
            grid[startY][startX],
            grid[startY][startX + 1],
            grid[startY + 1][startX],
            grid[startY + 1][startX + 1]
        ];
        const counts = {};
        for (let i = 0; i < symbols.length; i += 1) {
            const symbol = symbols[i];
            counts[symbol] = (counts[symbol] || 0) + 1;
        }

        let maxCount = 0;
        const allSymbols = Object.keys(counts);
        for (let i = 0; i < allSymbols.length; i += 1) {
            if (counts[allSymbols[i]] > maxCount) maxCount = counts[allSymbols[i]];
        }

        const candidates = allSymbols.filter((symbol) => counts[symbol] === maxCount);
        if (candidates.length === 1) return candidates[0];

        const nonTransparent = candidates.filter((symbol) => symbol !== PixelSource.TRANSPARENT_SYMBOL);
        if (nonTransparent.length === 1) return nonTransparent[0];
        if (nonTransparent.length > 1) {
            const priority = [symbols[3], symbols[1], symbols[2], symbols[0]];
            for (let i = 0; i < priority.length; i += 1) {
                if (nonTransparent.includes(priority[i])) return priority[i];
            }
        }

        return PixelSource.TRANSPARENT_SYMBOL;
    }

    function exportRowsFromGrid() {
        const rows = [];
        for (let y = 0; y < EXPORT_CANVAS_SIZE; y += 1) {
            let row = "";
            for (let x = 0; x < EXPORT_CANVAS_SIZE; x += 1) {
                row += reduceBlockSymbol(state.grid, x * EXPORT_SCALE, y * EXPORT_SCALE);
            }
            rows.push(row);
        }
        return rows;
    }

    function syncGridFromSource() {
        state.grid = expandRowsToEditorGrid(state.source.pixels);
        const paletteKeys = Object.keys(state.source.palette).filter((key) => key !== PixelSource.TRANSPARENT_SYMBOL);
        state.activeSymbol = paletteKeys[0] || "a";
    }

    function currentSource() {
        return {
            id: assetIdInput.value.trim(),
            width: EXPORT_CANVAS_SIZE,
            height: EXPORT_CANVAS_SIZE,
            palette: Object.assign({}, state.source.palette),
            pixels: exportRowsFromGrid(),
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

    function renderExportCanvas() {
        exportCtx.clearRect(0, 0, EXPORT_CANVAS_SIZE, EXPORT_CANVAS_SIZE);
        const exportedRows = exportRowsFromGrid();
        for (let y = 0; y < EXPORT_CANVAS_SIZE; y += 1) {
            const row = exportedRows[y];
            for (let x = 0; x < EXPORT_CANVAS_SIZE; x += 1) {
                const symbol = row.charAt(x);
                const color = state.source.palette[symbol];
                if (!color || color === "transparent") continue;
                exportCtx.fillStyle = toHex(color);
                exportCtx.fillRect(x, y, 1, 1);
            }
        }
    }

    function renderPreview(previewCtx, previewCanvas) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.imageSmoothingEnabled = false;
        previewCtx.drawImage(exportCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
    }

    function renderCanvas() {
        ctx.clearRect(0, 0, EDITOR_CANVAS_SIZE, EDITOR_CANVAS_SIZE);
        for (let y = 0; y < EDITOR_CANVAS_SIZE; y += 1) {
            for (let x = 0; x < EDITOR_CANVAS_SIZE; x += 1) {
                const symbol = state.grid[y][x];
                const color = state.source.palette[symbol];
                if (!color || color === "transparent") continue;
                ctx.fillStyle = toHex(color);
                ctx.fillRect(x, y, 1, 1);
            }
        }

        ctx.lineWidth = 1 / EDITOR_CANVAS_SIZE;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
        for (let i = 0; i <= EDITOR_CANVAS_SIZE; i += 1) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, EDITOR_CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(EDITOR_CANVAS_SIZE, i);
            ctx.stroke();
        }

        ctx.strokeStyle = "rgba(201, 170, 110, 0.32)";
        for (let i = 0; i <= EDITOR_CANVAS_SIZE; i += EXPORT_SCALE) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, EDITOR_CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(EDITOR_CANVAS_SIZE, i);
            ctx.stroke();
        }

        renderExportCanvas();
        renderPreview(slotPreviewCtx, slotPreviewCanvas);
        renderPreview(largePreviewCtx, largePreviewCanvas);
    }

    function renderPalette() {
        paletteList.innerHTML = "";
        const keys = Object.keys(state.source.palette);
        keys.forEach((symbol) => {
            const entry = document.createElement("div");
            entry.className = `palette-entry${symbol === state.activeSymbol ? " active" : ""}`;

            const swatch = document.createElement("div");
            swatch.className = "palette-swatch";
            swatch.style.background = symbol === PixelSource.TRANSPARENT_SYMBOL
                ? "linear-gradient(135deg, transparent 45%, rgba(201,170,110,0.55) 45%, rgba(201,170,110,0.55) 55%, transparent 55%)"
                : toHex(state.source.palette[symbol]);

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
        for (let y = 0; y < EDITOR_CANVAS_SIZE; y += 1) {
            for (let x = 0; x < EDITOR_CANVAS_SIZE; x += 1) {
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
        const x = Math.floor(((event.clientX - rect.left) / rect.width) * EDITOR_CANVAS_SIZE);
        const y = Math.floor(((event.clientY - rect.top) / rect.height) * EDITOR_CANVAS_SIZE);
        if (x < 0 || x >= EDITOR_CANVAS_SIZE || y < 0 || y >= EDITOR_CANVAS_SIZE) return null;
        return { x, y };
    }

    function mirroredPoints(x, y) {
        const points = {};
        const candidates = [[x, y]];
        if (mirrorXInput.checked) candidates.push([(EDITOR_CANVAS_SIZE - 1) - x, y]);
        if (mirrorYInput.checked) candidates.push([x, (EDITOR_CANVAS_SIZE - 1) - y]);
        if (mirrorXInput.checked && mirrorYInput.checked) {
            candidates.push([(EDITOR_CANVAS_SIZE - 1) - x, (EDITOR_CANVAS_SIZE - 1) - y]);
        }
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
            if (point[0] < EDITOR_CANVAS_SIZE - 1) queue.push([point[0] + 1, point[1]]);
            if (point[1] > 0) queue.push([point[0], point[1] - 1]);
            if (point[1] < EDITOR_CANVAS_SIZE - 1) queue.push([point[0], point[1] + 1]);
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

    function commitCanonicalSource(sourceLike) {
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
        commitCanonicalSource(next);
        setStatus("New 64x64 authoring asset (32x32 export)");
    }

    function openJsonFile(file) {
        const reader = new FileReader();
        reader.onload = function () {
            try {
                const parsed = JSON.parse(reader.result);
                commitCanonicalSource(parsed);
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
                try {
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = EXPORT_CANVAS_SIZE;
                    tempCanvas.height = EXPORT_CANVAS_SIZE;
                    const tempCtx = tempCanvas.getContext("2d");
                    tempCtx.imageSmoothingEnabled = false;
                    tempCtx.clearRect(0, 0, EXPORT_CANVAS_SIZE, EXPORT_CANVAS_SIZE);

                    const scale = Math.min(EXPORT_CANVAS_SIZE / image.width, EXPORT_CANVAS_SIZE / image.height);
                    const drawWidth = Math.max(1, Math.min(EXPORT_CANVAS_SIZE, Math.round(image.width * scale)));
                    const drawHeight = Math.max(1, Math.min(EXPORT_CANVAS_SIZE, Math.round(image.height * scale)));
                    const offsetX = Math.floor((EXPORT_CANVAS_SIZE - drawWidth) / 2);
                    const offsetY = Math.floor((EXPORT_CANVAS_SIZE - drawHeight) / 2);

                    tempCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
                    const imageData = tempCtx.getImageData(0, 0, EXPORT_CANVAS_SIZE, EXPORT_CANVAS_SIZE);
                    const palette = { ".": "transparent" };
                    const allocator = PixelSource.makeSymbolAllocator(["."]);
                    const symbolByColor = {};
                    const rows = [];

                    for (let y = 0; y < EXPORT_CANVAS_SIZE; y += 1) {
                        let row = "";
                        for (let x = 0; x < EXPORT_CANVAS_SIZE; x += 1) {
                            const offset = (y * EXPORT_CANVAS_SIZE + x) * 4;
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
                    commitCanonicalSource({
                        id: assetIdInput.value.trim() || derivedId,
                        width: EXPORT_CANVAS_SIZE,
                        height: EXPORT_CANVAS_SIZE,
                        palette,
                        pixels: rows,
                        model: {
                            depth: 4,
                            scale: 0.05,
                            groundVariant: "copy"
                        }
                    });
                    setStatus(`Imported ${file.name} into 32x32 export and expanded to 64x64 authoring`);
                } catch (error) {
                    setStatus(`PNG import failed: ${error.message}`);
                }
            };
            image.onerror = function () {
                setStatus(`PNG import failed: could not decode ${file.name}`);
            };
            image.src = reader.result;
        };
        reader.onerror = function () {
            setStatus(`PNG import failed: could not read ${file.name}`);
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
            setStatus(
                `x:${point.x} y:${point.y} export:${Math.floor(point.x / EXPORT_SCALE)},${Math.floor(point.y / EXPORT_SCALE)} tool:${state.activeTool}`
            );
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
            state.source = validation.normalized;
            assetIdInput.value = state.source.id;
            const filename = `${state.source.id || "pixel_asset"}.json`;
            downloadFile(filename, `${JSON.stringify(state.source, null, 2)}\n`, "application/json");
            renderPalette();
            renderCanvas();
            setStatus(`Saved ${filename} (32x32 export from 64x64 authoring grid)`);
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
