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
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
scene.add(directionalLight);

// 加载天空纹理
const skyTexture = textureLoader.load('assets/images/sky.jpg');

// 创建天空球
function createSky() {
    const geometry = new THREE.SphereGeometry(800, 128, 128); // 半径足够大，包围整个场景
    const material = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide // 只渲染球体的内侧
    });
    const sky = new THREE.Mesh(geometry, material);
    sky.isSky = true; // 添加标记以便于识别
    scene.add(sky);
    return sky;
}

const sky = createSky();

// 初始化方块系统，替换直接定义的纹理和材质
const { textures, materials, explosionTextures } = initBlockSystem(scene, textureLoader);

// 世界大小
const worldSize = 50;

// 保存所有创建的方块
const blockReferences = [];

// 添加一个数组来存储爆炸碎片
const explosionDebris = [];

// 创建世界
const world = [];
for (let x = 0; x < worldSize; x++) {
    world[x] = [];
    for (let y = 0; y < worldSize; y++) {
        world[x][y] = [];
        for (let z = 0; z < worldSize; z++) {
            world[x][y][z] = blockTypes.air;
        }
    }
}

// 添加简化版柏林噪声函数
function perlinNoise2D() {
    // 创建梯度网格
    const gradients = {};
    const gridSize = 8; // 网格大小

    // 创建随机梯度向量
    function createGradient(ix, iz) {
        const key = ix + "," + iz;
        if (!gradients[key]) {
            const angle = Math.random() * Math.PI * 2;
            gradients[key] = [Math.cos(angle), Math.sin(angle)];
        }
        return gradients[key];
    }

    // 点积计算
    function dotProduct(ix, iz, x, z) {
        const gradient = createGradient(ix, iz);
        const dx = x - ix;
        const dz = z - iz;
        return dx * gradient[0] + dz * gradient[1];
    }

    // 平滑插值
    function smootherStep(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // 线性插值
    function interpolate(a, b, t) {
        return a + smootherStep(t) * (b - a);
    }

    // 生成噪声
    return function (x, z) {
        // 缩放坐标到网格大小
        x = x / gridSize;
        z = z / gridSize;

        // 获取网格单元坐标
        const x0 = Math.floor(x);
        const z0 = Math.floor(z);
        const x1 = x0 + 1;
        const z1 = z0 + 1;

        // 计算相对坐标
        const sx = x - x0;
        const sz = z - z0;

        // 计算四个角的贡献
        const n0 = dotProduct(x0, z0, x, z);
        const n1 = dotProduct(x1, z0, x, z);
        const ix0 = interpolate(n0, n1, sx);

        const n2 = dotProduct(x0, z1, x, z);
        const n3 = dotProduct(x1, z1, x, z);
        const ix1 = interpolate(n2, n3, sx);

        // 最终插值
        const value = interpolate(ix0, ix1, sz);

        // 映射到[0,1]范围
        return (value + 1) * 0.5;
    };
}

// 生成地形
function generateTerrain() {
    console.log("使用柏林噪声生成地形...");

    // 创建柏林噪声函数
    const noise = perlinNoise2D();

    // 创建初始高度图
    const heightMap = [];
    for (let x = 0; x < worldSize; x++) {
        heightMap[x] = [];
        for (let z = 0; z < worldSize; z++) {
            // 使用柏林噪声，计算高度，范围为2-6
            // 使用多个频率的噪声相加，创造更丰富的地形
            const baseNoise = noise(x, z);
            const detailNoise = noise(x * 2, z * 2) * 0.5;

            // 混合基础噪声和细节噪声
            const combinedNoise = baseNoise * 0.7 + detailNoise * 0.3;

            // 将噪声值映射到高度范围2-6
            heightMap[x][z] = Math.floor(combinedNoise * 4) + 2;
        }
    }

    // 使用高度图生成实际地形
    for (let x = 0; x < worldSize; x++) {
        for (let z = 0; z < worldSize; z++) {
            const height = heightMap[x][z];

            // 生成地形块
            for (let y = 0; y < height; y++) {
                if (y === height - 1) {
                    world[x][y][z] = blockTypes.grass;
                } else if (y >= height - 3) { // 增加泥土层厚度，从最顶部往下3格
                    world[x][y][z] = blockTypes.dirt;
                } else {
                    world[x][y][z] = blockTypes.stone;
                }
            }
        }
    }

    // 添加一些随机变化，使地形更自然
    const smoothingPasses = 1;
    for (let pass = 0; pass < smoothingPasses; pass++) {
        for (let x = 1; x < worldSize - 1; x++) {
            for (let z = 1; z < worldSize - 1; z++) {
                // 有10%的概率在平坦区域创建小山丘或洼地
                if (Math.random() < 0.3) {
                    const currentHeight = heightMap[x][z];
                    const neighborAvg = (heightMap[x - 1][z] + heightMap[x + 1][z] +
                        heightMap[x][z - 1] + heightMap[x][z + 1]) / 4;

                    // 如果周围较平坦，则添加一些随机变化
                    if (Math.abs(currentHeight - neighborAvg) < 0.5) {
                        const newHeight = currentHeight + (Math.random() > 0.5 ? 1 : -1);
                        // 确保高度在有效范围内
                        const adjustedHeight = Math.max(2, Math.min(6, newHeight));

                        // 如果高度增加，需要添加方块
                        if (adjustedHeight > currentHeight) {
                            for (let y = currentHeight; y < adjustedHeight; y++) {
                                if (y === adjustedHeight - 1) {
                                    world[x][y][z] = blockTypes.grass;
                                    // 将之前的草方块转为泥土
                                    if (currentHeight > 0) {
                                        world[x][currentHeight - 1][z] = blockTypes.dirt;
                                    }
                                } else {
                                    world[x][y][z] = blockTypes.dirt;
                                }
                            }
                        }
                        // 如果高度减少，需要移除方块并将新的顶层设为草
                        else if (adjustedHeight < currentHeight) {
                            for (let y = adjustedHeight; y < currentHeight; y++) {
                                world[x][y][z] = blockTypes.air;
                            }
                            if (adjustedHeight > 0) {
                                world[x][adjustedHeight - 1][z] = blockTypes.grass;
                            }
                        }

                        heightMap[x][z] = adjustedHeight;
                    }
                }
            }
        }
    }
}

// 生成树
function generateTree(x, y, z) {
    const height = Math.floor(Math.random() * 3) + 4;
    // 树干
    for (let dy = 1; dy <= height; dy++) {
        if (y + dy < worldSize) {
            world[x][y + dy][z] = blockTypes.tree;
        }
    }
    // 树冠
    const crownSize = Math.floor(Math.random() * 2) + 2;
    for (let dx = -crownSize; dx <= crownSize; dx++) {
        for (let dz = -crownSize; dz <= crownSize; dz++) {
            for (let dy = height; dy < height + crownSize; dy++) {
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance < crownSize && Math.random() > 0.3) {
                    const tx = x + dx;
                    const ty = y + dy;
                    const tz = z + dz;

                    // 确保在世界范围内
                    if (tx >= 0 && tx < worldSize &&
                        ty >= 0 && ty < worldSize &&
                        tz >= 0 && tz < worldSize) {
                        world[tx][ty][tz] = blockTypes.leaves;
                    }
                }
            }
        }
    }
}

