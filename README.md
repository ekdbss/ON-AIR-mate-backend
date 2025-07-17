# ON-AIR-mate Backend

## 소개

ON-AIR-mate Backend(node.js) 레포지토리입니다.

## 🚀 배포 정보 (운영 중)

### **🌐 프로덕션 서버**
- **서버 URL**: http://54.180.254.48:3000
- **헬스체크**: http://54.180.254.48:3000/health
- **상태**: 🟢 **ONLINE** (24시간 운영)

### **☁️ AWS 인프라**
- **EC2**: i-0a91a4de26d731d88 (t2.micro, Amazon Linux 2023)
- **RDS**: MySQL 8.0 (db.t3.micro)
- **리전**: ap-northeast-2 (서울)
- **보안그룹**: HTTP(3000), SSH(22) 오픈

### **🔄 배포 상태**
- **프로세스 관리**: PM2
- **자동 재시작**: 활성화
- **로그 로테이션**: 활성화
- **GitHub Actions**: 자동 배포 설정 완료

---

## 🛠️ 기술 스택

- **Language**: TypeScript
- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: MySQL 8.0 (AWS RDS)
- **Process Manager**: PM2
- **CI/CD**: GitHub Actions

### **개발 도구**
- **Linting**: ESLint
- **Formatting**: Prettier
- **API 문서**: Swagger UI

---

## 🏗️ 프로젝트 구조

```
.
├── .github/
│   └── workflows/
│       └── deploy.yaml        # GitHub Actions 자동 배포
├── .vscode/                   # VS Code 설정
├── prisma/
│   └── schema.prisma         # 데이터베이스 스키마
├── src/
│   ├── auth/                 # JWT 인증
│   │   ├── jwt.ts
│   │   └── passport.ts
│   ├── middleware/           # 미들웨어
│   │   ├── authMiddleware.ts
│   │   └── errors/
│   ├── utils/               # 유틸리티 함수
│   │   └── response.ts
│   ├── db.config.ts         # 데이터베이스 설정
│   ├── swagger.ts           # Swagger 설정
│   └── app.ts               # 메인 애플리케이션
├── scripts/
│   └── migrate.js           # 마이그레이션 스크립트
├── .env.example             # 환경변수 템플릿
├── ecosystem.config.js      # PM2 설정
├── .prettierrc.json         # Prettier 설정
├── eslint.config.js         # ESLint 설정
├── package.json
├── tsconfig.json
├── TROUBLESHOOTING.md       # 트러블슈팅 가이드
└── TESTING.md               # 테스트 가이드
```

---

## 🚀 로컬 개발 환경 설정

### **1. 프로젝트 클론**

```bash
# 레포지토리 클론
git clone https://github.com/ON-AIR-mate/Node.js.git
cd Node.js

# 의존성 설치
npm install
```

### **2. 환경변수 설정**

```bash
# 환경변수 파일 생성
cp .env.example .env
```

**`.env` 파일 내용 (팀원별로 별도 공유):**
```env
# 서버 설정
PORT=3000
NODE_ENV=development

# JWT 설정
JWT_SECRET=your_jwt_secret_here

# 데이터베이스 설정
DATABASE_URL="mysql://username:password@host:3306/database"
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=onairmate_dev
DB_PORT=3306

# AWS 설정 (개발 환경용)
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_dev_access_key
AWS_SECRET_ACCESS_KEY=your_dev_secret_key
S3_BUCKET_NAME=your_dev_bucket
```

### **3. 개발 서버 실행**

```bash
# 개발 서버 시작 (자동 재시작)
npm run dev
```

**접속 URL:**
- **API 서버**: http://localhost:3000
- **API 문서**: http://localhost:3000/api-docs
- **헬스체크**: http://localhost:3000/health

---

## 🔄 배포 가이드

### **🤖 자동 배포 (권장)**

**GitHub Actions 사용 - main 브랜치 push 시 자동 배포**

```bash
# 로컬에서 작업
git add .
git commit -m "[feat] 새로운 기능 추가"
git push origin main

# 🚀 자동으로 EC2에 배포됩니다!
```

**배포 프로세스:**
1. ✅ 코드 품질 검사 (ESLint)
2. ✅ TypeScript 빌드
3. ✅ EC2 SSH 접속
4. ✅ 코드 pull 및 의존성 설치
5. ✅ 프로덕션 빌드
6. ✅ PM2 재시작
7. ✅ 헬스체크 확인

**GitHub Actions 설정:**
- `Settings` → `Secrets and variables` → `Actions`에서 설정 완료
- `EC2_KEY`: SSH 키 파일 설정 완료 ✅
- `EC2_HOST`: `54.180.254.48` ✅
- `EC2_USER`: `ec2-user` ✅

### **👨‍💻 수동 배포 (비상시)**

