import { 
    inventory, 
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
    togglePause,
    createPauseOverlay,
    setupPauseControl,
    setupRestartControl,
    tearDownMouseLock,
    tearDownMouseControls,
    tearDownAdvancedMouseControls,
    tearDownKeyboardControls
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

// 添加导入user_data.js中的函数
import {
    initUserDataSystem
} from './user_data.js';

// 添加导入config.js中的函数
import {
    getConfig
} from './config.js';

// 添加导入skills.js中的函数
import {
    skills,
    initSkillSystem,
    activateSkill,
    deactivateSkill,
    createSkillCard3D,
    pickupSkillCard,
    checkSkillCardDrop
} from './skills.js';


// 导出游戏实例，以便其他模块可以访问
export function createMinefract() {

    // 初始化用户数据系统
    const userDataSystem = initUserDataSystem();

    // 获取系统配置
    const config = getConfig(userDataSystem);

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

    // blockTypes 已设置
    console.log("blockTypes:", blockTypes);

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
    const player = createPlayer(config, findSafeSpawnPosition(world, worldSize));

    // 创建角色
    character = createCharacter(characterGroup, textureLoader);

    // 设置初始角色透明度（因为默认是第一人称视角）
    setCharacterPartsOpacity(character, true);

    // 替换全局键鼠控制变量为控制状态对象
    const controlsState = initControlsState();

    // 鼠标控制
    const mouseControlsListeners = setupMouseControls(controlsState, document);

    // 键盘控制代
    const keyboardControlsListeners = setupKeyboardControls(controlsState, document);

    // 鼠标锁定
    const mouseLockListeners =setupMouseLock(controlsState, document);

    // 设置高级鼠标控制（处理第一人称视角）
    const advancedMouseControlsListeners = setupAdvancedMouseControls(controlsState, player, camera, document);

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
    const animalSystem = initAnimalSystem(config, scene, world, worldSize, textureLoader, blockTypes);

    // 创建暂停界面
    const pauseOverlay = createPauseOverlay();

    // 设置暂停控制
    setupPauseControl(controlsState, pauseOverlay, document, animalSystem);

    // 设置重启游戏控制
    setupRestartControl(controlsState, document);

    // 初始化计分系统，传入所有需要解除的监听器
    const scoreSystem = initScoreSystem(
        config,
        document, 
        tearDownMouseLock, 
        mouseLockListeners, 
        tearDownMouseControls, 
        mouseControlsListeners,
        tearDownAdvancedMouseControls,
        advancedMouseControlsListeners,
        tearDownKeyboardControls,
        keyboardControlsListeners
    );

    // 初始化技能系统
    const skillSystem = initSkillSystem();

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
                `<span style="color: red; font-weight: bold">游戏已暂停</span>`;

            // 在暂停状态下仍然渲染场景，但不更新任何对象
            renderer.render(scene, activeCamera);
            return;
        }

        // 以下是游戏正常运行时的代码（只在未暂停时执行）
        // 确保传递给动物系统的是有效数值
        const animalDeltaTime = frameTime;

        // 修改：更新动物系统（检查全局对象而不是局部变量）
        if (animalSystem && typeof animalSystem.update === 'function') {
            animalSystem.update(animalDeltaTime, player);

            // 调试面板显示动物数量信息
            if (animalSystem.animals && animalSystem.animals.llamas) {
                const debugPanel = document.getElementById('debug-panel');
                if (debugPanel) {
                    const animalInfo = `羊驼数量: ${animalSystem.animals.llamas.length}/${animalSystem.initialCounts.llamas}`;
                    const pigInfo = `猪数量: ${animalSystem.animals.pigs ? animalSystem.animals.pigs.length : 0}/${animalSystem.initialCounts.pigs || 0}`;
                    // 将此信息添加到调试面板中
                    debugPanel.innerHTML += `<br>${animalInfo}<br>${pigInfo}`;
                }
            }
        } else {
            console.log("等待动物系统初始化完成...");
        }

        // 使用全局animalSystem
        const animals = animalSystem.animals;
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

        // 添加：检测是否拾取了技能卡
        scene.children.forEach(object => {
            if (object.isSkillCard) {
                // 计算与玩家的距离
                const distanceToPlayer = Math.sqrt(
                    Math.pow(player.position.x - object.position.x, 2) +
                    Math.pow(player.position.y - object.position.y, 2) +
                    Math.pow(player.position.z - object.position.z, 2)
                );
                
                // 如果玩家足够接近技能卡，拾取它
                if (distanceToPlayer < 1.5) {
                    pickupSkillCard(player, object, scene);
                }
            }
        });

        // 使用当前活动摄像机进行渲染
        renderer.render(scene, activeCamera);
    }

    // 窗口大小调整
    window.addEventListener('resize', () => {
        handleWindowResize(camera, overviewCamera, renderer);
    });

    // 初始化道具栏
    createInventoryUI(config);

    // 开始动画循环
    animate();



    return {
        config: config,
        scene: scene,
        world: world,
        blockReferences: blockReferences,
        worldSize: worldSize,
        blockTypes: blockTypes,
        explosionTextures: explosionTextures,
        materials: materials,
        explosionDebris: explosionDebris,
        inventory: inventory,
        updateInventoryUI: updateInventoryUI,
        character: character,
        textures: textures,
        animalSystem: animalSystem,
        scoreSystem: scoreSystem,
        userDataSystem: userDataSystem,
        skillSystem: skillSystem,
        checkSkillCardDrop: checkSkillCardDrop,
        createSkillCard3D: createSkillCard3D,
    }
}

