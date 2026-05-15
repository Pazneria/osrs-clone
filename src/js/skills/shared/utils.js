(function () {
    function rollChance(chance, rng) {
        const randomFn = typeof rng === 'function' ? rng : Math.random;
        return randomFn() < chance;
    }

    window.SkillSharedUtils = {
        rollChance
    };
})();
