import assert from 'node:assert/strict';
import test from 'node:test';
import { createEquipmentHistoryRuntime } from './support/equipment-history-render-harness.js';

test('equipment-history editor helpers preserve document basic photo and categorized detail markup', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;

  const documentTableHtml = api.renderDocumentEditableTable([api.createBlankDocumentRow()]);
  assert.match(documentTableHtml, /문서명/);
  assert.match(documentTableHtml, /파일 첨부/);
  assert.match(documentTableHtml, /선택된 파일 없음/);
  assert.match(documentTableHtml, /accept="[^"]*\.pdf[^"]*\.jpg[^"]*\.bmp/);
  assert.doesNotMatch(documentTableHtml, /첨부 키/);
  assert.doesNotMatch(documentTableHtml, /attachmentKey/);
  assert.doesNotMatch(documentTableHtml, /\?쒓굅|\?\?\?쒓굅|\?쓋굅/);

  const basicFieldHtml = api.renderFieldGrid(
    api.BASIC_FIELDS,
    api.createDraft(),
    'data-equipment-edit-grid data-equipment-basic-grid'
  );
  assert.match(basicFieldHtml, /설비명/);
  assert.match(basicFieldHtml, /관리팀/);
  assert.match(basicFieldHtml, /실/);
  assert.match(basicFieldHtml, /data-equipment-field="team"/);
  assert.match(basicFieldHtml, /data-equipment-field="room"/);
  assert.match(basicFieldHtml, /공정/);
  assert.match(basicFieldHtml, /가동률/);
  assert.doesNotMatch(basicFieldHtml, /설비코드/);
  assert.doesNotMatch(basicFieldHtml, /설비구분/);
  assert.doesNotMatch(basicFieldHtml, /담당/);

  const photoInfoHtml = api.renderFieldGrid(
    api.PHOTO_INFO_FIELDS,
    api.createDraft(),
    'data-equipment-edit-grid data-equipment-photo-info-grid'
  );
  assert.match(photoInfoHtml, /data-equipment-field="name"/);
  assert.match(photoInfoHtml, /data-equipment-field="room"/);
  assert.match(photoInfoHtml, /공정/);
  assert.match(photoInfoHtml, /가동률/);
  assert.match(photoInfoHtml, /기종/);
  assert.match(photoInfoHtml, /제조사/);
  assert.match(photoInfoHtml, /제조년월/);
  assert.match(photoInfoHtml, /담당 업체/);
  assert.ok(photoInfoHtml.indexOf('기종') > photoInfoHtml.indexOf('가동률'));
  assert.ok(photoInfoHtml.indexOf('제조사') > photoInfoHtml.indexOf('기종'));
  assert.ok(photoInfoHtml.indexOf('제조년월') > photoInfoHtml.indexOf('제조사'));
  assert.ok(photoInfoHtml.indexOf('담당 업체') > photoInfoHtml.indexOf('제조년월'));
  assert.match(photoInfoHtml, /class="data-equipment-field-label-input"[^>]*data-equipment-field="manufacturerLabel"/);
  assert.match(photoInfoHtml, /class="data-equipment-field-label-input"[^>]*data-equipment-field="ownerLabel"/);
  assert.match(photoInfoHtml, /data-equipment-field="manufacturer"/);
  assert.match(photoInfoHtml, /data-equipment-field="modelName"/);
  assert.match(photoInfoHtml, /data-equipment-field="manufacturedAt"/);
  assert.match(photoInfoHtml, /<input type="text"[^>]*data-equipment-field="manufacturer"/);
  assert.match(photoInfoHtml, /<input type="month"[^>]*data-equipment-field="manufacturedAt"/);
  assert.match(photoInfoHtml, /<input type="text"[^>]*data-equipment-field="owner"/);
  assert.doesNotMatch(photoInfoHtml, /<textarea[^>]*data-equipment-field="manufacturer"/);
  assert.doesNotMatch(photoInfoHtml, /<textarea[^>]*data-equipment-field="owner"/);
  assert.match(
    api.renderFieldGrid(
      api.PHOTO_INFO_FIELDS,
      api.createDraft({ modelName: 'FUJI-ACE EC101' }),
      'data-equipment-edit-grid data-equipment-photo-info-grid'
    ),
    /FUJI-ACE EC101/
  );
  assert.match(
    api.renderFieldGrid(
      api.PHOTO_INFO_FIELDS,
      api.createDraft({ manufacturedAt: '2012.10' }),
      'data-equipment-edit-grid data-equipment-photo-info-grid'
    ),
    /value="2012-10"/
  );
  assert.match(
    api.renderFieldGrid(
      api.PHOTO_INFO_FIELDS,
      api.createDraft({ manufacturerLabel: '제조사 주소', manufacturer: '서울시' }),
      'data-equipment-edit-grid data-equipment-photo-info-grid'
    ),
    /class="data-equipment-field-label-input"[^>]*value="제조사 주소"[^>]*data-equipment-field="manufacturerLabel"/
  );
  assert.match(
    api.renderFieldGrid(
      api.PHOTO_INFO_FIELDS,
      api.createDraft({ ownerLabel: 'A\/S 연락처', owner: '010-1234-5678' }),
      'data-equipment-edit-grid data-equipment-photo-info-grid'
    ),
    /class="data-equipment-field-label-input"[^>]*value="A\/S 연락처"[^>]*data-equipment-field="ownerLabel"/
  );
  assert.match(
    api.renderFieldGrid(
      api.PHOTO_INFO_FIELDS,
      api.createDraft({ owner: 'ABC정비\n010-1234-5678' }),
      'data-equipment-edit-grid data-equipment-photo-info-grid'
    ),
    /ABC정비 \/ 010-1234-5678/
  );
  assert.match(photoInfoHtml, /설비명/);
  assert.match(photoInfoHtml, /실/);
  assert.doesNotMatch(photoInfoHtml, /관리팀/);
  assert.doesNotMatch(photoInfoHtml, /data-equipment-field="team"/);
  const roomListPhotoInfoHtml = api.renderFieldGrid(
    api.PHOTO_INFO_FIELDS,
    api.createDraft(),
    'data-equipment-edit-grid data-equipment-photo-info-grid',
    {
      fieldAttrs: { room: 'list="room-options"' },
    }
  );
  assert.match(roomListPhotoInfoHtml, /data-equipment-field="room"[^>]*list="room-options"/);

  const detailItemsHtml = api.renderDetailItems([]);
  assert.match(detailItemsHtml, /data-equipment-detail-items-grid/);
  assert.match(detailItemsHtml, /data-equipment-detail-item/);
  assert.match(detailItemsHtml, /data-equipment-detail-remove/);
  assert.match(detailItemsHtml, /data-equipment-remove-row="detailInfo"/);
  assert.match(detailItemsHtml, /data-equipment-row-index="0"/);
  assert.doesNotMatch(detailItemsHtml, /data-equipment-row-index="1"/);
  assert.doesNotMatch(detailItemsHtml, /data-equipment-detail-table/);
  assert.doesNotMatch(detailItemsHtml, /data-equipment-detail-pad/);
  assert.doesNotMatch(detailItemsHtml, /data-equipment-detail-cell/);
  const categorizedSpecHtml = api.renderDetailItems(
    [
      { label: '\uBAA8\uB378\uBA85', value: 'FUJI-ACE EC101' },
      { label: '\uC804\uC6D0', value: '200/220 V, 3\uC0C1' },
      { label: '\uCD95 \uCCB4\uACC4', value: '4\uCD95 \uC11C\uBCF4' },
      { label: '\uC8FC\uC694 \uC810\uAC80\uBD80', value: '\uBCA0\uC5B4\uB9C1 / \uAC10\uC18D\uAE30' },
      {
        label: '\uC6B0\uC120 \uD655\uBCF4 \uBB38\uC11C',
        value: '\uC624\uB958 \uC774\uB825 / \uBC31\uC5C5 \uC0C1\uD0DC',
      },
      { label: '\uD604\uC7A5 \uBA54\uBAA8', value: '\uD5A5\uD6C4 \uD655\uC778' },
    ],
    'equipmentSpecs'
  );
  assert.match(categorizedSpecHtml, /data-equipment-detail-items-grid is-categorized/);
  assert.match(categorizedSpecHtml, /data-equipment-detail-category="all"/);
  assert.doesNotMatch(categorizedSpecHtml, /\uAE30\uBCF8 \uC815\uBCF4/);
  assert.doesNotMatch(categorizedSpecHtml, /\uC8FC\uC694 \uC2A4\uD399/);
  assert.doesNotMatch(categorizedSpecHtml, /\uC810\uAC80\u00B7\uBB38\uC11C/);
  assert.doesNotMatch(categorizedSpecHtml, /\uAE30\uD0C0/);
  assert.doesNotMatch(categorizedSpecHtml, /\uC131\uB2A5\u00B7\uC804\uC6D0/);
  assert.doesNotMatch(categorizedSpecHtml, /\uCD95\u00B7\uC81C\uC5B4/);
  assert.match(categorizedSpecHtml, /data-equipment-detail-category-grid/);
  assert.match(categorizedSpecHtml, /data-equipment-spec-block/);
  assert.match(categorizedSpecHtml, /data-equipment-spec-block-toggle/);
  assert.match(categorizedSpecHtml, /data-equipment-add-row-to-block="equipmentSpecs"/);
  assert.match(categorizedSpecHtml, /data-equipment-spec-row-actions/);
  assert.match(categorizedSpecHtml, /data-equipment-move-row="equipmentSpecs"/);
  assert.match(categorizedSpecHtml, /data-equipment-row-index="5"/);
  const openSpecHtml = api.renderDetailItems([{ label: '\uC804\uC6D0', value: '200 V' }], 'equipmentSpecs', {
    openBlocks: { 'all:auto-0': true },
  });
  assert.match(openSpecHtml, /data-equipment-spec-block is-managing/);
  assert.match(openSpecHtml, /data-equipment-spec-block-actions" aria-hidden="false"/);
  assert.match(openSpecHtml, /data-equipment-spec-row-actions" aria-hidden="false"/);
  const denseSpecHtml = api.renderDetailItems(
    [
      { label: '\uC804\uC6D0', value: '200 V' },
      { label: '\uACF5\uC555', value: '0.5 MPa' },
      { label: '\uC911\uB7C9', value: '120 kg' },
      { label: '\uC18D\uB3C4', value: '30 rpm' },
      { label: '\uC0AC\uC774\uC988', value: '1000 mm' },
    ],
    'equipmentSpecs'
  );
  assert.equal((denseSpecHtml.match(/data-equipment-spec-block-index/g) || []).length, 1);
  assert.equal((denseSpecHtml.match(/data-equipment-spec-block-row/g) || []).length, 5);
  const twelveSpecHtml = api.renderDetailItems(
    Array.from({ length: 12 }, (_, index) => ({
      label: `L${index + 1}`,
      value: `V${index + 1}`,
    })),
    'equipmentSpecs'
  );
  assert.equal((twelveSpecHtml.match(/data-equipment-spec-block-index/g) || []).length, 2);
  assert.equal((twelveSpecHtml.match(/data-equipment-spec-block-row/g) || []).length, 12);
  assert.ok(
    twelveSpecHtml.indexOf('data-equipment-row-index="7"') <
      twelveSpecHtml.indexOf('data-equipment-spec-block-index="1"')
  );
  assert.ok(
    twelveSpecHtml.indexOf('data-equipment-spec-block-index="1"') <
      twelveSpecHtml.indexOf('data-equipment-row-index="8"')
  );
  const groupedDetailItemsHtml = api.renderDetailGroups(api.createDraft().detailGroups);
  assert.match(groupedDetailItemsHtml, /data-equipment-detail-groups/);
  assert.match(groupedDetailItemsHtml, /data-equipment-detail-group="equipmentSpecs"/);
  assert.doesNotMatch(groupedDetailItemsHtml, /data-equipment-detail-group="otherInfo"/);
  assert.match(groupedDetailItemsHtml, /data-equipment-add-block="equipmentSpecs"/);
  assert.match(groupedDetailItemsHtml, /data-equipment-add-row-to-block="equipmentSpecs"/);
  assert.doesNotMatch(groupedDetailItemsHtml, /data-equipment-add-row="otherInfo"/);
  assert.match(groupedDetailItemsHtml, /data-equipment-remove-row="equipmentSpecs"/);
  assert.doesNotMatch(groupedDetailItemsHtml, /data-equipment-remove-row="otherInfo"/);
});
