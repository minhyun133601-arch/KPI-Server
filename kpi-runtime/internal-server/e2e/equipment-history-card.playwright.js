import { Buffer } from 'node:buffer';

import { expect, test } from '@playwright/test';

async function openEquipmentHistory(page) {
  const button = page
    .locator('#sidebar button')
    .filter({ hasText: /^\s*설비 이력\s*$/ })
    .first();
  await expect(button).toBeAttached();
  await button.evaluate((element) => element.click());
  await expect(page.locator('.data-equipment-page')).toBeVisible();
}

async function deleteEquipmentIfPresent(page, equipmentName) {
  await openEquipmentHistory(page);
  const currentName = page.locator('.data-equipment-title-name');
  if ((await currentName.count()) > 0 && (await currentName.inputValue().catch(() => '')) === equipmentName) {
    await page.locator('[data-equipment-delete-card]').click();
    await expect(page.locator('[data-equipment-view="board"]')).toBeVisible();
    return;
  }

  const boardButton = page.locator('[data-equipment-view-action="board"]');
  if ((await boardButton.count()) > 0) await boardButton.click();
  const card = page.locator('.data-equipment-board-card').filter({ hasText: equipmentName });
  if ((await card.count()) === 0) return;
  await card.first().click();
  await page.locator('[data-equipment-delete-card]').click();
  await expect(page.locator('[data-equipment-view="board"]')).toBeVisible();
}