```bash
# EC2 접속
ssh -i your-key.pem ec2-user@54.180.254.48

# 프로젝트 디렉토리 이동
cd /home/ec2-user/on-air-mate

# 최신 코드 가져오기
git pull origin main

# 의존성 설치 및 빌드
npm ci
npm run format
npm run build

# PM2 재시작
pm2 restart onairmate-api

# 배포 확인
pm2 status
curl http://localhost:3000/health
```

---

## 🔧 개발 도구 설정

### **VS Code 자동 포맷팅 (권장)**

프로젝트에 VS Code 설정이 포함되어 있어 **파일 저장 시 자동 포맷팅**됩니다:

1. **필수 확장 프로그램**:
   - `esbenp.prettier-vscode` (Prettier)
   - `dbaeumer.vscode-eslint` (ESLint)
2. 저장 시 자동 적용 ✨

### **코드 품질 관리**

```bash
# 🔥 포맷팅 + 린팅 (한번에)
npm run format

# ✅ 체크만 (수정하지 않음)
npm run check

# 🏗️ 빌드 확인
npm run build

# 🚀 개발 서버
npm run dev

# 🎯 프로덕션 실행
npm start
```

---

## 🗄️ 데이터베이스

### **Prisma 설정**

```bash
# 스키마 변경 후 마이그레이션
npm run db:migrate

# 수동 마이그레이션
npx prisma migrate dev --name migration_name

# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 브라우저
npx prisma studio
```

### **MySQL 연결 정보**
- **호스트**: AWS RDS (서울 리전)
- **엔진**: MySQL 8.0 (db.t3.micro)
- **포트**: 3306
- **데이터베이스**: onairmate
- **연결 풀**: 10개 연결 제한

---

## 🎯 운영 관리

### **PM2 명령어**

```bash
# 상태 확인
pm2 status

# 로그 확인 (실시간)
pm2 logs onairmate-api

# 모니터링 대시보드
pm2 monit

# 재시작
pm2 restart onairmate-api

# 중지/시작
pm2 stop onairmate-api
pm2 start onairmate-api

# 메모리 사용량 상세
pm2 show onairmate-api
```

### **시스템 모니터링**

```bash
# 서버 리소스 확인
htop           # CPU/메모리 실시간
free -h        # 메모리 사용량
df -h          # 디스크 사용량

# 네트워크 확인
sudo ss -tulpn | grep :3000  # 포트 상태
netstat -an | grep :3000     # 연결 상태

# 프로세스 확인
ps aux | grep node
ps aux --sort=-%mem | head   # 메모리 사용량 상위
```

---

## 📋 API 엔드포인트

### **현재 구현된 엔드포인트**
- **헬스체크**: `GET /health` - 서버 상태 확인 ✅
- **API 문서**: `GET /api-docs` - Swagger UI ✅  
- **루트**: `GET /` - Hello World ✅
- **인증 테스트**: `GET /protected` - JWT 토큰 테스트 ✅

### **개발 예정 엔드포인트**
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/users/profile` - 프로필 조회
- `PUT /api/users/profile` - 프로필 수정
- `GET /api/rooms` - 방 목록
- `POST /api/rooms` - 방 생성

---

## 🧪 테스트

### **테스트 종류**
```bash
# 단위 테스트 (예정)
npm test

# 통합 테스트 (예정)
npm run test:integration

# API 테스트 (수동)
curl http://54.180.254.48:3000/health
curl http://localhost:3000/api-docs
```

**자세한 테스트 가이드**: [TESTING.md](./TESTING.md)

---

## 🆘 트러블슈팅

### **자주 발생하는 문제 (Quick Fix)**

#### **1. 서버 접속 불가**
```bash
# 🔍 진단
pm2 status
curl http://localhost:3000/health

# 🛠️ 해결
pm2 restart onairmate-api
```

#### **2. 포맷팅 오류**
```bash
# 🔍 진단  
npm run check

# 🛠️ 해결
npm run format
```

#### **3. 빌드 실패**
```bash
# 🔍 진단
npm run build

# 🛠️ 해결
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **4. GitHub Actions 실패**
```bash
# 🔍 GitHub → Actions → 워크플로우 로그 확인
# 🛠️ SSH 키 및 Secrets 설정 재확인
```

**전체 트러블슈팅 가이드**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📋 코드 컨벤션

### **포맷팅 규칙**
- **들여쓰기**: space 2
- **따옴표**: single quote
- **세미콜론**: 필수
- **줄바꿈**: LF (Unix)

### **TypeScript 규칙**
- **interface** 사용 권장 (type 대신)
- **explicit return type** 권장
- **any 사용 금지** (필요시 unknown)

### **브랜치 전략 (GitHub Flow)**
```
main (자동 배포)
 ├── feature/user-auth
 ├── feature/room-management  
 ├── fix/cors-error
 └── docs/api-documentation
```

