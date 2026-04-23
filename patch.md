# patch.md
작성일 / Date: `2026-04-23`
상태 / Status: `supporting material only`
기준 문서 / Authority reference: `AGENTS.md`

## 2026-04-23

### Summary / 요약
- 진행/status 정리 문서 3개를 제거했다.
- `AGENTS.md`를 장기 진행 추적용이 아니라 실작업용 규칙 문서로 재정의했다.
- `patch.md`를 repo root patch history 로그로 도입했다.
- 다른 로컬 작업공간에서 가져오는 파일도 이 저장소 규격에 맞춰 재편 후 patch 하도록 `AGENTS.md`에 명시했다.

### Changed Files / 변경 파일
- `AGENTS.md`
- `patch.md`

### Removed Files / 삭제 파일
- `구조-개선-실행-페이즈.md`
- `구조-문제점-진단.md`
- `비전공자용.md`

### Verification / 검증
- `rg -n "구조-개선-실행-페이즈|구조-문제점-진단|비전공자용|supporting status 문서|supporting status docs" -S . -g '!patch.md'` → `no-active-references`

### Notes / 메모
- `patch.md`는 authority 문서가 아니라 patch 기록용 supporting 문서다.

### Cleanup Update / 테스트 산출물 정리
- 루트 `.codex-run/` 추적 스크래치 파일을 제거했다.
- `test-results/.last-run.json`, `kpi-runtime/internal-server/var/playwright/.last-run.json`을 제거했다.
- `kpi-runtime/internal-server/var/logs/readiness/`와 `var/tmp-*.log` 임시 검증 산출물을 제거했다.
- `.gitignore`에 `.playwright-mcp/`, `test-results/`를 추가했다.
