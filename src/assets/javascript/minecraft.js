import { 
    createInventory,
    heldItemMesh, 
    createInventoryUI, 
    updateInventoryUI, 
    updateHeldItem 
} from './inventory.js';

import { 
    createPlayer, 
    characterAnimation, 
    createCharacter, 
    updateCharacterAnimation, 
    setCharacterPartsOpacity, 
    findSafeSpawnPosition, 
    checkCollision,
    updateCamera 
} from './player.js';

import {
    blockTypes,
    initBlockSystem,
    createBlock,
    highlightBlock,
    breakBlock,
    placeBlock,
    createExplosionAnimation,
    createBlockDebris,
    startTNTTimer,
    explodeTNT
} from './blocks.js';

// 添加导入world.js中的函数
import {
    initWorld
} from './world.js';

// 添加导入sky_and_light.js中的函数
import {
    createLighting,
    createSky
} from './sky_and_light.js';

// 添加导入controls.js中的函数
import {
    initControlsState,
    setupMouseControls,
    setupKeyboardControls,
    setupMouseLock,
    setupAdvancedMouseControls,
    setupInventorySelection,
    setupCameraToggle,
    breakBlockWithDebounce,
    placeBlockWithDebounce,
    handleMouseActions,
    initPageLoadMouseLock,
    togglePause,
    createPauseOverlay,
    setupPauseControl
} from './controls.js';

// 添加导入camera.js中的函数
import {
    createMainCamera,
    createOverviewCamera,
    createFrustumSystem,
    createRenderSettings,
    applyFrustumCulling,
    handleWindowResize
} from './camera.js';

// 添加导入animal.js中的函数
import {
    initAnimalSystem
} from './animal.js';

// 添加导入score.js中的函数
import {
    initScoreSystem
} from './score.js';

// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
const camera = createMainCamera();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const textureLoader = new THREE.TextureLoader();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 设置相机位置
camera.position.y = 10;
camera.position.z = 20;

// 创建光源
const { ambientLight, directionalLight } = createLighting(scene);

// 创建天空球
const sky = createSky(scene, textureLoader, 'assets/images/sky.jpg');

// 初始化方块系统，替换直接定义的纹理和材质
const { textures, materials, explosionTextures } = initBlockSystem(scene, textureLoader);

// 世界大小
const worldSize = 50;

// 保存所有创建的方块
const blockReferences = [];

// 添加一个数组来存储爆炸碎片
const explosionDebris = [];

// 在调用 initWorld 前，确保 window.blockTypes 已设置
// 将这行代码移到更早的位置
window.blockTypes = blockTypes;
console.log("已设置全局 blockTypes:", window.blockTypes);

// 创建世界数组并初始化（旧代码将被替换）
const world = initWorld(worldSize, blockTypes, (generatedWorld) => {
    // 这是渲染回调函数
    for (let x = 0; x < worldSize; x++) {
        for (let y = 0; y < worldSize; y++) {
            for (let z = 0; z < worldSize; z++) {
                if (generatedWorld[x][y][z] !== blockTypes.air) {
                    createBlock(scene, x, y, z, generatedWorld[x][y][z], materials, textures, blockReferences, null);
                }
            }
        }
    }
});

// 下面这个函数定义可以保留，以供其他地方可能的调用
function renderWorld(world) {
    for (let x = 0; x < worldSize; x++) {
        for (let y = 0; y < worldSize; y++) {
            for (let z = 0; z < worldSize; z++) {
                if (world[x][y][z] !== blockTypes.air) {
                    createBlock(scene, x, y, z, world[x][y][z], materials, textures, blockReferences, null);
                }
            }
        }
    }
}

// 添加在scene声明后面
const characterGroup = new THREE.Group(); // 用于包含所有角色部分
scene.add(characterGroup);
let character; // 全局变量，用于存储角色对象

// 玩家控制 - 使用安全位置初始化
const player = createPlayer(findSafeSpawnPosition(world, worldSize));

// 创建角色
character = createCharacter(characterGroup, textureLoader);

