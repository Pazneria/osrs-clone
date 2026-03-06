(function () {
    function registerAllSkills() {
        if (!window.SkillRuntime || typeof SkillRuntime.registerSkillModule !== 'function') return;
        const modules = window.SkillModules || {};
        const manifest = window.SkillManifest || {};
        const ordered = Array.isArray(manifest.orderedSkillIds) ? manifest.orderedSkillIds : Object.keys(modules);

        for (let i = 0; i < ordered.length; i++) {
            const skillId = ordered[i];
            const module = modules[skillId];
            if (!module) continue;
            SkillRuntime.registerSkillModule(skillId, module);
        }
    }

    registerAllSkills();
})();
