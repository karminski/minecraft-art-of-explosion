// 技能系统 - 管理游戏中可用的技能
const skills = {
    items: [
        { name: 'theWorld', texture: 'assets/images/the-world.png', active: false, cooldown: 0, maxCooldown: 10, count: 0 },
        { name: 'theMagnet', texture: 'assets/images/the-magnet.png', active: false, cooldown: 0, maxCooldown: 10, count: 0 },
        { name: 'theNapalm', texture: 'assets/images/the-napalm.png', active: false, cooldown: 0, maxCooldown: 10, count: 0 },
        { name: 'theInfinite', texture: 'assets/images/the-infinite.png', active: false, cooldown: 0, maxCooldown: 10, count: 0 }
    ],
    activeSkillIndex: -1 // -1 表示当前没有激活的技能
};

// 技能激活计时器
let skillTimers = {};

// 创建技能UI
function createSkillsUI() {
    // 创建技能栏容器
    const skillsContainer = document.createElement('div');
    skillsContainer.id = 'skills-container';
    skillsContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        display: flex;
        flex-direction: row;
        gap: 10px;
        z-index: 1000;
    `;
    document.body.appendChild(skillsContainer);

    // 添加每个技能卡片
    skills.items.forEach((skill, index) => {
        createSkillCard(skill, index, skillsContainer);
    });
}

// 创建单个技能卡片
function createSkillCard(skill, index, container) {
    // 创建卡片容器
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.dataset.skillIndex = index;
    card.style.cssText = `
        width: 100px;
        height: 160px;
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    `;

    // 创建技能图片
    const img = document.createElement('img');
    img.src = skill.texture;
    img.alt = skill.name;
    img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: grayscale(100%); /* 默认黑白 */
        transition: filter 0.3s ease;
    `;

    // 创建黑白遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'skill-overlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        transition: opacity 0.3s ease;
    `;

    // 创建倒计时显示
    const timer = document.createElement('div');
    timer.className = 'skill-timer';
    timer.style.cssText = `
        position: absolute;
        top: 10px;
        left: 0;
        width: 100%;
        text-align: center;
        color: white;
        font-size: 24px;
        font-weight: bold;
        text-shadow: 0 0 5px black;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // 创建技能名称标签
    const label = document.createElement('div');
    label.className = 'skill-label';
    label.textContent = formatSkillName(skill.name);
    label.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 0;
        width: 100%;
        text-align: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
        text-shadow: 0 0 5px black;
    `;

    // 创建计数器显示
    const counter = document.createElement('div');
    counter.className = 'skill-counter';
    counter.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-size: 16px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 10px;
        text-shadow: 0 0 2px black;
    `;
    counter.textContent = skill.count;

    // 添加点击事件
    card.addEventListener('click', () => {
        activateSkill(index);
    });

    // 组合元素
    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(timer);
    card.appendChild(label);
    card.appendChild(counter);
    container.appendChild(card);
}

// 格式化技能名称（例如：the-world -> The World）
function formatSkillName(name) {
    return name.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// 激活技能
function activateSkill(index) {
    // 检查技能是否已经激活或在冷却中
    if (skills.items[index].active || skills.items[index].cooldown > 0) {
        console.log(`技能 ${skills.items[index].name} 无法使用：已激活或在冷却中`);
        return;
    }
    
    // 检查技能使用次数
    if (skills.items[index].count <= 0) {
        console.log(`技能 ${skills.items[index].name} 无法使用：无可用次数`);
        return;
    }

    console.log(`激活技能: ${skills.items[index].name}`);
    
    // 激活技能，减少可用次数
    skills.items[index].active = true;
    skills.activeSkillIndex = index;
    skills.items[index].count--;
    
    // 触发自定义事件，通知其他模块技能已激活
    const event = new CustomEvent('skill-activated', { 
        detail: { skillName: skills.items[index].name, skillIndex: index } 
    });
    document.dispatchEvent(event);
    
    // 更新UI
    updateSkillUI(index);
    
    // 开始倒计时
    startSkillTimer(index);
}

// 停用技能
function deactivateSkill(index) {
    if (!skills.items[index].active) return;
    
    // 停用技能
    skills.items[index].active = false;
    if (skills.activeSkillIndex === index) {
        skills.activeSkillIndex = -1;
    }
    
    // 触发自定义事件，通知其他模块技能已停用
    const event = new CustomEvent('skill-deactivated', { 
        detail: { skillName: skills.items[index].name, skillIndex: index } 
    });
    document.dispatchEvent(event);
    
    // 设置冷却状态
    skills.items[index].cooldown = skills.items[index].maxCooldown;
    
    // 更新UI
    updateSkillUI(index);
    
    // 开始冷却倒计时
    startCooldownTimer(index);
}

// 开始技能计时器
function startSkillTimer(index) {
    const skillCard = document.querySelector(`.skill-card[data-skill-index="${index}"]`);
    const timerElement = skillCard.querySelector('.skill-timer');
    const imageElement = skillCard.querySelector('img');
    const overlayElement = skillCard.querySelector('.skill-overlay');
    
    // 设置激活状态的视觉效果
    imageElement.style.filter = 'grayscale(0)'; // 移除黑白效果
    overlayElement.style.opacity = '0'; // 移除遮罩
    skillCard.style.boxShadow = '0 0 15px 5px gold'; // 添加金色发光边缘
    
    // 显示倒计时
    timerElement.style.opacity = '1';
    timerElement.textContent = skills.items[index].maxCooldown;
    
    // 清除之前的计时器（如果存在）
    if (skillTimers[index]) {
        clearInterval(skillTimers[index]);
    }
    
    // 设置倒计时
    let timeLeft = skills.items[index].maxCooldown;
    skillTimers[index] = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(skillTimers[index]);
            deactivateSkill(index);
        }
    }, 1000);
}

