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
    initPageLoadMouseLock
} from './controls.js';

// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
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

// 移除原始的鼠标控制代码，使用新函数代替
setupMouseControls(controlsState, document);

// 移除原始的键盘控制代码，使用新函数代替
setupKeyboardControls(controlsState, document);

// 移除原始的鼠标锁定代码，使用新函数代替
setupMouseLock(controlsState, document);

// 设置高级鼠标控制（处理第一人称视角）
setupAdvancedMouseControls(controlsState, player, camera, document);

// 设置物品快捷栏选择
setupInventorySelection(inventory, character, blockTypes, textures, materials, document);

// 修改摄像机切换代码
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && (event.key === '2' || event.key === '3')) {
        const newCamera = setupCameraToggle(character, camera, overviewCamera, { ctrlKey: true, key: event.key });
        if (newCamera) activeCamera = newCamera;
    }
});

// 在全局添加视锥和矩阵变量，放在初始化场景、相机和渲染器的代码之后
const frustum = new THREE.Frustum();
const tempMatrix = new THREE.Matrix4();
const cameraViewMatrix = new THREE.Matrix4();
const cameraProjectionMatrix = new THREE.Matrix4();

// 添加可配置的渲染距离参数
const renderSettings = {
    normalRenderDistance: 25,
    reducedRenderDistance: 15,
    lookingDownThreshold: -0.3,
    currentRenderDistance: 35
};

// 添加视锥检测函数
function updateFrustum() {
    // 更新投影视图矩阵
    camera.updateMatrixWorld();
    cameraViewMatrix.copy(camera.matrixWorldInverse);
    cameraProjectionMatrix.copy(camera.projectionMatrix);

    // 计算视锥
    tempMatrix.multiplyMatrices(cameraProjectionMatrix, cameraViewMatrix);
    frustum.setFromProjectionMatrix(tempMatrix);
}

// 检查方块是否在视锥内
function isInViewFrustum(position) {
    return frustum.containsPoint(position);
}

// 移除测试按键，只保留必要的键盘事件处理程序
document.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '8') {
        const index = parseInt(event.key) - 1;
        if (index >= 0 && index < inventory.items.length) {
            inventory.selectedIndex = index;
            updateInventoryUI(character, blockTypes, textures, materials);
        }
    } else if (event.key === 'm' && !mouseLock) {
        mouseLock = true;
        document.body.requestPointerLock();
    }
});

// 初始化手持物品
updateHeldItem(character, blockTypes, textures, materials);

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

// 在animate函数内添加视锥剔除和距离裁剪的逻辑
function animate(currentTime) {
    requestAnimationFrame(animate);

    // 计算帧时间和 FPS
    frameTime = currentTime - lastFrameTime;
    const fps = Math.round(1000 / frameTime);
    lastFrameTime = currentTime;

    updateCamera(player, character, characterGroup, characterAnimation, camera, world, worldSize, controlsState.keys);

    // 获取相机朝向向量
    const lookDirection = new THREE.Vector3();
    camera.getWorldDirection(lookDirection);

    // 只有在第一人称视角时才应用视锥剔除和距离裁剪
    if (activeCamera === camera) {
        // 更新视锥
        updateFrustum();

        // 动态调整渲染距离，当看向地面时减小可见距离
        if (lookDirection.y < renderSettings.lookingDownThreshold) {
            // 根据向下看的角度程度动态调整渲染距离
            const factor = Math.min(1, Math.abs(lookDirection.y / -1.0));
            renderSettings.currentRenderDistance = renderSettings.normalRenderDistance -
                (renderSettings.normalRenderDistance - renderSettings.reducedRenderDistance) * factor;
        } else {
            renderSettings.currentRenderDistance = renderSettings.normalRenderDistance;
        }

        // 应用视锥剔除和距离裁剪
        const cameraPosition = camera.position.clone();
        blockReferences.forEach(block => {
            if (!block) return;

            // 忽略天空，天空始终可见
            if (block.isSky) {
                block.visible = true;
                return;
            }

            // 计算到相机的距离
            const distanceToCamera = cameraPosition.distanceTo(block.position);

            // 应用距离裁剪和视锥剔除
            // 修改渲染条件：距离玩家6格以内的方块始终渲染，不考虑视锥
            const isNearPlayer = distanceToCamera <= 6;
            // 增加一个视锥外但在视锥边缘的判断
            const isNearFrustum = distanceToCamera <= 25 &&
                lookDirection.dot(new THREE.Vector3().subVectors(block.position, cameraPosition).normalize()) > 0.5;

            block.visible = (isNearPlayer || isNearFrustum || isInViewFrustum(block.position)) &&
                distanceToCamera <= renderSettings.currentRenderDistance;
        });
    } else {
        // 在俯视视角下，显示所有方块
        blockReferences.forEach(block => {
            if (block) block.visible = true;
        });
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
        `X: ${camera.position.x.toFixed(2)}<br>` +
        `Y: ${camera.position.y.toFixed(2)}<br>` +
        `Z: ${camera.position.z.toFixed(2)}<br>` +
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

        // 增加生命计数
        debris.currentLife++;

        // 如果碎片触地或者寿命结束，移除它
        if (debris.currentLife >= debris.lifeTime || debris.mesh.position.y < 0) {
            scene.remove(debris.mesh);
            debris.mesh.geometry.dispose();
            explosionDebris.splice(i, 1);
        }
    }

    // 使用当前活动摄像机进行渲染
    renderer.render(scene, activeCamera);
}

// 窗口大小调整
window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;

    // 更新主摄像机
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    // 更新俯视摄像机
    overviewCamera.aspect = aspect;
    overviewCamera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 初始化道具栏
createInventoryUI();

// 在初始化场景部分后添加
// 创建俯视摄像机
const overviewCamera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
// 设置摄像机位置 - 左上角45度俯视
overviewCamera.position.set(-20, 30, -20);
// 让摄像机指向世界中心
overviewCamera.lookAt(new THREE.Vector3(worldSize / 2, 0, worldSize / 2));

// 添加摄像机切换变量
let activeCamera = camera; // 默认使用主摄像机

// 开始动画循环
animate();

// 使用新的函数初始化页面加载时的鼠标锁定
initPageLoadMouseLock(window);

// 监听TNT爆炸事件
document.addEventListener('tnt-explosion', (event) => {
    const { x, y, z } = event.detail;
    explodeTNT(scene, x, y, z, world, blockReferences, worldSize, blockTypes, explosionTextures, materials, explosionDebris);
});

// 保留现有的全局函数处理方式作为备份
window.handleTNTExplosion = function(x, y, z) {
    explodeTNT(scene, x, y, z, world, blockReferences, worldSize, blockTypes, explosionTextures, materials, explosionDebris);
};