### **커밋 메시지 규칙**
```bash
[feat] 사용자 인증 API 추가
[fix] CORS 에러 수정
[docs] API 문서 업데이트
[refactor] 데이터베이스 연결 로직 개선
[chore] 의존성 업데이트
[test] 회원가입 테스트 추가
```

---

## 📞 팀원 가이드

### **새 팀원 온보딩 체크리스트**

- [ ] **1. 저장소 클론 및 설정**
```bash
git clone https://github.com/ON-AIR-mate/Node.js.git
cd Node.js
npm install
cp .env.example .env
```

- [ ] **2. 환경변수 설정** (팀 리더에게 요청)
- [ ] **3. 개발 서버 실행** (`npm run dev`)
- [ ] **4. API 문서 확인** (http://localhost:3000/api-docs)
- [ ] **5. 첫 커밋 테스트** (feature 브랜치에서)

### **운영 서버 접근** (필요시)
- [ ] EC2 SSH 키 요청
- [ ] AWS IAM 권한 요청  
- [ ] RDS 접근 권한 확인
- [ ] PM2 명령어 교육

### **개발 워크플로우**
1. **이슈 생성** → **브랜치 생성** → **개발** → **PR** → **리뷰** → **머지**
2. **main 브랜치**: 자동 배포됨 (신중하게!)
3. **feature 브랜치**: PR로만 머지

---

## 📊 명령어 치트시트

| 용도 | 명령어 | 설명 |
|------|--------|------|
| **개발** | `npm install` | 의존성 설치 |
| | `npm run dev` | 개발 서버 실행 |
| | `npm run format` | 코드 포맷팅 + 린팅 |
| | `npm run build` | TypeScript 컴파일 |
| | `npm start` | 프로덕션 실행 |
| **DB** | `npm run db:migrate` | DB 마이그레이션 |
| | `npx prisma studio` | DB 브라우저 |
| | `npx prisma generate` | 클라이언트 재생성 |
| **운영** | `pm2 status` | PM2 상태 확인 |
| | `pm2 logs onairmate-api` | 로그 확인 |
| | `pm2 restart onairmate-api` | 서버 재시작 |
| | `pm2 monit` | 실시간 모니터링 |
| **시스템** | `htop` | 시스템 리소스 |
| | `free -h` | 메모리 사용량 |
| | `df -h` | 디스크 사용량 |

---

## ⚠️ 중요 주의사항

### **🔐 보안**
- ❌ `.env` 파일 절대 커밋 금지
- ❌ AWS 키 절대 하드코딩 금지  
- ✅ 민감한 정보는 GitHub Secrets 사용
- ✅ JWT Secret 정기적 교체

### **🚀 배포**
- ⚡ main 브랜치 push = 자동 배포
- ✅ 배포 전 반드시 로컬 테스트
- ✅ 배포 후 헬스체크 확인 필수
- 🔄 롤백 준비 (이전 커밋 해시 기록)

### **💾 데이터베이스**
- 📋 마이그레이션 전 백업
- ❌ 운영 DB 직접 수정 금지
- 📢 스키마 변경 시 팀 전체 공유
- 🔍 쿼리 성능 모니터링

### **🔧 개발**
- ✅ 커밋 전 `npm run format` 실행
- ✅ PR 생성 전 빌드 확인  
- ✅ 코드 리뷰 필수
- 📝 의미 있는 커밋 메시지 작성

---

## 🎉 현재 상태 요약

### **✅ 완료된 설정**
- [x] **AWS 인프라**: EC2 + RDS 운영 중
- [x] **자동 배포**: GitHub Actions 설정 완료
- [x] **프로세스 관리**: PM2 설정 완료
- [x] **도메인 설정**: IP 기반 접근 가능
- [x] **보안 설정**: SSH, 방화벽, JWT 설정
- [x] **모니터링**: 로그, 헬스체크 설정
- [x] **개발 환경**: TypeScript, ESLint, Prettier

### **🚧 진행 중인 작업**
- [ ] **API 개발**: 사용자, 방, 인증 API
- [ ] **데이터베이스**: 스키마 최적화
- [ ] **테스트**: 단위/통합 테스트 추가
- [ ] **문서화**: API 문서 상세화

### **🎯 다음 단계**
1. **API 라우터 구현** (auth, users, rooms)
2. **데이터베이스 스키마 마이그레이션**
3. **프론트엔드 연동 테스트**
4. **성능 최적화 및 모니터링**

---

## 📞 연락처 및 리소스

### **프로덕션 정보**
- ** 서버**: http://54.180.254.48:3000
- ** 헬스체크**: http://54.180.254.48:3000/health
- ** 상태**: 🟢 **ONLINE** (24시간 운영)

### **개발 리소스**
- **GitHub**: https://github.com/ON-AIR-mate/Node.js
- **AWS 콘솔**: ap-northeast-2 (서울)
- **Prisma 문서**: https://www.prisma.io/docs/
- **PM2 문서**: https://pm2.keymetrics.io/docs/

---

## Ready to Code!
