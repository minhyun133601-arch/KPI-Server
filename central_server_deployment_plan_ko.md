# 중앙 서버 웹사이트 오픈/편집 시스템 구축 실행 계획 (AI 실행용)
작성일 / Date: `2026-04-06`

## Boundary Header / 경계 헤더

```yaml
authority_doc: true
doc_name: "central_server_deployment_plan_ko.md"
doc_scope: "runtime rollout plan, host deployment path, security and operations gates / 런타임 롤아웃 계획, 호스트 배포 경로, 보안·운영 게이트"
owns:
  - "central server deployment target / 중앙 서버 배포 목표"
  - "runtime topology, rollout phases, and acceptance gates / 런타임 토폴로지, 롤아웃 단계, 완료 게이트"
  - "exposure, backup/restore, observability, and incident baseline / 노출, 백업·복구, 관측, 사고 대응 기준"
  - "repo-root serverization and operations markdown authority / 저장소 루트 서버화·운영 markdown 권위"
not_own:
  - "repo-wide coding style, testing, and edit rules / 저장소 전체 코드 스타일, 테스트, 편집 규칙"
  - "new-PC workstation reconstruction workflow / 새 PC 작업환경 재구성 절차"
escalate_to:
  coding_rules: "AGENTS.md"
  workstation_setup: "새컴퓨터_동일작업환경_세팅_프롬프트.md"
authority_set:
  - "AGENTS.md"
  - "central_server_deployment_plan_ko.md"
  - "새컴퓨터_동일작업환경_세팅_프롬프트.md"
```

## 0) 문서 권한과 현재 기준

### 0.1 권한과 루트 문서 정책
- 현재 대화의 명시적 사용자 지시가 항상 이 문서보다 우선한다.
- 이 문서는 저장소의 런타임/배포/운영 게이트에 대한 핵심 권위 문서다.
- 별도 `서버화.md`는 더 이상 live 권위 문서로 유지하지 않는다. 이 문서가 그 역할을 대체한다.
- 이 계획 경로에서는 루트 repo-owned markdown를 `AGENTS.md`, `central_server_deployment_plan_ko.md`, `새컴퓨터_동일작업환경_세팅_프롬프트.md` 3개만 유지한다.
- 코드 스타일, 테스트, 편집 규칙은 `AGENTS.md`가 결정하고, 새 Windows 작업환경 복원 절차는 `새컴퓨터_동일작업환경_세팅_프롬프트.md`가 결정한다.

### 0.2 현재 저장소에서 이미 준비된 것
- 현재 앱/서버 소스 권위 경로는 `06_★★★_KPI런타임/internal-server`다.
- 현재 저장소에는 재사용 가능한 Ubuntu 배포 초안 자산이 이미 있다.
  - `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference/docker-compose.yml`
  - `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference/Caddyfile`
  - `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference/cloudflared-config.yml.example`
  - `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference/scripts/backup.sh`
  - `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference/scripts/restore.sh`
- Windows 기준 현재 운영/증거 수집 자산도 이미 있다.
  - `06_★★★_KPI런타임/internal-server/scripts/windows/backup-all.ps1`
  - `06_★★★_KPI런타임/internal-server/scripts/windows/report-serverization-readiness.ps1`
- 실제 Ubuntu 컷오버 전까지는 현재 Node.js + PostgreSQL + server-managed file storage baseline을 코드 기준본으로 유지하되, 중앙 서버 오픈 계획의 주 경로는 이 문서 기준으로 진행한다.
- 제품 표면은 실제 KPI 앱과 `KPI.html` 직접 서빙 흐름을 유지한다. wrapper-first, preview-first 전환은 기본값이 아니다.

### 0.3 필수 운영 가드레일
- 사용자에게 노출되는 표면은 웹 앱과 승인된 게이트웨이/터널뿐이다. DB, SSH, RDP, SMB, 관리자 포트, `docker.sock`은 직접 노출하지 않는다.
- `작동한다`와 `운영 가능하다`는 다르다. 백업, 복구 절차, 로그, 감사, 모니터링, 계정 정리 정책 없이 완료로 보지 않는다.
- 앱은 public-IP 개방 여부와 무관하게 객체 단위 권한 검사, 입력 검증, 감사 로그를 가져야 한다.
- 운영 준비도의 최소 백업 세트는 `DB`, `업로드/서버 파일`, `환경설정과 비밀정보 위치 정보`, `복구 절차`다.
- 운영 준비도의 최소 관측 세트는 `healthcheck`, `auth/access failure log`, `admin/write audit`, `backup success/failure`, `storage/log growth`, `service outage signal`이다.
- 사고 대응 기준은 최소한 `서비스 장애`, `DB 장애`, `보안 사고 의심` 3가지를 포함해야 한다.