// 开始冷却倒计时
function startCooldownTimer(index) {
    const skillCard = document.querySelector(`.skill-card[data-skill-index="${index}"]`);
    const timerElement = skillCard.querySelector('.skill-timer');
    const imageElement = skillCard.querySelector('img');
    const overlayElement = skillCard.querySelector('.skill-overlay');
    
    // 设置冷却状态的视觉效果
    imageElement.style.filter = 'grayscale(100%)'; // 恢复黑白效果
    overlayElement.style.opacity = '1'; // 显示遮罩
    skillCard.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; // 移除金色发光
    
    // 显示冷却倒计时
    timerElement.style.opacity = '1';
    timerElement.textContent = skills.items[index].cooldown;
    
    // 清除之前的计时器（如果存在）
    if (skillTimers[index]) {
        clearInterval(skillTimers[index]);
    }
    
    // 设置倒计时
    let cooldownLeft = skills.items[index].cooldown;
    skillTimers[index] = setInterval(() => {
        cooldownLeft--;
        skills.items[index].cooldown = cooldownLeft;
        timerElement.textContent = cooldownLeft;
        
        if (cooldownLeft <= 0) {
            clearInterval(skillTimers[index]);
            skills.items[index].cooldown = 0;
            timerElement.style.opacity = '0'; // 隐藏计时器
        }
    }, 1000);
}

// 更新技能UI
function updateSkillUI(index) {
    const skillCard = document.querySelector(`.skill-card[data-skill-index="${index}"]`);
    if (!skillCard) return;
    
    const skill = skills.items[index];
    const imageElement = skillCard.querySelector('img');
    const overlayElement = skillCard.querySelector('.skill-overlay');
    const timerElement = skillCard.querySelector('.skill-timer');
    const counterElement = skillCard.querySelector('.skill-counter');
    
    // 更新计数器显示
    if (counterElement) {
        counterElement.textContent = skill.count;
    }
    
    // 更新激活状态
    if (skill.active) {
        imageElement.style.filter = 'grayscale(0)';
        overlayElement.style.opacity = '0';
        skillCard.style.boxShadow = '0 0 15px 5px gold';
        timerElement.style.opacity = '1';
    } else if (skill.cooldown > 0) {
        // 冷却中
        imageElement.style.filter = 'grayscale(100%)';
        overlayElement.style.opacity = '1';
        skillCard.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        timerElement.style.opacity = '1';
        timerElement.textContent = skill.cooldown;
    } else {
        // 未激活且不在冷却
        imageElement.style.filter = 'grayscale(100%)';
        overlayElement.style.opacity = '1';
        skillCard.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        timerElement.style.opacity = '0';
    }
}

// 初始化技能系统
function initSkillSystem() {
    createSkillsUI();
    console.log("技能系统已初始化");
    
    return {
        skills: skills,
        activateSkill: activateSkill,
        deactivateSkill: deactivateSkill
    };
}

