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
