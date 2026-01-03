# Electron 게임 개발 가이드

## 프로젝트 구조

```
game/
├── main.js          # Electron 메인 프로세스 (앱 창 관리)
├── preload.js       # 보안 브릿지 스크립트
├── index.html       # 게임 UI
├── game.js          # 게임 로직
├── package.json     # 프로젝트 설정
└── README.md        # 이 파일
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 게임 실행
```bash
npm start
```

## Electron 게임 개발 기초

### 1. Electron 아키텍처

Electron은 두 가지 프로세스로 구성됩니다:

- **메인 프로세스 (main.js)**: 
  - 앱의 생명주기 관리
  - 브라우저 윈도우 생성 및 관리
  - Node.js API 접근 가능

- **렌더러 프로세스 (game.js, HTML)**: 
  - 실제 게임이 실행되는 곳
  - 웹 기술(HTML, CSS, JavaScript) 사용
  - 보안상 Node.js 직접 접근 불가 (preload.js 통해 노출)

### 2. 게임 루프 기본 구조

```javascript
class Game {
    update() {
        // 게임 상태 업데이트
        // - 플레이어 위치
        // - 충돌 감지
        // - 점수 계산 등
    }
    
    render() {
        // 화면 그리기
        // - Canvas에 그래픽 렌더링
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}
```

### 3. Canvas 게임 개발 핵심

#### Canvas 초기화
```javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
```

#### 기본 그리기
```javascript
// 사각형
ctx.fillStyle = '#ff0000';
ctx.fillRect(x, y, width, height);

// 원
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();

// 텍스트
ctx.fillStyle = '#ffffff';
ctx.font = '20px Arial';
ctx.fillText('Hello', x, y);
```

#### 애니메이션
```javascript
// requestAnimationFrame 사용 (60fps 목표)
function animate() {
    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 그리기
    draw();
    
    // 다음 프레임
    requestAnimationFrame(animate);
}
```

### 4. 입력 처리

```javascript
// 키보드 입력
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// 게임 루프에서 사용
if (keys['ArrowLeft']) {
    player.x -= speed;
}
```

### 5. 게임 개발 단계

1. **기본 구조 설정** ✅ (완료)
2. **게임 객체 클래스 생성** (플레이어, 적, 아이템 등)
3. **충돌 감지 시스템** 구현
4. **게임 상태 관리** (시작, 일시정지, 게임오버)
5. **사운드 효과** 추가
6. **점수 시스템** 및 **레벨 시스템**
7. **파일 저장** (로컬 스토리지 또는 파일 시스템)

### 6. 성능 최적화 팁

- **이미지 스프라이트** 사용 (여러 이미지를 하나로 합치기)
- **객체 풀링** (자주 생성/삭제되는 객체 재사용)
- **화면 밖 객체 렌더링 생략**
- **requestAnimationFrame** 사용 (setInterval 대신)

### 7. 다음 단계 예제

현재 프로젝트에는 간단한 점프 게임 예제가 포함되어 있습니다. 이를 확장하여:

- 적 캐릭터 추가
- 아이템 수집 시스템
- 레벨 진행 시스템
- 파티클 효과
- 사운드 추가

등을 구현할 수 있습니다.

## 유용한 리소스

- [Electron 공식 문서](https://www.electronjs.org/docs)
- [Canvas API 문서](https://developer.mozilla.org/ko/docs/Web/API/Canvas_API)
- [게임 개발 패턴](https://gameprogrammingpatterns.com/)

## 문제 해결

### 게임이 느려지는 경우
- Canvas 크기 확인
- 불필요한 렌더링 제거
- 객체 수 최적화

### 입력이 반응하지 않는 경우
- 이벤트 리스너가 제대로 등록되었는지 확인
- 키 코드 확인 (대소문자 구분)

### Electron 창이 열리지 않는 경우
- `npm install` 실행 확인
- Node.js 버전 확인 (v14 이상 권장)

# simple-game-electron
