let spriteSheet;
let walkSheet;
let stopSheet;
let pushSheet;
let toolSheet;
let jumpFrames = [];
let walkFrames = [];
let stopFrames = [];
let pushFrames = [];
let toolFrames = [];
let currentFrame = 0;

// 新增角色相關變數
let newCharStopSheet;
let newCharSmileSheet; // 微笑動畫的圖片精靈
let newCharStopFrames = [];
let newCharSmileFrames = []; // 微笑動畫的影格
let newCharCurrentFrame = 0;
let newCharX, newCharY;
let isNewCharSmiling = false; // 追蹤新角色是否正在微笑
let newCharLieSheet; // 新增倒地動畫的圖片精靈
let newCharLieFrames = []; // 倒地動畫的影格
let isNewCharLying = false; // 追蹤新角色是否正在倒地
let newCharLieTimer = 0; // 倒地動畫計時器
let newCharVulnerable = true; // 追蹤新角色是否可被攻擊 (避免連續倒地)

// 新增題庫相關變數
let questionTable;
let currentQuestionData = null; // 用來儲存當前抽到的題目、答案等資訊
let character2Dialogue = ""; // 角色2要顯示的對話
let isQuestionDisplayed = false; // 追蹤是否已經顯示一個問題
let currentQuestionAnswer = ""; // 儲存當前問題的正確答案
let answerInput; // 輸入答案的 HTML 輸入框
let retryButton; // "再作答一次" 的 HTML 按鈕
let nextQuestionButton; // "下一題" 的 HTML 按鈕
let hasAnsweredIncorrectly = false; // 追蹤是否答錯
let hasAnsweredCorrectly = false; // 追蹤是否答對
let feedbackMessage = ""; // 顯示給玩家的回饋訊息

// 跳躍動畫參數
const jumpNumFrames = 10;
const jumpFrameWidth = 1365 / jumpNumFrames;
const jumpFrameHeight = 188;

// 行走動畫參數
const walkNumFrames = 9;
const walkFrameWidth = 1246 / walkNumFrames;
const walkFrameHeight = 198;

// 待機動畫參數
const stopNumFrames = 11;
const stopFrameWidth = 1524 / stopNumFrames;
const stopFrameHeight = 212;

// 攻擊動畫參數
const pushNumFrames = 4;
const pushFrameWidth = 1039 / pushNumFrames;
const pushFrameHeight = 146;

// 飛行道具動畫參數 (假設為4幀)
const toolNumFrames = 4;
const toolFrameWidth = 740 / toolNumFrames;
const toolFrameHeight = 19;

// 新增角色動畫參數
const newCharStopNumFrames = 8;
const newCharStopFrameWidth = 699 / newCharStopNumFrames;
const newCharStopFrameHeight = 190;

// 新增角色微笑動畫參數
const newCharSmileNumFrames = 5;
const newCharSmileFrameWidth = 585 / newCharSmileNumFrames;
const newCharSmileFrameHeight = 183;

// 新增角色倒地動畫參數
const newCharLieNumFrames = 7;
const newCharLieFrameWidth = 1724 / newCharLieNumFrames; // 1724 / 7 = 246.28...
const newCharLieFrameHeight = 113;

// 角色狀態與物理變數
let playerX, playerY;
let velocityY = 0;
const gravity = 0.6; // 重力強度
const jumpStrength = -15; // 向上跳躍的力道 (負值代表向上)
const walkSpeed = 5; // 走路速度
let isJumping = false; // 追蹤角色是否在空中
let isWalking = false; // 追蹤角色是否在走路
let isAttacking = false; // 追蹤角色是否在攻擊
let isFacingRight = true; // 追蹤角色面向方向
let groundY;
let attackTimer = 0; // 攻擊動畫計時器
let hasSpawnedProjectile = false; // 追蹤本次攻擊是否已發射飛行道具

