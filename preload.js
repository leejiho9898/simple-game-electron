// preload.js는 메인 프로세스와 렌더러 프로세스 사이의 안전한 브릿지 역할
// 여기서 필요한 Electron API를 노출할 수 있습니다

const { contextBridge } = require('electron');

// 렌더러 프로세스에서 사용할 수 있는 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 예시: 플랫폼 정보
  platform: process.platform,
  
  // 필요시 여기에 추가 API를 노출할 수 있습니다
  // 예: 파일 시스템 접근, 설정 저장 등
});

