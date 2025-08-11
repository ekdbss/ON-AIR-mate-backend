ON-AIR-mate Backend
소개
ON-AIR-mate Backend(node.js) 레포지토리입니다.
🚀 배포 정보 (운영 중)
🌐 프로덕션 서버

서버 URL: https://54.180.254.48
Swagger URL: https://54.180.254.48/api-docs
헬스체크: https://54.180.254.48/health
상태: 🟢 ONLINE (24시간 운영)
보안: 🔒 HTTPS 활성화 (자체 서명 인증서)

☁️ AWS 인프라

EC2: i-0a91a4de26d731d88 (t2.micro, Amazon Linux 2023)
RDS: MySQL 8.0 (db.t3.micro)
리전: ap-northeast-2 (서울)
보안그룹: HTTP(80), HTTPS(443), SSH(22) 오픈
웹서버: Nginx (리버스 프록시)

🔄 배포 상태

프로세스 관리: PM2
자동 재시작: 활성화
로그 로테이션: 활성화
GitHub Actions: 자동 배포 설정 완료
HTTPS: 자체 서명 SSL 인증서 적용


🛠️ 기술 스택

Language: TypeScript
Runtime: Node.js 20.x
Framework: Express.js
ORM: Prisma
Database: MySQL 8.0 (AWS RDS)
Process Manager: PM2
Web Server: Nginx (리버스 프록시)
CI/CD: GitHub Actions

개발 도구

Linting: ESLint
Formatting: Prettier
API 문서: Swagger UI


🚀 로컬 개발 환경 설정
1. 프로젝트 클론
bash# 레포지토리 클론
git clone https://github.com/ON-AIR-mate/Node.js.git
cd Node.js

# 의존성 설치
npm install
2. 환경 변수 설정
.env 파일 내용 (팀원별로 별도 공유):
env# 서버 설정
PORT=3000
NODE_ENV=development

# JWT 설정
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

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
3. 개발 서버 실행
bash# 개발 서버 시작 (자동 재시작)
npm run dev
접속 URL:

API 서버: http://localhost:3000
API 문서: http://localhost:3000/api-docs
헬스체크: http://localhost:3000/health


🔄 배포 가이드
🤖 자동 배포 (권장)
GitHub Actions 사용 - main 브랜치 push 시 자동 배포
bash# 로컬에서 작업
git add .
git commit -m "[feat] 새로운 기능 추가"
git push origin main

# 🚀 자동으로 EC2에 배포됩니다!
배포 프로세스:

✅ 코드 품질 검사 (ESLint)
✅ TypeScript 빌드
✅ EC2 SSH 접속
✅ 코드 pull 및 의존성 설치
✅ 프로덕션 빌드
✅ PM2 재시작
✅ 헬스체크 확인

GitHub Actions 설정:

Settings → Secrets and variables → Actions에서 설정 완료
EC2_KEY: SSH 키 파일 설정 완료 ✅
EC2_HOST: 54.180.254.48 ✅
EC2_USER: ec2-user ✅

👨‍💻 수동 배포 (비상시)
bash# EC2 접속
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
curl https://localhost:3000/health

🔒 HTTPS/SSL 설정
Nginx 리버스 프록시 구성

Nginx: 80/443 포트 → Node.js 3000 포트로 프록시
SSL: 자체 서명 인증서 사용 (개발/테스트 환경)
위치: /etc/nginx/conf.d/app.conf

인증서 관리
bash# 인증서 위치
/etc/nginx/ssl/certificate.crt
/etc/nginx/ssl/private.key

# Nginx 재시작 (설정 변경 시)
sudo systemctl restart nginx
향후 계획

 Let's Encrypt 무료 인증서 적용 (도메인 구매 후)
 AWS Certificate Manager + ALB 고려


🔧 개발 도구 설정
VS Code 자동 포맷팅 (권장)
프로젝트에 VS Code 설정이 포함되어 있어 파일 저장 시 자동 포맷팅됩니다:

필수 확장 프로그램:

esbenp.prettier-vscode (Prettier)
dbaeumer.vscode-eslint (ESLint)


저장 시 자동 적용 ✨

코드 품질 관리
bash# 🔥 포맷팅 + 린팅 (한번에)
npm run format

# ✅ 체크만 (수정하지 않음)
npm run check

# 🏗️ 빌드 확인
npm run build

# 🚀 개발 서버
npm run dev

# 🎯 프로덕션 실행
NODE_ENV=production npm start

🗄️ 데이터베이스
Prisma 설정
bash# 스키마 변경 후 마이그레이션
npm run db:migrate

# 수동 마이그레이션
npx prisma migrate dev --name migration_name

# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 브라우저
npx prisma studio
MySQL 연결 정보

호스트: AWS RDS (서울 리전)
엔진: MySQL 8.0 (db.t3.micro)
포트: 3306
데이터베이스: onairmate
연결 풀: 10개 연결 제한


🎯 운영 관리
PM2 명령어
bash# 상태 확인
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

# 환경변수와 함께 시작
NODE_ENV=production pm2 start ecosystem.config.js
Nginx 관리
bash# 상태 확인
sudo systemctl status nginx

# 설정 테스트
sudo nginx -t

# 재시작
sudo systemctl restart nginx

# 로그 확인
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
시스템 모니터링
bash# 서버 리소스 확인
htop           # CPU/메모리 실시간
free -h        # 메모리 사용량
df -h          # 디스크 사용량

# 네트워크 확인
sudo ss -tulpn | grep :3000  # Node.js 포트
sudo ss -tulpn | grep :443   # HTTPS 포트
netstat -an | grep :443      # HTTPS 연결 상태

# 프로세스 확인
ps aux | grep node
ps aux | grep nginx