// 设置初始角色透明度（因为默认是第一人称视角）
setCharacterPartsOpacity(character, true);

// 替换全局键鼠控制变量为控制状态对象
const controlsState = initControlsState();

// 创建暂停界面
const pauseOverlay = createPauseOverlay();

// 设置暂停控制
setupPauseControl(controlsState, pauseOverlay, document);

// 移除原始的鼠标控制代码，使用新函数代替
setupMouseControls(controlsState, document);

// 移除原始的键盘控制代码，使用新函数代替
setupKeyboardControls(controlsState, document);

// 移除原始的鼠标锁定代码，使用新函数代替
setupMouseLock(controlsState, document);

// 设置高级鼠标控制（处理第一人称视角）
setupAdvancedMouseControls(controlsState, player, camera, document);

// 创建初始库存，替换原来的导入
let inventory = createInventory(blockTypes);

// 设置物品快捷栏选择
setupInventorySelection(inventory, character, blockTypes, textures, materials, document);

// 创建俯视摄像机
const overviewCamera = createOverviewCamera(worldSize);

// 添加摄像机切换变量
let activeCamera = camera; // 默认使用主摄像机

// 在全局添加视锥系统
const frustumSystem = createFrustumSystem();

// 添加可配置的渲染距离参数
const renderSettings = createRenderSettings();

// 使用更高效的 FPS 计算方法
let lastFrameTime = performance.now();
let frameTime = 0;

// 添加十字准星
const crosshairCanvas = document.getElementById('crosshair');
const crosshairCtx = crosshairCanvas.getContext('2d');
crosshairCtx.beginPath();
crosshairCtx.moveTo(10, 0);
crosshairCtx.lineTo(10, 20);
crosshairCtx.moveTo(0, 10);
crosshairCtx.lineTo(20, 10);
crosshairCtx.strokeStyle = 'white';
crosshairCtx.stroke();

// 初始化动物系统
const animalSystem = initAnimalSystem(scene, world, worldSize, textureLoader);

