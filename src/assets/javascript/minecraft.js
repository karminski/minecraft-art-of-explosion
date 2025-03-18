import { inventory, heldItemMesh, createInventoryUI, updateInventoryUI, updateHeldItem } from './inventory.js';
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

// 方块类型和纹理
const blockTypes = {
    air: 0,
    grass: 1,
    dirt: 2,
    stone: 3,
    tree: 4,
    leaves: 5,
    tnt: 6
};

// 加载纹理
const textures = {
    grass: textureLoader.load('assets/images/grass.png'),
    dirt: textureLoader.load('assets/images/dirt.png'),
    stone: textureLoader.load('assets/images/stone.png'),
    tree: textureLoader.load('assets/images/tree.png'),
    leaves: textureLoader.load('assets/images/leaves.png'),
    tntTop: textureLoader.load('assets/images/tnt-top.png'),
    tntSide: textureLoader.load('assets/images/tnt-side.jpg'),
    tntBottom: textureLoader.load('assets/images/tnt-bottom.png')
};

// 创建方块材质
const materials = {
    grass: new THREE.MeshPhongMaterial({ map: textures.grass, color: 0x7cba34 }),
    dirt: new THREE.MeshPhongMaterial({ map: textures.dirt, color: 0x8b4513 }),
    stone: new THREE.MeshPhongMaterial({ map: textures.stone, color: 0x808080 }),
    tree: new THREE.MeshPhongMaterial({ map: textures.tree, color: 0x8b4513 }),
    leaves: new THREE.MeshPhongMaterial({ map: textures.leaves, color: 0x32cd32, transparent: true, opacity: 0.8 }),
    tnt: new THREE.MeshPhongMaterial({
        map: textures.tntSide,
        color: 0x8b4513,
        side: THREE.DoubleSide
    })
};

// 世界大小
const worldSize = 50;

// 保存所有创建的方块
const blockReferences = [];

// 添加这一行在 TNT 相关函数之前（可放在 world 数组定义之后）
const tntTimers = {};

// 预加载爆炸动画序列帧
const explosionTextures = [];
for (let i = 1; i <= 12; i++) {
    const textureNum = i.toString().padStart(2, '0');
    explosionTextures.push(textureLoader.load(`assets/images/explode-${textureNum}.png`));
}

// 创建爆炸动画
function createExplosionAnimation(position, scale = 1) {
    const explosionMaterial = new THREE.SpriteMaterial({
        map: explosionTextures[0],
        transparent: true,
        blending: THREE.AdditiveBlending // 使爆炸效果更明亮
    });

    const explosion = new THREE.Sprite(explosionMaterial);
    explosion.position.copy(position);
    explosion.scale.set(scale, scale, 1);
    scene.add(explosion);

    // 帧索引和时间控制
    let frameIndex = 0;
    const frameTime = 60; // 每帧持续时间(毫秒)

    // 动画间隔
    const animInterval = setInterval(() => {
        frameIndex++;
        if (frameIndex < explosionTextures.length) {
            explosion.material.map = explosionTextures[frameIndex];
        } else {
            // 动画结束，清理
            clearInterval(animInterval);
            scene.remove(explosion);
            explosion.material.dispose();
        }
    }, frameTime);

    return explosion;
}

// 添加一个数组来存储爆炸碎片
const explosionDebris = [];

// 添加新函数：为销毁的方块创建爆炸碎片
function createBlockDebris(x, y, z, blockType) {
    // 确定方块的材质
    let material;
    if (blockType === blockTypes.tnt) {
        // TNT使用多材质，我们只用第一个面的材质来简化
        material = materials.tnt;
    } else {
        material = materials[Object.keys(blockTypes).find(key => blockTypes[key] === blockType)];
    }

    // 为每个方块创建2到4个碎片，增加数量让效果更明显
    const debrisCount = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < debrisCount; i++) {
        // 创建一个小一点的几何体作为碎片
        const size = 0.2 + Math.random() * 0.4; // 0.2-0.6之间的随机大小
        const geometry = new THREE.BoxGeometry(size, size, size);
        const debris = new THREE.Mesh(geometry, material);

        // 设置碎片的初始位置（方块中心位置附近）
        debris.position.set(
            x + 0.5 + (Math.random() - 0.5) * 0.3,
            y + 0.5 + (Math.random() - 0.5) * 0.3,
            z + 0.5 + (Math.random() - 0.5) * 0.3
        );

        // 设置随机的初始速度（从爆炸中心向外飞）
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 2 + 0.5, // 更大的向上初始速度
            (Math.random() - 0.5) * 2
        ).normalize();

        // 速度大小随机，但与到爆炸中心的距离成反比
        // 增加10倍速度
        const speed = (0.05 + Math.random() * 0.1) * 10;

        // 随机旋转速度, 也变快10倍左右
        const rotationSpeed = {
            x: (Math.random() - 0.5) * 2.0,
            y: (Math.random() - 0.5) * 2.0,
            z: (Math.random() - 0.5) * 2.0
        };

        // 将碎片添加到场景中
        scene.add(debris);

        // 将碎片信息添加到数组中以便更新
        explosionDebris.push({
            mesh: debris,
            velocity: direction.multiplyScalar(speed),
            rotationSpeed: rotationSpeed,
            lifeTime: 120 + Math.floor(Math.random() * 60), // 存在时间更长: 120-180帧
            currentLife: 0,
            gravity: 0.004 // 稍微降低重力，让碎片飞得更远
        });
    }
}

