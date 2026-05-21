(function () {
    const SECTION_ORDER = ['work', 'data', 'report', 'experiment', 'owner'];

    function registerSections(AppData) {
        const factories = KpiSectionFactoryAdapter.getFactories();
        SECTION_ORDER.forEach(sectionKey => {
            const factory = factories[sectionKey];
            if (typeof factory === 'function') {
                AppData[sectionKey] = factory();
            }
        });
        return AppData;
    }

    KpiSectionFactoryAdapter.setRegistry(Object.freeze({
        registerSections
    }));
})();
