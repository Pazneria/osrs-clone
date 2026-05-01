(function () {
    let runtimeSharedMaterial = null;

    function getThreeRef(options = {}) {
        return options.THREERef || (typeof THREE !== 'undefined' ? THREE : null);
    }

    function packJagexHsl(h, s, l) {
        return ((h & 63) << 10) | ((s & 7) << 7) | (l & 127);
    }

    function unpackJagexHsl(packed) {
        return {
            h: (packed >> 10) & 63,
            s: (packed >> 7) & 7,
            l: packed & 127
        };
    }

    function hslToRgb(h, s, l) {
        if (s === 0) {
            const v = Math.round(l * 255);
            return [v, v, v];
        }
        const hue2rgb = function hueToRgb(p, q, t) {
            let wrappedT = t;
            if (wrappedT < 0) wrappedT += 1;
            if (wrappedT > 1) wrappedT -= 1;
            if (wrappedT < 1 / 6) return p + (q - p) * 6 * wrappedT;
            if (wrappedT < 1 / 2) return q;
            if (wrappedT < 2 / 3) return p + (q - p) * (2 / 3 - wrappedT) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const r = hue2rgb(p, q, h + 1 / 3);
        const g = hue2rgb(p, q, h);
        const b = hue2rgb(p, q, h - 1 / 3);
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    function jagexHslToRgb(packed) {
        const hsl = unpackJagexHsl(packed);
        const h = hsl.h / 63;
        const s = hsl.s / 7;
        const l = hsl.l / 127;
        const rgb = hslToRgb(h, s, l);
        return { r: rgb[0] / 255, g: rgb[1] / 255, b: rgb[2] / 255 };
    }

    function hexColorToRgb(hex) {
        if (typeof hex !== 'string') return null;
        const normalized = hex.trim().replace(/^#/, '');
        if (normalized.length !== 6) return null;
        const r = parseInt(normalized.slice(0, 2), 16);
        const g = parseInt(normalized.slice(2, 4), 16);
        const b = parseInt(normalized.slice(4, 6), 16);
        if (![r, g, b].every((value) => Number.isFinite(value))) return null;
        return { r: r / 255, g: g / 255, b: b / 255 };
    }

    function resolveFragmentRgb(fragment, packedColor) {
        if (fragment && typeof fragment.rgbColor === 'string') {
            const rgb = hexColorToRgb(fragment.rgbColor);
            if (rgb) return rgb;
        }
        return jagexHslToRgb(packedColor);
    }

    function getPlayerMaterial(options = {}) {
        const THREERef = getThreeRef(options);
        if (!THREERef) throw new Error('THREE is required to create player model materials.');
        const cache = options.materialCache && typeof options.materialCache === 'object'
            ? options.materialCache
            : null;
        if (cache) {
            if (!cache.sharedMaterial) {
                cache.sharedMaterial = new THREERef.MeshLambertMaterial({
                    vertexColors: true,
                    flatShading: false
                });
            }
            return cache.sharedMaterial;
        }
        if (!runtimeSharedMaterial) {
            runtimeSharedMaterial = new THREERef.MeshLambertMaterial({
                vertexColors: true,
                flatShading: false
            });
        }
        return runtimeSharedMaterial;
    }

    function createPixelExtrudeGeometry(options = {}, fragment, size) {
        const THREERef = getThreeRef(options);
        if (!THREERef) throw new Error('THREE is required to create player model geometry.');
        const voxelSize = Array.isArray(size) ? Number(size[0]) : NaN;
        const depth = Array.isArray(size) ? Number(size[1]) : NaN;
        const safeVoxelSize = Number.isFinite(voxelSize) && voxelSize > 0 ? voxelSize : 0.02;
        const safeDepth = Number.isFinite(depth) && depth > 0 ? depth : safeVoxelSize;
        const origin = Array.isArray(fragment && fragment.origin) ? fragment.origin : [0.5, 0.5];
        const originX = Number.isFinite(origin[0]) ? origin[0] : 0.5;
        const originY = Number.isFinite(origin[1]) ? origin[1] : 0.5;
        const flipY = !!(fragment && fragment.flipY);
        const voxelsIn = Array.isArray(fragment && fragment.voxels) ? fragment.voxels : [];
        const voxels = [];
        const localRotationAxis = Array.isArray(fragment && fragment.localRotationAxis) ? fragment.localRotationAxis : null;
        const localRotationAngle = Number(fragment && fragment.localRotationAngle);

        for (let i = 0; i < voxelsIn.length; i++) {
            const voxel = voxelsIn[i];
            if (!Array.isArray(voxel) || voxel.length < 2) continue;
            const x = Number(voxel[0]);
            const y = Number(voxel[1]);
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            voxels.push([x, y]);
        }

        if (!voxels.length) return new THREERef.BoxGeometry(safeVoxelSize, safeVoxelSize, safeDepth);

        const template = new THREERef.BoxGeometry(safeVoxelSize, safeVoxelSize, safeDepth).toNonIndexed();
        const templatePositions = template.getAttribute('position');
        const templateNormals = template.getAttribute('normal');
        const verticesPerVoxel = templatePositions.count;
        const positions = new Float32Array(verticesPerVoxel * 3 * voxels.length);
        const normals = new Float32Array(verticesPerVoxel * 3 * voxels.length);

        for (let voxelIndex = 0; voxelIndex < voxels.length; voxelIndex++) {
            const voxel = voxels[voxelIndex];
            const centerX = ((voxel[0] + 0.5) - originX) * safeVoxelSize;
            const centerY = flipY
                ? (((voxel[1] + 0.5) - originY) * safeVoxelSize)
                : ((originY - (voxel[1] + 0.5)) * safeVoxelSize);
            const baseOffset = voxelIndex * verticesPerVoxel * 3;
            for (let vertexIndex = 0; vertexIndex < verticesPerVoxel; vertexIndex++) {
                const outputIndex = baseOffset + (vertexIndex * 3);
                positions[outputIndex] = templatePositions.getX(vertexIndex) + centerX;
                positions[outputIndex + 1] = templatePositions.getY(vertexIndex) + centerY;
                positions[outputIndex + 2] = templatePositions.getZ(vertexIndex);
                normals[outputIndex] = templateNormals.getX(vertexIndex);
                normals[outputIndex + 1] = templateNormals.getY(vertexIndex);
                normals[outputIndex + 2] = templateNormals.getZ(vertexIndex);
            }
        }

        const geometry = new THREERef.BufferGeometry();
        geometry.setAttribute('position', new THREERef.BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREERef.BufferAttribute(normals, 3));
        if (localRotationAxis && Number.isFinite(localRotationAngle) && Math.abs(localRotationAngle) > 1e-6) {
            const axis = new THREERef.Vector3(
                Number(localRotationAxis[0]) || 0,
                Number(localRotationAxis[1]) || 0,
                Number(localRotationAxis[2]) || 0
            );
            if (axis.lengthSq() > 1e-6) {
                axis.normalize();
                const rotation = new THREERef.Quaternion().setFromAxisAngle(axis, localRotationAngle);
                const positionAttr = geometry.getAttribute('position');
                const normalAttr = geometry.getAttribute('normal');
                const temp = new THREERef.Vector3();
                for (let i = 0; i < positionAttr.count; i++) {
                    temp.set(positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i));
                    temp.applyQuaternion(rotation);
                    positionAttr.setXYZ(i, temp.x, temp.y, temp.z);
                    temp.set(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i));
                    temp.applyQuaternion(rotation);
                    normalAttr.setXYZ(i, temp.x, temp.y, temp.z);
                }
                positionAttr.needsUpdate = true;
                normalAttr.needsUpdate = true;
            }
        }
        return geometry;
    }

    function createGeometry(options = {}, shape, size, fragment) {
        const THREERef = getThreeRef(options);
        if (!THREERef) throw new Error('THREE is required to create player model geometry.');
        if (shape === 'box') return new THREERef.BoxGeometry(size[0], size[1], size[2]);
        if (shape === 'cylinder4') return new THREERef.CylinderGeometry(size[0], size[2], size[1], 4, 1);
        if (shape === 'cylinder') return new THREERef.CylinderGeometry(size[0], size[2], size[1], 16, 1);
        if (shape === 'cone') return new THREERef.ConeGeometry(size[0], size[1], size[2] || 16, 1);
        if (shape === 'sphere') return new THREERef.SphereGeometry(size[0], 14, 10);
        if (shape === 'torusArc') return new THREERef.TorusGeometry(size[0], size[1], 12, 28, size[2] || Math.PI);
        if (shape === 'torusArcTaper') {
            const radius = size[0];
            const tube = size[1];
            const arc = size[2] || Math.PI;
            const radialSeg = size[3] || 12;
            const tubularSeg = size[4] || 32;
            const taperPow = size[5] || 1.4;
            const g = new THREERef.TorusGeometry(radius, tube, radialSeg, tubularSeg, arc);
            const pos = g.getAttribute('position');
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const z = pos.getZ(i);
                let u = Math.atan2(y, x);
                if (u < 0) u += Math.PI * 2;
                let t = arc > 1e-5 ? (u / arc) : 0.5;
                t = Math.max(0, Math.min(1, t));
                const taper = Math.pow(Math.sin(Math.PI * t), taperPow);
                const cx = radius * Math.cos(u);
                const cy = radius * Math.sin(u);
                const dx = x - cx;
                const dy = y - cy;
                const dz = z;
                pos.setXYZ(i, cx + dx * taper, cy + dy * taper, dz * taper);
            }
            pos.needsUpdate = true;
            g.computeVertexNormals();
            return g;
        }
        if (shape === 'latheTaper') {
            const midRadius = size[0];
            const halfLen = size[1];
            const tipRadius = size[2] || 0.01;
            const tipInset = size[3] || (halfLen * 0.4);
            const segments = size[4] || 20;
            const profile = [
                new THREERef.Vector2(0, -halfLen),
                new THREERef.Vector2(tipRadius, -halfLen + tipInset),
                new THREERef.Vector2(midRadius, 0),
                new THREERef.Vector2(tipRadius, halfLen - tipInset),
                new THREERef.Vector2(0, halfLen)
            ];
            return new THREERef.LatheGeometry(profile, segments);
        }
        if (shape === 'pixelExtrude') return createPixelExtrudeGeometry(options, fragment, size);
        return new THREERef.BoxGeometry(0.2, 0.2, 0.2);
    }

    function createColorizedMesh(options = {}, shape, size, packedColor, fragment) {
        const THREERef = getThreeRef(options);
        if (!THREERef) throw new Error('THREE is required to create player model meshes.');
        let geometry = createGeometry(options, shape, size, fragment);
        if (geometry.index) geometry = geometry.toNonIndexed();
        const rgb = resolveFragmentRgb(fragment, packedColor);
        const positions = geometry.getAttribute('position');
        const colors = new Float32Array(positions.count * 3);
        for (let i = 0; i < positions.count; i++) {
            colors[i * 3] = rgb.r;
            colors[i * 3 + 1] = rgb.g;
            colors[i * 3 + 2] = rgb.b;
        }
        geometry.setAttribute('color', new THREERef.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        return new THREERef.Mesh(geometry, getPlayerMaterial(options));
    }

    function createPixelSourceVisualMeshes(runtimeOptions = {}, pixelSource, options = {}) {
        if (!pixelSource || typeof pixelSource !== 'object') return [];
        const rows = Array.isArray(pixelSource.pixels) ? pixelSource.pixels : [];
        const palette = pixelSource.palette && typeof pixelSource.palette === 'object' ? pixelSource.palette : null;
        if (!rows.length || !palette) return [];

        const width = Number.isFinite(pixelSource.width) ? pixelSource.width : (typeof rows[0] === 'string' ? rows[0].length : 0);
        const height = Number.isFinite(pixelSource.height) ? pixelSource.height : rows.length;
        const model = pixelSource.model && typeof pixelSource.model === 'object' ? pixelSource.model : {};
        const modelScale = Number.isFinite(model.scale) && model.scale > 0 ? model.scale : 0.05;
        const modelDepth = Number.isFinite(model.depth) && model.depth > 0 ? model.depth : 1;
        const scaleMultiplier = Number.isFinite(options.scaleMultiplier) && options.scaleMultiplier > 0 ? options.scaleMultiplier : 1;
        const depthMultiplier = Number.isFinite(options.depthMultiplier) && options.depthMultiplier > 0 ? options.depthMultiplier : 1;
        const pixelSize = Number.isFinite(options.pixelSize) && options.pixelSize > 0
            ? options.pixelSize
            : (modelScale * scaleMultiplier);
        const defaultDepth = pixelSize * modelDepth * depthMultiplier;
        const origin = Array.isArray(options.origin) ? options.origin.slice() : [width / 2, height / 2];
        const rotation = Array.isArray(options.rotation) ? options.rotation.slice() : [0, 0, 0];
        const offset = Array.isArray(options.offset) ? options.offset.slice() : [0, 0, 0];
        const flipY = options.flipY == null ? false : !!options.flipY;
        const depthBySymbol = options.depthBySymbol && typeof options.depthBySymbol === 'object'
            ? options.depthBySymbol
            : null;
        const localRotationAxis = Array.isArray(options.localRotationAxis) ? options.localRotationAxis.slice() : null;
        const localRotationAngle = Number.isFinite(options.localRotationAngle) ? options.localRotationAngle : 0;
        const meshes = [];
        const symbols = Object.keys(palette);

        for (let symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
            const symbol = symbols[symbolIndex];
            const colorHex = palette[symbol];
            if (symbol === '.' || colorHex === 'transparent') continue;
            const voxels = [];
            for (let y = 0; y < rows.length; y++) {
                const row = typeof rows[y] === 'string' ? rows[y] : '';
                for (let x = 0; x < row.length; x++) {
                    if (row.charAt(x) === symbol) voxels.push([x, y]);
                }
            }
            if (!voxels.length) continue;
            const depth = depthBySymbol && Number.isFinite(depthBySymbol[symbol]) && depthBySymbol[symbol] > 0
                ? depthBySymbol[symbol]
                : defaultDepth;
            const fragment = {
                shape: 'pixelExtrude',
                size: [pixelSize, depth],
                origin,
                rotation,
                offset,
                flipY,
                localRotationAxis,
                localRotationAngle,
                voxels,
                rgbColor: colorHex
            };
            meshes.push(createColorizedMesh(runtimeOptions, 'pixelExtrude', [pixelSize, depth], packJagexHsl(0, 0, 64), fragment));
        }

        return meshes;
    }

    window.PlayerModelVisualRuntime = {
        packJagexHsl,
        unpackJagexHsl,
        hslToRgb,
        jagexHslToRgb,
        hexColorToRgb,
        resolveFragmentRgb,
        getPlayerMaterial,
        createPixelExtrudeGeometry,
        createGeometry,
        createColorizedMesh,
        createPixelSourceVisualMeshes
    };
})();
