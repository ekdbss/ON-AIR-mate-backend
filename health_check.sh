#!/bin/bash
echo "=== ON-AIR-mate 서버 상태 체크 ==="
echo "시간: $(date)"

echo "1. PM2 상태:"
pm2 status

echo "2. 애플리케이션 헬스 체크:"
curl -f http://localhost:3000/health 2>/dev/null && echo "✅ 정상" || echo "❌ 실패"

echo "3. 메모리 사용량:"
free -h

echo "4. 디스크 사용량:"
df -h

echo "5. 포트 3000 리스닝 확인:"
sudo netstat -tlnp | grep :3000

echo "6. 환경변수 파일 권한:"
ls -la .env

echo "================================"