// 随机生成树
function generateTrees() {
    // 增加树木数量为5-10棵
    const treeCount = Math.floor(Math.random() * 6) + 5;
    console.log(`正在生成 ${treeCount} 棵树...`);

    // 追踪已放置的树
    let placedTrees = 0;
    let attempts = 0;
    const maxAttempts = 100; // 防止无限循环

    while (placedTrees < treeCount && attempts < maxAttempts) {
        const x = Math.floor(Math.random() * worldSize);
        const z = Math.floor(Math.random() * worldSize);

        // 找到该位置的地面高度
        let groundY = -1;
        for (let y = worldSize - 1; y >= 0; y--) {
            if (world[x][y][z] === blockTypes.grass) {
                groundY = y;
                break;
            }
        }

        // 如果找到草地，且周围有足够空间，则种树
        if (groundY >= 0) {
            // 检查是否与其他树太近
            let tooClose = false;
            const minTreeDistance = 5; // 树之间的最小距离

            // 简单检查：如果4个方向都有足够的空间
            for (let dx = -minTreeDistance; dx <= minTreeDistance; dx++) {
                for (let dz = -minTreeDistance; dz <= minTreeDistance; dz++) {
                    const nx = x + dx;
                    const nz = z + dz;

                    // 跳过自己的位置
                    if (dx === 0 && dz === 0) continue;

                    // 确保在边界内
                    if (nx >= 0 && nx < worldSize && nz >= 0 && nz < worldSize) {
                        // 检查该位置是否为树干
                        for (let y = groundY + 1; y < groundY + 5; y++) {
                            if (y < worldSize && world[nx][y][nz] === blockTypes.tree) {
                                tooClose = true;
                                break;
                            }
                        }
                    }

                    if (tooClose) break;
                }

                if (tooClose) break;
            }

            if (!tooClose) {
                generateTree(x, groundY, z);
                placedTrees++;
            }
        }

        attempts++;
    }
}

// 渲染世界
function renderWorld() {
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

// 初始化世界
generateTerrain();
generateTrees();
renderWorld();

// 玩家控制 - 修改这里，使用安全位置初始化
const player = createPlayer(findSafeSpawnPosition(world, worldSize));

// 创建角色
character = createCharacter(characterGroup, textureLoader);

// 设置初始角色透明度（因为默认是第一人称视角）
setCharacterPartsOpacity(character, true);


// 修改摄像机切换代码
document.addEventListener('keydown', (event) => {
    // 检测Ctrl+1和Ctrl+2组合键
    if (event.ctrlKey) {
        if (event.key === '2') {
            // 切换到第一人称视角（角色头部摄像机）
            activeCamera = camera;
            console.log('切换到第一人称视角');

            // 设置角色部件透明度
            setCharacterPartsOpacity(character, true);


        } else if (event.key === '3') {
            // 切换到俯视摄像机
            activeCamera = overviewCamera;
            console.log('切换到俯视视角');

            // 恢复角色部件可见性
            setCharacterPartsOpacity(character, false);

        }
    }
});



// 鼠标控制
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;
let isRightMouseDown = false;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
        isMouseDown = true;
    } else if (event.button === 2) {
        isRightMouseDown = true;
    }
});