// 飛行道具管理
let projectiles = [];

function preload() {
  // 從 '1' 資料夾載入圖片精靈
  spriteSheet = loadImage('1/jump.png');
  walkSheet = loadImage('1/walk.png');
  stopSheet = loadImage('1/stop.png');
  pushSheet = loadImage('1/push.png');
  toolSheet = loadImage('1/tool.png');
  newCharStopSheet = loadImage('2/stop.png'); // 載入新角色的圖片
  newCharSmileSheet = loadImage('2/smile.png'); // 載入新角色的微笑圖片
  newCharLieSheet = loadImage('2/lie.png'); // 載入新角色的倒地圖片

  // 載入題庫 CSV 檔案，'csv' 指定格式，'header' 表示第一行為標題
  questionTable = loadTable('questions.csv', 'csv', 'header');
}

// 檢查玩家答案的函式
function checkAnswer() {
  let playerAnswer = answerInput.value();
  if (playerAnswer === currentQuestionAnswer) {
    feedbackMessage = currentQuestionData.getString('答對回饋');
    hasAnsweredCorrectly = true;
    hasAnsweredIncorrectly = false;
    answerInput.hide(); // 答對後隱藏輸入框
    retryButton.hide(); // 答對後隱藏重試按鈕
    nextQuestionButton.show(); // 顯示下一題按鈕
  } else {
    feedbackMessage = currentQuestionData.getString('答錯回饋');
    hasAnsweredIncorrectly = true;
    answerInput.value(''); // 清空輸入框，方便玩家重新輸入
    retryButton.show(); // 答錯後顯示重試按鈕
  }
}

// 重新作答的函式
function retryQuestion() {
  character2Dialogue = currentQuestionData.getString('題目'); // 重新顯示題目
  feedbackMessage = ""; // 清空回饋訊息
  hasAnsweredIncorrectly = false;
  hasAnsweredCorrectly = false;
  isQuestionDisplayed = true; // 確保問題顯示狀態為真
  answerInput.value(''); // 清空輸入框
  answerInput.show(); // 顯示輸入框
  retryButton.hide(); // 隱藏重試按鈕
}

// 取得下一題的函式
function getNextQuestion() {
  let randomIndex = floor(random(questionTable.getRowCount()));
  currentQuestionData = questionTable.getRow(randomIndex);
  character2Dialogue = currentQuestionData.getString('題目');
  currentQuestionAnswer = currentQuestionData.getString('答案');
  feedbackMessage = "";
  hasAnsweredCorrectly = false;
  isQuestionDisplayed = true; // 確保問題顯示狀態為真
  answerInput.value('');
  answerInput.show();
  nextQuestionButton.hide();
}

