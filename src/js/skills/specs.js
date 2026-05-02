/*
 * Compatibility marker for docs and older links. Runtime SkillSpecs are assembled
 * by the ordered classic-script shards under src/js/skills/specs/.
 */
(function () {
    if (typeof window === 'undefined') return;
    if (!window.SkillSpecs && window.__SkillSpecAuthoring) {
        throw new Error('Skill spec shards were initialized but not finalized. Load src/js/skills/specs/finalize.js.');
    }
})();