// 初始化计分系统，修改重启回调函数
const scoreSystem = initScoreSystem(document, () => {
    console.log("重新开始游戏");
    
    // 备份旧的动物系统
    const oldAnimalSystem = window.animalSystem;
    
    // 创建一个空的临时动物系统
    window.animalSystem = {
        animals: { llamas: [], pigs: [] },
        initialCounts: { llamas: 0, pigs: 0 },
        update: function() {}
    };
    
    // 清除现有动物
    if (oldAnimalSystem && oldAnimalSystem.animals) {
        // 遍历动物类型
        for (const type in oldAnimalSystem.animals) {
            const animalArray = oldAnimalSystem.animals[type];
            
            // 确保是有效数组
            if (animalArray && Array.isArray(animalArray)) {
                // 从后向前遍历以避免移除元素时的索引问题
                for (let i = animalArray.length - 1; i >= 0; i--) {
                    const animal = animalArray[i];
                    if (animal && animal.mesh) {
                        scene.remove(animal.mesh);
                    }
                }
            }
        }
    }
    
    // 清除所有爆炸碎片
    for (let i = explosionDebris.length - 1; i >= 0; i--) {
        const debris = explosionDebris[i];
        if (debris && debris.mesh) {
            scene.remove(debris.mesh);
            if (debris.mesh.geometry) {
                debris.mesh.geometry.dispose();
            }
        }
    }
    explosionDebris.length = 0;
    
    // 创建全新的库存实例，而不是修改现有的
    inventory = createInventory(blockTypes);
    
    // 更新库存UI
    createInventoryUI(inventory); // 重新创建UI
    
    // 清除现有方块
    for (let i = 0; i < blockReferences.length; i++) {
        if (blockReferences[i]) {
            scene.remove(blockReferences[i]);
            if (blockReferences[i].geometry) {
                blockReferences[i].geometry.dispose();
            }
            if (blockReferences[i].material) {
                if (Array.isArray(blockReferences[i].material)) {
                    blockReferences[i].material.forEach(mat => {
                        if (mat) mat.dispose();
                    });
                } else {
                    blockReferences[i].material.dispose();
                }
            }
        }
    }
    
    // 清空方块引用数组
    blockReferences.length = 0;
    
    // 5. 完全重建世界数组
    console.log("开始重建世界...");
    
    try {
        // 确保所有操作完成后才开始生成新世界
        setTimeout(() => {
            try {
                // 5.1 创建新的空白世界数组
                for (let x = 0; x < worldSize; x++) {
                    for (let y = 0; y < worldSize; y++) {
                        for (let z = 0; z < worldSize; z++) {
                            world[x][y][z] = blockTypes.air; // 先将所有块设为空气
                        }
                    }
                }
                
                // 5.2 重新初始化世界并设置回调
                initWorld(worldSize, blockTypes, (generatedWorld) => {
                    console.log("新地图生成完成，开始渲染...");
                    
                    // 5.3 基于新生成的世界更新原有的world数组
                    for (let x = 0; x < worldSize; x++) {
                        for (let y = 0; y < worldSize; y++) {
                            for (let z = 0; z < worldSize; z++) {
                                world[x][y][z] = generatedWorld[x][y][z];
                                
                                // 5.4 仅为非空气方块创建可视对象
                                if (generatedWorld[x][y][z] !== blockTypes.air) {
                                    createBlock(scene, x, y, z, generatedWorld[x][y][z], materials, textures, blockReferences, null);
                                }
                            }
                        }
                    }
                    
                    // 6. 重置玩家位置和属性 (放在回调内确保世界已生成)
                    const safePosition = findSafeSpawnPosition(world, worldSize);
                    player.position.set(safePosition.x, safePosition.y, safePosition.z);
                    player.rotation.set(0, 0, 0);
                    camera.rotation.set(0, 0, 0);
                    player.velocity.set(0, 0, 0);
                    
                    // 7. 重置角色位置和动画状态
                    characterGroup.position.copy(player.position);
                    if (characterAnimation) {
                        characterAnimation.isWalking = false;
                        characterAnimation.animationTime = 0;
                    }
                    
                    // 8. 重新初始化动物系统 (放在回调内确保世界已生成)
                    try {
                        window.animalSystem = initAnimalSystem(scene, world, worldSize, textureLoader);
                    } catch (error) {
                        console.error("重新初始化动物系统出错:", error);
                    }
                    
                    // 9. 恢复相机为第一人称
                    activeCamera = camera;
                    
                    // 10. 确保游戏未暂停
                    togglePause(controlsState, false);
                    
                    console.log("游戏场景已完全重置");
                });
            } catch (error) {
                console.error("重建世界时出错:", error);
                togglePause(controlsState, false);
            }
        }, 100); // 添加小延迟以确保清理操作完成
    } catch (error) {
        console.error("启动重建过程时出错:", error);
        togglePause(controlsState, false);
    }
});