// 修改createBlock函数以确保TNT正确激活
function createBlock(x, y, z, type) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    if (type === blockTypes.tnt) {
        // 创建TNT的六面材质
        const materials = [
            new THREE.MeshPhongMaterial({ map: textures.tntSide }), // 右侧
            new THREE.MeshPhongMaterial({ map: textures.tntSide }), // 左侧
            new THREE.MeshPhongMaterial({ map: textures.tntTop }), // 顶部
            new THREE.MeshPhongMaterial({ map: textures.tntBottom }), // 底部
            new THREE.MeshPhongMaterial({ map: textures.tntSide }), // 前侧
            new THREE.MeshPhongMaterial({ map: textures.tntSide })  // 后侧
        ];

        const tntMesh = new THREE.Mesh(geometry, materials);
        tntMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        tntMesh.type = type;
        tntMesh.blockX = x;
        tntMesh.blockY = y;
        tntMesh.blockZ = z;
        tntMesh.originalMaterial = materials;
        scene.add(tntMesh);

        // 保存引用到数组
        blockReferences.push(tntMesh);

        // 激活TNT (如果是通过放置操作创建的)
        if (inventory.selectedIndex === 1) {
            startTNTTimer(tntMesh);
        }

        return tntMesh;
    } else {
        const material = materials[Object.keys(blockTypes).find(key => blockTypes[key] === type)];
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x + 0.5, y + 0.5, z + 0.5);
        cube.type = type;
        cube.blockX = x;
        cube.blockY = y;
        cube.blockZ = z;
        scene.add(cube);

        // 保存引用到数组
        blockReferences.push(cube);

        return cube;
    }
}

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
                    createBlock(x, y, z, world[x][y][z]);
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

// 高亮效果函数 - 添加了节流和范围优化
function highlightBlock() {
    // 重置所有方块的高亮状态
    blockReferences.forEach(block => {
        if (block && block.isHighlighted) {
            // 判断是否为TNT方块（使用材质数组）
            if (Array.isArray(block.originalMaterial)) {
                block.material = block.originalMaterial;
            } else if (block.originalMaterials) {
                // 如果是正在倒计时的TNT，不修改其材质
            } else {
                block.material = block.originalMaterial;
            }
            block.isHighlighted = false;
        }
    });

    const raycaster = new THREE.Raycaster();
    raycaster.far = 5;
    raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));

    // 只检测视野范围内且可见的方块
    const visibleBlocks = blockReferences.filter(block => {
        if (!block) return false;
        return block.visible &&
            camera.position.distanceTo(block.position) < 5;
    });

    const intersects = raycaster.intersectObjects(visibleBlocks);

    if (intersects.length > 0) {
        const block = intersects[0].object;

        // 如果是正在计时的TNT，跳过高亮处理
        if (block.type === blockTypes.tnt && block.originalMaterials) {
            return;
        }

        // 保存原始材质
        if (!block.originalMaterial) {
            // 检查是否为使用材质数组的方块
            if (Array.isArray(block.material)) {
                block.originalMaterial = block.material.map(mat => mat.clone());
            } else {
                block.originalMaterial = block.material.clone();
            }
        }

        // 创建高亮材质
        if (Array.isArray(block.material)) {
            // 如果是材质数组（TNT），为每个面创建高亮版本
            const highlightMaterials = block.originalMaterial.map(mat => {
                const highlightMat = mat.clone();
                if (highlightMat.emissive) {
                    highlightMat.emissive.set(0xffff00);
                    highlightMat.emissiveIntensity = 0.1;
                }
                return highlightMat;
            });
            block.material = highlightMaterials;
        } else {
            // 单一材质的处理方式不变
            const highlightMaterial = block.originalMaterial.clone();
            if (highlightMaterial.emissive) {
                highlightMaterial.emissive.set(0xffff00);
                highlightMaterial.emissiveIntensity = 0.1;
            }
            block.material = highlightMaterial;
        }

        block.isHighlighted = true;
    }
}

