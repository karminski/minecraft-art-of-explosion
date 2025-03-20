// Game scoring and timer system
import { initUserDataSystem } from './user_data.js';

export function initScoreSystem(document) {
    let score = 0;
    let gameActive = true;
    let timeLeft = 60000; // 60秒，以毫秒为单位
    let timerInterval = null;
    
    // 初始化用户数据系统
    const userDataSystem = initUserDataSystem();
    const currentBonusPoints = userDataSystem.getBonusPoints();
    
    // 创建分数和计时器显示容器
    const gameInfoDisplay = document.createElement('div');
    gameInfoDisplay.id = 'game-info-display';
    gameInfoDisplay.style.position = 'absolute';
    gameInfoDisplay.style.top = '20px';
    gameInfoDisplay.style.left = '50%';
    gameInfoDisplay.style.transform = 'translateX(-50%)';
    gameInfoDisplay.style.color = 'white';
    gameInfoDisplay.style.fontSize = '48px';
    gameInfoDisplay.style.fontWeight = 'bold';
    gameInfoDisplay.style.textShadow = '2px 2px 4px #000000';
    gameInfoDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    gameInfoDisplay.style.padding = '10px 20px';
    gameInfoDisplay.style.borderRadius = '10px';
    gameInfoDisplay.style.display = 'flex';
    gameInfoDisplay.style.flexDirection = 'column';
    gameInfoDisplay.style.alignItems = 'center';
    gameInfoDisplay.style.gap = '10px';
    gameInfoDisplay.style.zIndex = '1000';
    document.body.appendChild(gameInfoDisplay);
    
    // 创建计时器显示元素
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer-display';
    timerDisplay.innerHTML = formatTime(timeLeft);
    gameInfoDisplay.appendChild(timerDisplay);
    
    // 创建分数显示元素
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score-display';
    scoreDisplay.innerHTML = `分数: ${score}`;
    gameInfoDisplay.appendChild(scoreDisplay);
    
    // 创建游戏结束界面
    const gameOverDisplay = document.createElement('div');
    gameOverDisplay.id = 'game-over';
    gameOverDisplay.style.position = 'fixed';
    gameOverDisplay.style.top = '0';
    gameOverDisplay.style.left = '0';
    gameOverDisplay.style.width = '100%';
    gameOverDisplay.style.height = '100%';
    gameOverDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverDisplay.style.color = 'white';
    gameOverDisplay.style.fontSize = '36px';
    gameOverDisplay.style.fontWeight = 'bold';
    gameOverDisplay.style.textAlign = 'center';
    gameOverDisplay.style.display = 'flex';
    gameOverDisplay.style.flexDirection = 'column';
    gameOverDisplay.style.justifyContent = 'center';
    gameOverDisplay.style.alignItems = 'center';
    gameOverDisplay.style.zIndex = '2000';
    gameOverDisplay.style.display = 'none';
    
    gameOverDisplay.innerHTML = `
        <div style="background-color: rgba(50, 50, 50, 0.9); padding: 40px; border-radius: 20px; box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);">
            <div style="font-size: 48px; margin-bottom: 20px;">游戏结束</div>
            <div id="final-score" style="font-size: 36px; margin-bottom: 15px;">最终分数: ${score}</div>
            <div id="bonus-points" style="font-size: 28px; margin-bottom: 30px; color: gold;">总奖金: ${currentBonusPoints}</div>
            
            <!-- 升级系统区域 -->
            <div id="upgrade-system" style="margin-bottom: 30px; width: 100%;">
                <div style="font-size: 24px; margin-bottom: 15px; color: #4CAF50;">可升级项目</div>
                
                <!-- 第一行升级项 -->
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                    <!-- 军火商 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/arms_dealer.png" alt="军火商" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">军火商</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, TNT 初始数量 + 1</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" style="width: 0%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>0</span>
                            <span>100</span>
                        </div>
                    </div>
                    
                    <!-- 核爆 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/abomb.png" alt="核爆" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">核爆</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, TNT 爆炸范围 + 1</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" style="width: 0%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>0</span>
                            <span>100</span>
                        </div>
                    </div>
                    
                    <!-- 羊驼奶 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/llama-feed.png" alt="羊驼奶" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">羊驼奶</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 羊驼的生成最大数量 + 10</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" style="width: 0%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>0</span>
                            <span>100</span>
                        </div>
                    </div>
                    
                    <!-- 猪饲料 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/pig-feed.png" alt="猪饲料" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">猪饲料</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 猪猪的生成最大数量 + 1</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" style="width: 0%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>0</span>
                            <span>100</span>
                        </div>
                    </div>
                </div>
                
                <!-- 第二行升级项 -->
                <div style="display: flex; justify-content: center; gap: 20px;">
                    <!-- 长者的眼镜 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/glasses.png" alt="长者的眼镜" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">长者的眼镜</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 每局游戏最大时长 + 1s</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" style="width: 0%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>0</span>
                            <span>100</span>
                        </div>
                    </div>
                    
                    <!-- 奇怪的收购者 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/acquirer.png" alt="奇怪的收购者" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">奇怪的收购者</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 消灭一只动物的得分增加10%</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" style="width: 0%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>0</span>
                            <span>100</span>
                        </div>
                    </div>
                    
                    <!-- 幸运星 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/izumi.png" alt="幸运星" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">幸运星</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 猪猪的道具掉落概率增加 2%</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" style="width: 0%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>0</span>
                            <span>100</span>
                        </div>
                    </div>
                    
                    <!-- 肌肉狂 -->
                    <div class="upgrade-item" style="width: 150px; background-color: rgba(30, 30, 30, 0.7); border-radius: 10px; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                        <div class="upgrade-icon" style="width: 150px; height: 150px; background-color: #333; border-radius: 5px; margin-bottom: 10px; display: flex; justify-content: center; align-items: center; color: #666; font-size: 16px;"><img src="assets/images/muscle.png" alt="肌肉狂" style="width: 100%; height: 100%; object-fit: cover;"></div>
                        <div class="upgrade-title" style="font-size: 18px; margin-bottom: 5px;">肌肉狂</div>
                        <div class="upgrade-desc" style="font-size: 14px; color: #aaa; margin-bottom: 10px; height: 40px;">每增加一点, 人物的移动速度和跳跃高度增加 1%</div>
                        <div class="progress-container" style="width: 100%; height: 15px; background-color: #222; border-radius: 7px; overflow: hidden;">
                            <div class="progress-bar" style="width: 0%; height: 100%; background-color: #ff5722; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                            <span>0</span>
                            <span>100</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <button id="restart-button" style="padding: 15px 30px; font-size: 24px; background-color: #4CAF50; color: white; border: none; border-radius: 10px; cursor: pointer; transition: background-color 0.3s;">再来一次</button>
        </div>
    `;
    document.body.appendChild(gameOverDisplay);
    
    // 格式化时间为 MM:SS.MS 格式
    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
    
    // 添加重新开始按钮事件
    document.getElementById('restart-button').addEventListener('click', () => {
        // 直接刷新页面
        window.location.reload();
    });
    
    // 开始计时器
    function startTimer() {
        const startTime = Date.now();
        timerInterval = setInterval(() => {
            // 基于实际流逝的时间计算
            const elapsedTime = Date.now() - startTime;
            timeLeft = Math.max(60000 - elapsedTime, 0);
            
            timerDisplay.innerHTML = formatTime(timeLeft);
            
            // 检查时间是否已到
            if (timeLeft <= 0) {
                endGame();
            }
        }, 100);
    }
    
    // 开始计时器
    startTimer();
    
    // 返回控制接口
    return {
        updateScore: function(points) {
            if (!gameActive) return;
            
            score += points;
            scoreDisplay.innerHTML = `分数: ${score}`;
            
            // 添加得分动画
            const scoreAnimation = document.createElement('div');
            scoreAnimation.textContent = `+${points}`;
            scoreAnimation.style.position = 'absolute';
            scoreAnimation.style.top = '360px';
            scoreAnimation.style.left = '50%';
            scoreAnimation.style.transform = 'translateX(-50%)';
            scoreAnimation.style.color = '#ffff00';
            scoreAnimation.style.fontSize = '60px';
            scoreAnimation.style.fontWeight = 'bold';
            scoreAnimation.style.textShadow = '2px 2px 4px #000000';
            scoreAnimation.style.opacity = '1';
            scoreAnimation.style.transition = 'top 1s, opacity 1s';
            document.body.appendChild(scoreAnimation);
            
            // 动画效果
            setTimeout(() => {
                scoreAnimation.style.top = '20px';
                scoreAnimation.style.opacity = '0';
            }, 50);
            
            // 移除元素
            setTimeout(() => {
                document.body.removeChild(scoreAnimation);
            }, 1100);
        },
        endGame: function() {
            endGame();
        },
        isGameActive: function() {
            return gameActive;
        },
        getCurrentScore: function() {
            return score;
        },
        getTimeLeft: function() {
            return timeLeft;
        }
    };
    
    // 游戏结束函数，修改为保存分数到奖金
    function endGame() {
        if (!gameActive) return;
        
        gameActive = false;
        clearInterval(timerInterval);
        
        // 更新奖金
        const newBonusPoints = userDataSystem.addBonusPoints(score);
        
        // 更新结束画面显示
        document.getElementById('final-score').textContent = `最终分数: ${score}`;
        document.getElementById('bonus-points').textContent = `总奖金: ${newBonusPoints}`;
        gameOverDisplay.style.display = 'flex';
        
        // 禁用所有控制
        document.exitPointerLock();
    }
}