### 0.4 자동화 한계와 수동 게이트
- 저장소 안 자동화로 닫을 수 없는 항목은 `BIOS/UEFI 자동 전원`, `실제 Ubuntu 설치`, `실서버 하드웨어 점검`, `공유기 DHCP 예약 또는 고정 IP`, `Cloudflare 계정 로그인`, `DNS route 생성`, `Access policy 승인`, `외부망 실접속 검증`이다.
- 따라서 이 저장소에서 최대한 많이 이행할 수 있는 범위는 `문서`, `명령`, `배포 자산`, `검증 체크리스트`, `로컬 참조 파일`까지다.
- 실제 호스트 provision과 외부 계정 연동은 사람 게이트를 통과해야만 완료로 기록한다.

## 1) 문서 목적
이 문서는 **안 쓰는 컴퓨터 1대를 중앙 서버로 사용**하여, 외부 사용자가 **별도 프로그램 설치 없이 도메인만 입력해 접속**하고, 지정된 편집자 4~5명이 **브라우저에서 로그인 후 자료 업로드/수정**까지 할 수 있도록 구축하는 **실행 계획서**다.

이 문서는 **AI 작업자에게 전달하기 위한 운영용 문서**이며, 각 단계는 **페이즈(Phase)** 단위로 나뉜다. 각 페이즈는 다음 4가지를 반드시 포함한다.

- 목표
- 작업 항목
- 검증 항목
- 종료 게이트

---

## 2) 최종 목표
구축 후 상태는 아래를 만족해야 한다.

- 공개 주소: `https://www.<DOMAIN>`
- 편집 주소: `https://admin.<DOMAIN>`
- 일반 방문자: 공개 주소 접속만 가능, 별도 프로그램 설치 불필요
- 편집자 4~5명: 브라우저에서 로그인 후 자료 업로드/수정 가능
- 중앙 서버: 사용하지 않는 컴퓨터 1대
- 운영 시간: **매일 08:00 ~ 17:00**
- 서버가 꺼진 시간에는 공개 사이트와 편집 사이트 모두 접속 불가
- 공인 IP 직접 개방/포트포워딩 최소화
- 관리자/편집 기능은 공개 사이트와 분리
- 백업 가능해야 함
- 추후 AI가 유지보수할 수 있도록 디렉터리/설정/스크립트가 정리되어 있어야 함

---

## 3) 권장 아키텍처
이 문서는 **Ubuntu Server 24.04 LTS 기준**으로 작성한다.

> 이유: 무인 운영, 부팅 후 자동 시작, 서비스 관리, 08:00~17:00 운영 스케줄, 원격 SSH 유지보수 측면에서 Windows + Docker Desktop보다 운영이 단순하고 안정적이다.

### 3.1 구성 요소
- **OS**: Ubuntu Server 24.04 LTS
- **컨테이너 런타임**: Docker Engine + Docker Compose Plugin
- **외부 공개**: Cloudflare Tunnel
- **편집 경로 보호**: Cloudflare Access (이메일 OTP 또는 조직 로그인)
- **애플리케이션**: 사용자가 만든 웹사이트(공개/관리 기능 포함)
- **DB**: PostgreSQL 또는 MariaDB/MySQL 중 1개
- **파일 저장소**: 서버 로컬 볼륨(초기 버전), 필요 시 이후 NAS/S3 계열로 확장
- **백업**: DB dump + 업로드 파일 백업
- **운영 제어**: systemd + cron/systemd timer

### 3.2 트래픽 구조
- `www.<DOMAIN>` → Cloudflare Tunnel → 로컬 앱(public)
- `admin.<DOMAIN>` → Cloudflare Tunnel → Cloudflare Access 인증 → 로컬 앱(admin)
- DB는 외부에 공개하지 않음
- SSH는 내부망 또는 제한된 관리자 경로로만 허용

### 3.3 운영 원칙
- 공개 사이트와 관리자 사이트는 **호스트명 또는 경로로 분리**한다.
- 편집자는 **브라우저만 사용**한다.
- 서버 파일을 직접 수정하게 하지 말고, **반드시 웹 관리자 화면에서 업로드/수정**하게 한다.
- Cloudflare Access는 **1차 게이트**, 애플리케이션 내부 로그인은 **2차 게이트**로 둔다.
- 서버가 17:00 이후 꺼지면 사이트도 함께 내려간다. 이 점을 운영 정책으로 명시한다.

---

## 4) AI 작업자 실행 규칙
AI는 아래 규칙을 어기지 말 것.