document.addEventListener('mouseup', (event) => {
    if (event.button === 0) {
        isMouseDown = false;
    } else if (event.button === 2) {
        isRightMouseDown = false;
    }
});

// 键盘控制
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// 鼠标锁定
let mouseLock = false;
document.addEventListener('keydown', (event) => {
    if (event.key === 'm' && !mouseLock) {
        mouseLock = true;
        document.body.requestPointerLock();
    }
});

document.addEventListener('pointerlockchange', () => {
    mouseLock = document.pointerLockElement === document.body;
});

document.addEventListener('mousemove', (event) => {
    if (mouseLock) {
        const deltaX = event.movementX;
        const deltaY = event.movementY;

        // 修改后的旋转计算
        player.rotation.y -= deltaX * 0.002;
        // 将角度限制在 -π 到 π 之间
        player.rotation.y = ((player.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;

        player.rotation.x -= deltaY * 0.002;
        player.rotation.x = THREE.MathUtils.clamp(player.rotation.x, -Math.PI / 2, Math.PI / 2);

        // 使用四元数直接累积旋转
        const deltaQuaternion = new THREE.Quaternion()
            .setFromAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX * 0.002) // Y轴旋转
            .multiply(
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -deltaY * 0.002) // X轴旋转
            );
        camera.quaternion.multiply(deltaQuaternion).normalize();
    }
});




// 添加性能优化辅助函数
let lastRaycastTime = 0;
const raycastInterval = 100; // 每100毫秒检测一次

let isBreakingBlock = false;
let isPlacingBlock = false;
const blockActionCooldown = 250; // 操作冷却时间(毫秒)

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

    updateCamera(player, character, characterGroup, characterAnimation, camera, world, worldSize, keys);

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

    // 优化：节流高亮方块的射线检测
    if (currentTime - lastRaycastTime > raycastInterval) {
        highlightBlock(blockReferences, camera);
        lastRaycastTime = currentTime;
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

    // 使用防抖动版本的方块操作
    if (isMouseDown) {
        // 根据当前选择的道具决定左键行为
        if (inventory.selectedIndex === 0) {
            // 当选择矿镐时，左键执行挖掘方块功能
            breakBlockWithDebounce();
        } else {
            // 选择其他道具时，左键执行放置方块功能
            placeBlockWithDebounce();
        }
    }

    if (isRightMouseDown) {
        // 右键功能暂时留空
    }

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

// 添加页面加载完成后自动锁定鼠标的逻辑
window.addEventListener('load', () => {
    // 在页面加载后稍微延迟锁定，以确保所有资源都已加载
    setTimeout(() => {
        document.body.requestPointerLock();
    }, 1000);
});

// 保留现有的指针锁定变更事件处理
document.addEventListener('pointerlockchange', () => {
    mouseLock = document.pointerLockElement === document.body;

    // 如果鼠标解锁了，添加点击事件重新锁定
    if (!mouseLock) {
        const clickToLock = () => {
            document.body.requestPointerLock();
            document.removeEventListener('click', clickToLock);
        };
        document.addEventListener('click', clickToLock);
    }
});

// 添加防抖版的方块操作函数
function breakBlockWithDebounce() {
    if (!isBreakingBlock) {
        isBreakingBlock = true;
        breakBlock(scene, world, blockReferences, camera, inventory, blockTypes, updateInventoryUI, character);
        setTimeout(() => {
            isBreakingBlock = false;
        }, blockActionCooldown);
    }
}

function placeBlockWithDebounce() {
    if (!isPlacingBlock) {
        isPlacingBlock = true;
        placeBlock(scene, world, blockReferences, camera, inventory, blockTypes, worldSize, player, 
                  (scene, x, y, z, type, materials, textures, blockReferences, inventory) => 
                      createBlock(scene, x, y, z, type, materials, textures, blockReferences, inventory), 
                  updateInventoryUI, character, textures, materials);
        setTimeout(() => {
            isPlacingBlock = false;
        }, blockActionCooldown);
    }
}

// 监听TNT爆炸事件
document.addEventListener('tnt-explosion', (event) => {
    const { x, y, z } = event.detail;
    explodeTNT(scene, x, y, z, world, blockReferences, worldSize, blockTypes, explosionTextures, materials, explosionDebris);
});

// 保留现有的全局函数处理方式作为备份
window.handleTNTExplosion = function(x, y, z) {
    explodeTNT(scene, x, y, z, world, blockReferences, worldSize, blockTypes, explosionTextures, materials, explosionDebris);
};
