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

    function createSeededRandom(seed) {
        let state = (seed >>> 0) || 1;
        return function seededRandom() {
            state = (Math.imul(1664525, state) + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }

    function buildGrassTextureCanvas(size = 192) {
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
                const low = sampleFractalNoise2D(nx * 4.2, ny * 4.2, 19.43, 4, 2.0, 0.54);
                const mid = sampleFractalNoise2D((nx * 12.8) + 5.3, (ny * 12.8) - 7.1, 37.91, 3, 2.1, 0.56);
                const grain = sampleFractalNoise2D((nx * 44.0) - 12.4, (ny * 44.0) + 8.7, 73.28, 2, 2.0, 0.5);

                const lushMask = smoothstep(0.24, 0.72, low);
                const wornMask = smoothstep(0.62, 0.94, mid);

                let red = 41 + (low * 24) + (mid * 10) - (wornMask * 14);
                let green = 65 + (low * 40) + (mid * 16) + (lushMask * 10) - (wornMask * 18);
                let blue = 30 + (low * 18) + (mid * 8) - (wornMask * 12);

                const grainLift = (grain - 0.5) * 14;
                red += grainLift * 0.5;
                green += grainLift;
                blue += grainLift * 0.45;

                const idx = ((y * size) + x) * 4;
                pixels[idx] = Math.max(0, Math.min(255, Math.round(red)));
                pixels[idx + 1] = Math.max(0, Math.min(255, Math.round(green)));
                pixels[idx + 2] = Math.max(0, Math.min(255, Math.round(blue)));
                pixels[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const random = createSeededRandom(0x8f43a2b1);
        ctx.lineWidth = 1;
        for (let i = 0; i < 4200; i++) {
            const x = random() * size;
            const y = random() * size;
            const length = 1.8 + (random() * 4.6);
            const sway = (random() - 0.5) * (0.8 + (length * 0.22));
            const tone = random();
            const alpha = 0.07 + (random() * 0.16);
            const red = 56 + Math.round(tone * 18);
            const green = 92 + Math.round(tone * 34);
            const blue = 42 + Math.round(tone * 14);

            ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + sway, y - length);
            ctx.stroke();
        }

        ctx.globalCompositeOperation = 'multiply';
        for (let i = 0; i < 160; i++) {
            const cx = random() * size;
            const cy = random() * size;
            const radius = 2 + (random() * 8);
            const alpha = 0.05 + (random() * 0.09);
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

        const imageData = ctx.createImageData(size, size);
        const pixels = imageData.data;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size;
                const ny = y / size;
                const low = sampleFractalNoise2D(nx * 5.6, ny * 5.6, 141.2, 4, 2.0, 0.56);
                const mid = sampleFractalNoise2D((nx * 18.0) + 4.1, (ny * 18.0) - 2.2, 208.9, 3, 2.05, 0.54);
                const grain = sampleFractalNoise2D((nx * 52.0) + 9.4, (ny * 52.0) - 7.3, 317.4, 2, 2.0, 0.5);

                const dryMask = smoothstep(0.58, 0.94, low);
                const richMask = smoothstep(0.18, 0.66, mid);
                let red = 74 + (low * 26) + (mid * 12) - (dryMask * 11);
                let green = 56 + (low * 17) + (mid * 8) - (dryMask * 8);
                let blue = 38 + (low * 10) + (richMask * 4) - (dryMask * 5);

                const grainDelta = (grain - 0.5) * 16;
                red += grainDelta * 0.8;
                green += grainDelta * 0.58;
                blue += grainDelta * 0.38;

                const idx = ((y * size) + x) * 4;
                pixels[idx] = Math.max(0, Math.min(255, Math.round(red)));
                pixels[idx + 1] = Math.max(0, Math.min(255, Math.round(green)));
                pixels[idx + 2] = Math.max(0, Math.min(255, Math.round(blue)));
                pixels[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const random = createSeededRandom(0x53ab1c29);
        for (let i = 0; i < 1850; i++) {
            const px = random() * size;
            const py = random() * size;
            const radius = 0.35 + (random() * 1.8);
            const alpha = 0.08 + (random() * 0.2);
            const tone = random();
            const red = 92 + Math.round(tone * 26);
            const green = 70 + Math.round(tone * 15);
            const blue = 48 + Math.round(tone * 12);
            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'multiply';
        for (let i = 0; i < 380; i++) {
            const px = random() * size;
            const py = random() * size;
            const width = 1 + (random() * 2.8);
            const height = 1 + (random() * 2.2);
            const alpha = 0.1 + (random() * 0.14);
            ctx.fillStyle = `rgba(56, 38, 24, ${alpha})`;
            ctx.fillRect(px, py, width, height);
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