1. **페이즈를 건너뛰지 말 것.**
2. 각 페이즈 종료 전, 반드시 검증 명령과 기대 결과를 기록할 것.
3. 에러 발생 시 다음 페이즈로 넘어가지 말고, 해당 페이즈에서 수정할 것.
4. 비밀번호/토큰/시크릿은 문서에 평문 저장하지 말고 `.env` 또는 비밀 저장 위치에 보관할 것.
5. 외부 공개 전에 반드시 `admin` 보호 정책을 먼저 적용할 것.
6. 운영 시간 자동화는 **켜기(부팅)** 와 **끄기(종료)** 를 구분해 설계할 것.
7. BIOS/UEFI에서 자동 전원 켜기 기능이 없으면, 08:00 자동 기동은 소프트웨어만으로 완전 해결되지 않음을 명시할 것.
8. 모든 설정 파일 경로, 서비스 이름, 포트, 볼륨 위치를 기록할 것.
9. 이 계획 경로에서는 루트 repo-owned markdown를 `AGENTS.md`, `central_server_deployment_plan_ko.md`, `새컴퓨터_동일작업환경_세팅_프롬프트.md` 3개만 유지하고, 별도 `OPERATIONS.md`, `RUNBOOK.md`, 임시 메모 markdown는 사용자 명시 요청 없이는 만들지 말 것.
10. 실제 Ubuntu 호스트 또는 Cloudflare 사람 계정이 필요한 단계는 저장소 안 자동화만으로 완료된 것처럼 표시하지 말고, 반드시 수동 게이트로 남길 것.

---

## 5) 사전 결정값(변수 테이블)
아래 값은 먼저 확정해야 한다.

```text
DOMAIN=example.com
PUBLIC_HOST=www.example.com
ADMIN_HOST=admin.example.com
TZ=Asia/Seoul
SERVER_HOSTNAME=central-web-01
SERVER_USER=svcweb
SERVER_LAN_IP=192.168.0.50
SSH_ADMIN_IP=192.168.0.0/24
APP_PUBLIC_PORT=8080
APP_ADMIN_PORT=8081   # 단일 앱이면 8080 하나만 써도 됨
DB_ENGINE=postgres    # 또는 mariadb
DB_NAME=appdb
DB_USER=appuser
UPLOAD_DIR=/srv/central-site/data/uploads
BACKUP_DIR=/srv/central-site/backups
PROJECT_ROOT=/srv/central-site
ADMIN_EMAIL_1=
ADMIN_EMAIL_2=
ADMIN_EMAIL_3=
ADMIN_EMAIL_4=
ADMIN_EMAIL_5=
```

---

## 6) 페이즈 개요
- **Phase 0**: 요구사항 고정 및 자산 준비
- **Phase 1**: 하드웨어/BIOS/OS 설치
- **Phase 2**: 기본 보안 및 원격 접속
- **Phase 3**: Docker Engine + Compose 설치
- **Phase 4**: 프로젝트 디렉터리 및 실행 구조 생성
- **Phase 5**: 애플리케이션 컨테이너화 및 로컬 구동
- **Phase 6**: Cloudflare 도메인/터널 연결
- **Phase 7**: Cloudflare Access로 `admin` 보호
- **Phase 8**: 08:00~17:00 운영 자동화
- **Phase 9**: 백업/복구 체계 구성
- **Phase 10**: 점검/인수 테스트/운영 문서화

## 6A) 현재 실행 상태
- `Phase 0`: 변수 테이블과 실제 계정/도메인/호스트 값이 아직 비어 있어 완료 전 상태다.
- `Phase 1 ~ 2`: 실제 Ubuntu 호스트 설치, BIOS 설정, SSH/UFW 적용은 수동 게이트로 남아 있다.
- `Phase 3 ~ 4`: 저장소 안 참조 자산은 부분 준비 완료 상태다. 실제 호스트 반입과 환경값 확정이 남아 있다.
- `Phase 5`: 현재 Node 기반 서버 앱 소스와 DB migration은 존재하지만, Ubuntu 기준 컨테이너화와 실호스트 구동은 아직 닫히지 않았다.
- `Phase 6 ~ 7`: Cloudflare Tunnel/Access는 계정 로그인과 DNS/정책 설정이 필요한 수동 단계라 아직 미완료다.
- `Phase 8 ~ 10`: 백업/복구 초안과 운영 스크립트 일부는 있지만, 실제 호스트 자동화/복구 리허설/외부 인수 테스트는 남아 있다.

## 6B) 현재 저장소에서 바로 재사용할 자산
- 앱 기준 경로: `06_★★★_KPI런타임/internal-server`
- Ubuntu 배포 초안: `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference`
- Windows 기준 백업/점검 스크립트: `06_★★★_KPI런타임/internal-server/scripts/windows`
- 이 문서를 실행할 때는 위 경로를 버리지 말고, Ubuntu 대상 파일을 만들 때 먼저 참고/복사/수정한다.

---

# Phase 0. 요구사항 고정 및 자산 준비

## 목표
구축 전 필요한 도메인/계정/인원/운영 조건을 확정한다.

## 작업 항목
1. 아래 항목을 확정한다.
   - 도메인 1개
   - Cloudflare 계정
   - Cloudflare Zero Trust 조직
   - 편집자 이메일 4~5개
   - 중앙 서버 PC 스펙 (CPU / RAM / SSD 용량)
   - 현재 OS 유지 여부 또는 Ubuntu 재설치 여부
   - 사이트가 단일 앱인지, 공개/관리 앱이 분리되는지
   - DB 종류(PostgreSQL 또는 MariaDB)