// 将开始游戏方法暴露给全局
window.createMinefract = createMinefract;

// 创建游戏实例
window.MinecraftArtOfExplode = createMinefract();

// TNT爆炸事件监听器 - 修改为包含计分系统更新
document.addEventListener('tnt-explosion', (event) => {
    const { x, y, z } = event.detail;
    console.log(`TNT爆炸触发，位置: (${x}, ${y}, ${z})`);
    console.log(window.MinecraftArtOfExplode.config);
    
    explodeTNT(
        window.MinecraftArtOfExplode.config,
        window.MinecraftArtOfExplode.scene, 
        x, y, z, 
        window.MinecraftArtOfExplode.world, 
        window.MinecraftArtOfExplode.blockReferences, 
        window.MinecraftArtOfExplode.worldSize, 
        window.MinecraftArtOfExplode.blockTypes, 
        window.MinecraftArtOfExplode.explosionTextures, 
        window.MinecraftArtOfExplode.materials, 
        window.MinecraftArtOfExplode.explosionDebris,
        window.MinecraftArtOfExplode.animalSystem.animals,
        window.MinecraftArtOfExplode.inventory,
        window.MinecraftArtOfExplode.updateInventoryUI,
        window.MinecraftArtOfExplode.character,
        window.MinecraftArtOfExplode.textures,
        window.MinecraftArtOfExplode.scoreSystem,
        window.MinecraftArtOfExplode.checkSkillCardDrop,
        window.MinecraftArtOfExplode.createSkillCard3D
    );
});

// 全局TNT爆炸处理函数 - 也需要修改
window.handleTNTExplosion = function(x, y, z) {
    console.log(`全局TNT爆炸处理，位置: (${x}, ${y}, ${z})`);
    
    explodeTNT(
        window.MinecraftArtOfExplode.config,
        window.MinecraftArtOfExplode.scene, 
        x, y, z, 
        window.MinecraftArtOfExplode.world, 
        window.MinecraftArtOfExplode.blockReferences, 
        window.MinecraftArtOfExplode.worldSize, 
        window.MinecraftArtOfExplode.blockTypes, 
        window.MinecraftArtOfExplode.explosionTextures, 
        window.MinecraftArtOfExplode.materials, 
        window.MinecraftArtOfExplode.explosionDebris,
        window.MinecraftArtOfExplode.animalSystem.animals,
        window.MinecraftArtOfExplode.inventory,
        window.MinecraftArtOfExplode.updateInventoryUI,
        window.MinecraftArtOfExplode.character,
        window.MinecraftArtOfExplode.textures,
        window.MinecraftArtOfExplode.scoreSystem,
        window.MinecraftArtOfExplode.checkSkillCardDrop,
        window.MinecraftArtOfExplode.createSkillCard3D
    );
};

