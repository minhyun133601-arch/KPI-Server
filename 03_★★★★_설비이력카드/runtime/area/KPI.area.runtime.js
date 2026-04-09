(function registerAreaRuntime() {
    const runtime = window.KpiRuntime;
    if (!runtime) return;

    function resolveAreaSaveState(context = {}) {
        const activeState = window.AreaMapState?.active;
        if (activeState) return activeState;
        const root = context.container || document;
        const shells = Array.from(root?.querySelectorAll?.('.area-map-shell') || []);
        const shellState = shells.map(shell => shell?.__areaState).find(Boolean) || null;
        if (shellState && typeof AreaMapState !== 'undefined') {
            AreaMapState.active = shellState;
        }
        return shellState;
    }

    runtime.registerDefaultContentDecorator('equip', (category) => {
        return renderEquipRoomBar(category) || '';
    });

    runtime.registerViewChangeHandler('area-shells', ({ container }) => {
        const root = container || document;
        const areaShells = Array.from(root.querySelectorAll('.area-map-shell'));
        if (!areaShells.length) {
            if (typeof AreaMapState !== 'undefined') {
                AreaMapState.active = null;
            }
            return;
        }
        areaShells.forEach(shell => {
            initAreaMapEditor(shell);
        });
    });

    runtime.registerSaveProvider('equip-area-save', (context = {}) => {
        if (context.sectionId !== 'equip') return null;
        const state = resolveAreaSaveState(context);
        if (!state || typeof saveAreaMapToStorage !== 'function') return null;
        const serverRuntime = typeof getAreaServerRuntimeConfig === 'function'
            ? getAreaServerRuntimeConfig(state.templateId)
            : null;
        const canWrite = runtime.canUseServerWrite(serverRuntime?.writeEnabled === true);
        return {
            priority: 95,
            canSave: canWrite,
            buttonLabel: '저장',
            historyLabel: '설비 배치도 저장',
            title: '설비 배치도 저장',
            statusText: canWrite
                ? '현재 설비 배치도를 중앙 서버에 저장합니다.'
                : '서버 기록이 가능한 환경에서만 설비 배치도를 저장할 수 있습니다.',
            perform: async () => {
                if (!canWrite) return false;
                return saveAreaMapToStorage(state);
            }
        };
    });
})();