2. 공개 정책을 문서화한다.
   - 일반 방문자는 `www`만 사용
   - 편집자는 `admin`만 사용
   - 편집자는 브라우저에서만 작업
   - 17:00 이후 서비스 중단
3. 운영 정책을 문서화한다.
   - 관리자 계정 수
   - 편집자 계정 수
   - 업로드 허용 파일 종류
   - 업로드 최대 크기
   - 백업 보관 기간

## 검증 항목
- 도메인 소유권 확인 가능
- Cloudflare 계정 로그인 가능
- 편집자 이메일 목록 확보 완료
- 중앙 서버 PC 스펙 확인 완료

## 종료 게이트
- 변수 테이블이 모두 채워져 있을 것
- `public/admin/off-hours` 정책이 명시되어 있을 것

---

# Phase 1. 하드웨어/BIOS/OS 설치

## 목표
중앙 서버 PC를 Ubuntu Server 기반의 안정적인 서버 상태로 만든다.

## 작업 항목
1. 기존 PC 데이터 백업 후 OS 재설치 여부를 결정한다.
2. BIOS/UEFI에서 아래 항목을 확인한다.
   - 자동 전원 켜기(예: RTC Alarm / Power On By Alarm / Resume By RTC)
   - 전원 복구 후 자동 켜짐(AC Power Recovery / Restore on AC Power Loss)
3. 가능하면 **07:55 자동 전원 켜기**를 설정한다.
4. Ubuntu Server 24.04 LTS를 설치한다.
   - 호스트명: `central-web-01` 같은 고정명 사용
   - OpenSSH Server 함께 설치
   - 타임존: `Asia/Seoul`
5. 네트워크 설정
   - 라우터에서 DHCP 예약 또는 서버에 고정 IP 부여
   - `SERVER_LAN_IP` 확정
6. 초기 시스템 업데이트

## 권장 설치 후 기본 명령
```bash
sudo timedatectl set-timezone Asia/Seoul
sudo apt update && sudo apt upgrade -y
hostnamectl
ip addr
```

## 검증 항목
```bash
hostnamectl
ip a
systemctl status ssh
```

### 기대 결과
- 호스트명이 의도한 값으로 표시될 것
- 서버 IP가 고정되어 있을 것
- SSH 서비스가 active 일 것

## 종료 게이트
- SSH로 동일 네트워크에서 접속 가능
- 타임존이 `Asia/Seoul`
- 서버 재부팅 후 네트워크와 SSH가 정상 복구될 것

---

# Phase 2. 기본 보안 및 원격 접속

## 목표
루트 직접 로그인 대신 일반 관리자 계정 + sudo + SSH 키 기반 운영 구조를 만든다.

## 작업 항목
1. 운영용 계정 생성(필요 시)
```bash
sudo adduser svcweb
sudo usermod -aG sudo svcweb
```
2. 루트 계정 직접 사용 금지
```bash
sudo passwd -l root
```
3. 관리자 PC에서 SSH 키 생성 후 서버에 등록
```bash
ssh-keygen -t ed25519 -C "central-server-admin"
ssh-copy-id svcweb@<SERVER_LAN_IP>
```
4. SSH 접속 확인 후, 필요 시 비밀번호 로그인 제한
   - `/etc/ssh/sshd_config` 확인
   - `PasswordAuthentication no` 는 **키 인증 검증 후** 적용
