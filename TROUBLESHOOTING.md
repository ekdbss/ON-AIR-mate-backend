# 🆘 ON-AIR-mate 백엔드 트러블슈팅 가이드

> 개발 및 운영 중 발생할 수 있는 모든 문제와 해결 방법을 정리한 완전 가이드

## 📋 목차

1. [🚀 배포 관련 문제](#-배포-관련-문제)
2. [🗄️ 데이터베이스 연결 문제](#️-데이터베이스-연결-문제)  
3. [🔧 개발 환경 문제](#-개발-환경-문제)
4. [⚙️ PM2 관련 문제](#️-pm2-관련-문제)
5. [🌐 네트워크 및 접속 문제](#-네트워크-및-접속-문제)
6. [🤖 GitHub Actions 문제](#-github-actions-문제)
7. [💾 메모리 및 성능 문제](#-메모리-및-성능-문제)
8. [🔑 인증 및 보안 문제](#-인증-및-보안-문제)
9. [📊 모니터링 및 로그](#-모니터링-및-로그)
10. [🆘 응급 복구 절차](#-응급-복구-절차)

---

## 🚀 배포 관련 문제

### 문제 1: GitHub Actions 배포 실패

#### 🔍 증상
- GitHub Actions 워크플로우가 실패함
- "SSH connection failed" 에러
- "Permission denied" 에러

#### 🛠️ 해결방법

**1. GitHub Secrets 확인**
```bash
# GitHub 레포지토리에서 확인
Settings → Secrets and variables → Actions

# 필요한 Secrets:
EC2_KEY      # SSH 키 파일 전체 내용  
EC2_HOST     # 15.164.176.168
EC2_USER     # ec2-user
```

**2. SSH 키 형식 확인**
```bash
# 올바른 형식:
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(키 내용)
...
-----END RSA PRIVATE KEY-----

# 잘못된 형식:
- 공백이나 줄바꿈 누락
- 헤더/푸터 누락  
- 다른 키 형식 (OpenSSH 등)
```

**3. EC2 보안그룹 확인**
```bash
# SSH 포트 22번 열려있는지 확인
Source: 0.0.0.0/0 (모든 IP 허용)
또는 GitHub Actions IP 대역
```

#### 🎯 예방법
- SSH 키 정기적 갱신
- GitHub Secrets 백업
- 배포 스크립트 테스트

---

### 문제 2: EC2 수동 배포 실패

#### 🔍 증상
- git pull 실패
- npm install 오류
- pm2 restart 실패

#### 🛠️ 해결방법

**1. Git 관련 오류**
```bash
# 로컬 변경사항 충돌
git stash
git pull origin main
git stash pop

# 강제 업데이트 (주의!)
git fetch origin
git reset --hard origin/main
```

**2. 권한 문제**
```bash
# 파일 권한 확인
ls -la /home/ec2-user/on-air-mate

# 권한 수정
sudo chown -R ec2-user:ec2-user /home/ec2-user/on-air-mate
chmod -R 755 /home/ec2-user/on-air-mate
```

**3. 디스크 공간 부족**
```bash
# 디스크 사용량 확인
df -h

# 불필요한 파일 정리
sudo yum autoremove      # Amazon Linux

# 로그 파일 정리
pm2 flush
sudo journalctl --vacuum-time=7d
```

---

## 🗄️ 데이터베이스 연결 문제

### 문제 1: RDS 연결 실패

#### 🔍 증상
- `Error: connect ETIMEDOUT`
- `Error: Access denied for user`
- `Error: Unknown database 'onairmate'`

#### 🛠️ 해결방법

**1. 연결 정보 확인**
```bash
# 환경변수 확인
grep -E "(DATABASE_URL|DB_)" .env

# 올바른 형식:
DATABASE_URL="mysql://admin:on-air-mate@onairmate-db-seoul.cviw844m2ex4.ap-northeast-2.rds.amazonaws.com:3306/onairmate"
```

**2. 네트워크 연결 테스트**
```bash
# RDS 연결 테스트
telnet onairmate-db-seoul.cviw844m2ex4.ap-northeast-2.rds.amazonaws.com 3306

# DNS 확인
nslookup onairmate-db-seoul.cviw844m2ex4.ap-northeast-2.rds.amazonaws.com
```

**3. RDS 보안그룹 확인**
```bash
# AWS Console에서 확인:
# RDS → onairmate-db-seoul → Connectivity & security → Security groups
# Inbound rules: MySQL/Aurora (3306) 
# Source: EC2 보안그룹 또는 EC2 private IP
```

**4. Prisma 연결 테스트**
```bash
# Prisma 연결 확인
npx prisma db pull

# 스키마 동기화
npx prisma generate
```

---

### 문제 2: 마이그레이션 실패

#### 🔍 증상
- Migration failed
- Schema drift detected
- Connection pool timeout

#### 🛠️ 해결방법

**1. 마이그레이션 상태 확인**
```bash
# 마이그레이션 히스토리 확인
npx prisma migrate status

# 실패한 마이그레이션 확인
npx prisma migrate resolve --rolled-back migration_name
```

**2. 스키마 리셋 (개발환경만)**
```bash
# ⚠️ 주의: 모든 데이터 삭제됨
npx prisma migrate reset

# 새로 마이그레이션
npx prisma migrate dev --name init
```

**3. 수동 마이그레이션**
```bash
# SQL 직접 실행
npx prisma db execute --file ./migration.sql

# 또는 MySQL 클라이언트로 접속
mysql -h onairmate-db-seoul.cviw844m2ex4.ap-northeast-2.rds.amazonaws.com -u admin -p onairmate
```

---

## 🔧 개발 환경 문제

### 문제 1: 의존성 설치 실패

#### 🔍 증상
- `npm ERR! peer dep missing`
- `npm ERR! code EACCES`
- `npm ERR! network timeout`

#### 🛠️ 해결방법

**1. npm 캐시 정리**
```bash
# npm 캐시 확인
npm cache verify

# 캐시 정리
npm cache clean --force

# node_modules 완전 재설치
rm -rf node_modules package-lock.json
npm install
```

**2. 권한 문제**
```bash
# npm 권한 설정 (글로벌)
sudo chown -R $(whoami) ~/.npm

# 또는 nvm 사용 권장
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**3. 네트워크 문제**
```bash
# npm 레지스트리 확인
npm config get registry

# 레지스트리 변경 (국내)
npm config set registry https://registry.npmjs.org/

# 타임아웃 증가
npm config set timeout 60000
```

---

### 문제 2: TypeScript 컴파일 오류

#### 🔍 증상
- `error TS2307: Cannot find module`
- `error TS2345: Argument of type is not assignable`
- `error TS2532: Object is possibly 'undefined'`

#### 🛠️ 해결방법

**1. 타입 정의 확인**
```bash
# 타입 정의 설치
npm install --save-dev @types/node @types/express

# tsconfig.json 확인
cat tsconfig.json
```

**2. 모듈 해결 문제**
```json
// tsconfig.json 수정
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true
  }
}
```

**3. 타입 체크 무시 (임시)**
```typescript
// 임시 해결책 (권장하지 않음)
// @ts-ignore
const result = problematicCode();

// 더 나은 방법
const result = problematicCode() as any;
```

---

## ⚙️ PM2 관련 문제

### 문제 1: PM2 프로세스 시작 실패

#### 🔍 증상
- `PM2: Process failed to start`
- `PM2: Application has thrown an uncaught exception`
- `PM2: EADDRINUSE: address already in use :::3000`

#### 🛠️ 해결방법

**1. 포트 충돌 확인**
```bash
# 포트 사용 확인
sudo ss -tulpn | grep :3000
sudo lsof -i :3000

# 프로세스 종료
sudo kill -9 PID_NUMBER

# 또는 포트 변경
export PORT=3001
```

**2. PM2 완전 초기화**
```bash
# 모든 PM2 프로세스 정지
pm2 stop all
pm2 delete all
pm2 kill

# PM2 재시작
pm2 start npm --name "onairmate-api" -- run start
pm2 save
```

**3. PM2 설정 파일 사용**
```javascript
// ecosystem.config.js 생성
module.exports = {
  apps: [{
    name: 'onairmate-api',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

```bash
# 설정 파일로 시작
pm2 start ecosystem.config.js
```

---

### 문제 2: PM2 자동 시작 설정 실패

#### 🔍 증상
- 서버 재부팅 후 애플리케이션이 시작되지 않음
- `pm2 startup` 실패

#### 🛠️ 해결방법

**1. Startup 스크립트 재설정**
```bash
# 기존 startup 제거
pm2 unstartup

# 새로 설정
pm2 startup
# 출력된 명령어 실행 (sudo 권한 필요)

# 현재 프로세스 저장
pm2 save
```

**2. 시스템 서비스 확인**
```bash
# 서비스 상태 확인
sudo systemctl status pm2-ec2-user

# 서비스 재시작
sudo systemctl restart pm2-ec2-user

# 부팅 시 자동 시작 활성화
sudo systemctl enable pm2-ec2-user
```

**3. 수동 테스트**
```bash
# 서버 재부팅
sudo reboot

# 재접속 후 확인
ssh -i your-key.pem ec2-user@15.164.176.168
pm2 status
```

---

## 🌐 네트워크 및 접속 문제

### 문제 1: 외부에서 서버 접속 불가

#### 🔍 증상
- `curl: (7) Failed to connect to 15.164.176.168 port 3000: Connection refused`
- `This site can't be reached`

#### 🛠️ 해결방법

**1. 서버 상태 확인**
```bash
# PM2 상태 확인
pm2 status

# 포트 바인딩 확인
sudo ss -tulpn | grep :3000

# 로컬 접속 테스트
curl http://localhost:3000/health
```

**2. 보안그룹 설정 확인**
```bash
# AWS Console → EC2 → Security Groups
# onairmate-sg 규칙 확인:

Inbound Rules:
Type: Custom TCP
Port: 3000
Source: 0.0.0.0/0

Type: SSH
Port: 22
Source: 0.0.0.0/0 (또는 특정 IP)
```

**3. 방화벽 확인 (Amazon Linux)**
```bash
# iptables 확인
sudo iptables -L

# 방화벽 비활성화 (임시)
sudo systemctl stop iptables

# 영구 비활성화 (개발환경만)
sudo systemctl disable iptables
```

---

### 문제 2: CORS 에러

#### 🔍 증상
```
Access to fetch at 'http://15.164.176.168:3000/api/users' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

#### 🛠️ 해결방법

**1. CORS 설정 확인**
```typescript
// src/app.ts에서 CORS 설정 확인
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-frontend-domain.com',
    'https://onairmate.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

**2. 개발환경에서 임시 해결**
```typescript
// 모든 origin 허용 (개발용만)
app.use(cors({
  origin: true,
  credentials: true
}));
```

---

## 🤖 GitHub Actions 문제

### 문제 1: 워크플로우 권한 에러

#### 🔍 증상
- `Error: Permission denied (publickey)`
- `Host key verification failed`

#### 🛠️ 해결방법

**1. SSH 키 재확인**
```bash
# 로컬에서 SSH 키 확인
cat ~/.ssh/your-key.pem

# GitHub Secrets의 EC2_KEY와 완전히 동일한지 확인
# 공백, 줄바꿈, 헤더/푸터 모두 포함
```

**2. SSH 호스트 키 문제**
```yaml
# .github/workflows/deploy.yaml 수정
- name: Deploy to EC2
  run: |
    echo "${{ secrets.EC2_KEY }}" > private_key
    chmod 600 private_key
    ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts
    ssh -o StrictHostKeyChecking=no -i private_key ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} '
      cd /home/ec2-user/on-air-mate &&
      git pull origin main &&
      npm ci &&
      npm run build &&
      pm2 restart onairmate-api
    '
```

---

### 문제 2: 빌드 단계 실패

#### 🔍 증상
- `npm ERR! code ELIFECYCLE`
- `npm ERR! errno 1`
- `ESLint errors found`

#### 🛠️ 해결방법

**1. 로컬에서 미리 테스트**
```bash
# 로컬에서 빌드 확인
npm run format
npm run build

# 에러 수정 후 커밋
git add .
git commit -m "[fix] ESLint 에러 수정"
git push origin main
```

**2. 빌드 에러 무시 (임시)**
```yaml
# .github/workflows/deploy.yaml
- name: Run ESLint
  run: npm run lint
  continue-on-error: true  # 임시로 에러 무시
```

---

## 💾 메모리 및 성능 문제

### 문제 1: 메모리 부족

#### 🔍 증상
- `PM2: Process failed due to memory limit`
- `JavaScript heap out of memory`

#### 🛠️ 해결방법

**1. 메모리 사용량 확인**
```bash
# 시스템 메모리 확인
free -h

# PM2 프로세스별 메모리
pm2 monit

# 프로세스 메모리 상세
ps aux --sort=-%mem | head
```

**2. 스왑 파일 설정**
```bash
# 1GB 스왑 생성
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 적용
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**3. PM2 메모리 제한 설정**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'onairmate-api',
    script: 'npm',
    args: 'start',
    max_memory_restart: '500M',  // 500MB 초과시 재시작
    node_args: '--max-old-space-size=512'  // Node.js 힙 크기 제한
  }]
};
```

---

### 문제 2: 응답 속도 저하

#### 🔍 증상
- API 응답이 5초 이상 걸림
- 타임아웃 에러 발생

#### 🛠️ 해결방법

**1. 성능 모니터링**
```bash
# CPU 사용률 확인
htop

# 네트워크 연결 상태
ss -s

# 디스크 I/O 확인
iostat -x 1
```

**2. 데이터베이스 연결 풀 최적화**
```typescript
// src/db.config.ts
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,        // 연결 수 제한
  acquireTimeout: 60000,      // 연결 대기 시간
  timeout: 60000,             // 쿼리 타임아웃
  reconnect: true,            // 자동 재연결
  queueLimit: 0
});
```

---

## 🔑 인증 및 보안 문제

### 문제 1: JWT 토큰 검증 실패

#### 🔍 증상
- `JsonWebTokenError: invalid token`
- `TokenExpiredError: jwt expired`

#### 🛠️ 해결방법

**1. JWT Secret 확인**
```bash
# 환경변수 확인
grep JWT_SECRET .env

# 서버와 클라이언트 동일한 secret 사용하는지 확인
```

**2. 토큰 형식 확인**
```javascript
// 올바른 토큰 형식
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 잘못된 형식
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  // Bearer 누락
```

**3. 토큰 만료 시간 조정**
```typescript
// src/auth/jwt.ts
export const generateToken = (user: { id: string; nickname: string }) => {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: '7d',  // 7일로 연장
  });
};
```

---

## 📊 모니터링 및 로그

### 로그 확인 방법

**1. 애플리케이션 로그**
```bash
# PM2 로그 실시간 확인
pm2 logs onairmate-api

# 에러 로그만
pm2 logs onairmate-api --err

# 특정 줄 수만
pm2 logs onairmate-api --lines 100

# 로그 파일 직접 확인
tail -f ~/.pm2/logs/onairmate-api-out.log
tail -f ~/.pm2/logs/onairmate-api-error.log
```

**2. 시스템 로그**
```bash
# 시스템 로그
sudo journalctl -u pm2-ec2-user -f

# 부팅 로그
sudo journalctl -b

# 시간 범위별 로그
sudo journalctl --since "1 hour ago"
```

**3. 웹서버 접근 로그**
```bash
# Nginx 로그 (사용시)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🆘 응급 복구 절차

### 서비스 완전 중단 시

**1단계: 빠른 진단**
```bash
# EC2 접속 확인
ssh -i your-key.pem ec2-user@15.164.176.168

# 기본 상태 확인
pm2 status
curl http://localhost:3000/health
free -h
df -h
```

**2단계: 서비스 재시작**
```bash
# PM2 강제 재시작
pm2 restart onairmate-api --force

# 실패 시 완전 재시작
pm2 delete onairmate-api
pm2 start npm --name "onairmate-api" -- run start
pm2 save
```

**3단계: 백업에서 복구**
```bash
# 코드 백업에서 복구
cd /home/ec2-user
git clone https://github.com/ON-AIR-mate/Node.js.git on-air-mate-backup
cd on-air-mate-backup

# 환경변수 복사
cp ../on-air-mate/.env .

# 의존성 설치 및 시작
npm install
npm run build
pm2 start npm --name "onairmate-api-backup" -- run start
```

### 데이터베이스 연결 불가 시

**1. 임시 대안 서비스**
```typescript
// 임시 응답을 위한 Mock API
app.get('/api/*', (req, res) => {
  res.status(503).json({
    success: false,
    error: {
      code: 'DATABASE_MAINTENANCE',
      message: '데이터베이스 점검 중입니다. 잠시 후 다시 시도해주세요.'
    }
  });
});
```

**2. RDS 재시작**
```bash
# AWS CLI로 RDS 재시작 (권한 필요)
aws rds reboot-db-instance --db-instance-identifier onairmate-db-seoul

# 또는 AWS Console에서 수동 재시작
```

### GitHub Actions 배포 불가 시

**1. 수동 배포로 전환**
```bash
# EC2에서 직접 배포
cd /home/ec2-user/on-air-mate
git pull origin main
npm ci
npm run build
pm2 restart onairmate-api
```

**2. 롤백**
```bash
# 이전 커밋으로 롤백
git log --oneline -10
git reset --hard COMMIT_HASH
npm run build
pm2 restart onairmate-api
```

---

## 📞 긴급 연락처 및 리소스

### 문서 및 참고자료
- **AWS RDS 문서**: https://docs.aws.amazon.com/rds/
- **PM2 공식 문서**: https://pm2.keymetrics.io/docs/
- **Prisma 문서**: https://www.prisma.io/docs/

### 외부 모니터링 도구
```bash
# 서버 상태 모니터링 (Uptime Robot 등)
curl -X POST "https://api.uptimerobot.com/v2/getMonitors" \
     -d "api_key=YOUR_API_KEY" \
     -d "format=json"
```

### 백업 및 복구
```bash
# 데이터베이스 백업
mysqldump -h onairmate-db-seoul.cviw844m2ex4.ap-northeast-2.rds.amazonaws.com \
          -u admin -p onairmate > backup_$(date +%Y%m%d).sql

# 코드 백업
tar -czf backup_$(date +%Y%m%d).tar.gz /home/ec2-user/on-air-mate
```

---

## ✅ 트러블슈팅 체크리스트

### 문제 발생 시 확인 순서

- [ ] PM2 프로세스 상태 확인 (`pm2 status`)
- [ ] 애플리케이션 로그 확인 (`pm2 logs onairmate-api`)
- [ ] 시스템 리소스 확인 (`free -h`, `df -h`)
- [ ] 네트워크 연결 확인 (`curl localhost:3000/health`)
- [ ] 데이터베이스 연결 확인 (`npx prisma db pull`)
- [ ] 보안그룹 설정 확인 (AWS Console)
- [ ] 환경변수 확인 (`grep -E "(DATABASE_URL|JWT_SECRET)" .env`)
- [ ] GitHub Actions 워크플로우 확인 (Actions 탭)

### 복구 후 확인사항

- [ ] 헬스체크 정상 응답 (`curl http://15.164.176.168:3000/health`)
- [ ] API 문서 접근 가능 (http://15.164.176.168:3000/api-docs)
- [ ] PM2 자동 시작 설정 (`pm2 startup`, `pm2 save`)
- [ ] 로그 로테이션 작동 확인
- [ ] 메모리 사용량 정상 범위
- [ ] 데이터베이스 연결 안정성

---

## 🎯 성능 최적화 팁

### CPU 최적화
```bash
# PM2 클러스터 모드 (멀티코어 활용)
pm2 start ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'onairmate-api',
    script: 'npm',
    args: 'start',
    instances: 'max',  // CPU 코어 수만큼 인스턴스 생성
    exec_mode: 'cluster'
  }]
};
```

### 메모리 최적화
```typescript
// 메모리 누수 방지
process.on('exit', () => {
  console.log('Process exiting...');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
```

### 데이터베이스 최적화
```typescript
// 연결 풀 최적화
export const pool = mysql.createPool({
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});
```

---

**🚨 Remember**: 문제 발생 시 당황하지 말고 체계적으로 접근하세요!

1. **로그 확인** → 2. **상태 진단** → 3. **단계별 해결** → 4. **재발 방지**