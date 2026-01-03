const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // 브라우저 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // 보안을 위해 nodeIntegration은 false로 설정
      nodeIntegration: false,
      contextIsolation: true,
      // preload 스크립트를 통해 안전하게 API 노출
      preload: path.join(__dirname, 'preload.js')
    },
    // 게임에 최적화된 설정
    frame: true,
    resizable: true
  });

  // HTML 파일 로드
  mainWindow.loadFile('index.html');

  // 개발자 도구 열기 (개발 시에만)
  // mainWindow.webContents.openDevTools();

  // 윈도우가 닫힐 때 참조 제거
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron이 준비되면 윈도우 생성
app.whenReady().then(() => {
  createWindow();

  // macOS에서 독립적으로 동작하도록
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 윈도우가 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