5. UFW 기본 정책 적용
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from <SSH_ADMIN_IP> to any port 22 proto tcp
sudo ufw enable
sudo ufw status verbose
```

> 주의: Cloudflare Tunnel 방식에서는 공개 웹을 위해 별도 인바운드 포트를 열 필요가 없다. SSH만 최소 허용으로 시작한다.

## 검증 항목
```bash
ssh svcweb@<SERVER_LAN_IP>
sudo ufw status numbered
sudo -l
```

### 기대 결과
- `svcweb` 계정으로 SSH 키 로그인 가능
- `sudo` 가능
- UFW 활성화됨

## 종료 게이트
- 루트 대신 `svcweb` 운영 가능
- SSH 접속 경로가 최소화됨

---

# Phase 3. Docker Engine + Docker Compose 설치

## 목표
애플리케이션을 컨테이너 단위로 안정적으로 실행할 수 있게 한다.

## 작업 항목
1. 충돌 패키지 제거
```bash
sudo apt remove -y docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc || true
```
2. Docker 공식 저장소 설정
```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```
3. Docker Engine + Compose Plugin 설치
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
4. Docker 서비스 자동 시작 설정
```bash
sudo systemctl enable docker
sudo systemctl start docker
```
5. 운영 계정에 Docker 권한 부여
```bash
sudo usermod -aG docker svcweb
newgrp docker
```
6. 동작 확인
```bash
docker version
docker compose version
docker run --rm hello-world
```

## 검증 항목
- `docker version` 성공
- `docker compose version` 성공
- hello-world 컨테이너 실행 성공

## 종료 게이트
- 재부팅 후 Docker 서비스 자동 시작
- 운영 계정으로 `sudo` 없이 Docker 명령 실행 가능

---

# Phase 4. 프로젝트 디렉터리 및 실행 구조 생성

## 목표
모든 구성 파일과 데이터 위치를 표준화한다.

## 작업 항목
1. 프로젝트 루트 생성
```bash
sudo mkdir -p /srv/central-site/{app,config,data/uploads,data/db,backups,scripts,logs}
sudo chown -R svcweb:svcweb /srv/central-site
```
2. 기본 파일 생성
```bash
cd /srv/central-site
touch .env compose.yaml
mkdir -p config/cloudflared
```
3. `.env` 템플릿 작성
```dotenv
TZ=Asia/Seoul
PUBLIC_HOST=www.example.com
ADMIN_HOST=admin.example.com
APP_PUBLIC_PORT=8080
APP_ADMIN_PORT=8081
DB_ENGINE=postgres
DB_NAME=appdb
DB_USER=appuser
DB_PASSWORD=CHANGE_ME
UPLOAD_DIR=/srv/central-site/data/uploads
```
4. `compose.yaml` 초안 작성
5. 저장소에 이미 있는 참조 자산을 빈 파일 대신 초안으로 사용한다.
   - `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference/docker-compose.yml`
   - `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference/Caddyfile`
   - `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference/cloudflared-config.yml.example`
   - `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference/scripts/backup.sh`
   - `06_★★★_KPI런타임/internal-server/deploy/ubuntu-reference/scripts/restore.sh`
6. 위 참조 자산을 `/srv/central-site` 구조에 맞게 복사/조정하고, 실제 값은 `.env`와 운영 계정 기준으로 치환한다.

## 기본 compose 예시 (단일 앱 + DB)
```yaml
services:
  app:
    build: ./app
    container_name: central_app
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - ./data/uploads:/app/uploads
    depends_on:
      - db

  db:
    image: postgres:16
    container_name: central_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      TZ: ${TZ}
    volumes:
      - ./data/db:/var/lib/postgresql/data
    expose:
      - "5432"
```

## 공개/관리 앱 분리 예시 (필요 시)
```yaml
services:
  public_web:
    build: ./app/public
    container_name: public_web
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"

  admin_web:
    build: ./app/admin
    container_name: admin_web
    restart: unless-stopped
    ports:
      - "127.0.0.1:8081:8081"

  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/db:/var/lib/postgresql/data
```

## 검증 항목
```bash
cd /srv/central-site
ls -R
cat .env
cat compose.yaml
```

## 종료 게이트
- 디렉터리 구조가 명확할 것
- 업로드/DB/백업 디렉터리가 분리될 것
- compose 파일이 최소 1회 문법 확인될 것

문법 확인 예시:
```bash
docker compose config
```

---

# Phase 5. 애플리케이션 컨테이너화 및 로컬 구동

## 목표
사용자가 만든 웹사이트를 로컬에서 먼저 정상 구동한다.

## 작업 항목
1. 현재 앱/서버 소스 권위 경로는 `06_★★★_KPI런타임/internal-server`로 본다. 컨테이너화는 이 경로를 기준으로 진행한다.
2. 앱 종류를 판별한다.
   - Node.js
   - Python (FastAPI/Django/Flask)
   - PHP/Laravel
   - 정적 사이트 + 별도 관리자
3. 앱용 `Dockerfile` 작성
4. 앱 환경변수 정리
   - DB 연결 문자열
   - 업로드 디렉터리
   - 세션 시크릿
   - 관리자 초기 계정 정보
5. 앱 기능 최소 요건 확인
   - 관리자 로그인
   - 편집자 로그인
   - 자료 업로드
   - 자료 수정
   - 자료 삭제 또는 비활성화
   - 공개 페이지 반영
6. `KPI.html` 직접 서빙 흐름과 현재 로그인/세션/서버 저장 경계를 유지한 채 컨테이너화한다. wrapper-first 또는 preview-first 구조를 새 기본값으로 만들지 않는다.
7. 단일 앱이면 public/admin 라우트를 같은 앱에서 처리
8. 분리 앱이면 `public_web`, `admin_web` 컨테이너로 나눔
9. 로컬 실행
```bash
cd /srv/central-site
docker compose up -d --build
```
10. 로컬 상태 확인
```bash
docker compose ps
docker logs central_app --tail=100
curl -I http://127.0.0.1:8080
```

## 권장 앱 보안 조건
- 앱 내부 사용자 테이블 보유
- 역할 분리: `admin`, `editor`, `viewer` 또는 유사 구조
- 업로드 확장자 화이트리스트
- 업로드 최대 용량 제한
- 파일명 충돌 처리
- 삭제 시 soft delete 또는 휴지통 구조 고려
- 로그인 실패 제한 또는 지연
- 감사 로그(누가 언제 수정/업로드했는지) 최소한 남김

## 검증 항목
- `http://127.0.0.1:8080` 응답 성공
- 관리자 계정 로그인 가능
- 샘플 파일 업로드/수정 성공
- DB 데이터와 업로드 파일이 영속 볼륨에 저장되는지 확인

