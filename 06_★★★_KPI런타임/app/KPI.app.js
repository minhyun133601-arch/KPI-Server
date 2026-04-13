        bindBackspaceGoHomeHotkey();
        bindGlobalSaveButton();
        bindGlobalSaveHotkey();
        bindGlobalSaveRefreshHooks();
        bindRuntimeAuthUi();
        bindOwnerRecordsUi();
        renderRuntimeAuthUi();
        renderGlobalSaveUi({ forceDefault: true });
        renderOwnerRecordsView();
        KpiRuntime?.runBootTasks?.();
        goHome();

