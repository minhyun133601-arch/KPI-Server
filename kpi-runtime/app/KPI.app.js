        bindBackspaceGoHomeHotkey();
        bindGlobalSaveButton();
        bindGlobalSaveHotkey();
        bindGlobalSaveRefreshHooks();
        bindRuntimeAuthUi();
        renderGlobalSaveUi({ forceDefault: true });
        KpiRuntime?.runBootTasks?.();
        renderRuntimeAuthUi();
        goHome();