### 기대 결과
- 컨테이너를 재시작해도 업로드 파일과 DB가 유지될 것

## 종료 게이트
- 외부 노출 전에 **로컬에서 공개/관리 기능이 모두 검증**되었을 것

---

# Phase 6. Cloudflare 도메인/터널 연결

## 목표
공인 IP 직접 개방 없이 외부에서 도메인으로 접속 가능하게 만든다.

## 작업 항목
1. 도메인을 Cloudflare에 등록하고 네임서버 전환 완료
2. Cloudflare Zero Trust 조직 생성
3. 서버에 `cloudflared` 설치

### Ubuntu 설치 예시
```bash
# Cloudflare 공식 패키지 저장소 또는 배포 파일 방식 중 1개 선택
# 배포판 방식 사용 시 공식 문서 기준으로 진행
```

### 대안: 직접 다운로드 설치
```bash
cd /tmp
curl -L --output cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
cloudflared --version
```

4. Cloudflare 인증
```bash
cloudflared tunnel login
```
5. 이름 있는 터널 생성
```bash
cloudflared tunnel create central-site-tunnel
```
6. 터널 설정 파일 생성
`/home/svcweb/.cloudflared/config.yml`

### 단일 앱 예시
```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /home/svcweb/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: www.example.com
    service: http://127.0.0.1:8080
  - hostname: admin.example.com
    service: http://127.0.0.1:8080
  - service: http_status:404
```

### 공개/관리 앱 분리 예시
```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /home/svcweb/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: www.example.com
    service: http://127.0.0.1:8080
  - hostname: admin.example.com
    service: http://127.0.0.1:8081
  - service: http_status:404
```

7. DNS 라우트 생성
```bash
cloudflared tunnel route dns central-site-tunnel www.example.com
cloudflared tunnel route dns central-site-tunnel admin.example.com
```
8. 터널 실행 테스트
```bash
cloudflared tunnel run central-site-tunnel
```
9. 서비스 등록
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

> 사람 게이트: `cloudflared tunnel login`, tunnel 생성, DNS route 생성, Access 연결은 실제 Cloudflare 계정으로 최종 실행하고 결과를 기록해야 한다.

## 검증 항목
```bash
cloudflared tunnel list
cloudflared tunnel info central-site-tunnel
systemctl status cloudflared
curl -I https://www.example.com
```

### 기대 결과
- 외부 네트워크에서 `www` 접속 가능
- `admin` 도메인도 도달 가능하지만, 아직 보호 전이라면 즉시 다음 Phase로 진행

## 종료 게이트
- `www`/`admin` 두 호스트명이 Cloudflare Tunnel로 연결되었을 것
- `cloudflared` 가 서비스로 active 일 것

---

# Phase 7. Cloudflare Access로 `admin` 보호

## 목표
편집용 관리자 주소는 허용된 4~5명만 브라우저 인증 후 접근할 수 있게 한다.

## 작업 항목
1. Cloudflare Zero Trust 대시보드에서 Access 앱 생성
   - 유형: Self-hosted
   - 도메인: `admin.<DOMAIN>`
2. 로그인 방식 선택
   - 소규모 운영이면 **One-time PIN(이메일 OTP)** 권장
   - 조직 IdP가 있으면 Google/Microsoft/Okta 등으로 대체 가능
3. 허용 정책 생성
   - 허용 이메일: 편집자 4~5명만 등록
   - 기본 정책: `Allow`
   - 그 외는 기본 거부
4. 세션 시간 설정
   - 예: 8시간 이하
5. 필요 시 `www`는 Access 적용하지 않음 (공개 사이트)
6. 테스트용 브라우저에서 다음 확인
   - 허용 이메일 → OTP 발송/로그인 가능
   - 미허용 이메일 → 차단
7. 앱 내부 로그인도 별도로 유지
   - Cloudflare Access 통과 후에도 앱의 `admin/editor` 계정으로 한 번 더 로그인

## 검증 항목
- 허용 이메일로 `https://admin.<DOMAIN>` 접속 시 OTP 인증 가능
- 미허용 이메일은 차단
- 앱 내부 관리자/편집자 로그인 가능

## 종료 게이트
- `admin` 경로는 **허용 이메일 + 앱 계정** 두 단계가 모두 필요한 상태일 것

---

# Phase 8. 08:00~17:00 운영 자동화

## 목표
서버 가동 시간을 정책대로 맞춘다.

