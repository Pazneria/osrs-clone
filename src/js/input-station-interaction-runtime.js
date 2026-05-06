(function () {
    function getFurnaceStationInfo(options = {}, tx, ty, z = 0) {
        const furnacesToRender = Array.isArray(options.furnacesToRender) ? options.furnacesToRender : [];
        for (let i = 0; i < furnacesToRender.length; i++) {
            const station = furnacesToRender[i];
            if (!station || station.z !== z) continue;
            const w = Number.isFinite(station.footprintW) ? Math.max(1, Math.round(station.footprintW)) : 1;
            const d = Number.isFinite(station.footprintD) ? Math.max(1, Math.round(station.footprintD)) : 1;
            const centerX = station.x + Math.floor((w - 1) / 2);
            const centerY = station.y + Math.floor((d - 1) / 2);
            const inside = tx >= station.x && tx < station.x + w && ty >= station.y && ty < station.y + d;
            if ((tx === centerX && ty === centerY) || inside) {
                return {
                    station,
                    x: station.x,
                    y: station.y,
                    centerX,
                    centerY,
                    w,
                    d
                };
            }
        }
        return null;
    }

    function getStationFootprint(options = {}, targetObj, tx, ty, z = 0) {
        if (targetObj !== 'FURNACE') return { w: 1, d: 1 };
        const info = getFurnaceStationInfo(options, tx, ty, z);
        if (info) return { w: info.w, d: info.d };
        return { w: 1, d: 1 };
    }

    function getStationFacingYaw(options = {}, targetObj, tx, ty, z = 0) {
        const stations = targetObj === 'FURNACE'
            ? options.furnacesToRender
            : (targetObj === 'ANVIL' ? options.anvilsToRender : null);
        if (!Array.isArray(stations)) return 0;

        if (targetObj === 'FURNACE') {
            const info = getFurnaceStationInfo(options, tx, ty, z);
            if (info && info.station && Number.isFinite(info.station.facingYaw)) return info.station.facingYaw;
            return 0;
        }

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
            const info = getFurnaceStationInfo(options, tx, ty, z);
            const anchorX = info ? info.x : tx;
            const anchorY = info ? info.y : ty;
            const footprint = info ? { w: info.w, d: info.d } : getStationFootprint(options, targetObj, tx, ty, z);
            if (footprint.w === 1 && footprint.d === 1) {
                return [{ x: anchorX + front.dx, y: anchorY + front.dy }];
            }
            if (front.dx !== 0) {
                const fx = front.dx > 0 ? (anchorX + footprint.w) : (anchorX - 1);
                const centerY = anchorY + Math.floor((footprint.d - 1) / 2);
                return [{ x: fx, y: centerY }];
            }
            const fy = front.dy > 0 ? (anchorY + footprint.d) : (anchorY - 1);
            const centerX = anchorX + Math.floor((footprint.w - 1) / 2);
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
        getFurnaceStationInfo,
        getStationFacingYaw,
        resolveCardinalStepFromYaw,
        resolveCardinalFacingStep,
        getStationInteractionFacingStep,
        resolveInteractionFacingRotation,
        getStationApproachPositions,
        validateStationApproach
    };
})();