// 修改挖方块功能，添加防抖动机制
function breakBlockWithDebounce() {
    if (!isBreakingBlock) {
        isBreakingBlock = true;

        const raycaster = new THREE.Raycaster();
        // 设置射线检测的长度为5个方块长度
        raycaster.far = 5;
        raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));

        // 只检测视野范围内的方块
        const visibleBlocks = blockReferences.filter(block => {
            const distance = camera.position.distanceTo(block.position);
            return distance < 7;
        });

        const intersects = raycaster.intersectObjects(visibleBlocks);

        if (intersects.length > 0) {
            const block = intersects[0].object;
            const x = block.blockX;
            const y = block.blockY;
            const z = block.blockZ;

            if (x >= 0 && x < worldSize && y >= 0 && y < worldSize && z >= 0 && z < worldSize) {
                // 只有使用道具1（矿镐）才能挖掘方块
                if (inventory.selectedIndex === 0) {
                    world[x][y][z] = blockTypes.air;
                    scene.remove(block);
                    // 从引用数组中移除
                    const index = blockReferences.indexOf(block);
                    if (index > -1) {
                        blockReferences.splice(index, 1);
                    }

                    // 根据方块类型添加到对应的道具栏
                    switch (block.type) {
                        case blockTypes.grass: // 添加草方块的处理
                            inventory.items[2].count += 1; // 也算作泥土
                            break;
                        case blockTypes.dirt:
                            inventory.items[2].count += 1;
                            break;
                        case blockTypes.stone:
                            inventory.items[3].count += 1;
                            break;
                        case blockTypes.tree:
                            inventory.items[4].count += 1;
                            break;
                        case blockTypes.leaves:
                            inventory.items[5].count += 1;
                            break;
                    }

                    updateInventoryUI(character, blockTypes, textures, materials);
                }
            }
        }

        // 添加冷却时间
        setTimeout(() => {
            isBreakingBlock = false;
        }, blockActionCooldown);
    }
}

// 修改放置方块的功能，处理与玩家冲突情况
function placeBlockWithDebounce() {
    if (!isPlacingBlock) {
        isPlacingBlock = true;

        const raycaster = new THREE.Raycaster();
        // 设置射线检测的长度为5个方块长度
        raycaster.far = 5;
        raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));

        // 只检测视野范围内的方块
        const visibleBlocks = blockReferences.filter(block => {
            const distance = camera.position.distanceTo(block.position);
            return distance < 5;
        });

        const intersects = raycaster.intersectObjects(visibleBlocks);

        if (intersects.length > 0) {
            const block = intersects[0].object;
            const point = intersects[0].point;
            const normal = intersects[0].face.normal;

            const x = Math.floor(point.x + normal.x * 0.5);
            const y = Math.floor(point.y + normal.y * 0.5);
            const z = Math.floor(point.z + normal.z * 0.5);

            if (x >= 0 && x < worldSize && y >= 0 && y < worldSize && z >= 0 && z < worldSize && world[x][y][z] === blockTypes.air) {
                // 检查是否与玩家位置冲突
                const playerBlockX = Math.floor(player.position.x);
                const playerBlockY = Math.floor(player.position.y);
                const playerBlockZ = Math.floor(player.position.z);

                // 检查将要放置的方块是否会与玩家碰撞
                const willCollideWithPlayer = (x === playerBlockX && y === playerBlockY && z === playerBlockZ) ||
                    (x === playerBlockX && y === playerBlockY - 1 && z === playerBlockZ);

                // 只能放置方块，不能放置道具1（矿镐）
                if (inventory.selectedIndex !== 0 && inventory.items[inventory.selectedIndex].count > 0) {
                    // 根据当前选择的物品确定方块类型
                    let blockTypeToPlace;
                    switch (inventory.selectedIndex) {
                        case 2: // 泥土
                            blockTypeToPlace = blockTypes.dirt;
                            break;
                        case 3: // 石头
                            blockTypeToPlace = blockTypes.stone;
                            break;
                        case 4: // 木头
                            blockTypeToPlace = blockTypes.tree;
                            break;
                        case 5: // 树叶
                            blockTypeToPlace = blockTypes.leaves;
                            break;
                        case 1: // TNT
                            blockTypeToPlace = blockTypes.tnt;
                            break;
                        default:
                            blockTypeToPlace = blockTypes.stone; // 默认为石头
                    }

                    world[x][y][z] = blockTypeToPlace;
                    createBlock(x, y, z, blockTypeToPlace);

                    // 如果方块与玩家位置冲突，将玩家抬高
                    if (willCollideWithPlayer) {
                        console.log("检测到方块与玩家位置冲突，自动抬高玩家");
                        player.position.y += 1.0; // 抬高一个方块的高度
                    }

                    // 减少物品数量并确保不会低于0
                    inventory.items[inventory.selectedIndex].count = Math.max(0, inventory.items[inventory.selectedIndex].count - 1);

                    // 立即更新UI
                    updateInventoryUI(character, blockTypes, textures, materials);
                }
            }
        }

        // 添加冷却时间
        setTimeout(() => {
            isPlacingBlock = false;
        }, blockActionCooldown);
    }
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