// 在animate函数内，修改动物更新处理
function animate(currentTime) {
    requestAnimationFrame(animate);

    // 计算帧时间和 FPS
    frameTime = currentTime - lastFrameTime;
    
    // 添加：防止 frameTime 为 NaN 或异常值
    if (isNaN(frameTime) || frameTime <= 0 || frameTime > 1000) {
        frameTime = 16; // 使用合理的默认值(约60fps)
    }
    
    const fps = Math.round(1000 / frameTime);
    lastFrameTime = currentTime;

    // 在暂停状态下，只更新基本UI但不更新游戏逻辑
    if (controlsState.isPaused || !scoreSystem.isGameActive()) {
        // 更新调试面板，显示暂停状态
        const debugPanel = document.getElementById('debug-panel');
        debugPanel.innerHTML = 
            `FPS: ${fps}<br>` +
            `Frame Time: ${frameTime.toFixed(2)}ms<br>` +
            `<span style="color: red; font-weight: bold">游戏已${controlsState.isPaused ? '暂停' : '结束'}</span>`;
        
        // 在暂停状态下仍然渲染场景，但不更新任何对象
        renderer.render(scene, activeCamera);
        return;
    }

    // 以下是游戏正常运行时的代码（只在未暂停时执行）
    // 确保传递给动物系统的是有效数值
    const animalDeltaTime = frameTime;
    
    // 修改：更新动物系统（检查全局对象而不是局部变量）
    if (window.animalSystem && typeof window.animalSystem.update === 'function') {
        window.animalSystem.update(animalDeltaTime, player);
        
        // 调试面板显示动物数量信息
        if (window.animalSystem.animals && window.animalSystem.animals.llamas) {
            const debugPanel = document.getElementById('debug-panel');
            if (debugPanel) {
                const animalInfo = `羊驼数量: ${window.animalSystem.animals.llamas.length}/${window.animalSystem.initialCounts.llamas}`;
                const pigInfo = `猪数量: ${window.animalSystem.animals.pigs ? window.animalSystem.animals.pigs.length : 0}/${window.animalSystem.initialCounts.pigs || 0}`;
                // 将此信息添加到调试面板中
                debugPanel.innerHTML += `<br>${animalInfo}<br>${pigInfo}`;
            }
        }
    } else {
        console.log("等待动物系统初始化完成...");
    }

    // 使用全局animalSystem
    const animals = window.animalSystem ? window.animalSystem.animals : {};
    updateCamera(player, character, characterGroup, characterAnimation, camera, world, worldSize, controlsState.keys, animals);

    // 只有在第一人称视角时才应用视锥剔除和距离裁剪
    let lookDirection;
    if (activeCamera === camera) {
        // 修改：传递正确的动物集合
        lookDirection = applyFrustumCulling(camera, blockReferences, frustumSystem, renderSettings, animals);
    } else {
        // 在俯视视角下，显示所有方块
        blockReferences.forEach(block => {
            if (block) block.visible = true;
        });
        
        // 获取相机朝向向量用于显示在调试面板
        lookDirection = new THREE.Vector3();
        activeCamera.getWorldDirection(lookDirection);
    }

    // 使用新的handleMouseActions函数处理鼠标操作
    handleMouseActions(
        controlsState, 
        scene, 
        world, 
        blockReferences, 
        camera, 
        inventory, 
        blockTypes, 
        worldSize, 
        player, 
        createBlock, 
        updateInventoryUI, 
        character, 
        textures, 
        materials
    );
    
    // 优化：节流高亮方块的射线检测
    if (currentTime - controlsState.lastRaycastTime > controlsState.raycastInterval) {
        highlightBlock(blockReferences, camera);
        controlsState.lastRaycastTime = currentTime;
    }

    // 更新调试面板，添加渲染模式信息
    const debugPanel = document.getElementById('debug-panel');
    debugPanel.innerHTML =
        `FPS: ${fps}<br>` +
        `Frame Time: ${frameTime.toFixed(2)}ms<br>` +
        `Camera Position:<br>` +
        `X: ${activeCamera.position.x.toFixed(2)}<br>` +
        `Y: ${activeCamera.position.y.toFixed(2)}<br>` +
        `Z: ${activeCamera.position.z.toFixed(2)}<br>` +
        `Look Direction:<br>` +
        `X: ${lookDirection.x.toFixed(2)}<br>` +
        `Y: ${lookDirection.y.toFixed(2)}<br>` +
        `Z: ${lookDirection.z.toFixed(2)}<br>` +
        `Current View: ${activeCamera === camera ? '第一人称' : '俯视'}<br>` +
        `Render Mode: ${activeCamera === camera ? '视锥剔除' : '全部渲染'}<br>` +
        `Render Distance: ${activeCamera === camera ? renderSettings.currentRenderDistance.toFixed(1) : '无限制'}`;

    // 更新爆炸碎片
    for (let i = explosionDebris.length - 1; i >= 0; i--) {
        const debris = explosionDebris[i];

        // 应用重力
        debris.velocity.y -= debris.gravity;

        // 更新位置
        debris.mesh.position.x += debris.velocity.x;
        debris.mesh.position.y += debris.velocity.y;
        debris.mesh.position.z += debris.velocity.z;

        // 更新旋转
        debris.mesh.rotation.x += debris.rotationSpeed.x;
        debris.mesh.rotation.y += debris.rotationSpeed.y;
        debris.mesh.rotation.z += debris.rotationSpeed.z;

        // 如果是动物碎片，逐渐缩小
        if (debris.mesh.isDebris && debris.shrinkFactor) {
            // 每帧缩小一点
            debris.mesh.scale.multiplyScalar(debris.shrinkFactor);
        }

        // 增加生命计数
        debris.currentLife++;

        // 如果碎片触地或者寿命结束，移除它
        if (debris.currentLife >= debris.lifeTime || debris.mesh.position.y < 0) {
            scene.remove(debris.mesh);
            
            // 对于普通方块碎片，释放几何体资源
            if (!debris.mesh.isDebris && debris.mesh.geometry) {
                debris.mesh.geometry.dispose();
            }
            
            explosionDebris.splice(i, 1);
        }
    }

    // 使用当前活动摄像机进行渲染
    renderer.render(scene, activeCamera);
}