function setup() {
  // 建立一個全視窗的畫布
  createCanvas(windowWidth, windowHeight);

  // 初始化角色位置
  // 注意：我們以最高的待機圖檔為基準來計算地面，以避免動畫切換時的抖動
  groundY = (height - stopFrameHeight) / 2;
  playerX = (width - stopFrameWidth) / 2;
  playerY = groundY;

  // 初始化新角色的位置，在原角色的左邊
  newCharX = playerX - newCharStopFrameWidth - 50; // 50 是間距
  newCharY = (height - newCharStopFrameHeight) / 2;

  // 將 spriteSheet 切割成 10 個影格
  for (let i = 0; i < jumpNumFrames; i++) {
    let frame = spriteSheet.get(i * jumpFrameWidth, 0, jumpFrameWidth, jumpFrameHeight);
    jumpFrames.push(frame); // 將切割後的影格存入 jumpFrames 陣列
  }

  // 將 walkSheet 切割成 9 個影格
  for (let i = 0; i < walkNumFrames; i++) {
    let frame = walkSheet.get(i * walkFrameWidth, 0, walkFrameWidth, walkFrameHeight);
    walkFrames.push(frame);
  }

  // 將 stopSheet 切割成 11 個影格
  for (let i = 0; i < stopNumFrames; i++) {
    let frame = stopSheet.get(i * stopFrameWidth, 0, stopFrameWidth, stopFrameHeight);
    stopFrames.push(frame);
  }

  // 將 pushSheet 切割成 4 個影格
  for (let i = 0; i < pushNumFrames; i++) {
    let frame = pushSheet.get(i * pushFrameWidth, 0, pushFrameWidth, pushFrameHeight);
    pushFrames.push(frame);
  }

  // 將 toolSheet 切割成 4 個影格
  for (let i = 0; i < toolNumFrames; i++) {
    let frame = toolSheet.get(i * toolFrameWidth, 0, toolFrameWidth, toolFrameHeight);
    toolFrames.push(frame);
  }

  // 將 newCharStopSheet 切割成 8 個影格
  for (let i = 0; i < newCharStopNumFrames; i++) {
    let frame = newCharStopSheet.get(i * newCharStopFrameWidth, 0, newCharStopFrameWidth, newCharStopFrameHeight);
    newCharStopFrames.push(frame);
  }

  // 將 newCharSmileSheet 切割成 5 個影格
  for (let i = 0; i < newCharSmileNumFrames; i++) {
    let frame = newCharSmileSheet.get(i * newCharSmileFrameWidth, 0, newCharSmileFrameWidth, newCharSmileFrameHeight);
    newCharSmileFrames.push(frame);
  }
  
  // 將 newCharLieSheet 切割成 7 個影格
  for (let i = 0; i < newCharLieNumFrames; i++) {
    let frame = newCharLieSheet.get(i * newCharLieFrameWidth, 0, newCharLieFrameWidth, newCharLieFrameHeight);
    newCharLieFrames.push(frame);
  }

  // 建立輸入框
  answerInput = createInput('');
  answerInput.attribute('placeholder', '輸入你的答案');
  answerInput.style('font-size', '16px');
  answerInput.style('padding', '5px');
  answerInput.size(100); // 設定輸入框寬度
  answerInput.hide(); // 初始隱藏
  answerInput.changed(checkAnswer); // 當輸入框內容改變（按下Enter或失去焦點）時觸發檢查答案

  // 建立重試按鈕
  retryButton = createButton('再作答一次');
  retryButton.style('font-size', '16px');
  retryButton.style('padding', '8px 15px');
  retryButton.style('background-color', '#4CAF50'); // 綠色背景
  retryButton.style('color', 'white'); // 白色文字
  retryButton.style('border', 'none');
  retryButton.style('border-radius', '5px');
  retryButton.style('cursor', 'pointer');
  retryButton.hide(); // 初始隱藏
  retryButton.mousePressed(retryQuestion); // 按下按鈕時觸發重新作答

  // 建立下一題按鈕
  nextQuestionButton = createButton('下一題');
  nextQuestionButton.style('font-size', '16px');
  nextQuestionButton.style('padding', '8px 15px');
  nextQuestionButton.style('background-color', '#008CBA'); // 藍色背景
  nextQuestionButton.style('color', 'white'); // 白色文字
  nextQuestionButton.style('border', 'none');
  nextQuestionButton.style('border-radius', '5px');
  nextQuestionButton.style('cursor', 'pointer');
  nextQuestionButton.hide(); // 初始隱藏
  nextQuestionButton.mousePressed(getNextQuestion); // 按下按鈕時觸發取得下一題
}

