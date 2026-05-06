(function () {
    const NPC_HUMANOID_RIG_CACHE = new Map();
    const NPC_BODY_COLORS = [0, 0, 0, 0, 0];

    function getPackJagexHsl(options = {}) {
        if (typeof options.packJagexHsl === 'function') return options.packJagexHsl;
        const visualRuntime = window.PlayerModelVisualRuntime || null;
        if (visualRuntime && typeof visualRuntime.packJagexHsl === 'function') return visualRuntime.packJagexHsl;
        return (h, s, l) => ((h & 63) << 10) | ((s & 7) << 7) | (l & 127);
    }

    function normalizeNpcHumanoidId(value) {
        return typeof value === 'string' ? value.trim().toLowerCase() : '';
    }

    function getNpcAppearanceCatalog() {
        const catalog = window.NpcAppearanceCatalog || null;
        return catalog && typeof catalog === 'object' ? catalog : null;
    }

    function getNpcAppearancePresetMap() {
        const catalog = getNpcAppearanceCatalog();
        return catalog && catalog.presets && typeof catalog.presets === 'object' ? catalog.presets : {};
    }

    function resolveCatalogNpcHumanoidPresetId(presetId) {
        const normalizedPresetId = normalizeNpcHumanoidId(presetId);
        if (!normalizedPresetId) return '';
        const presets = getNpcAppearancePresetMap();
        const catalog = getNpcAppearanceCatalog();
        const aliases = catalog && catalog.aliases && typeof catalog.aliases === 'object' ? catalog.aliases : {};
        const aliasedPresetId = normalizeNpcHumanoidId(aliases[normalizedPresetId]);
        if (aliasedPresetId && presets[aliasedPresetId]) return aliasedPresetId;
        return presets[normalizedPresetId] ? normalizedPresetId : '';
    }

    function getCatalogNpcHumanoidPreset(presetId) {
        const catalogPresetId = resolveCatalogNpcHumanoidPresetId(presetId);
        if (!catalogPresetId) return null;
        return getNpcAppearancePresetMap()[catalogPresetId] || null;
    }

    function normalizeNpcHumanoidPresetId(presetId) {
        const normalizedPresetId = normalizeNpcHumanoidId(presetId);
        const catalogPresetId = resolveCatalogNpcHumanoidPresetId(normalizedPresetId);
        if (catalogPresetId) return catalogPresetId;
        if (normalizedPresetId === 'tanner') return 'tanner_rusk';
        if (normalizedPresetId === 'goblin' || normalizedPresetId === 'guard' || normalizedPresetId === 'tanner_rusk') return normalizedPresetId;
        return '';
    }

    function createLiteralRgbFragment(options, target, shape, size, offset, rgbColor, extras) {
        const fragment = {
            target,
            shape,
            size: Array.isArray(size) ? size.slice() : [0.1, 0.1, 0.1],
            offset: Array.isArray(offset) ? offset.slice() : [0, 0, 0],
            color: getPackJagexHsl(options)(0, 0, 64),
            rgbColor: typeof rgbColor === 'string' ? rgbColor : '#ffffff'
        };
        if (extras && typeof extras === 'object') Object.assign(fragment, extras);
        return fragment;
    }

    function createGoblinHumanoidFragments(options = {}) {
        const skin = '#6fa74d';
        const skinDark = '#4f7c36';
        const tunic = '#7a4c2d';
        const tunicDark = '#53311b';
        const cloth = '#6f6044';
        const foot = '#3d3327';
        const eye = '#111111';
        return [
            createLiteralRgbFragment(options, 'head', 'box', [0.42, 0.4, 0.36], [0, 0.0, 0.0], skin),
            createLiteralRgbFragment(options, 'head', 'box', [0.34, 0.08, 0.1], [0, 0.1, 0.13], skinDark),
            createLiteralRgbFragment(options, 'head', 'box', [0.14, 0.1, 0.17], [0, -0.02, 0.19], skinDark),
            createLiteralRgbFragment(options, 'head', 'box', [0.08, 0.24, 0.08], [0.24, 0.06, -0.02], skin, {
                rotation: [0, 0, -0.46]
            }),
            createLiteralRgbFragment(options, 'head', 'box', [0.08, 0.24, 0.08], [-0.24, 0.06, -0.02], skin, {
                rotation: [0, 0, 0.46]
            }),
            createLiteralRgbFragment(options, 'head', 'box', [0.045, 0.045, 0.03], [0.09, 0.03, 0.19], eye),
            createLiteralRgbFragment(options, 'head', 'box', [0.045, 0.045, 0.03], [-0.09, 0.03, 0.19], eye),
            createLiteralRgbFragment(options, 'torso', 'box', [0.56, 0.5, 0.34], [0, 0, 0], tunic),
            createLiteralRgbFragment(options, 'torso', 'box', [0.42, 0.24, 0.12], [0, -0.02, 0.11], tunicDark),
            createLiteralRgbFragment(options, 'torso', 'box', [0.3, 0.14, 0.08], [0, -0.18, 0.12], cloth),
            createLiteralRgbFragment(options, 'leftArm', 'box', [0.2, 0.28, 0.2], [0, -0.14, -0.02], tunic),
            createLiteralRgbFragment(options, 'rightArm', 'box', [0.2, 0.28, 0.2], [0, -0.14, -0.02], tunic),
            createLiteralRgbFragment(options, 'leftLowerArm', 'box', [0.17, 0.28, 0.17], [0, -0.14, 0], skin),
            createLiteralRgbFragment(options, 'rightLowerArm', 'box', [0.17, 0.28, 0.17], [0, -0.14, 0], skin),
            createLiteralRgbFragment(options, 'leftLeg', 'box', [0.2, 0.32, 0.22], [0, -0.16, 0], cloth),
            createLiteralRgbFragment(options, 'rightLeg', 'box', [0.2, 0.32, 0.22], [0, -0.16, 0], cloth),
            createLiteralRgbFragment(options, 'leftLowerLeg', 'box', [0.18, 0.28, 0.18], [0, -0.14, 0], skinDark),
            createLiteralRgbFragment(options, 'rightLowerLeg', 'box', [0.18, 0.28, 0.18], [0, -0.14, 0], skinDark),
            createLiteralRgbFragment(options, 'leftLowerLeg', 'box', [0.2, 0.1, 0.28], [0, -0.26, 0.05], foot),
            createLiteralRgbFragment(options, 'rightLowerLeg', 'box', [0.2, 0.1, 0.28], [0, -0.26, 0.05], foot)
        ];
    }

    function createGuardHumanoidFragments(options = {}) {
        const steel = '#8e98a2';
        const steelDark = '#5e6871';
        const steelTrim = '#d0b05a';
        const tabard = '#274f86';
        const tabardDark = '#17365e';
        const cloth = '#6d5c3c';
        const leather = '#4b3f2e';
        const wood = '#6b4a2e';
        const boot = '#2f261c';
        return [
            createLiteralRgbFragment(options, 'head', 'box', [0.5, 0.4, 0.42], [0, 0.08, 0], steel),
            createLiteralRgbFragment(options, 'head', 'box', [0.38, 0.12, 0.2], [0, 0.05, 0.18], steelDark),
            createLiteralRgbFragment(options, 'head', 'box', [0.18, 0.08, 0.16], [0, 0.16, 0.2], steelTrim),
            createLiteralRgbFragment(options, 'head', 'box', [0.12, 0.16, 0.08], [0.18, 0.08, -0.02], steelTrim, {
                rotation: [0, 0, -0.28]
            }),
            createLiteralRgbFragment(options, 'head', 'box', [0.12, 0.16, 0.08], [-0.18, 0.08, -0.02], steelTrim, {
                rotation: [0, 0, 0.28]
            }),
            createLiteralRgbFragment(options, 'torso', 'box', [0.64, 0.5, 0.38], [0, 0.01, 0], steel),
            createLiteralRgbFragment(options, 'torso', 'box', [0.46, 0.36, 0.2], [0, 0, 0.08], tabard),
            createLiteralRgbFragment(options, 'torso', 'box', [0.34, 0.1, 0.12], [0, -0.18, 0.08], tabardDark),
            createLiteralRgbFragment(options, 'torso', 'box', [0.22, 0.08, 0.16], [0, -0.28, 0.08], leather),
            createLiteralRgbFragment(options, 'torso', 'box', [0.52, 0.1, 0.16], [0, 0.2, 0.05], steelTrim),
            createLiteralRgbFragment(options, 'leftArm', 'box', [0.26, 0.2, 0.26], [0.03, 0.08, 0.01], steel),
            createLiteralRgbFragment(options, 'rightArm', 'box', [0.26, 0.2, 0.26], [-0.03, 0.08, 0.01], steel),
            createLiteralRgbFragment(options, 'leftLowerArm', 'box', [0.2, 0.3, 0.18], [0, -0.08, 0], leather),
            createLiteralRgbFragment(options, 'rightLowerArm', 'box', [0.2, 0.3, 0.18], [0, -0.08, 0], leather),
            createLiteralRgbFragment(options, 'leftLowerArm', 'box', [0.46, 0.52, 0.08], [0.22, -0.01, 0.03], wood, {
                rotation: [0, 0, 0.14]
            }),
            createLiteralRgbFragment(options, 'leftLowerArm', 'box', [0.28, 0.34, 0.04], [0.2, 0, 0.08], steel, {
                rotation: [0, 0, 0.12]
            }),
            createLiteralRgbFragment(options, 'rightLowerArm', 'box', [0.08, 0.64, 0.08], [0.14, -0.02, 0], wood, {
                rotation: [0, 0, 0.24]
            }),
            createLiteralRgbFragment(options, 'rightLowerArm', 'box', [0.1, 0.16, 0.1], [0.15, -0.3, 0], steelTrim, {
                rotation: [0, 0, 0.24]
            }),
            createLiteralRgbFragment(options, 'leftLeg', 'box', [0.22, 0.34, 0.24], [0.01, -0.12, 0], cloth),
            createLiteralRgbFragment(options, 'rightLeg', 'box', [0.22, 0.34, 0.24], [-0.01, -0.12, 0], cloth),
            createLiteralRgbFragment(options, 'leftLowerLeg', 'box', [0.2, 0.26, 0.2], [0, -0.12, 0], steelDark),
            createLiteralRgbFragment(options, 'rightLowerLeg', 'box', [0.2, 0.26, 0.2], [0, -0.12, 0], steelDark),
            createLiteralRgbFragment(options, 'leftLowerLeg', 'box', [0.22, 0.1, 0.3], [0, -0.26, 0.05], boot),
            createLiteralRgbFragment(options, 'rightLowerLeg', 'box', [0.22, 0.1, 0.3], [0, -0.26, 0.05], boot)
        ];
    }

    function createTannerHumanoidFragments(options = {}) {
        const skin = '#d6a37a';
        const skinDark = '#8e5f44';
        const hair = '#5a3926';
        const beard = '#4a2f20';
        const shirt = '#6f8b5e';
        const shirtDark = '#4d6341';
        const apron = '#9d6b3c';
        const apronDark = '#6f4726';
        const trousers = '#53483d';
        const boot = '#34281f';
        const glove = '#7b5632';
        return [
            createLiteralRgbFragment(options, 'head', 'box', [0.46, 0.42, 0.38], [0, 0.01, 0], skin),
            createLiteralRgbFragment(options, 'head', 'box', [0.38, 0.12, 0.24], [0, 0.14, 0.05], hair),
            createLiteralRgbFragment(options, 'head', 'box', [0.14, 0.08, 0.18], [0, -0.1, 0.18], beard),
            createLiteralRgbFragment(options, 'head', 'box', [0.1, 0.06, 0.08], [0.15, 0.06, 0.16], skinDark),
            createLiteralRgbFragment(options, 'head', 'box', [0.1, 0.06, 0.08], [-0.15, 0.06, 0.16], skinDark),
            createLiteralRgbFragment(options, 'torso', 'box', [0.6, 0.48, 0.34], [0, 0, 0], shirt),
            createLiteralRgbFragment(options, 'torso', 'box', [0.46, 0.24, 0.18], [0, -0.02, 0.09], shirtDark),
            createLiteralRgbFragment(options, 'torso', 'box', [0.42, 0.42, 0.28], [0, -0.04, 0.04], apron),
            createLiteralRgbFragment(options, 'torso', 'box', [0.3, 0.14, 0.14], [0, 0.16, 0.08], apronDark),
            createLiteralRgbFragment(options, 'torso', 'box', [0.16, 0.08, 0.1], [0, -0.2, 0.12], glove),
            createLiteralRgbFragment(options, 'leftArm', 'box', [0.22, 0.3, 0.2], [0.02, -0.03, 0], shirt),
            createLiteralRgbFragment(options, 'rightArm', 'box', [0.22, 0.3, 0.2], [-0.02, -0.03, 0], shirt),
            createLiteralRgbFragment(options, 'leftLowerArm', 'box', [0.18, 0.28, 0.18], [0, -0.1, 0], skin),
            createLiteralRgbFragment(options, 'rightLowerArm', 'box', [0.18, 0.28, 0.18], [0, -0.1, 0], skin),
            createLiteralRgbFragment(options, 'leftLowerArm', 'box', [0.12, 0.18, 0.12], [0.01, -0.26, 0.02], glove),
            createLiteralRgbFragment(options, 'rightLowerArm', 'box', [0.12, 0.18, 0.12], [-0.01, -0.26, 0.02], glove),
            createLiteralRgbFragment(options, 'leftLeg', 'box', [0.22, 0.34, 0.24], [0.01, -0.1, 0], trousers),
            createLiteralRgbFragment(options, 'rightLeg', 'box', [0.22, 0.34, 0.24], [-0.01, -0.1, 0], trousers),
            createLiteralRgbFragment(options, 'leftLowerLeg', 'box', [0.18, 0.28, 0.18], [0, -0.12, 0], skinDark),
            createLiteralRgbFragment(options, 'rightLowerLeg', 'box', [0.18, 0.28, 0.18], [0, -0.12, 0], skinDark),
            createLiteralRgbFragment(options, 'leftLowerLeg', 'box', [0.22, 0.1, 0.3], [0, -0.26, 0.05], boot),
            createLiteralRgbFragment(options, 'rightLowerLeg', 'box', [0.22, 0.1, 0.3], [0, -0.26, 0.05], boot)
        ];
    }

    function getRigNodeMap(options = {}, rigRoot) {
        return typeof options.rigNodeMap === 'function' ? options.rigNodeMap(rigRoot) : {};
    }

    function cloneCatalogArray(value, fallback) {
        return Array.isArray(value) ? value.slice() : fallback.slice();
    }

    function createCatalogHumanoidFragments(options = {}, preset = {}) {
        const fragments = Array.isArray(preset.fragments) ? preset.fragments : [];
        return fragments.map((fragment) => {
            const cloned = fragment && typeof fragment === 'object' ? Object.assign({}, fragment) : {};
            cloned.target = typeof cloned.target === 'string' ? cloned.target : '';
            cloned.shape = typeof cloned.shape === 'string' ? cloned.shape : 'box';
            cloned.size = cloneCatalogArray(cloned.size, [0.1, 0.1, 0.1]);
            cloned.offset = cloneCatalogArray(cloned.offset, [0, 0, 0]);
            if (Array.isArray(cloned.rotation)) cloned.rotation = cloned.rotation.slice();
            if (Array.isArray(cloned.handleRelative)) cloned.handleRelative = cloned.handleRelative.slice();
            if (Array.isArray(cloned.origin)) cloned.origin = cloned.origin.slice();
            if (Array.isArray(cloned.localRotationAxis)) cloned.localRotationAxis = cloned.localRotationAxis.slice();
            if (!Number.isFinite(cloned.color)) cloned.color = getPackJagexHsl(options)(0, 0, 64);
            return cloned;
        }).filter((fragment) => fragment.target);
    }

    function setVec3FromArray(vec, value, fallback) {
        if (!vec || typeof vec.set !== 'function') return;
        const source = Array.isArray(value) ? value : fallback;
        const x = Number(source && source[0]);
        const y = Number(source && source[1]);
        const z = Number(source && source[2]);
        vec.set(
            Number.isFinite(x) ? x : fallback[0],
            Number.isFinite(y) ? y : fallback[1],
            Number.isFinite(z) ? z : fallback[2]
        );
    }

    function applyCatalogRigBasePose(options = {}, rigRoot, preset = {}) {
        const nodes = getRigNodeMap(options, rigRoot);
        const pose = preset && preset.pose && typeof preset.pose === 'object' ? preset.pose : {};
        const nodePose = pose.nodes && typeof pose.nodes === 'object' ? pose.nodes : {};
        setVec3FromArray(rigRoot.position, pose.rootPosition, [0, 0, 0]);
        if (Array.isArray(preset.scale)) {
            setVec3FromArray(rigRoot.scale, preset.scale, [1, 1, 1]);
        } else if (Number.isFinite(preset.scale) && rigRoot.scale && typeof rigRoot.scale.set === 'function') {
            rigRoot.scale.set(preset.scale, preset.scale, preset.scale);
        } else {
            setVec3FromArray(rigRoot.scale, [1, 1, 1], [1, 1, 1]);
        }
        Object.keys(nodePose).forEach((nodeName) => {
            if (!nodes[nodeName]) return;
            setVec3FromArray(nodes[nodeName].position, nodePose[nodeName], [0, 0, 0]);
        });
    }

    function applyTannerRigBasePose(options = {}, rigRoot) {
        const nodes = getRigNodeMap(options, rigRoot);
        if (!nodes.torso || !nodes.head || !nodes.leftArm || !nodes.rightArm || !nodes.leftLeg || !nodes.rightLeg) return;
        rigRoot.position.set(0, 0, 0);
        rigRoot.scale.set(0.99, 0.99, 0.99);
        nodes.torso.position.set(0, 1.01, 0);
        nodes.head.position.set(0, 0.5, 0);
        nodes.leftArm.position.set(0.36, 0.25, 0.02);
        nodes.rightArm.position.set(-0.36, 0.25, 0.02);
        if (nodes.leftLowerArm) nodes.leftLowerArm.position.set(0, -0.27, -0.02);
        if (nodes.rightLowerArm) nodes.rightLowerArm.position.set(0, -0.27, -0.02);
        nodes.leftLeg.position.set(0.16, 0.69, 0);
        nodes.rightLeg.position.set(-0.16, 0.69, 0);
        if (nodes.leftLowerLeg) nodes.leftLowerLeg.position.set(0, -0.31, 0);
        if (nodes.rightLowerLeg) nodes.rightLowerLeg.position.set(0, -0.31, 0);
    }

    function applyGoblinRigBasePose(options = {}, rigRoot) {
        const nodes = getRigNodeMap(options, rigRoot);
        if (!nodes.torso || !nodes.head || !nodes.leftArm || !nodes.rightArm || !nodes.leftLeg || !nodes.rightLeg) return;
        rigRoot.position.set(0, 0, 0);
        rigRoot.scale.set(0.94, 0.94, 0.94);
        nodes.torso.position.set(0, 0.98, 0);
        nodes.head.position.set(0, 0.42, 0.01);
        nodes.leftArm.position.set(0.34, 0.24, 0.06);
        nodes.rightArm.position.set(-0.34, 0.24, 0.06);
        if (nodes.leftLowerArm) nodes.leftLowerArm.position.set(0, -0.31, -0.06);
        if (nodes.rightLowerArm) nodes.rightLowerArm.position.set(0, -0.31, -0.06);
        nodes.leftLeg.position.set(0.13, 0.67, 0);
        nodes.rightLeg.position.set(-0.13, 0.67, 0);
        if (nodes.leftLowerLeg) nodes.leftLowerLeg.position.set(0, -0.31, 0);
        if (nodes.rightLowerLeg) nodes.rightLowerLeg.position.set(0, -0.31, 0);
    }

    function applyGuardRigBasePose(options = {}, rigRoot) {
        const nodes = getRigNodeMap(options, rigRoot);
        if (!nodes.torso || !nodes.head || !nodes.leftArm || !nodes.rightArm || !nodes.leftLeg || !nodes.rightLeg) return;
        rigRoot.position.set(0, 0, 0);
        rigRoot.scale.set(1.01, 1.01, 1.01);
        nodes.torso.position.set(0, 1.03, 0);
        nodes.head.position.set(0, 0.48, 0);
        nodes.leftArm.position.set(0.37, 0.28, 0.01);
        nodes.rightArm.position.set(-0.37, 0.28, 0.01);
        if (nodes.leftLowerArm) nodes.leftLowerArm.position.set(0, -0.28, -0.01);
        if (nodes.rightLowerArm) nodes.rightLowerArm.position.set(0, -0.28, -0.01);
        nodes.leftLeg.position.set(0.15, 0.69, 0);
        nodes.rightLeg.position.set(-0.15, 0.69, 0);
        if (nodes.leftLowerLeg) nodes.leftLowerLeg.position.set(0, -0.3, 0);
        if (nodes.rightLowerLeg) nodes.rightLowerLeg.position.set(0, -0.3, 0);
    }

    function buildNpcHumanoidRigTemplate(options = {}, presetId) {
        const normalizedPresetId = normalizeNpcHumanoidPresetId(presetId);
        if (!normalizedPresetId || typeof options.createRigBones !== 'function' || typeof options.addFragmentsToRig !== 'function') return null;
        const catalogPreset = getCatalogNpcHumanoidPreset(normalizedPresetId);
        const rigRoot = options.createRigBones(catalogPreset && catalogPreset.armRigDefaults ? catalogPreset.armRigDefaults : {
            elbowPivot: {
                x: 0,
                y: -0.31,
                z: -0.06
            }
        });
        if (!rigRoot) return null;

        if (catalogPreset) {
            applyCatalogRigBasePose(options, rigRoot, catalogPreset);
            options.addFragmentsToRig(rigRoot, createCatalogHumanoidFragments(options, catalogPreset), NPC_BODY_COLORS, []);
        } else if (normalizedPresetId === 'goblin') {
            applyGoblinRigBasePose(options, rigRoot);
            options.addFragmentsToRig(rigRoot, createGoblinHumanoidFragments(options), NPC_BODY_COLORS, []);
        } else if (normalizedPresetId === 'guard') {
            applyGuardRigBasePose(options, rigRoot);
            options.addFragmentsToRig(rigRoot, createGuardHumanoidFragments(options), NPC_BODY_COLORS, []);
        } else {
            applyTannerRigBasePose(options, rigRoot);
            options.addFragmentsToRig(rigRoot, createTannerHumanoidFragments(options), NPC_BODY_COLORS, []);
        }

        const nodes = getRigNodeMap(options, rigRoot);
        if (nodes.axe) nodes.axe.visible = false;
        if (nodes.leftTool) nodes.leftTool.visible = false;
        rigRoot.userData.baseY = 0;
        rigRoot.userData.npcPresetId = normalizedPresetId;
        return rigRoot;
    }

    function createNpcHumanoidRigFromPreset(options = {}, presetId) {
        const normalizedPresetId = normalizeNpcHumanoidPresetId(presetId);
        if (!normalizedPresetId || typeof options.bindRigUserData !== 'function') return null;
        let template = NPC_HUMANOID_RIG_CACHE.get(normalizedPresetId);
        if (!template) {
            template = buildNpcHumanoidRigTemplate(options, normalizedPresetId);
            if (!template) return null;
            NPC_HUMANOID_RIG_CACHE.set(normalizedPresetId, template);
        }
        const clone = template.clone(true);
        clone.userData.npcPresetId = normalizedPresetId;
        return options.bindRigUserData(clone);
    }

    function appendPreviewActor(actors, seen, actorId, label) {
        const normalizedActorId = normalizeNpcHumanoidId(actorId);
        if (!normalizedActorId || seen.has(normalizedActorId)) return;
        seen.add(normalizedActorId);
        actors.push({
            actorId: normalizedActorId,
            label: typeof label === 'string' && label.trim() ? label.trim() : normalizedActorId
        });
    }

    function appendCatalogPreviewActors(actors, seen) {
        const catalog = getNpcAppearanceCatalog();
        const presets = getNpcAppearancePresetMap();
        const previewActors = catalog && Array.isArray(catalog.previewActors) ? catalog.previewActors : [];
        previewActors.forEach((entry) => {
            if (!entry || typeof entry !== 'object') return;
            const presetId = resolveCatalogNpcHumanoidPresetId(entry.actorId);
            if (!presetId) return;
            const preset = presets[presetId] || {};
            appendPreviewActor(actors, seen, presetId, entry.label || preset.label);
        });
        Object.keys(presets).forEach((presetId) => {
            const preset = presets[presetId] || {};
            appendPreviewActor(actors, seen, presetId, preset.label);
        });
    }

    function listAnimationStudioPreviewActors() {
        const actors = [];
        const seen = new Set();
        appendPreviewActor(actors, seen, 'player', 'Player');
        appendCatalogPreviewActors(actors, seen);
        appendPreviewActor(actors, seen, 'goblin', 'Goblin');
        appendPreviewActor(actors, seen, 'guard', 'Guard');
        appendPreviewActor(actors, seen, 'tanner_rusk', 'Tanner Rusk');
        return actors;
    }

    function createAnimationStudioPreviewRig(options = {}, actorId) {
        const normalizedActorId = typeof actorId === 'string' ? actorId.trim().toLowerCase() : '';
        const npcPresetId = normalizeNpcHumanoidPresetId(normalizedActorId);
        if (npcPresetId) return createNpcHumanoidRigFromPreset(options, npcPresetId);
        return typeof options.createPlayerRigForAnimationStudio === 'function'
            ? options.createPlayerRigForAnimationStudio()
            : null;
    }

    function publishNpcHumanoidHooks(options = {}) {
        const windowRef = options.windowRef || (typeof window !== 'undefined' ? window : null);
        if (!windowRef) return;
        if (typeof options.createNpcHumanoidRigFromPreset === 'function') {
            windowRef.createNpcHumanoidRigFromPreset = options.createNpcHumanoidRigFromPreset;
        }
        if (typeof options.listAnimationStudioPreviewActors === 'function') {
            windowRef.listAnimationStudioPreviewActors = options.listAnimationStudioPreviewActors;
        }
        if (typeof options.createAnimationStudioPreviewRig === 'function') {
            windowRef.createAnimationStudioPreviewRig = options.createAnimationStudioPreviewRig;
        }
    }

    window.PlayerNpcHumanoidRuntime = {
        resolveCatalogNpcHumanoidPresetId,
        normalizeNpcHumanoidPresetId,
        createLiteralRgbFragment,
        createCatalogHumanoidFragments,
        createGoblinHumanoidFragments,
        createGuardHumanoidFragments,
        createTannerHumanoidFragments,
        applyCatalogRigBasePose,
        applyTannerRigBasePose,
        applyGoblinRigBasePose,
        applyGuardRigBasePose,
        buildNpcHumanoidRigTemplate,
        createNpcHumanoidRigFromPreset,
        listAnimationStudioPreviewActors,
        createAnimationStudioPreviewRig,
        publishNpcHumanoidHooks
    };
})();
