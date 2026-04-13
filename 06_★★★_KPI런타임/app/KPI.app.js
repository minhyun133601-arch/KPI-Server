        bindBackspaceGoHomeHotkey();
        bindGlobalSaveButton();
        bindGlobalSaveHotkey();
        bindGlobalSaveRefreshHooks();
        bindRuntimeAuthUi();
        bindOwnerRecordsUi();
        renderRuntimeAuthUi();
        renderGlobalSaveUi({ forceDefault: true });
        renderOwnerRecordsPanel();
        KpiRuntime?.runBootTasks?.();
        goHome();