function draw() {
  // 設定背景顏色
  background('#ade8f4');
  
  // --- 輸入處理 ---
  // 使用 keyIsDown 實現持續移動
  if (!isAttacking && !isJumping) {
    if (keyIsDown(68)) { // 'D' 鍵
      playerX += walkSpeed;
      isWalking = true;
      isFacingRight = true;
    } else if (keyIsDown(65)) { // 'A' 鍵
      playerX -= walkSpeed;
      isWalking = true;
      isFacingRight = false;
    } else {
      isWalking = false;
    }
  }

  // --- 物理更新 ---
  velocityY += gravity; // 將重力應用到垂直速度
  playerY += velocityY; // 根據速度更新 Y 位置
  
  // 檢查角色是否落地
  if (playerY >= groundY) {
    playerY = groundY; // 將角色固定在地面上，避免掉下去
    velocityY = 0; // 停止垂直移動
    isJumping = false; // 設定為不在跳躍狀態
  }
  
  // --- 動畫更新與繪製 ---
  let displayFrame;
  let frameW, frameH;

  if (isAttacking) {
    // 狀態1: 攻擊 (最高優先級)
    // 根據計時器決定顯示哪一幀，讓動畫播放一次後停止
    let attackFrameIndex = floor(attackTimer / 5); // 每5幀換一圖
    if (attackFrameIndex >= pushNumFrames) {
      isAttacking = false; // 動畫結束
    } else {
      displayFrame = pushFrames[attackFrameIndex];
      frameW = pushFrameWidth;
      frameH = pushFrameHeight;
      attackTimer++;

      // 在攻擊動畫的特定幀發射飛行道具
      // 這裡假設在第 3 幀 (索引為 2) 發射，您可以根據實際動畫效果調整這個數字
      if (attackFrameIndex === 2 && !hasSpawnedProjectile) {
        let projectile = {
          x: isFacingRight ? playerX + frameW - 20 : playerX - toolFrameWidth + 20, // 調整發射位置
          y: playerY + frameH / 2 - toolFrameHeight / 2, // 調整發射高度，使其與角色中心對齊
          speed: isFacingRight ? 10 : -10,
          animFrame: 0
        };
        projectiles.push(projectile);
        hasSpawnedProjectile = true; // 標記為已發射，本次攻擊不再發射
      }
    }
  }
  
  if (!isAttacking && isJumping) {
    // 狀態2: 跳躍
    if (frameCount % 5 === 0) {
      currentFrame = (currentFrame + 1) % jumpNumFrames;
    }
    displayFrame = jumpFrames[currentFrame];
    frameW = jumpFrameWidth;
    frameH = jumpFrameHeight;
  } else if (!isAttacking && isWalking) {
    // 狀態3: 行走
    if (frameCount % 5 === 0) {
      currentFrame = (currentFrame + 1) % walkNumFrames;
    }
    displayFrame = walkFrames[currentFrame];
    frameW = walkFrameWidth;
    frameH = walkFrameHeight;
  } else if (!isAttacking) {
    // 狀態4: 站立/待機 (預設)
    // 播放待機動畫
    if (frameCount % 8 === 0) { // 待機動畫可以慢一點
      currentFrame = (currentFrame + 1) % stopNumFrames;
    }
    displayFrame = stopFrames[currentFrame];
    frameW = stopFrameWidth;
    frameH = stopFrameHeight;
  }
  
  // --- 新角色狀態更新 ---
  // 偵測角色1是否在角色2的一個身位距離內
  const playerCenter = playerX + frameW / 2;
  const newCharCenter = newCharX + newCharStopFrameWidth / 2;
  
  // 計算兩個角色中心的水平距離
  const centerDistance = abs(playerCenter - newCharCenter);
  
  // 兩個角色的半寬度總和
  const halfWidths = (frameW / 2) + (newCharStopFrameWidth / 2);
  
  // 觸發距離設定為角色2的寬度
  const triggerDistance = newCharStopFrameWidth;

  // 當兩個角色邊緣的距離小於 triggerDistance 時，觸發微笑
  // centerDistance - halfWidths 是兩個角色邊緣之間的距離
  const edgeDistance = centerDistance - halfWidths;

  let newCharDisplayFrame; // 儲存當前要繪製的新角色影格
  let newCharCurrentFrameWidth, newCharCurrentFrameHeight; // 儲存當前影格的寬高
  let newCharDrawY = newCharY; // 繪製新角色的Y座標，可能需要調整以保持底部對齊

  if (isNewCharLying) {
    // 角色倒地狀態
    hideQuestionUI(); // 倒地時隱藏UI
    if (frameCount % 8 === 0) { // 控制倒地動畫速度
      newCharCurrentFrame = (newCharCurrentFrame + 1) % newCharLieNumFrames;
    }
    newCharDisplayFrame = newCharLieFrames[newCharCurrentFrame];
    newCharCurrentFrameWidth = newCharLieFrameWidth;
    newCharCurrentFrameHeight = newCharLieFrameHeight;
    // 調整Y座標以保持底部對齊
    newCharDrawY = newCharY + newCharStopFrameHeight - newCharLieFrameHeight;

    newCharLieTimer++;
    // 倒地動畫播放完畢後，進入恢復狀態
    if (newCharLieTimer > newCharLieNumFrames * 8) { // 播放完一輪動畫後
      isNewCharLying = false;
      newCharVulnerable = true; // 恢復可被攻擊狀態
      // 如果角色1仍在附近，則重新觸發問題邏輯
      if (edgeDistance < triggerDistance) {
        isNewCharSmiling = true; // 恢復微笑狀態
        // 重新抽取問題
        let randomIndex = floor(random(questionTable.getRowCount()));
        currentQuestionData = questionTable.getRow(randomIndex);
        character2Dialogue = currentQuestionData.getString('題目');
        currentQuestionAnswer = currentQuestionData.getString('答案');
        isQuestionDisplayed = true;
        feedbackMessage = "";
        hasAnsweredCorrectly = false;
        hasAnsweredIncorrectly = false;
        answerInput.value('');
        answerInput.show();
        nextQuestionButton.hide();
      } else {
        isNewCharSmiling = false; // 否則回到待機狀態
      }
    }
  } else if (edgeDistance < triggerDistance) {
    // 角色1靠近，且角色2未倒地
    isNewCharSmiling = true; // 進入微笑狀態
    if (!isQuestionDisplayed) { // 如果還沒有顯示問題，則抽取一個
      let randomIndex = floor(random(questionTable.getRowCount()));
      currentQuestionData = questionTable.getRow(randomIndex);
      character2Dialogue = currentQuestionData.getString('題目');
      currentQuestionAnswer = currentQuestionData.getString('答案');
      isQuestionDisplayed = true;
      feedbackMessage = "";
      hasAnsweredCorrectly = false;
      hasAnsweredIncorrectly = false;
      answerInput.value('');
      answerInput.show();
      nextQuestionButton.hide();
    }
    // 繪製微笑動畫
    // 持續播放微笑動畫
    push(); // 保存當前的繪圖設定
    const padding = 10;
    const boxHeight = 40;
    
    textSize(16);
    const boxWidth = textWidth(character2Dialogue) + padding * 2;
    
    // 計算對話框位置 (角色頭頂上方)
    const boxX = newCharX + (newCharSmileFrameWidth / 2) - (boxWidth / 2); // 對話框 X 座標
    const boxY = newCharY - boxHeight - 10; // 角色頭頂上方 10px

    // 繪製方塊
    fill(255, 255, 255, 220); // 半透明白色背景
    stroke(0); // 黑色邊框
    rect(boxX, boxY, boxWidth, boxHeight, 8); // 圓角矩形

    // 繪製文字
    fill(0); // 黑色文字
    noStroke();
    textAlign(CENTER, CENTER);
    text(character2Dialogue, boxX + boxWidth / 2, boxY + boxHeight / 2);
    pop(); // 恢復繪圖設定

    // --- 顯示並定位UI元素 ---
    if (isQuestionDisplayed && !hasAnsweredCorrectly) answerInput.show();
    if (hasAnsweredIncorrectly) retryButton.show();
    if (hasAnsweredCorrectly) nextQuestionButton.show();

    // --- 定位輸入框和按鈕 ---
    // 輸入框在對話框下方
    const inputX = playerX + (frameW / 2) - (answerInput.width / 2); // 改為以角色1為基準
    const inputY = groundY - frameH - answerInput.height - 10; // 改為以角色1的腳底為基準，確保位置穩定
    answerInput.position(inputX, inputY);

    // 按鈕在對話框上方
    const buttonX = newCharX + (newCharCurrentFrameWidth / 2) - (retryButton.width / 2);
    const buttonY = boxY - retryButton.height - 10; // 對話框上方 10px
    retryButton.position(buttonX, buttonY);

    // 下一題按鈕與重試按鈕在相同位置，因為它們不會同時顯示
    const nextButtonX = buttonX;
    const nextButtonY = buttonY;
    nextQuestionButton.position(nextButtonX, nextButtonY);

    // --- 繪製回饋訊息 ---
    if (feedbackMessage !== "") {
      push();
      textSize(14);
      fill(0);
      textAlign(CENTER, TOP);
      text(feedbackMessage, inputX + answerInput.width / 2, inputY + answerInput.height + 5); // 改為在輸入框正下方顯示
      pop();
    }

    // 繪製微笑動畫 (移到UI之後，確保角色在UI之上)
    if (frameCount % 8 === 0) { // 控制微笑動畫速度
      newCharCurrentFrame = (newCharCurrentFrame + 1) % newCharSmileNumFrames;
    }
    newCharDisplayFrame = newCharSmileFrames[newCharCurrentFrame];
    newCharCurrentFrameWidth = newCharSmileFrameWidth;
    newCharCurrentFrameHeight = newCharSmileFrameHeight;

  } else {
    // 角色1不靠近，且角色2未倒地
    isNewCharSmiling = false; // 離開微笑狀態
    isQuestionDisplayed = false; // 離開觸發範圍後重置問題顯示狀態
    hasAnsweredCorrectly = false; // 重置答對狀態

    // 播放待機動畫
    if (frameCount % 8 === 0) { // 動畫速度與原角色待機動畫相同
      newCharCurrentFrame = (newCharCurrentFrame + 1) % newCharStopNumFrames;
    }
    newCharDisplayFrame = newCharStopFrames[newCharCurrentFrame];
    newCharCurrentFrameWidth = newCharStopFrameWidth;
    newCharCurrentFrameHeight = newCharStopFrameHeight;

    hideQuestionUI(); // 當角色1離開時，隱藏所有問答UI
  }

  // 統一繪製新角色 (根據當前狀態決定影格和尺寸)
  // 只有在不是倒地狀態時才使用 newCharY，倒地狀態的 newCharDrawY 已經調整過
  if (!isNewCharLying) {
    image(newCharDisplayFrame, newCharX, newCharY, newCharCurrentFrameWidth, newCharCurrentFrameHeight);
  } else {
    image(newCharDisplayFrame, newCharX, newCharDrawY, newCharCurrentFrameWidth, newCharCurrentFrameHeight);
  }


  // --- 更新與繪製飛行道具 (包含碰撞檢測) ---
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.x += p.speed; // 移動
    p.animFrame = (p.animFrame + 0.2) % toolNumFrames; // 動畫
    
    image(toolFrames[floor(p.animFrame)], p.x, p.y); // 繪製
    
    // 檢查飛行道具是否與新角色碰撞
    // 只有當新角色不是倒地狀態且可被攻擊時才進行碰撞檢測
    if (!isNewCharLying && newCharVulnerable) {
      const newCharCollisionX = newCharX;
      const newCharCollisionY = newCharY;
      const newCharCollisionW = newCharStopFrameWidth; // 使用站立時的寬度以保持碰撞箱穩定
      const newCharCollisionH = newCharStopFrameHeight; // 使用站立時的高度

      if (checkCollision(p.x, p.y, toolFrameWidth, toolFrameHeight, newCharCollisionX, newCharCollisionY, newCharCollisionW, newCharCollisionH)) {
        isNewCharLying = true; // 觸發倒地狀態
        newCharLieTimer = 0; // 重置倒地計時器
        newCharCurrentFrame = 0; // 從倒地動畫第一幀開始
        newCharVulnerable = false; // 倒地後暫時無敵
        projectiles.splice(i, 1); // 移除擊中的飛行道具
        hideQuestionUI(); // 隱藏所有問答UI
      }
    }

    // 如果飛出畫面，則移除
    if (p.x > width || p.x < -toolFrameWidth) {
      projectiles.splice(i, 1);
    }
  }

  // --- 繪製角色 ---
  push(); // 保存當前的繪圖狀態
  translate(playerX + frameW / 2, playerY + frameH / 2); // 將座標原點移到圖片中心
  if (!isFacingRight) {
    scale(-1, 1); // 如果角色向左，則水平翻轉
  }
  image(displayFrame, -frameW / 2, -frameH / 2); // 在新的原點繪製圖片
  pop(); // 恢復繪圖狀態
}