## 중요 원칙
- **켜기(전원 ON)** 는 OS가 꺼져 있으면 소프트웨어만으로 불가능할 수 있다.
- 따라서 08:00 자동 시작은 다음 중 하나가 필요하다.
  1. BIOS/UEFI의 Scheduled Power On / RTC Alarm
  2. Wake-on-LAN
  3. 사람이 직접 전원 켜기
- 반면 17:00 종료는 OS에서 자동화 가능하다.

## 작업 항목
1. 부팅 자동화
   - BIOS/UEFI에서 `07:55` 자동 전원 켜기 설정 (가능 시)
2. 부팅 후 서비스 자동 시작 확인
```bash
sudo systemctl enable docker
sudo systemctl enable cloudflared
```
3. 종료 스크립트 작성
`/srv/central-site/scripts/daily_shutdown.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
cd /srv/central-site

echo "[1/3] optional backup start"
# 백업 스크립트가 있으면 여기서 호출
# /srv/central-site/scripts/backup_now.sh || true

echo "[2/3] stopping app stack"
docker compose down || true

echo "[3/3] shutdown host"
/sbin/shutdown -h now
```

```bash
chmod +x /srv/central-site/scripts/daily_shutdown.sh
```
4. cron 또는 systemd timer 등록

### cron 예시
```bash
crontab -e
```
다음 추가:
```cron
5 17 * * * /srv/central-site/scripts/daily_shutdown.sh
```

5. 재부팅 후 자동 기동 테스트

## 검증 항목
- 오전 부팅 후 Docker / cloudflared 자동 시작
- `www`와 `admin` 접속 가능
- 17:05에 정상 종료되는지 테스트

## 종료 게이트
- 운영 시간 정책이 실제로 작동할 것
- 부팅 실패 시 대체 방안(수동 전원/원격 콘센트/WOL)이 문서화될 것

---

# Phase 9. 백업/복구 체계 구성

## 목표
데이터 손실 시 DB와 업로드 파일을 함께 복구할 수 있게 한다.

## 백업 원칙
- 백업은 **DB + 업로드 파일**을 함께 가져가야 한다.
- 같은 서버 디스크만 백업 대상으로 삼지 말고, 외장 디스크/NAS/다른 시스템으로 복제한다.
- 복구 테스트를 실제로 해봐야 한다.
- `compose`, `Caddy`, `cloudflared`, `.env` 또는 비밀정보 위치 정보도 함께 추적해야 한다.
- 복구 검증은 `DB restore`, `파일 복원`, `앱/프록시 재기동`, `health/smoke 재검증`까지 한 흐름으로 본다.

## 작업 항목
1. 백업 디렉터리 준비
```bash
mkdir -p /srv/central-site/backups/db
mkdir -p /srv/central-site/backups/files
```
2. DB 백업 스크립트 작성 (PostgreSQL 예시)
`/srv/central-site/scripts/backup_db.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%F_%H%M%S)
cd /srv/central-site
docker exec central_db pg_dump -U "$DB_USER" "$DB_NAME" > "/srv/central-site/backups/db/${STAMP}.sql"
```

> 실제 실행 시 `.env` 값을 source 하거나 안전한 방식으로 주입할 것.

3. 업로드 파일 백업
```bash
rsync -a /srv/central-site/data/uploads/ /srv/central-site/backups/files/latest/
```
4. 보관 정책 예시
   - 일간 7개
   - 주간 4개
   - 월간 3개
5. 월 1회 복구 테스트
   - 임시 디렉터리에 복원
   - DB import 테스트
   - 파일 접근 테스트

## 검증 항목
- 백업 파일 생성 여부
- 실제로 SQL import 가능한지
- 업로드 파일이 복사되는지

## 종료 게이트
- 이 문서 또는 운영 기준 안에 복원 절차가 정리되어 있고, 최소 1회 복구 테스트 완료

---

# Phase 10. 점검/인수 테스트/운영 문서화

## 목표
실서비스 전 마지막 검증과 이 문서 안의 운영 기준을 최종 확정한다.

## 작업 항목
1. 외부망에서 공개 사이트 접속 테스트
2. 허용된 편집자 이메일로 `admin` 접속 테스트
3. 편집자 계정으로 로그인 후 자료 생성/수정/삭제 테스트
4. 업로드 파일이 공개 화면에 반영되는지 확인
5. 컨테이너 재시작 후 데이터 유지 확인
6. 서버 재부팅 후 자동 기동 확인
7. 17:00 종료 정책 확인
8. 이 문서에 운영 최종값 기록
   - 서버 정보
   - OS 버전
   - Docker 버전
   - cloudflared 버전
   - compose 파일 경로
   - 볼륨 경로
   - 백업 경로
   - 관리자 이메일 목록
   - 갱신 절차
   - 장애 대응 절차
   - healthcheck 경로와 확인 명령
   - access failure / admin write audit 로그 위치
   - 서비스 장애 / DB 장애 / 보안 사고 의심 대응 절차

