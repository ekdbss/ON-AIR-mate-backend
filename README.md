## 소개

ON-AIR-mate Backend(node.js) 레포지토리입니다.

<!-- ## 주요 기능

-
-
- -->

## 기술 스택

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma

### **데이터베이스**

- MySQL

### **개발 도구**

- **Linting**: ESLint
- **Formatting**: Prettier

## 프로젝트 구조

```
.
├── .github/
├── prisma/
│   └── schema.prisma
├── src/
│   └── app.ts
├── .gitignore
├── eslint.config.ts
├── package.json
├── prettierrc.ts
└── tsconfig.json
```

## 프로젝트 실행

### **Installation**

1. 레포지토리 클론

```bash
git clone https://github.com/ON-AIR-mate/Node.js.git
```

2. 패키지 설치

```bash
npm install
```

3. `env` 파일 설정

4. 개발 서버 실행

```bash
npm run dev
```

<!-- ## API

API에 대한 문서는 [링크]() 에서 확인하실 수 있습니다. -->

## 코드 컨벤션

### 🧑‍💻 **코드 포맷**

- 들여쓰기는 space 2로 설정
- single quote(작은 따옴표) 사용

### 📜 **typeScript 관련**

- ON AIR mate Node.js에서는 typescript를 사용
- 특정한 상황 외에는 type보다 `interface`를 사용해주세요.

### 📏 **Naming(네이밍 규칙)**

- **`변수`**는 camelCase 사용
- **`상수`**는 대문자  + SNAKE_CASE 사용
- 가급적이면 약어를 피해주세요!
- 페이지 등 정의할 땐 **`function`, 그 외는 `화살표 함수`를 사용해주세요.**

- **commit 형식**
    - [Feat]: 새로운 기능 추가
    - [Fix]: 버그 수정
    - [Docs]: 문서 수정
    - [Style]: 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우
    - [Refactor]: 코드 리펙토링
    - [Test]: 테스트 코드, 리펙토링 테스트 코드 추가
    - [Chore]: 빌드 업무 수정, 패키지 매니저 수정

    ## 브랜치 전략
    - 각자 **‘닉네임/이름(영어)’** 형식으로 브랜치 생성 및 작업 진행  ex. `nickname/hongildong`
    - Git-flow 전략을 기반으로 main, develop 브랜치 운용
    - main, develop 브랜치로 나누어 개발
        - main 브랜치 : 배포 단계에서만 사용하는 브랜치
        - develop 브랜치 : 개발 단계에서 git-flow의 master 역할을 하는 브랜치