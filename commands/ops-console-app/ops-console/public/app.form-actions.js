export function createOpsFormBuilders(deps) {
  const { $, buildField, commandIconMap, commandLabel, commandTitle, compactDescription, createIcon, executeCommand, getCommand, localizeField, setResult, t } = deps;
  function closeScheduleModal() {
    $('scheduleModal').hidden = true;
    document.body.classList.remove('modal-open');
  }
  function openScheduleModal() {
    const command = getCommand('system.scheduleShutdown');
    if (!command) {
      setResult(t('scheduleNotLoaded'));
      return;
    }
    $('scheduleModalTitle').textContent = commandTitle(command);
    $('scheduleModalDescription').textContent = compactDescription(command);
    const form = $('scheduleModalForm');
    form.innerHTML = '';
    const groupedFields = [];
    const localizedFields = (command.fields || []).map((field) => localizeField(command, field));
    for (let index = 0; index < localizedFields.length; index += 2) {
      groupedFields.push(localizedFields.slice(index, index + 2));
    }
    for (const group of groupedFields) {
      const row = document.createElement('div');
      row.className = 'field-row';
      if (group.length === 1) {
        row.classList.add('field-row-single');
      }
      for (const field of group) {
        const label = document.createElement('label');
        const labelText = document.createElement('span');
        labelText.textContent = field.label;
        label.appendChild(labelText);
        label.appendChild(buildField(field));
        row.appendChild(label);
      }
      form.appendChild(row);
    }
    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'secondary-button';
    closeButton.textContent = t('closeLabel');
    closeButton.addEventListener('click', closeScheduleModal);
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'primary-button';
    submitButton.textContent = commandLabel(command);
    actions.append(closeButton, submitButton);
    form.appendChild(actions);
    form.onsubmit = async (event) => {
      event.preventDefault();
      const payload = {};
      for (const field of localizedFields) {
        const value = form.elements[field.name]?.value ?? '';
        payload[field.name] = String(value).trim();
      }
      submitButton.disabled = true;
      closeButton.disabled = true;
      try {
        const result = await executeCommand(command, payload, {
          onSuccess: () => {
            closeScheduleModal();
          }
        });
        if (result) {
          form.reset();
        }
      } catch (error) {
        setResult(t('scriptFailed', { title: commandTitle(command) }), error.message);
      } finally {
        submitButton.disabled = false;
        closeButton.disabled = false;
      }
    };
    $('scheduleModal').hidden = false;
    document.body.classList.add('modal-open');
  }
  function buildFormItem(command) {
    const wrapper = document.createElement('details');
    wrapper.className = 'form-disclosure';
    const summary = document.createElement('summary');
    const summaryText = document.createElement('div');
    summaryText.className = 'form-summary-text';
    const summaryHead = document.createElement('div');
    summaryHead.className = 'action-copy-head';
    summaryHead.appendChild(createIcon(commandIconMap[command.key] || 'spark', 'action-icon'));
    const title = document.createElement('strong');
    title.textContent = commandTitle(command);
    summaryHead.appendChild(title);
    summaryText.appendChild(summaryHead);
    const description = document.createElement('span');
    description.textContent = compactDescription(command);
    summaryText.appendChild(description);
    const toggle = document.createElement('span');
    toggle.className = 'form-summary-toggle';
    toggle.textContent = t('openLabel');
    summary.appendChild(summaryText);
    summary.appendChild(toggle);
    wrapper.appendChild(summary);
    const body = document.createElement('div');
    body.className = 'form-body';
    const form = document.createElement('form');
    form.className = 'field-grid';
    const groupedFields = [];
    const localizedFields = (command.fields || []).map((field) => localizeField(command, field));
    for (let index = 0; index < localizedFields.length; index += 2) {
      groupedFields.push(localizedFields.slice(index, index + 2));
    }
    for (const group of groupedFields) {
      const row = document.createElement('div');
      row.className = 'field-row';
      if (group.length === 1) {
        row.classList.add('field-row-single');
      }
      for (const field of group) {
        const label = document.createElement('label');
        const labelText = document.createElement('span');
        labelText.textContent = field.label;
        label.appendChild(labelText);
        label.appendChild(buildField(field));
        row.appendChild(label);
      }
      form.appendChild(row);
    }
    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = command.key.includes('delete') ? 'secondary-button' : 'primary-button';
    button.textContent = commandLabel(command);
    actions.appendChild(button);
    form.appendChild(actions);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      button.disabled = true;
      const payload = {};
      for (const field of localizedFields) {
        const value = form.elements[field.name]?.value ?? '';
        payload[field.name] = String(value).trim();
      }
      try {
        const result = await executeCommand(command, payload, {
          onSuccess: () => {
            form.reset();
            wrapper.open = false;
          }
        });
        if (!result) {
          return;
        }
      } catch (error) {
        setResult(t('scriptFailed', { title: commandTitle(command) }), error.message);
      } finally {
        button.disabled = false;
      }
    });
    body.appendChild(form);
    wrapper.appendChild(body);
    const syncToggleLabel = () => {
      toggle.textContent = wrapper.open ? t('closeLabel') : t('openLabel');
    };
    wrapper.addEventListener('toggle', syncToggleLabel);
    syncToggleLabel();
    return wrapper;
  }

  return { closeScheduleModal, openScheduleModal, buildFormItem };
}