// 處理鍵盤按下事件
function keyPressed() {
  // 當按下 'W' 鍵且角色不在空中或攻擊時，觸發跳躍
  if ((key === 'W' || key === 'w') && !isJumping && !isAttacking) {
    velocityY = jumpStrength; // 給予向上的初速度
    isJumping = true; // 設定為跳躍狀態
    currentFrame = 0; // 重置動畫影格，讓跳躍從第一格開始
  }

  // 當按下空白鍵且角色不在攻擊時，觸發攻擊 (現在允許在跳躍時攻擊)
  if (keyCode === 32 && !isAttacking) {
    isAttacking = true;
    attackTimer = 0; // 重置攻擊計時器
    isWalking = false; // 攻擊時停止走路
    // 注意：飛行道具的生成邏輯已移至 draw() 函式中，以確保發射時機準確
    // 這裡只負責啟動攻擊狀態並重置旗標
    hasSpawnedProjectile = false; // 重置發射標記，準備本次攻擊發射飛行道具
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 當視窗大小改變時，重新計算角色位置
  groundY = (height - stopFrameHeight) / 2; // 同樣更新地面位置到垂直中央
  
  // 如果角色沒有在移動，將其重新置中
  // 這裡我們假設遊戲開始時角色是靜止的
  if (!isJumping) {
    playerX = (width - stopFrameWidth) / 2;
    playerY = groundY;

    // 更新新角色的位置，保持相對位置
    newCharX = playerX - newCharStopFrameWidth - 50; // 保持在角色1的左邊
    newCharY = (height - newCharStopFrameHeight) / 2; // 保持垂直居中

    // 隱藏所有與問題相關的UI元素
    hideQuestionUI();
    // 重置新角色狀態
    isNewCharLying = false;
    newCharVulnerable = true;
    isNewCharSmiling = false;
    isQuestionDisplayed = false;
    hasAnsweredCorrectly = false;
    hasAnsweredIncorrectly = false;
    feedbackMessage = "";
  }
}

// 輔助函式：隱藏所有與問題相關的UI元素
function hideQuestionUI() {
  answerInput.hide();
  retryButton.hide();
  nextQuestionButton.hide();
  // 這裡不需要重置 isQuestionDisplayed 等狀態，因為它們會在其他邏輯中被正確設定
  // 比如離開觸發範圍時，isQuestionDisplayed 會被設為 false
  // 倒地時，也會被設為 false
}

// 輔助函式：AABB 碰撞檢測
function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 < x2 + w2 &&
         x1 + w1 > x2 &&
         y1 < y2 + h2 &&
         y1 + h1 > y2;
}