## 최종 인수 테스트 체크리스트
- [ ] `www.<DOMAIN>` 외부 접속 성공
- [ ] `admin.<DOMAIN>` 에서 허용 이메일 OTP 인증 성공
- [ ] 앱 내부 로그인 성공
- [ ] 편집자 업로드 성공
- [ ] 편집 결과가 공개 화면에 반영됨
- [ ] DB와 업로드 파일 영속성 확인
- [ ] 서버 재부팅 후 자동 복구 확인
- [ ] 17:00 종료 스케줄 확인
- [ ] 백업 생성 확인
- [ ] 복구 테스트 1회 이상 완료

## 종료 게이트
- 체크리스트 전체 통과
- 이 문서의 운영/장애 대응 섹션 최종값 기입 완료

---

# 운영 후 정기 작업

## 매주
- OS 보안 업데이트 확인
- Docker 이미지 취약점/업데이트 확인
- 로그 확인
- 백업 상태 확인

## 매월
- `cloudflared` 업데이트
- 컨테이너 이미지 업데이트
- 복구 테스트
- 편집자 계정/권한 재검토

## 분기별
- 사용하지 않는 계정 삭제
- 업로드 정책 재검토
- 저장 용량/성능 점검

---

# 장애 대응 기본 절차

## 1. 사이트 접속 불가
확인 순서:
```bash
systemctl status cloudflared
systemctl status docker
docker compose ps
journalctl -u cloudflared -n 100 --no-pager
```

## 2. 앱은 켜져 있는데 화면 오류
```bash
cd /srv/central-site
docker compose logs --tail=200
```

## 3. DB 연결 실패
```bash
docker compose ps
docker logs central_db --tail=100
```

## 4. 업로드 파일 누락
- `/srv/central-site/data/uploads` 확인
- 최근 백업 확인
- 권한 문제 확인

---

# AI에게 추가로 요구할 산출물
이 문서를 실행하는 AI는 최종적으로 아래 파일도 함께 만들어야 한다.

1. `compose.yaml` 최종본
2. `.env.example`
3. `Dockerfile`(앱용)
4. `cloudflared` 설정 파일
5. 백업 스크립트 1개 이상
6. 종료 스크립트 1개
7. 이 문서 안에 반영된 운영 최종값과 장애 대응 절차
8. `AGENTS.md`와 충돌하지 않도록 정리된 루트 markdown 체계

---

# 구현 시 필수 주의사항

1. `admin` 보호를 적용하기 전까지 외부에 관리자 주소를 공개하지 말 것.
2. DB 포트를 외부로 publish 하지 말 것.
3. 업로드 디렉터리와 앱 코드 디렉터리를 분리할 것.
4. `.env` 와 시크릿 파일은 Git 저장소에 올리지 말 것.
5. 관리자 계정과 편집자 계정을 혼용하지 말 것.
6. 서버가 17:00 이후 꺼지는 정책이면, 방문자도 그 시간 이후 접속 불가함을 이 문서의 운영 기준에 명시할 것.
7. BIOS 자동 부팅이 안 되면, 08:00 자동 운영은 추가 장비(WOL/원격 전원 장치/수동 전원) 없이는 완전 자동화되지 않는다고 분명히 기록할 것.

---

# 참고용 공식 문서
아래는 실제 구축 시 우선 참조할 공식 문서다.

- Ubuntu Server 설치 문서: https://ubuntu.com/server/docs/tutorial/basic-installation/
- Ubuntu 방화벽(UFW): https://ubuntu.com/server/docs/how-to/security/firewalls/
- Ubuntu 사용자 관리: https://ubuntu.com/server/docs/how-to/security/user-management/
- Docker Engine Ubuntu 설치: https://docs.docker.com/engine/install/ubuntu/
- Docker Compose Plugin 설치: https://docs.docker.com/compose/install/linux/
- Docker Linux post-install: https://docs.docker.com/engine/install/linux-postinstall/
- Docker restart policy: https://docs.docker.com/engine/containers/start-containers-automatically/
- Cloudflare Tunnel 시작: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/
- Cloudflare Tunnel 다운로드: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/
- Cloudflare Tunnel 로컬 관리: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/create-local-tunnel/
- cloudflared 서비스 실행(Linux): https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/as-a-service/linux/
- Cloudflare Access Self-hosted App: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/
- Cloudflare Access One-time PIN: https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/

---

# 최종 요약
이 프로젝트의 핵심은 아래 5줄로 정리된다.

1. 서버는 Ubuntu Server로 구성한다.
2. 앱은 Docker Compose로 올린다.
3. 외부 공개는 Cloudflare Tunnel로 처리한다.
4. `admin` 은 Cloudflare Access + 앱 자체 로그인으로 이중 보호한다.
5. 서버는 08:00~17:00만 운영하며, 종료 전 백업/정리 절차를 둔다.
