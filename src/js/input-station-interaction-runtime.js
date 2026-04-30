(function () {
    function getStationFootprint(options = {}, targetObj, tx, ty, z = 0) {
        if (targetObj !== 'FURNACE') return { w: 1, d: 1 };
        const furnacesToRender = Array.isArray(options.furnacesToRender) ? options.furnacesToRender : [];

        for (let i = 0; i < furnacesToRender.length; i++) {
            const station = furnacesToRender[i];
            if (!station || station.x !== tx || station.y !== ty || station.z !== z) continue;
            const w = Number.isFinite(station.footprintW) ? Math.max(1, Math.round(station.footprintW)) : 1;
            const d = Number.isFinite(station.footprintD) ? Math.max(1, Math.round(station.footprintD)) : 1;
            return { w, d };
        }
        return { w: 1, d: 1 };
    }

    function getStationFacingYaw(options = {}, targetObj, tx, ty, z = 0) {
        const stations = targetObj === 'FURNACE'
            ? options.furnacesToRender
            : (targetObj === 'ANVIL' ? options.anvilsToRender : null);
        if (!Array.isArray(stations)) return 0;

        for (let i = 0; i < stations.length; i++) {
            const station = stations[i];
            if (!station || station.x !== tx || station.y !== ty || station.z !== z) continue;
            if (Number.isFinite(station.facingYaw)) return station.facingYaw;
            break;
        }
        return 0;
    }

    function resolveCardinalStepFromYaw(yaw) {
        const y = Number.isFinite(yaw) ? yaw : 0;
        const sx = Math.sin(y);
        const sy = Math.cos(y);
        let dx = Math.round(sx);
        let dy = Math.round(sy);

        // Clamp any borderline diagonal rounding back to a cardinal step.
        if (Math.abs(dx) === Math.abs(dy)) {
            if (Math.abs(sx) >= Math.abs(sy)) dy = 0;
            else dx = 0;
        }
        if (dx === 0 && dy === 0) dy = 1;

        return { dx, dy };
    }

    function resolveCardinalFacingStep(fromX, fromY, toX, toY) {
        let dx = toX - fromX;
        let dy = toY - fromY;
        if (Math.abs(dx) >= Math.abs(dy)) {
            dx = Math.sign(dx);
            dy = 0;
        } else {
            dy = Math.sign(dy);
            dx = 0;
        }
        return { dx, dy };
    }

    function getStationInteractionFacingStep(options = {}, targetObj, tx, ty, px = 0, py = 0, z = 0) {
        if (targetObj === 'FURNACE') {
            const front = resolveCardinalStepFromYaw(getStationFacingYaw(options, targetObj, tx, ty, z));
            return { dx: -front.dx, dy: -front.dy };
        }
        return resolveCardinalFacingStep(px, py, tx, ty);
    }

    function resolveInteractionFacingRotation(options = {}, targetObj, tx, ty, px = 0, py = 0, z = 0) {
        if (targetObj !== 'FURNACE' && targetObj !== 'ANVIL') return null;
        const facingStep = getStationInteractionFacingStep(options, targetObj, tx, ty, px, py, z);
        if (facingStep.dx === 0 && facingStep.dy === 0) return null;
        return Math.atan2(facingStep.dx, facingStep.dy);
    }

    function getStationApproachPositions(options = {}, targetObj, tx, ty, z = 0) {
        if (targetObj !== 'FURNACE' && targetObj !== 'ANVIL') return [];

        const front = resolveCardinalStepFromYaw(getStationFacingYaw(options, targetObj, tx, ty, z));
        if (targetObj === 'FURNACE') {
            const footprint = getStationFootprint(options, targetObj, tx, ty, z);
            if (footprint.w === 1 && footprint.d === 1) {
                return [{ x: tx + front.dx, y: ty + front.dy }];
            }
            if (front.dx !== 0) {
                const fx = front.dx > 0 ? (tx + footprint.w) : (tx - 1);
                const centerY = ty + Math.floor((footprint.d - 1) / 2);
                return [{ x: fx, y: centerY }];
            }
            const fy = front.dy > 0 ? (ty + footprint.d) : (ty - 1);
            const centerX = tx + Math.floor((footprint.w - 1) / 2);
            return [{ x: centerX, y: fy }];
        }

        const long = { dx: front.dx, dy: front.dy };
        return [
            { x: tx + long.dx, y: ty + long.dy },
            { x: tx - long.dx, y: ty - long.dy }
        ];
    }

    function validateStationApproach(options = {}, targetObj, tx, ty, px, py, z = 0) {
        if (targetObj !== 'FURNACE' && targetObj !== 'ANVIL') return { ok: true, message: '' };

        const allowed = getStationApproachPositions(options, targetObj, tx, ty, z);
        for (let i = 0; i < allowed.length; i++) {
            const pos = allowed[i];
            if (pos.x === px && pos.y === py) return { ok: true, message: '' };
        }

        if (targetObj === 'FURNACE') {
            return { ok: false, message: 'You need to stand at the front of the furnace to use it.' };
        }
        return { ok: false, message: 'You need to stand on the long side of the anvil to use it.' };
    }

    window.InputStationInteractionRuntime = {
        getStationFootprint,
        getStationFacingYaw,
        resolveCardinalStepFromYaw,
        resolveCardinalFacingStep,
        getStationInteractionFacingStep,
        resolveInteractionFacingRotation,
        getStationApproachPositions,
        validateStationApproach
    };
})();