// 窗口大小调整
window.addEventListener('resize', () => {
    handleWindowResize(camera, overviewCamera, renderer);
});

// 初始化道具栏 - 传递inventory参数
createInventoryUI(inventory);

// 开始动画循环
animate();

// 使用新的函数初始化页面加载时的鼠标锁定
initPageLoadMouseLock(window);

// 修改：TNT爆炸事件监听器 - 使用全局动物对象访问
document.addEventListener('tnt-explosion', (event) => {
    const { x, y, z } = event.detail;
    console.log(`TNT爆炸触发，位置: (${x}, ${y}, ${z})`);
    
    const currentAnimals = window.animalSystem ? window.animalSystem.animals : {};
    const animalsBeforeExplosion = countAnimals(currentAnimals);
    
    explodeTNT(
        scene, 
        x, y, z, 
        world, 
        blockReferences, 
        worldSize, 
        blockTypes, 
        explosionTextures, 
        materials, 
        explosionDebris,
        currentAnimals,
        inventory,
        updateInventoryUI,
        character,
        textures
    );
    
    // 在爆炸后计算被消灭的动物数量
    const animalsAfterExplosion = countAnimals(currentAnimals);
    const animalsKilled = animalsBeforeExplosion - animalsAfterExplosion;
    
    // 每消灭一个动物加10分
    if (animalsKilled > 0 && scoreSystem.isGameActive()) {
        console.log(`消灭了 ${animalsKilled} 个动物，增加 ${animalsKilled * 10} 分`);
        scoreSystem.updateScore(animalsKilled * 10);
    }
});

// 添加计算动物总数的辅助函数
function countAnimals(animals) {
    let total = 0;
    if (animals.llamas) total += animals.llamas.length;
    if (animals.pigs) total += animals.pigs.length;
    // 如果有其他类型的动物，也加入计算
    return total;
}

// 保留现有的全局函数处理方式作为备份 - 修改为使用全局动物对象
window.handleTNTExplosion = function(x, y, z) {
    console.log(`全局TNT爆炸处理，位置: (${x}, ${y}, ${z})`);
    
    const currentAnimals = window.animalSystem ? window.animalSystem.animals : {};
    const animalsBeforeExplosion = countAnimals(currentAnimals);
    
    explodeTNT(
        scene, 
        x, y, z, 
        world, 
        blockReferences, 
        worldSize, 
        blockTypes, 
        explosionTextures, 
        materials, 
        explosionDebris,
        currentAnimals,
        inventory,
        updateInventoryUI,
        character,
        textures
    );
    
    // 在爆炸后计算被消灭的动物数量
    const animalsAfterExplosion = countAnimals(currentAnimals);
    const animalsKilled = animalsBeforeExplosion - animalsAfterExplosion;
    
    // 每消灭一个动物加10分
    if (animalsKilled > 0 && scoreSystem.isGameActive()) {
        console.log(`消灭了 ${animalsKilled} 个动物，增加 ${animalsKilled * 10} 分`);
        scoreSystem.updateScore(animalsKilled * 10);
    }
};