test.describe('equipment-history card', () => {
  test('annual plan attachment download and print layout work end to end', async ({ page, baseURL }, testInfo) => {
    const statusResponse = await page.request.get(new URL('/api/bootstrap/status', baseURL).toString());
    const status = await statusResponse.json();
    test.skip(Boolean(status?.authEnabled && status?.loginEnabled), 'This focused smoke uses the no-login QA runtime.');

    const equipmentName = `설비이력 검증 ${Date.now()}`;
    let saved = false;
    let uploadedDocumentId = '';
    page.on('dialog', async (dialog) => {
      if (dialog.message().includes('삭제')) await dialog.accept();
      else await dialog.dismiss();
    });

    try {
      await page.goto('/');
      await expect(page.locator('#sidebar')).toBeVisible();
      await openEquipmentHistory(page);
      await page
        .locator('[data-equipment-view-action="card"]')
        .first()
        .evaluate((element) => element.click());
      await expect(page.locator('[data-equipment-card-start-form]')).toBeVisible();
      await page.locator('[data-equipment-start-field="team"]').selectOption('1팀 1파트');
      await page.locator('[data-equipment-start-field="room"]').fill('검증실');
      await page.locator('[data-equipment-start-field="name"]').fill(equipmentName);
      await page.locator('[data-equipment-card-start-submit]').click();

      await expect(page.locator('.data-equipment-card-grid > article .data-equipment-section-title')).toHaveText([
        /설비 스펙/,
        /연간정비계획표/,
        /정비 이력/,
      ]);
      await expect(page.locator('.data-equipment-annual-plan-row')).toHaveCount(3);
      await page
        .locator('[data-equipment-row-section="annualMaintenancePlan"][data-equipment-field="maintenanceItem"]')
        .first()
        .fill('구동 벨트');
      await page
        .locator('[data-equipment-row-section="annualMaintenancePlan"][data-equipment-field="maintenanceContent"]')
        .first()
        .fill('장력 확인 및 마모 상태 점검');
      await page
        .locator('[data-equipment-row-section="annualMaintenancePlan"][data-equipment-field="cycle"]')
        .first()
        .fill('연 2회');
      await page
        .locator('[data-equipment-row-section="annualMaintenancePlan"][data-equipment-field="executionMonth"]')
        .first()
        .fill('3월');
      await page
        .locator('[data-equipment-row-section="annualMaintenancePlan"][data-equipment-field="inspectionNotes"]')
        .first()
        .fill('점검 완료');

      const documentTitle = page
        .locator('[data-equipment-row-section="documents"][data-equipment-field="title"]')
        .first();
      await documentTitle.fill('sample-nameplate.png');
      await page
        .locator('[data-equipment-document-file-input]')
        .first()
        .setInputFiles({
          name: 'sample-nameplate.png',
          mimeType: 'image/png',
          buffer: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lQn1GQAAAABJRU5ErkJggg==',
            'base64'
          ),
        });
      await expect(page.locator('.data-equipment-document-file-name').first()).toHaveText('');

      await page.locator('#global-save-button').click();
      await expect(page.locator('#global-save-status')).toContainText('저장되었습니다');
      saved = true;
      await page.locator('[data-equipment-view-action="board"]').click();
      const equipmentCard = page.locator('.data-equipment-board-card').filter({ hasText: equipmentName });
      await expect(equipmentCard).toHaveCount(1);
      await equipmentCard.click();

      await expect(
        page
          .locator('[data-equipment-row-section="annualMaintenancePlan"][data-equipment-field="maintenanceItem"]')
          .first()
      ).toHaveValue('구동 벨트');
      await expect(
        page
          .locator('[data-equipment-row-section="annualMaintenancePlan"][data-equipment-field="maintenanceContent"]')
          .first()
      ).toHaveValue('장력 확인 및 마모 상태 점검');
      await expect(documentTitle).toHaveValue('sample-nameplate.png');
      await expect(page.locator('.data-equipment-document-file-name').first()).toHaveText('');
      await page.screenshot({ path: testInfo.outputPath('equipment-history-card.png'), fullPage: true });

      const downloadLink = page.locator('.data-equipment-document-download').first();
      const documentActions = page.locator('.data-equipment-document-actions').first();
      await expect(documentActions.locator('.data-equipment-document-download')).toBeVisible();
      await expect(documentActions.locator('.data-equipment-document-remove')).toBeVisible();
      const downloadHref = await downloadLink.getAttribute('href');
      uploadedDocumentId = decodeURIComponent(downloadHref?.match(/^\/api\/files\/([^/]+)\/download$/)?.[1] || '');
      expect(uploadedDocumentId).not.toBe('');
      const downloadPromise = page.waitForEvent('download');
      await downloadLink.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('sample-nameplate.png');
      await download.delete();

      const printHtml = await page.evaluate((name) => {
        const payload = window.PortalData?.data_equipment_history_card;
        const record = payload?.equipmentList?.find((item) => item?.name === name);
        return window.KpiDataEquipmentHistory?.buildEquipmentHistoryPrintDocument?.(record, {
          updatedAt: payload?.header?.updatedAt || payload?.meta?.updatedAt,
        });
      }, equipmentName);
      expect(printHtml).toContain('연간정비계획표');
      const printPage = await page.context().newPage();
      await printPage.setContent(printHtml, { waitUntil: 'domcontentloaded' });
      await printPage.emulateMedia({ media: 'print' });
      await expect(printPage.locator('.equipment-print-annual-plan')).toContainText('구동 벨트');
      await expect(printPage.locator('.equipment-print-annual-plan')).toContainText('점검 완료');
      await expect(printPage.locator('.equipment-print-doc-cell')).toHaveText('sample-nameplate.png');
      const layout = await printPage.locator('.equipment-print-page').evaluate((element) => ({
        clientHeight: element.clientHeight,
        overflow: getComputedStyle(element).overflow,
        scrollHeight: element.scrollHeight,
      }));
      expect(layout.overflow).toBe('visible');
      expect(layout.scrollHeight).toBe(layout.clientHeight);
      await printPage.screenshot({ path: testInfo.outputPath('equipment-history-print.png'), fullPage: true });
      await printPage.close();

      const deleteDocumentResponse = await page.request.delete(
        new URL(`/api/files/${encodeURIComponent(uploadedDocumentId)}`, baseURL).toString()
      );
      expect(deleteDocumentResponse.ok()).toBeTruthy();
      uploadedDocumentId = '';
      await page.locator('[data-equipment-delete-card]').click();
      await expect(page.locator('[data-equipment-view="board"]')).toBeVisible();
      await expect(page.locator('.data-equipment-board-card').filter({ hasText: equipmentName })).toHaveCount(0);
      saved = false;
    } finally {
      if (saved && !page.isClosed()) {
        await deleteEquipmentIfPresent(page, equipmentName).catch(() => {});
      }
      if (uploadedDocumentId) {
        await page.request
          .delete(new URL(`/api/files/${encodeURIComponent(uploadedDocumentId)}`, baseURL).toString())
          .catch(() => {});
      }
    }
  });
});
