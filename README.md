# Tetris (브라우저용)

간단한 HTML + CSS + JavaScript로 만든 테트리스 게임입니다. `index.html`을 브라우저에서 열면 바로 플레이할 수 있습니다.

## 실행 방법

방법 1 — 파일 직접 열기 (간단)

1. 파일 탐색기에서 `index.html`을 더블클릭하여 기본 브라우저로 엽니다.

방법 2 — 간단한 로컬 웹서버 (권장)

PowerShell에서 현재 폴더(이 프로젝트 폴더)로 이동한 뒤 아래 중 하나 실행:

Python (설치되어 있을 경우):
```powershell
python -m http.server 8000
# 브라우저에서 http://localhost:8000 를 열어 플레이
```

Node (npx serve):
```powershell
npx serve .
```

## 조작 방법 (기본)
- 좌/우 : 이동
- 위 : 회전
- 아래 : 소프트 드롭
- 스페이스 : 하드 드롭
- START 버튼: 시작/일시정지/재시작

## 파일 설명
- `index.html` — 게임 뷰와 UI
- `style.css` — 스타일
- `script.js` — 테트리스 게임 로직 및 렌더러

즐거운 플레이 되세요! 🎮
