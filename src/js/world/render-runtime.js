(function () {
    const MAIN_DIRECTIONAL_SHADOW_CONFIG = {
        enabled: true,
        mapSize: 512,
        cameraHalfSize: 28,
        cameraNear: 1,
        cameraFar: 120,
        height: 44,
        offsetX: 18,
        offsetZ: 14,
        bias: -0.00045,
        normalBias: 0.02
    };

    function requireThree(three) {
        if (!three) throw new Error('World render runtime requires THREE.');
        return three;
    }

    function requireSharedMaterials(sharedMaterials) {
        if (!sharedMaterials) throw new Error('World render runtime requires shared materials.');
        return sharedMaterials;
    }

    function getWaterMaterialCaches(sharedMaterials) {
        const materials = requireSharedMaterials(sharedMaterials);
        if (!materials.waterSurfaceCache) materials.waterSurfaceCache = Object.create(null);
        if (!materials.waterShoreCache) materials.waterShoreCache = Object.create(null);
        if (!materials.waterFringeCache) materials.waterFringeCache = Object.create(null);
        if (!Array.isArray(materials.waterAnimatedMaterials)) materials.waterAnimatedMaterials = [];
        return {
            surface: materials.waterSurfaceCache,
            shore: materials.waterShoreCache,
            fringe: materials.waterFringeCache,
            animated: materials.waterAnimatedMaterials
        };
    }

    function buildWaterMaterialKey(tokens) {
        return [
            tokens.shallowColor,
            tokens.deepColor,
            tokens.foamColor,
            tokens.shoreColor,
            tokens.rippleColor,
            tokens.highlightColor,
            tokens.opacity,
            tokens.shoreOpacity
        ].join(':');
    }

    function createWaterSurfaceMaterial(three, tokens) {
        const THREE = requireThree(three);
        return new THREE.ShaderMaterial({
            transparent: false,
            depthWrite: true,
            uniforms: {
                uTime: { value: 0 },
                uShallowColor: { value: new THREE.Color(tokens.shallowColor) },
                uDeepColor: { value: new THREE.Color(tokens.deepColor) },
                uFoamColor: { value: new THREE.Color(tokens.foamColor) },
                uShoreColor: { value: new THREE.Color(tokens.shoreColor) },
                uRippleColor: { value: new THREE.Color(tokens.rippleColor) },
                uHighlightColor: { value: new THREE.Color(tokens.highlightColor) },
                uOpacity: { value: Number.isFinite(tokens.opacity) ? tokens.opacity : 0.86 }
            },
            vertexShader: `
                    uniform float uTime;
                    attribute vec2 waterData;
                    varying vec3 vWorldPos;
                    varying float vDepth;
                    varying float vShore;
                    void main() {
                        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                        float waveA = sin((worldPos.x * 0.17) + (uTime * 0.72) + (worldPos.z * 0.11));
                        float waveB = cos((worldPos.z * 0.21) - (uTime * 0.56) + (worldPos.x * 0.07));
                        float shoreCalm = mix(1.0, 0.34, clamp(waterData.y, 0.0, 1.0));
                        float cameraDistance = distance(worldPos.xz, cameraPosition.xz);
                        float farWaveFade = 1.0 - smoothstep(48.0, 118.0, cameraDistance);
                        float wave = (waveA + waveB) * 0.014 * (0.55 + (waterData.x * 0.45)) * shoreCalm * farWaveFade;
                        vec3 transformed = position;
                        transformed.y += wave;
                        vec4 displacedWorld = modelMatrix * vec4(transformed, 1.0);
                        vWorldPos = displacedWorld.xyz;
                        vDepth = clamp(waterData.x, 0.0, 1.0);
                        vShore = clamp(waterData.y, 0.0, 1.0);
                        gl_Position = projectionMatrix * viewMatrix * displacedWorld;
                    }
                `,
            fragmentShader: `
                    uniform float uTime;
                    uniform vec3 uShallowColor;
                    uniform vec3 uDeepColor;
                    uniform vec3 uFoamColor;
                    uniform vec3 uShoreColor;
                    uniform vec3 uRippleColor;
                    uniform vec3 uHighlightColor;
                    uniform float uOpacity;
                    varying vec3 vWorldPos;
                    varying float vDepth;
                    varying float vShore;
                    void main() {
                        float broadWave = sin((vWorldPos.x * 0.18) + (vWorldPos.z * 0.11) - (uTime * 0.36));
                        float crossingWave = sin((vWorldPos.x * -0.22) + (vWorldPos.z * 0.28) + (uTime * 0.42));
                        float smallRipple = sin((vWorldPos.x * 0.76) - (vWorldPos.z * 0.58) + (uTime * 0.82));
                        float fineRipple = sin((vWorldPos.x * 1.42) + (vWorldPos.z * 1.16) - (uTime * 1.18));
                        float cameraDistance = distance(vWorldPos.xz, cameraPosition.xz);
                        float farWaveFade = 1.0 - smoothstep(54.0, 126.0, cameraDistance);
                        float farDetailFade = 1.0 - smoothstep(34.0, 82.0, cameraDistance);
                        float rippleMix = (broadWave * 0.34 * farWaveFade) + (crossingWave * 0.28 * farWaveFade) + (smallRipple * 0.24 * farDetailFade) + (fineRipple * 0.14 * farDetailFade * farDetailFade);
                        float waveField = (broadWave * 0.48 * farWaveFade) + (crossingWave * 0.32 * farWaveFade) + (smallRipple * 0.2 * farDetailFade);
                        float crestMask = smoothstep(0.56, 0.96, waveField);
                        float troughMask = smoothstep(0.54, 0.98, -waveField);
                        float depthMix = smoothstep(0.18, 0.96, vDepth);
                        float offShore = 1.0 - smoothstep(0.16, 0.82, vShore);
                        vec3 color = mix(uShallowColor, uDeepColor, depthMix);
                        color = mix(color, uDeepColor * 0.72, smoothstep(0.50, 1.0, vDepth) * offShore * 0.38);
                        float surfaceMottle = sin((vWorldPos.x * 0.41) + (vWorldPos.z * 0.67) + (uTime * 0.12))
                            * sin((vWorldPos.x * -0.59) + (vWorldPos.z * 0.36) - (uTime * 0.08));
                        color += uRippleColor * (rippleMix * 0.036);
                        color = mix(color, color + (uHighlightColor * 0.04), smoothstep(0.22, 0.92, surfaceMottle) * (0.12 + (depthMix * 0.08)) * farDetailFade);
                        color = mix(color, color + (uRippleColor * 0.052), crestMask * (0.16 + (offShore * 0.08)));
                        color = mix(color, color * 0.88, troughMask * 0.11);
                        color = mix(color, uShallowColor, smoothstep(0.34, 0.92, vShore) * (1.0 - depthMix) * 0.12);
                        float highlight = smoothstep(0.52, 1.0, rippleMix) * (0.04 + (depthMix * 0.05)) * farDetailFade;
                        color += uHighlightColor * highlight;
                        float farColorFade = 1.0 - smoothstep(72.0, 156.0, cameraDistance);
                        vec3 calmFarColor = mix(uDeepColor, uShallowColor, 0.08);
                        color = mix(calmFarColor, color, farColorFade);
                        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
                    }
                `
        });
    }

    function createWaterShorelineRibbonMaterial(three, tokens) {
        const THREE = requireThree(three);
        return new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uShallowColor: { value: new THREE.Color(tokens.shallowColor) },
                uFoamColor: { value: new THREE.Color(tokens.foamColor) },
                uShoreColor: { value: new THREE.Color(tokens.shoreColor) },
                uRippleColor: { value: new THREE.Color(tokens.rippleColor) },
                uHighlightColor: { value: new THREE.Color(tokens.highlightColor) }
            },
            vertexShader: `
                    uniform float uTime;
                    attribute vec2 waterData;
                    attribute float fringeAlpha;
                    varying vec3 vWorldPos;
                    varying float vLane;
                    varying float vBreakSeed;
                    varying float vAlpha;
                    void main() {
                        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                        float ripple = sin((worldPos.x * 0.25) + (worldPos.z * 0.19) + (uTime * 0.52));
                        vec3 transformed = position;
                        transformed.y += ripple * 0.004 * clamp(fringeAlpha, 0.0, 1.0);
                        vec4 displacedWorld = modelMatrix * vec4(transformed, 1.0);
                        vWorldPos = displacedWorld.xyz;
                        vLane = clamp(waterData.x, 0.0, 1.0);
                        vBreakSeed = clamp(waterData.y, 0.0, 1.0);
                        vAlpha = clamp(fringeAlpha, 0.0, 1.0);
                        gl_Position = projectionMatrix * viewMatrix * displacedWorld;
                    }
                `,
            fragmentShader: `
                    uniform float uTime;
                    uniform vec3 uShallowColor;
                    uniform vec3 uShoreColor;
                    uniform vec3 uRippleColor;
                    uniform vec3 uHighlightColor;
                    varying vec3 vWorldPos;
                    varying float vLane;
                    varying float vBreakSeed;
                    varying float vAlpha;
                    void main() {
                        float laceA = sin((vWorldPos.x * 1.84) - (vWorldPos.z * 1.31) + (uTime * 0.92) + (vBreakSeed * 4.7)) * 0.5 + 0.5;
                        float laceB = sin((vWorldPos.x * -2.42) + (vWorldPos.z * 1.68) - (uTime * 0.74) + (vBreakSeed * 6.1)) * 0.5 + 0.5;
                        float ripple = sin((vWorldPos.x * 0.48) + (vWorldPos.z * 0.36) - (uTime * 0.42));
                        float cameraDistance = distance(vWorldPos.xz, cameraPosition.xz);
                        float farFoamFade = 1.0 - smoothstep(38.0, 88.0, cameraDistance);
                        float brokenFeather = smoothstep(0.34, 0.92, (laceA * 0.58) + (laceB * 0.42)) * farFoamFade;
                        float featherCenter = 1.0 - smoothstep(0.0, 0.34, abs(vLane - 0.58));
                        float edgeFeather = featherCenter * (0.58 + (brokenFeather * 0.24));
                        float waterSide = 1.0 - smoothstep(0.18, 0.52, vLane);
                        float bankFade = smoothstep(0.56, 0.98, vLane);
                        vec3 outerWaterColor = mix(uShallowColor, uRippleColor, 0.14);
                        vec3 color = outerWaterColor * (0.94 + (ripple * 0.03 * farFoamFade));
                        color = mix(color, uShoreColor, bankFade * 0.08);
                        color += uRippleColor * (ripple * waterSide * 0.02 * farFoamFade);
                        color += uHighlightColor * (edgeFeather * 0.006);
                        float alpha = vAlpha * (0.16 + (waterSide * 0.14) + (edgeFeather * 0.22)) * farFoamFade;
                        gl_FragColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 0.46));
                    }
                `
        });
    }

    function getWaterSurfaceMaterial(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = requireSharedMaterials(options && options.sharedMaterials);
        const tokens = options && options.tokens ? options.tokens : {};
        const caches = getWaterMaterialCaches(sharedMaterials);
        const key = buildWaterMaterialKey(tokens);
        if (!caches.surface[key]) {
            const material = createWaterSurfaceMaterial(THREE, tokens);
            material.userData = Object.assign({}, material.userData, { waterAnimated: true });
            caches.surface[key] = material;
            caches.animated.push(material);
        }
        return caches.surface[key];
    }

    function getWaterShorelineRibbonMaterial(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = requireSharedMaterials(options && options.sharedMaterials);
        const tokens = options && options.tokens ? options.tokens : {};
        const caches = getWaterMaterialCaches(sharedMaterials);
        const key = buildWaterMaterialKey(tokens);
        if (!caches.fringe[key]) {
            const material = createWaterShorelineRibbonMaterial(THREE, tokens);
            material.userData = Object.assign({}, material.userData, { waterAnimated: true });
            caches.fringe[key] = material;
            caches.animated.push(material);
        }
        return caches.fringe[key];
    }

    function getWaterFringeMaterial(options) {
        return getWaterShorelineRibbonMaterial(options);
    }

    function getWaterShoreMaterial(options) {
        const THREE = requireThree(options && options.THREE);
        const sharedMaterials = requireSharedMaterials(options && options.sharedMaterials);
        const tokens = options && options.tokens ? options.tokens : {};
        const caches = getWaterMaterialCaches(sharedMaterials);
        const key = buildWaterMaterialKey(tokens);
        if (!caches.shore[key]) {
            caches.shore[key] = new THREE.MeshBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: Number.isFinite(tokens.shoreOpacity) ? Math.max(tokens.shoreOpacity, 0.78) : 0.78,
                depthWrite: false,
                side: THREE.DoubleSide
            });
        }
        return caches.shore[key];
    }

    function updateMainDirectionalShadowFocus(sharedMaterials, focusX, focusY, focusZ) {
        const materials = requireSharedMaterials(sharedMaterials);
        const dirLight = materials.mainDirectionalShadowLight;
        const dirLightTarget = materials.mainDirectionalShadowTarget;
        const shadowConfig = materials.mainDirectionalShadowConfig;
        if (!dirLight || !dirLightTarget || !shadowConfig || !shadowConfig.enabled) return;

        const targetX = Number.isFinite(focusX) ? focusX : 0;
        const targetY = Number.isFinite(focusY) ? focusY : 0;
        const targetZ = Number.isFinite(focusZ) ? focusZ : 0;

        dirLight.position.set(
            targetX + shadowConfig.offsetX,
            targetY + shadowConfig.height,
            targetZ + shadowConfig.offsetZ
        );
        dirLightTarget.position.set(targetX, targetY, targetZ);
        dirLight.updateMatrixWorld();
        dirLightTarget.updateMatrixWorld();
        dirLight.shadow.camera.updateMatrixWorld();
    }

    function createSkyDomeMaterial(three, cloudTexture, sunDirection) {
        const THREE = requireThree(three);
        return new THREE.ShaderMaterial({
            side: THREE.BackSide,
            depthWrite: false,
            depthTest: false,
            fog: false,
            transparent: false,
            toneMapped: false,
            uniforms: {
                uTime: { value: 0 },
                uZenithColor: { value: new THREE.Color(0x5ea8f7) },
                uUpperSkyColor: { value: new THREE.Color(0x8fcaff) },
                uHorizonColor: { value: new THREE.Color(0xc7e4ff) },
                uHazeColor: { value: new THREE.Color(0xe0f0ff) },
                uSunColor: { value: new THREE.Color(0xfff2bf) },
                uCloudTexture: { value: cloudTexture || null },
                uSunDirection: { value: sunDirection ? sunDirection.clone() : new THREE.Vector3(0.3, 0.85, 0.2).normalize() }
            },
            vertexShader: `
                    varying vec3 vSkyDirection;
                    void main() {
                        vSkyDirection = normalize(position);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
            fragmentShader: `
                    uniform float uTime;
                    uniform vec3 uZenithColor;
                    uniform vec3 uUpperSkyColor;
                    uniform vec3 uHorizonColor;
                    uniform vec3 uHazeColor;
                    uniform vec3 uSunColor;
                    uniform sampler2D uCloudTexture;
                    uniform vec3 uSunDirection;
                    varying vec3 vSkyDirection;

                    const float PI = 3.141592653589793;

                    void main() {
                        vec3 skyDir = normalize(vSkyDirection);
                        float elevation = clamp((skyDir.y * 0.5) + 0.5, 0.0, 1.0);
                        float horizonGlow = 1.0 - smoothstep(0.05, 0.44, abs(skyDir.y));
                        float upperBlend = smoothstep(0.12, 0.42, elevation);
                        float zenithBlend = smoothstep(0.45, 0.98, elevation);
                        float lowerFade = smoothstep(-0.34, 0.12, skyDir.y);

                        vec3 color = mix(uHazeColor, uUpperSkyColor, upperBlend);
                        color = mix(color, uZenithColor, zenithBlend);
                        color = mix(color, uHorizonColor, horizonGlow * 0.72);
                        color = mix(uHazeColor, color, lowerFade);

                        float sunAmount = max(dot(skyDir, normalize(uSunDirection)), 0.0);
                        float sunHalo = pow(sunAmount, 12.0);
                        float sunCore = pow(sunAmount, 64.0);
                        color += uSunColor * ((sunHalo * 0.28) + (sunCore * 0.18));

                        float cloudU = (atan(skyDir.z, skyDir.x) / (2.0 * PI)) + 0.5;
                        float cloudV = clamp((skyDir.y * 0.5) + 0.5, 0.0, 1.0);
                        vec2 uvA = vec2((cloudU * 1.05) + (uTime * 0.0018), cloudV * 1.75);
                        vec2 uvB = vec2((cloudU * 1.55) - (uTime * 0.0026), (cloudV * 2.35) + 0.11);
                        float cloudSampleA = texture2D(uCloudTexture, uvA).r;
                        float cloudSampleB = texture2D(uCloudTexture, uvB).r;
                        float cloudShape = smoothstep(0.55, 0.80, (cloudSampleA * 0.62) + (cloudSampleB * 0.38));
                        float cloudFade = smoothstep(-0.02, 0.22, skyDir.y);
                        float cloudAmount = cloudShape * cloudFade * 0.22;
                        vec3 cloudColor = mix(vec3(1.0), uHazeColor, 0.2);
                        color = mix(color, cloudColor, cloudAmount);

                        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
                    }
                `
        });
    }

    function initSkyRuntime(options) {
        const THREE = requireThree(options && options.THREE);
        const scene = options && options.scene;
        const camera = options && options.camera;
        const sharedMaterials = requireSharedMaterials(options && options.sharedMaterials);
        const buildSkyCloudNoiseCanvas = options && options.buildSkyCloudNoiseCanvas;
        const shadowConfig = options && options.shadowConfig ? options.shadowConfig : MAIN_DIRECTIONAL_SHADOW_CONFIG;
        if (!scene || !camera || typeof buildSkyCloudNoiseCanvas !== 'function') return null;

        const existing = sharedMaterials.skyRuntime || null;
        if (existing && existing.mesh && existing.mesh.parent) existing.mesh.parent.remove(existing.mesh);
        if (existing && existing.mesh && existing.mesh.geometry && typeof existing.mesh.geometry.dispose === 'function') existing.mesh.geometry.dispose();
        if (existing && existing.material && typeof existing.material.dispose === 'function') existing.material.dispose();
        if (existing && existing.cloudTexture && typeof existing.cloudTexture.dispose === 'function') existing.cloudTexture.dispose();

        const cloudTexture = new THREE.CanvasTexture(buildSkyCloudNoiseCanvas(512));
        cloudTexture.wrapS = THREE.RepeatWrapping;
        cloudTexture.wrapT = THREE.RepeatWrapping;
        cloudTexture.magFilter = THREE.LinearFilter;
        cloudTexture.minFilter = THREE.LinearMipmapLinearFilter;
        cloudTexture.generateMipmaps = true;
        cloudTexture.needsUpdate = true;

        const sunDirection = new THREE.Vector3(
            shadowConfig.offsetX,
            shadowConfig.height,
            shadowConfig.offsetZ
        ).normalize();
        const material = createSkyDomeMaterial(THREE, cloudTexture, sunDirection);
        const skyRadius = Math.max(1, camera.far - 20);
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(skyRadius, 24, 16), material);
        mesh.frustumCulled = false;
        mesh.renderOrder = -1000;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.position.copy(camera.position);
        scene.add(mesh);

        sharedMaterials.skyRuntime = {
            cloudTexture,
            material,
            mesh,
            sunDirection
        };
        return sharedMaterials.skyRuntime;
    }

    function updateSkyRuntime(sharedMaterials, cameraPosition, frameNowMs) {
        const materials = requireSharedMaterials(sharedMaterials);
        const skyRuntime = materials.skyRuntime || null;
        if (!skyRuntime || !skyRuntime.mesh || !skyRuntime.material || !skyRuntime.material.uniforms) return;

        if (cameraPosition && typeof skyRuntime.mesh.position.copy === 'function') {
            skyRuntime.mesh.position.copy(cameraPosition);
        }
        if (skyRuntime.material.uniforms.uTime) {
            skyRuntime.material.uniforms.uTime.value = Number.isFinite(frameNowMs) ? frameNowMs * 0.001 : 0;
        }
    }

    window.WorldRenderRuntime = {
        MAIN_DIRECTIONAL_SHADOW_CONFIG,
        buildWaterMaterialKey,
        createWaterShorelineRibbonMaterial,
        createWaterSurfaceMaterial,
        createSkyDomeMaterial,
        getWaterMaterialCaches,
        getWaterFringeMaterial,
        getWaterShorelineRibbonMaterial,
        getWaterSurfaceMaterial,
        getWaterShoreMaterial,
        initSkyRuntime,
        updateMainDirectionalShadowFocus,
        updateSkyRuntime
    };
})();
