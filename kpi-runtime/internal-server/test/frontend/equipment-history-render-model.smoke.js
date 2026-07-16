import assert from 'node:assert/strict';
import test from 'node:test';
import { createEquipmentHistoryRuntime, renderSource } from './support/equipment-history-render-harness.js';

test('equipment-history draft and record models preserve labels groups photos and documents', () => {
  const { context } = createEquipmentHistoryRuntime();
  const api = context.KpiDataEquipmentHistory;

  const record = api.buildRecordFromDraft({
    equipmentCode: 'EQ-MIX-001',
    name: '샘플 혼합기 A',
    team: '생산1팀',
    room: '외포장실',
    group: '혼합 공정',
    owner: '홍길동',
    status: '운영중',
    line: '라인 알파',
    process: '혼합',
    production: '2,680 kg',
    plan: '3,000 kg / 일',
    rate: '88',
    modelName: 'MX-1',
    manufacturer: '샘플 제조사',
    manufacturedAt: '2020.03',
    note: '설비 기록 작성 테스트',
    photoDocumentId: 'doc-photo-1',
    photoPreviewUrl: '/api/files/doc-photo-1/view',
    photoThumbDataUrl: 'data:image/jpeg;base64,VEhVTUI=',
    photoCrop: { x: 0.1, y: 0.2, width: 0.5, height: 0.4 },
    detailInfo: [{ label: '제조사', value: '샘플 제조사' }],
    annualMaintenancePlan: [
      {
        equipmentName: '샘플 혼합기 A',
        maintenanceItem: '구동 벨트',
        maintenanceContent: '장력 확인 및 마모 상태 점검',
        cycle: '연 2회',
        executionMonth: '3월',
        inspectionNotes: '점검 완료',
      },
    ],
    maintenanceHistory: [
      { date: '2026.04.29', type: '정기점검', content: '구동부 점검', worker: '홍길동', note: '정상' },
    ],
    documents: [
      {
        title: '점검 보고서',
        attachmentKey: 'legacy-key',
        documentId: 'doc-attachment-1',
        fileName: 'eq-mix-001-report.pdf',
        downloadUrl: '/api/files/doc-attachment-1/download',
      },
    ],
  });

  assert.equal(record.equipmentCode, 'EQ-MIX-001');
  assert.equal(record.room, '외포장실');
  assert.equal(record.group, '혼합');
  assert.equal(record.status, '\uAC00\uB3D9\uC911');
  assert.equal(
    api.buildRecordFromDraft({ name: 'Mixer', status: '\uBE44\uAC00\uB3D9\uC911' }).status,
    '\uBE44\uAC00\uB3D9\uC911'
  );
  assert.equal(
    JSON.stringify(
      api.createDraft({
        name: 'Mixer',
        detailInfo: [
          { label: '\uC124\uBE44\uBA85', value: 'Mixer' },
          { label: '\uAE30\uC885', value: 'MX-1' },
          { label: '\uC81C\uC870\uC0AC', value: 'Sample Maker' },
          { label: '\uC81C\uC870\uB144\uC6D4', value: '2018.07' },
        ],
      }).detailInfo
    ),
    JSON.stringify([])
  );
  assert.equal(
    api.createDraft({
      name: 'Mixer',
      detailInfo: [
        { label: '\uC124\uBE44\uBA85', value: 'Mixer' },
        { label: '\uAE30\uC885', value: 'MX-1' },
        { label: '\uC81C\uC870\uC0AC', value: 'Sample Maker' },
        { label: '\uC81C\uC870\uB144\uC6D4', value: '2018.07' },
      ],
    }).manufacturer,
    'Sample Maker'
  );
  assert.equal(
    api.createDraft({
      name: 'Mixer',
      detailInfo: [
        { label: '\uBAA8\uB378\uBA85', value: 'MX-1' },
        { label: '\uC81C\uC870\uB144\uC6D4', value: '2018.07' },
      ],
    }).modelName,
    'MX-1'
  );
  assert.equal(
    api.createDraft({
      name: 'Mixer',
      detailInfo: [{ label: '\uC81C\uC870\uB144\uC6D4', value: '2018.07' }],
    }).manufacturedAt,
    '2018-07'
  );
  const legacyDetailDraft = api.createDraft({
    name: 'Mixer',
    detailInfo: [
      { label: '\uBAA8\uB378\uBA85', value: 'MX-1' },
      { label: '\uC81C\uC870\uC0AC', value: 'Sample Maker' },
      { label: '\uC81C\uC870\uB144\uC6D4', value: '2018.07' },
      { label: '\uBA54\uBAA8', value: 'Clean daily' },
    ],
  });
  assert.equal(
    JSON.stringify(legacyDetailDraft.detailGroups.equipmentSpecs),
    JSON.stringify([{ label: '\uBA54\uBAA8', value: 'Clean daily' }])
  );
  assert.equal(legacyDetailDraft.modelName, 'MX-1');
  assert.equal(legacyDetailDraft.manufacturer, 'Sample Maker');
  assert.equal(legacyDetailDraft.manufacturedAt, '2018-07');
  assert.equal(legacyDetailDraft.detailGroups.otherInfo, undefined);
  assert.equal(api.createDraft().manufacturerLabel, '제조사');
  assert.equal(api.createDraft().ownerLabel, '담당 업체');
  const customLabelDraft = api.createDraft({
    name: 'Mixer',
    manufacturerLabel: '제조사 주소',
    ownerLabel: '담당 업체 연락처',
    detailInfo: [
      { label: '제조사 주소', value: 'ABC제조\n서울시' },
      { label: '담당 업체 연락처', value: 'ABC정비\n010-1234-5678' },
      { label: '메모', value: 'Clean daily' },
    ],
  });
  assert.equal(customLabelDraft.manufacturer, 'ABC제조\n서울시');
  assert.equal(customLabelDraft.owner, 'ABC정비\n010-1234-5678');
  assert.equal(
    JSON.stringify(customLabelDraft.detailGroups.equipmentSpecs),
    JSON.stringify([{ label: '메모', value: 'Clean daily' }])
  );
  assert.deepEqual(
    api
      .normalizeEquipmentItems({
        equipmentList: [
          {
            id: 'custom-label',
            name: 'Mixer',
            manufacturerLabel: '제조사 주소',
            ownerLabel: '담당 업체 연락처',
            modelName: 'MX-1',
            detailInfo: [
              { label: '제조사 주소', value: 'ABC제조\n서울시' },
              { label: '담당 업체 연락처', value: 'ABC정비\n010-1234-5678' },
            ],
          },
        ],
      })
      .map((item) => ({
        manufacturerLabel: item.manufacturerLabel,
        manufacturer: item.manufacturer,
        ownerLabel: item.ownerLabel,
        owner: item.owner,
        modelName: item.modelName,
      })),
    [
      {
        manufacturerLabel: '제조사 주소',
        manufacturer: 'ABC제조\n서울시',
        ownerLabel: '담당 업체 연락처',
        owner: 'ABC정비\n010-1234-5678',
        modelName: 'MX-1',
      },
    ]
  );
  const customLabelRecord = api.buildRecordFromDraft({
    name: 'Mixer',
    manufacturerLabel: '제조사 주소',
    manufacturer: 'ABC제조\n서울시',
    ownerLabel: '담당 업체 연락처',
    owner: 'ABC정비\n010-1234-5678',
  });
  assert.equal(customLabelRecord.manufacturerLabel, '제조사 주소');
  assert.equal(customLabelRecord.ownerLabel, '담당 업체 연락처');
  assert.ok(
    customLabelRecord.detailInfo.some((item) => item.label === '제조사 주소' && item.value === 'ABC제조\n서울시')
  );
  assert.ok(
    !api.createDraft(customLabelRecord).detailGroups.equipmentSpecs.some((item) => item.label === '제조사 주소')
  );
  const groupedRecord = api.buildRecordFromDraft({
    name: 'Mixer',
    detailGroups: {
      equipmentSpecs: [{ label: '\uBAA8\uB378', value: 'MX-1' }],
      otherInfo: [{ label: '\uBA54\uBAA8', value: 'Clean daily' }],
    },
  });
  assert.equal(
    JSON.stringify(groupedRecord.detailGroups.equipmentSpecs),
    JSON.stringify([{ label: '\uBA54\uBAA8', value: 'Clean daily' }])
  );
  assert.equal(groupedRecord.detailGroups.otherInfo, undefined);
  assert.equal(groupedRecord.modelName, 'MX-1');
  assert.ok(groupedRecord.detailInfo.some((item) => item.label === '\uAE30\uC885' && item.value === 'MX-1'));
  assert.ok(groupedRecord.detailInfo.some((item) => item.label === '\uBA54\uBAA8' && item.value === 'Clean daily'));
  assert.deepEqual(
    api
      .normalizeEquipmentItems({ equipmentList: [{ id: 'legacy-yusan', name: '유산 기존 설비', team: '유산' }] })
      .map((item) => ({ team: item.team, teamDataKey: item.teamDataKey })),
    [{ team: '공무환경팀', teamDataKey: 'work_team_calendar_team4' }]
  );
  assert.equal(
    api.buildRecordFromDraft({ name: '폐수 펌프', team: '공무환경팀' }).teamDataKey,
    'work_team_calendar_team4'
  );
  assert.deepEqual(
    api
      .normalizeEquipmentItems({
        equipmentList: [{ id: 'room-robot', name: '로봇', team: '1팀 2파트', room: '외포장실' }],
      })
      .map((item) => ({ name: item.name, team: item.team, room: item.room })),
    [{ name: '로봇', team: '1팀 2파트', room: '외포장실' }]
  );
  assert.deepEqual(
    {
      team: api.buildRecordFromDraft({ name: '유산 기존 설비', team: '유산' }).team,
      teamDataKey: api.buildRecordFromDraft({ name: '유산 기존 설비', team: '유산' }).teamDataKey,
    },
    { team: '공무환경팀', teamDataKey: 'work_team_calendar_team4' }
  );
  assert.equal(record.photoDataUrl, '');
  assert.equal(record.photoThumbDataUrl, 'data:image/jpeg;base64,VEhVTUI=');
  assert.equal(JSON.stringify(record.photoCrop), JSON.stringify({ x: 0.1, y: 0.2, width: 0.5, height: 0.4 }));
  assert.equal(record.photoDocumentId, 'doc-photo-1');
  assert.equal(record.photoAttachmentKey, api.EQUIPMENT_PHOTO_ATTACHMENT_KEY);
  assert.equal(api.createDraft().photoAttachmentKey, api.EQUIPMENT_PHOTO_ATTACHMENT_KEY);
  assert.equal(
    api.normalizeEquipmentItems({
      equipmentList: [{ id: 'photo-key', name: 'Mixer', photoAttachmentKey: 'custom-photo-key' }],
    })[0].photoAttachmentKey,
    'custom-photo-key'
  );
  assert.equal(api.createDraft().documents.length, 1);
  assert.equal(api.createDraft({ name: 'Mixer' }).annualMaintenancePlan.length, 3);
  assert.equal(api.createDraft({ name: 'Mixer' }).annualMaintenancePlan[0].equipmentName, 'Mixer');
  assert.equal(api.buildRecordFromDraft({ name: 'Mixer' }).annualMaintenancePlan.length, 0);
  assert.equal(api.createDraft({ documents: [{ title: '점검 보고서' }] }).documents.length, 1);
  assert.equal(
    api.createDraft({ documents: Array.from({ length: 4 }, (_, index) => ({ title: `문서 ${index + 1}` })) }).documents
      .length,
    4
  );
  assert.equal(record.modelName, 'MX-1');
  assert.equal(record.manufacturer, '샘플 제조사');
  assert.equal(record.manufacturedAt, '2020-03');
  assert.equal(record.documents[0].documentId, 'doc-attachment-1');
  assert.equal(record.documents[0].attachmentKey, undefined);
  assert.equal(
    JSON.stringify(record.annualMaintenancePlan),
    JSON.stringify([
      {
        equipmentName: '샘플 혼합기 A',
        maintenanceItem: '구동 벨트',
        maintenanceContent: '장력 확인 및 마모 상태 점검',
        cycle: '연 2회',
        executionMonth: '3월',
        inspectionNotes: '점검 완료',
      },
    ])
  );
  assert.equal(
    api.normalizeEquipmentItems({ equipmentList: [record] })[0].annualMaintenancePlan[0].maintenanceItem,
    '구동 벨트'
  );
  assert.equal(record.operationInfo.map((item) => item.label).join(','), '설비명,관리팀,실,공정,가동률');
  assert.ok(record.detailInfo.some((item) => item.label === '공정' && item.value === '혼합'));
  assert.ok(!record.detailInfo.some((item) => item.label === '설비코드'));
  assert.ok(!record.detailInfo.some((item) => item.label === '담당'));
  assert.ok(record.detailInfo.some((item) => item.label === '기종' && item.value === 'MX-1'));
  assert.ok(record.detailInfo.some((item) => item.label === '제조사' && item.value === '샘플 제조사'));
  assert.ok(record.detailInfo.some((item) => item.label === '제조년월' && item.value === '2020-03'));
  assert.match(renderSource, /data-equipment-card-start-form/);
  assert.match(renderSource, /data-equipment-start-field="team"/);
  assert.match(renderSource, /data-equipment-start-field="room"/);
  assert.match(renderSource, /data-equipment-start-field="name"/);
  assert.match(renderSource, /state\.view = 'card-start'/);
});