// 修改explodeTNT函数，调整爆炸大小并为每个销毁的方块添加爆炸效果
function explodeTNT(x, y, z) {
    // 创建主爆炸动画，大小增加
    const mainExplosionPos = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
    const mainExplosionSize = 3.0 + Math.random() * 3.0; // 增大到3.0-6.0之间随机值
    createExplosionAnimation(mainExplosionPos, mainExplosionSize);

    // 创建额外的爆炸效果，增加数量
    for (let i = 0; i < 5; i++) { // 从3个增加到5个
        // 在主爆炸点附近随机位置创建额外爆炸
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 4, // 范围扩大
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
        );

        const extraExplosionPos = new THREE.Vector3().addVectors(mainExplosionPos, offset);
        // 随机爆炸大小和延迟，增加范围
        const scale = 1.5 + Math.random() * 1.5; // 1.5-3.0之间
        setTimeout(() => {
            createExplosionAnimation(extraExplosionPos, scale);
        }, Math.random() * 200); // 延迟相同
    }

    // 从TNT发出射线检测
    const tntPosition = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);

    // 记录已经被销毁的方块位置，避免重复创建爆炸动画
    const destroyedBlocks = new Set();

    // 存储发现的TNT方块位置，用于后续连锁引爆
    const chainTNTBlocks = [];

    // 设置爆炸球体的最大半径
    const explosionRadius = 3.5; // 稍微比原来的3格更大一点

    // 遍历爆炸范围内的所有方块（仍使用立方体范围来遍历，但应用球形检测）
    for (let dx = -Math.ceil(explosionRadius); dx <= Math.ceil(explosionRadius); dx++) {
        for (let dy = -Math.ceil(explosionRadius); dy <= Math.ceil(explosionRadius); dy++) {
            for (let dz = -Math.ceil(explosionRadius); dz <= Math.ceil(explosionRadius); dz++) {
                const blockX = x + dx;
                const blockY = y + dy;
                const blockZ = z + dz;

                // 检查是否在世界范围内
                if (blockX >= 0 && blockX < worldSize &&
                    blockY >= 0 && blockY < worldSize &&
                    blockZ >= 0 && blockZ < worldSize) {

                    // 跳过TNT本身的位置
                    if (dx === 0 && dy === 0 && dz === 0) continue;

                    // 计算到爆炸中心的距离
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    // 添加一些随机性，使爆炸边缘不那么规则 (0.9-1.1之间的随机系数)
                    const randomFactor = 0.9 + Math.random() * 0.2;
                    const effectiveRadius = explosionRadius * randomFactor;

                    // 只有在球体范围内的方块才会被爆炸影响
                    if (distance <= effectiveRadius) {
                        // 如果是石头方块，则不移除（免疫TNT）
                        if (world[blockX][blockY][blockZ] === blockTypes.stone) {
                            continue;
                        }

                        // 如果不是空气，执行射线检测
                        if (world[blockX][blockY][blockZ] !== blockTypes.air) {
                            // 计算方块中心
                            const blockPosition = new THREE.Vector3(
                                blockX + 0.5,
                                blockY + 0.5,
                                blockZ + 0.5
                            );

                            // 方向向量：从TNT指向目标方块
                            const direction = new THREE.Vector3().subVectors(blockPosition, tntPosition).normalize();

                            // 创建射线
                            const raycaster = new THREE.Raycaster(tntPosition, direction);

                            // 查找可能阻挡的方块
                            const rayDistance = tntPosition.distanceTo(blockPosition);
                            const intersects = raycaster.intersectObjects(blockReferences);

                            let blocked = false;

                            // 检查是否被石头阻挡
                            for (let i = 0; i < intersects.length; i++) {
                                // 如果在到达目标方块前碰到石头，则被阻挡
                                if (intersects[i].distance < rayDistance &&
                                    intersects[i].object.type === blockTypes.stone) {
                                    blocked = true;
                                    break;
                                }
                            }

                            // 如果没有被石头阻挡，则移除方块
                            if (!blocked) {
                                // 检查当前方块是否为TNT，如果是则记录位置稍后引爆
                                if (world[blockX][blockY][blockZ] === blockTypes.tnt) {
                                    // 将此TNT添加到连锁引爆列表
                                    chainTNTBlocks.push({ x: blockX, y: blockY, z: blockZ });

                                    // 查找这个TNT方块对象，以清除其可能存在的定时器
                                    const tntBlockObj = blockReferences.find(block =>
                                        block.blockX === blockX && block.blockY === blockY && block.blockZ === blockZ && block.type === blockTypes.tnt
                                    );

                                    // 如果找到了这个TNT方块对象且它有正在运行的定时器，则清理定时器
                                    if (tntBlockObj && tntTimers[tntBlockObj.uuid]) {
                                        // 清除闪烁定时器
                                        clearInterval(tntTimers[tntBlockObj.uuid].highlightInterval);
                                        // 清除爆炸定时器
                                        clearTimeout(tntTimers[tntBlockObj.uuid].explodeTimeout);
                                        // 从定时器存储中删除
                                        delete tntTimers[tntBlockObj.uuid];
                                        console.log(`清理了被波及TNT的定时器: (${blockX}, ${blockY}, ${blockZ})`);
                                    }
                                }

                                // 创建方块碎片
                                const blockType = world[blockX][blockY][blockZ];
                                createBlockDebris(blockX, blockY, blockZ, blockType);

                                // 记录已销毁方块位置
                                destroyedBlocks.add(`${blockX},${blockY},${blockZ}`);

                                world[blockX][blockY][blockZ] = blockTypes.air;
                                // 移除对应的方块对象
                                const blockIndex = blockReferences.findIndex(block =>
                                    block.blockX === blockX && block.blockY === blockY && block.blockZ === blockZ
                                );
                                if (blockIndex !== -1) {
                                    scene.remove(blockReferences[blockIndex]);
                                    blockReferences.splice(blockIndex, 1);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 引爆连锁TNT，添加随机延迟使爆炸更自然
    if (chainTNTBlocks.length > 0) {
        chainTNTBlocks.forEach((tntBlock, index) => {
            // 随机延迟200-600毫秒，使连锁爆炸更加生动
            const delay = 50 + Math.random() * 40;
            setTimeout(() => {
                console.log(`连锁引爆TNT: (${tntBlock.x}, ${tntBlock.y}, ${tntBlock.z})`);
                explodeTNT(tntBlock.x, tntBlock.y, tntBlock.z);
            }, delay);
        });
    }
}

// 修正startTNTTimer函数确保定时器正确工作
function startTNTTimer(block) {
    console.log("TNT激活！");

    // 保存原始材质（数组）
    block.originalMaterials = block.material.map(mat => mat.clone());

    // 创建高亮材质数组
    const highlightMaterials = block.material.map(mat => {
        const highlightMat = mat.clone();
        if (highlightMat.emissive) {
            highlightMat.emissive.set(0xff0000); // 改为红色更醒目
            highlightMat.emissiveIntensity = 0.5; // 提高亮度
        }
        return highlightMat;
    });

    // 闪烁效果
    let isHighlighted = false;
    const highlightInterval = setInterval(() => {
        if (isHighlighted) {
            block.material = block.originalMaterials;
        } else {
            block.material = highlightMaterials;
        }
        isHighlighted = !isHighlighted;
    }, 200);

    // 倒计时3秒后爆炸
    const explodeTimeout = setTimeout(() => {
        console.log("TNT爆炸！");
        clearInterval(highlightInterval);

        // 爆炸之前将其移除
        world[block.blockX][block.blockY][block.blockZ] = blockTypes.air;

        // 执行爆炸效果
        explodeTNT(block.blockX, block.blockY, block.blockZ);

        // 从场景中移除TNT方块
        scene.remove(block);
        const index = blockReferences.indexOf(block);
        if (index > -1) {
            blockReferences.splice(index, 1);
        }

        // 清理定时器引用
        if (tntTimers[block.uuid]) {
            delete tntTimers[block.uuid];
        }
    }, 3000);

    // 存储定时器引用以便清理
    tntTimers[block.uuid] = {
        highlightInterval: highlightInterval,
        explodeTimeout: explodeTimeout
    };
}

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
        highlightBlock();
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
