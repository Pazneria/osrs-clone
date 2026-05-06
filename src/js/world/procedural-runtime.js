(function () {
    function getThree() {
        return (typeof THREE !== 'undefined') ? THREE : null;
    }

    function applyColorTextureSettings(texture, filter = 'nearest') {
        if (!texture) return texture;
        const three = getThree();
        if (three && three.SRGBColorSpace) texture.colorSpace = three.SRGBColorSpace;
        if (three && filter === 'nearest') {
            texture.magFilter = three.NearestFilter;
            texture.minFilter = three.NearestFilter;
        } else if (three && filter === 'linear') {
            texture.magFilter = three.LinearFilter;
            texture.minFilter = three.LinearFilter;
        }
        texture.needsUpdate = true;
        return texture;
    }

    function clamp01(value) {
        return Math.max(0, Math.min(1, value));
    }

    function lerpNumber(start, end, t) {
        return start + ((end - start) * t);
    }

    function smoothstep(edge0, edge1, value) {
        if (edge0 === edge1) return value < edge0 ? 0 : 1;
        const t = clamp01((value - edge0) / (edge1 - edge0));
        return t * t * (3 - (2 * t));
    }

    function hash2D(x, y, seed = 0) {
        const s = Math.sin((x * 127.1) + (y * 311.7) + (seed * 74.7)) * 43758.5453123;
        return s - Math.floor(s);
    }

    function sampleValueNoise2D(x, y, seed = 0) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const tx = x - x0;
        const ty = y - y0;
        const sx = tx * tx * (3 - (2 * tx));
        const sy = ty * ty * (3 - (2 * ty));

        const n00 = hash2D(x0, y0, seed);
        const n10 = hash2D(x0 + 1, y0, seed);
        const n01 = hash2D(x0, y0 + 1, seed);
        const n11 = hash2D(x0 + 1, y0 + 1, seed);

        const nx0 = lerpNumber(n00, n10, sx);
        const nx1 = lerpNumber(n01, n11, sx);
        return lerpNumber(nx0, nx1, sy);
    }

    function positiveModulo(value, divisor) {
        return ((value % divisor) + divisor) % divisor;
    }

    function sampleTileableValueNoise2D(x, y, periodX, periodY, seed = 0) {
        const resolvedPeriodX = Math.max(1, Math.floor(periodX));
        const resolvedPeriodY = Math.max(1, Math.floor(periodY));
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const tx = x - x0;
        const ty = y - y0;
        const sx = tx * tx * (3 - (2 * tx));
        const sy = ty * ty * (3 - (2 * ty));

        const n00 = hash2D(positiveModulo(x0, resolvedPeriodX), positiveModulo(y0, resolvedPeriodY), seed);
        const n10 = hash2D(positiveModulo(x0 + 1, resolvedPeriodX), positiveModulo(y0, resolvedPeriodY), seed);
        const n01 = hash2D(positiveModulo(x0, resolvedPeriodX), positiveModulo(y0 + 1, resolvedPeriodY), seed);
        const n11 = hash2D(positiveModulo(x0 + 1, resolvedPeriodX), positiveModulo(y0 + 1, resolvedPeriodY), seed);

        const nx0 = lerpNumber(n00, n10, sx);
        const nx1 = lerpNumber(n01, n11, sx);
        return lerpNumber(nx0, nx1, sy);
    }

    function sampleFractalNoise2D(x, y, seed, octaves = 4, lacunarity = 2.0, gain = 0.5) {
        let amplitude = 1;
        let frequency = 1;
        let sum = 0;
        let sumAmplitude = 0;
        for (let i = 0; i < octaves; i++) {
            sum += sampleValueNoise2D(x * frequency, y * frequency, seed + (i * 13.37)) * amplitude;
            sumAmplitude += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }
        return sumAmplitude > 0 ? (sum / sumAmplitude) : 0;
    }

    function samplePeriodicFractalNoise2D(nx, ny, seed, basePeriod = 4, octaves = 4, lacunarity = 2.0, gain = 0.5) {
        let amplitude = 1;
        let frequency = 1;
        let sum = 0;
        let sumAmplitude = 0;
        for (let i = 0; i < octaves; i++) {
            const period = Math.max(1, Math.round(basePeriod * frequency));
            sum += sampleTileableValueNoise2D(nx * period, ny * period, period, period, seed + (i * 13.37)) * amplitude;
            sumAmplitude += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }
        return sumAmplitude > 0 ? (sum / sumAmplitude) : 0;
    }

    function createSeededRandom(seed) {
        let state = (seed >>> 0) || 1;
        return function seededRandom() {
            state = (Math.imul(1664525, state) + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }

    function mixRgb(start, end, t) {
        const resolvedT = clamp01(t);
        return [
            lerpNumber(start[0], end[0], resolvedT),
            lerpNumber(start[1], end[1], resolvedT),
            lerpNumber(start[2], end[2], resolvedT)
        ];
    }

    function drawWrappedStroke(ctx, size, x, y, toX, toY) {
        for (let offsetY = -size; offsetY <= size; offsetY += size) {
            for (let offsetX = -size; offsetX <= size; offsetX += size) {
                ctx.beginPath();
                ctx.moveTo(x + offsetX, y + offsetY);
                ctx.lineTo(toX + offsetX, toY + offsetY);
                ctx.stroke();
            }
        }
    }

    function drawWrappedEllipse(ctx, size, x, y, radiusX, radiusY, rotation = 0) {
        for (let offsetY = -size; offsetY <= size; offsetY += size) {
            for (let offsetX = -size; offsetX <= size; offsetX += size) {
                ctx.beginPath();
                ctx.ellipse(x + offsetX, y + offsetY, radiusX, radiusY, rotation, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function buildGrassTextureCanvas(size = 192) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return canvas;

        const palette = {
            shadow: [37, 59, 31],
            deep: [49, 82, 38],
            mid: [68, 111, 50],
            lush: [86, 135, 59],
            highlight: [111, 151, 74],
            straw: [118, 112, 58]
        };

        const imageData = ctx.createImageData(size, size);
        const pixels = imageData.data;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size;
                const ny = y / size;
                const low = samplePeriodicFractalNoise2D(nx, ny, 19.43, 5, 4, 2.0, 0.55);
                const mid = samplePeriodicFractalNoise2D((nx + 0.29) % 1, (ny + 0.61) % 1, 37.91, 10, 3, 2.0, 0.52);
                const detail = samplePeriodicFractalNoise2D((nx + 0.72) % 1, (ny + 0.18) % 1, 73.28, 24, 2, 2.0, 0.48);
                const worn = samplePeriodicFractalNoise2D((nx + 0.14) % 1, (ny + 0.83) % 1, 108.55, 7, 3, 2.0, 0.5);

                const lushMix = smoothstep(0.22, 0.9, low);
                const highlightMix = smoothstep(0.64, 0.96, mid) * 0.16;
                const wornMix = smoothstep(0.76, 0.98, worn) * 0.1;

                let color = mixRgb(palette.deep, palette.lush, lushMix);
                color = mixRgb(color, palette.highlight, highlightMix);
                color = mixRgb(color, palette.shadow, smoothstep(0.0, 0.22, 1 - low) * 0.24);
                color = mixRgb(color, palette.straw, wornMix);

                const detailLift = (detail - 0.5) * 2.4;
                let red = color[0] + (detailLift * 0.36);
                let green = color[1] + detailLift;
                let blue = color[2] + (detailLift * 0.28);

                const idx = ((y * size) + x) * 4;
                pixels[idx] = Math.max(0, Math.min(255, Math.round(red)));
                pixels[idx + 1] = Math.max(0, Math.min(255, Math.round(green)));
                pixels[idx + 2] = Math.max(0, Math.min(255, Math.round(blue)));
                pixels[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const random = createSeededRandom(0x8f43a2b1);
        ctx.lineWidth = 0.75;
        ctx.lineCap = 'round';
        for (let i = 0; i < 760; i++) {
            const x = random() * size;
            const y = random() * size;
            const length = 1.1 + (random() * 2.8);
            const angle = (-Math.PI / 2) + ((random() - 0.5) * 1.85);
            const sway = Math.cos(angle) * length;
            const lean = Math.sin(angle) * length;
            const tone = random();
            const alpha = 0.01 + (random() * 0.028);
            const red = 68 + Math.round(tone * 30);
            const green = 104 + Math.round(tone * 42);
            const blue = 42 + Math.round(tone * 22);

            ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
            drawWrappedStroke(ctx, size, x, y, x + sway, y + lean);
        }

        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 54; i++) {
            const x = random() * size;
            const y = random() * size;
            const length = 2 + (random() * 5);
            const angle = (-Math.PI / 2) + ((random() - 0.5) * 1.1);
            const sway = Math.cos(angle) * length;
            const lean = Math.sin(angle) * length;
            const alpha = 0.006 + (random() * 0.014);
            ctx.strokeStyle = `rgba(139, 166, 86, ${alpha})`;
            drawWrappedStroke(ctx, size, x, y, x + sway, y + lean);
        }

        ctx.globalCompositeOperation = 'multiply';
        for (let i = 0; i < 20; i++) {
            const cx = random() * size;
            const cy = random() * size;
            const radius = 4 + (random() * 8);
            const alpha = 0.01 + (random() * 0.018);
            ctx.fillStyle = `rgba(39, 57, 31, ${alpha})`;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';

        return canvas;
    }

    function buildDirtTextureCanvas(size = 192) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return canvas;

        const palette = {
            compact: [78, 55, 35],
            warm: [96, 69, 43],
            dry: [124, 94, 59],
            shadow: [48, 34, 23],
            clay: [116, 82, 49],
            grit: [137, 112, 76]
        };

        const imageData = ctx.createImageData(size, size);
        const pixels = imageData.data;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size;
                const ny = y / size;
                const low = samplePeriodicFractalNoise2D(nx, ny, 141.2, 4, 4, 2.0, 0.58);
                const mid = samplePeriodicFractalNoise2D((nx + 0.37) % 1, (ny + 0.66) % 1, 208.9, 9, 3, 2.0, 0.52);
                const fine = samplePeriodicFractalNoise2D((nx + 0.12) % 1, (ny + 0.43) % 1, 317.4, 26, 3, 2.0, 0.46);
                const grit = samplePeriodicFractalNoise2D((nx + 0.71) % 1, (ny + 0.18) % 1, 431.7, 56, 2, 2.0, 0.42);

                const packedMix = smoothstep(0.18, 0.9, low);
                const dryMix = smoothstep(0.62, 0.95, low) * 0.32;
                const clayMix = smoothstep(0.66, 0.96, mid) * 0.18;
                const shadowMix = smoothstep(0.0, 0.28, 1 - low) * 0.24;

                let color = mixRgb(palette.compact, palette.warm, packedMix);
                color = mixRgb(color, palette.dry, dryMix);
                color = mixRgb(color, palette.clay, clayMix);
                color = mixRgb(color, palette.shadow, shadowMix);

                const fineDelta = ((fine - 0.5) * 8.5) + ((grit - 0.5) * 3.5);
                let red = color[0] + (fineDelta * 0.82);
                let green = color[1] + (fineDelta * 0.62);
                let blue = color[2] + (fineDelta * 0.42);

                const idx = ((y * size) + x) * 4;
                pixels[idx] = Math.max(0, Math.min(255, Math.round(red)));
                pixels[idx + 1] = Math.max(0, Math.min(255, Math.round(green)));
                pixels[idx + 2] = Math.max(0, Math.min(255, Math.round(blue)));
                pixels[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const random = createSeededRandom(0x53ab1c29);
        ctx.globalCompositeOperation = 'multiply';
        for (let i = 0; i < 34; i++) {
            const px = random() * size;
            const py = random() * size;
            const radiusX = 7 + (random() * 18);
            const radiusY = 3 + (random() * 9);
            const alpha = 0.018 + (random() * 0.034);
            const angle = random() * Math.PI;
            ctx.fillStyle = `rgba(56, 38, 24, ${alpha})`;
            drawWrappedEllipse(ctx, size, px, py, radiusX, radiusY, angle);
        }

        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 22; i++) {
            const px = random() * size;
            const py = random() * size;
            const radiusX = 5 + (random() * 14);
            const radiusY = 2 + (random() * 7);
            const alpha = 0.012 + (random() * 0.026);
            const angle = random() * Math.PI;
            ctx.fillStyle = `rgba(154, 122, 78, ${alpha})`;
            drawWrappedEllipse(ctx, size, px, py, radiusX, radiusY, angle);
        }

        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < 330; i++) {
            const px = random() * size;
            const py = random() * size;
            const radiusX = 0.35 + (random() * 1.15);
            const radiusY = 0.25 + (random() * 0.9);
            const alpha = 0.045 + (random() * 0.12);
            const tone = random();
            const red = 103 + Math.round(tone * 42);
            const green = 78 + Math.round(tone * 30);
            const blue = 50 + Math.round(tone * 24);
            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
            drawWrappedEllipse(ctx, size, px, py, radiusX, radiusY, random() * Math.PI);
        }

        ctx.globalCompositeOperation = 'multiply';
        for (let i = 0; i < 120; i++) {
            const px = random() * size;
            const py = random() * size;
            const radiusX = 0.6 + (random() * 2.0);
            const radiusY = 0.35 + (random() * 1.45);
            const alpha = 0.04 + (random() * 0.08);
            ctx.fillStyle = `rgba(56, 38, 24, ${alpha})`;
            drawWrappedEllipse(ctx, size, px, py, radiusX, radiusY, random() * Math.PI);
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        for (let i = 0; i < 140; i++) {
            const x = random() * size;
            const y = random() * size;
            const length = 2.0 + (random() * 7.5);
            const angle = (Math.PI * 0.12) + ((random() - 0.5) * 1.15);
            const alpha = 0.018 + (random() * 0.045);
            const tone = random();
            const red = 80 + Math.round(tone * 42);
            const green = 58 + Math.round(tone * 28);
            const blue = 35 + Math.round(tone * 20);
            ctx.lineWidth = 0.45 + (random() * 0.65);
            ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
            drawWrappedStroke(ctx, size, x, y, x + (Math.cos(angle) * length), y + (Math.sin(angle) * length));
        }

        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 44; i++) {
            const x = random() * size;
            const y = random() * size;
            const length = 4.0 + (random() * 10.0);
            const angle = (Math.PI * 0.16) + ((random() - 0.5) * 0.9);
            ctx.lineWidth = 0.55 + (random() * 0.8);
            ctx.strokeStyle = `rgba(151, 118, 73, ${0.014 + (random() * 0.026)})`;
            drawWrappedStroke(ctx, size, x, y, x + (Math.cos(angle) * length), y + (Math.sin(angle) * length));
        }
        ctx.globalCompositeOperation = 'source-over';

        return canvas;
    }

    function sampleTileableFractalNoise2D(nx, ny, scale, seed, octaves = 4, lacunarity = 2.0, gain = 0.5) {
        const sampleX = nx * scale;
        const sampleY = ny * scale;
        const wrappedX = sampleX - scale;
        const wrappedY = sampleY - scale;

        const n00 = sampleFractalNoise2D(sampleX, sampleY, seed, octaves, lacunarity, gain);
        const n10 = sampleFractalNoise2D(wrappedX, sampleY, seed, octaves, lacunarity, gain);
        const n01 = sampleFractalNoise2D(sampleX, wrappedY, seed, octaves, lacunarity, gain);
        const n11 = sampleFractalNoise2D(wrappedX, wrappedY, seed, octaves, lacunarity, gain);

        const blendX0 = lerpNumber(n00, n10, nx);
        const blendX1 = lerpNumber(n01, n11, nx);
        return lerpNumber(blendX0, blendX1, ny);
    }

    function buildSkyCloudNoiseCanvas(size = 512) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return canvas;

        const imageData = ctx.createImageData(size, size);
        const pixels = imageData.data;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size;
                const ny = y / size;
                const base = sampleTileableFractalNoise2D(nx, ny, 5.5, 411.2, 5, 2.02, 0.56);
                const detail = sampleTileableFractalNoise2D(nx, ny, 11.0, 823.7, 3, 2.08, 0.5);
                const wisps = sampleTileableFractalNoise2D(nx, ny, 18.0, 1291.4, 2, 2.0, 0.46);

                const puffMask = smoothstep(0.48, 0.88, base);
                const detailMask = smoothstep(0.42, 0.82, detail);
                let cloudValue = (puffMask * 0.68) + (detailMask * 0.22) + (wisps * 0.1);
                cloudValue = smoothstep(0.50, 0.82, cloudValue);

                const brightness = 196 + Math.round(cloudValue * 54);
                const alpha = 110 + Math.round(cloudValue * 100);
                const idx = ((y * size) + x) * 4;
                pixels[idx] = brightness;
                pixels[idx + 1] = brightness;
                pixels[idx + 2] = Math.min(255, brightness + 4);
                pixels[idx + 3] = alpha;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    window.WorldProceduralRuntime = {
        applyColorTextureSettings,
        clamp01,
        lerpNumber,
        smoothstep,
        hash2D,
        sampleValueNoise2D,
        sampleFractalNoise2D,
        sampleTileableFractalNoise2D,
        createSeededRandom,
        buildGrassTextureCanvas,
        buildDirtTextureCanvas,
        buildSkyCloudNoiseCanvas
    };
})();