// 增加技能卡掉落功能
function createSkillCard3D(scene, position, skillType) {
    // 获取对应技能的纹理
    const skillIndex = skills.items.findIndex(item => item.name === skillType);
    if (skillIndex === -1) {
        console.error(`未找到技能类型: ${skillType}`);
        return null;
    }
    
    const skillTexture = skills.items[skillIndex].texture;
    
    // 创建纹理
    const texture = new THREE.TextureLoader().load(skillTexture);
    
    // 创建材质，添加发光效果
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
    });
    
    // 创建平面几何体
    const geometry = new THREE.PlaneGeometry(0.7, 1.05); // 保持16:9的比例
    
    // 创建网格
    const card = new THREE.Mesh(geometry, material);
    
    // 设置位置
    card.position.copy(position);
    // 抬高一点，使其悬浮在地面上
    card.position.y += 0.5;
    
    // 标记为技能卡
    card.isSkillCard = true;
    card.skillType = skillType;
    card.skillIndex = skillIndex;
    
    // 添加到场景
    scene.add(card);
    
    // 创建动画函数
    const animate = () => {
        if (!card.parent) return; // 如果卡片已从场景中移除，则停止动画
        
        // 旋转卡片
        card.rotation.y += 0.02;
        
        // 上下浮动
        card.position.y = position.y + 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
        
        requestAnimationFrame(animate);
    };
    
    // 开始动画
    animate();
    
    return card;
}

// 添加拾取技能卡的功能
function pickupSkillCard(player, card, scene) {
    if (!card || !card.isSkillCard) return;
    
    // 获取对应技能
    const skillIndex = card.skillIndex;
    
    // 增加技能使用次数
    skills.items[skillIndex].count++;
    
    // 更新UI
    updateSkillUI(skillIndex);
    
    // 创建拾取效果
    createPickupEffect(scene, card.position.clone());
    
    // 从场景中移除卡片
    scene.remove(card);
    
    // 播放音效
    playPickupSound();
    
    console.log(`拾取技能卡: ${skills.items[skillIndex].name}, 当前可用次数: ${skills.items[skillIndex].count}`);
}

// 创建拾取效果
function createPickupEffect(scene, position) {
    // 创建粒子系统或简单动画效果
    const sprite = new THREE.TextureLoader().load('assets/images/sparkle.png');
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const material = new THREE.SpriteMaterial({
            map: sprite,
            color: 0xffcc00,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const particle = new THREE.Sprite(material);
        
        // 设置初始位置
        particle.position.copy(position);
        
        // 设置随机大小
        const size = 0.2 + Math.random() * 0.3;
        particle.scale.set(size, size, size);
        
        // 设置随机速度
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            Math.random() * 0.1,
            (Math.random() - 0.5) * 0.05
        );
        
        // 设置寿命
        particle.life = 40;
        particle.maxLife = 40;
        
        // 添加到场景
        scene.add(particle);
        
        // 更新函数
        function updateParticle() {
            if (particle.life <= 0) {
                scene.remove(particle);
                return;
            }
            
            // 更新位置
            particle.position.add(particle.velocity);
            
            // 缩小粒子
            const scale = (particle.life / particle.maxLife) * size;
            particle.scale.set(scale, scale, scale);
            
            // 降低不透明度
            material.opacity = particle.life / particle.maxLife;
            
            // 减少寿命
            particle.life--;
            
            requestAnimationFrame(updateParticle);
        }
        
        updateParticle();
    }
}

// 播放拾取音效
function playPickupSound() {
    const audio = new Audio('assets/sounds/pickup.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('无法播放音效:', e));
}

// 检查是否可以掉落技能卡
function checkSkillCardDrop(config) {
    return 'theWorld';
    // 检查是否掉落卡牌
    if (Math.random() < config.gameConfig.skillCardDropProbability) {
        // 确定掉落哪种卡牌
        const dropList = config.gameConfig.skillCardDropList;
        const totalProbability = Object.values(dropList).reduce((sum, prob) => sum + prob, 0);
        
        let randomValue = Math.random() * totalProbability;
        let cumulativeProbability = 0;
        
        for (const [cardType, probability] of Object.entries(dropList)) {
            cumulativeProbability += probability;
            
            if (randomValue <= cumulativeProbability) {
                return cardType;
            }
        }
    }
    
    return null;
}

export {
    skills,
    initSkillSystem,
    activateSkill,
    deactivateSkill,
    createSkillCard3D,
    pickupSkillCard,
    checkSkillCardDrop
};
