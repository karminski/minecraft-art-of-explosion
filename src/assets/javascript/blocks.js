// 方块类型和纹理
const blockTypes = {
    air: 0,
    grass: 1,
    dirt: 2,
    stone: 3,
    tree: 4,
    leaves: 5,
    tnt: 6,
    bedrock: 7  // 添加基岩类型
};

// 存储TNT定时器
const tntTimers = {};

// 初始化块系统
function initBlockSystem(scene, textureLoader) {
    // 加载纹理
    const textures = {
        grass: textureLoader.load('assets/images/grass.png'),
        dirt: textureLoader.load('assets/images/dirt.png'),
        stone: textureLoader.load('assets/images/stone.png'),
        tree: textureLoader.load('assets/images/tree.png'),
        leaves: textureLoader.load('assets/images/leaves.png'),
        tntTop: textureLoader.load('assets/images/tnt-top.png'),
        tntSide: textureLoader.load('assets/images/tnt-side.jpg'),
        tntBottom: textureLoader.load('assets/images/tnt-bottom.png'),
        bedrock: textureLoader.load('assets/images/bedrock.png')  // 添加基岩纹理
    };

    // 预加载爆炸动画序列帧
    const explosionTextures = [];
    for (let i = 1; i <= 12; i++) {
        const textureNum = i.toString().padStart(2, '0');
        explosionTextures.push(textureLoader.load(`assets/images/explode-${textureNum}.png`));
    }

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
        }),
        bedrock: new THREE.MeshPhongMaterial({ map: textures.bedrock, color: 0x333333 })  // 添加基岩材质
    };

    return { textures, materials, explosionTextures };
}

// 创建方块
function createBlock(scene, x, y, z, type, materials, textures, blockReferences, inventory) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    if (type === blockTypes.tnt) {
        // 创建TNT的六面材质
        const tntMaterials = [
            new THREE.MeshPhongMaterial({ map: textures.tntSide }), // 右侧
            new THREE.MeshPhongMaterial({ map: textures.tntSide }), // 左侧
            new THREE.MeshPhongMaterial({ map: textures.tntTop }), // 顶部
            new THREE.MeshPhongMaterial({ map: textures.tntBottom }), // 底部
            new THREE.MeshPhongMaterial({ map: textures.tntSide }), // 前侧
            new THREE.MeshPhongMaterial({ map: textures.tntSide })  // 后侧
        ];

        const tntMesh = new THREE.Mesh(geometry, tntMaterials);
        tntMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        tntMesh.type = type;
        tntMesh.blockX = x;
        tntMesh.blockY = y;
        tntMesh.blockZ = z;
        tntMesh.originalMaterial = tntMaterials;
        scene.add(tntMesh);

        // 保存引用到数组
        blockReferences.push(tntMesh);

        // 激活TNT (如果是通过放置操作创建的)
        if (inventory && inventory.selectedIndex === 1) {
            startTNTTimer(tntMesh, scene, blockReferences);
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

// 高亮方块
function highlightBlock(blockReferences, camera) {
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

// 破坏方块
function breakBlock(scene, world, blockReferences, camera, inventory, blockTypes, updateInventoryUI, character) {
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

        if (x >= 0 && x < world.length && y >= 0 && y < world.length && z >= 0 && z < world.length) {
            // 检查是否为基岩，如果是则不能破坏
            if (block.type === blockTypes.bedrock) {
                return; // 基岩不可破坏，直接返回
            }

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

                updateInventoryUI(character, blockTypes, null, null);
            }
        }
    }
}

// 放置方块
function placeBlock(scene, world, blockReferences, camera, inventory, blockTypes, worldSize, player, createBlock, updateInventoryUI, character, textures, materials) {
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
                createBlock(scene, x, y, z, blockTypeToPlace, materials, textures, blockReferences, inventory);

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
}

// 创建爆炸动画
function createExplosionAnimation(scene, position, explosionTextures, scale = 1) {
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

// 为销毁的方块创建爆炸碎片
function createBlockDebris(scene, x, y, z, blockType, materials, blockTypes, explosionDebris) {
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

// 激活TNT定时器
function startTNTTimer(block, scene, blockReferences) {
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

        // 获取TNT坐标
        const x = block.blockX;
        const y = block.blockY;
        const z = block.blockZ;

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

        // 使用自定义事件触发爆炸
        const tntEvent = new CustomEvent('tnt-explosion', {
            detail: { x: x, y: y, z: z }
        });
        document.dispatchEvent(tntEvent);
        
        // 作为备份方案，仍然尝试调用全局函数
        if (window.handleTNTExplosion) {
            window.handleTNTExplosion(x, y, z);
        }
    }, 3000);

    // 存储定时器引用以便清理
    tntTimers[block.uuid] = {
        highlightInterval: highlightInterval,
        explodeTimeout: explodeTimeout
    };
}

// TNT爆炸效果
function explodeTNT(scene, x, y, z, world, blockReferences, worldSize, blockTypes, explosionTextures, materials, explosionDebris, animals, inventory, updateInventoryUI, character, textures) {
    // 爆炸之前将其移除
    world[x][y][z] = blockTypes.air;

    // 创建主爆炸动画，大小增加
    const mainExplosionPos = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
    const mainExplosionSize = 3.0 + Math.random() * 3.0; // 增大到3.0-6.0之间随机值
    createExplosionAnimation(scene, mainExplosionPos, explosionTextures, mainExplosionSize);

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
            createExplosionAnimation(scene, extraExplosionPos, explosionTextures, scale);
        }, Math.random() * 200); // 延迟相同
    }

    // 检查爆炸范围内的动物
    if (animals && animals.llamas && animals.llamas.length > 0) {
        // 记录被炸到的动物索引
        const explodedAnimals = [];
        // 设置爆炸检测半径（与方块爆炸半径保持一致）
        const animalExplosionRadius = 3.5;
        
        // 计算爆炸中心点
        const explosionCenter = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
        
        // 检查每只羊驼是否在爆炸范围内
        animals.llamas.forEach((llama, index) => {
            // 计算羊驼到爆炸中心的距离
            const distance = llama.position.distanceTo(explosionCenter);
            
            // 如果距离小于爆炸半径，则认为羊驼被炸到
            if (distance <= animalExplosionRadius) {
                // 将索引添加到被炸动物列表中（倒序添加以便后续删除）
                explodedAnimals.unshift(index);
                
                // 在羊驼位置创建小爆炸特效
                createExplosionAnimation(scene, llama.position.clone(), explosionTextures, 1.5);
                
                // 从场景中移除羊驼
                scene.remove(llama);
                
                // 如果有道具库，则增加TNT数量
                if (inventory && inventory.items) {
                    // TNT通常在索引1的位置
                    inventory.items[1].count += 1;
                    
                    // 如果提供了更新UI的函数，则更新UI显示
                    if (typeof updateInventoryUI === 'function') {
                        // 这里需要传递正确的参数，不能直接调用updateInventoryUI()
                        // 添加debug日志
                        console.log("尝试更新物品栏UI，character参数:", character);
                        
                        // 检查character参数是否存在
                        if (character) {
                            updateInventoryUI(character, blockTypes, textures, materials);
                        } else {
                            console.warn("无法更新物品栏UI：character参数缺失");
                            // 尝试直接更新物品栏显示，而不处理手持物品
                            const slots = document.querySelectorAll('.inventory-slot');
                            slots.forEach((slot, index) => {
                                // 更新选中状态
                                slot.classList.remove('selected');
                                if (index === inventory.selectedIndex) {
                                    slot.classList.add('selected');
                                }
                                
                                // 清除旧的计数元素
                                const countElements = slot.getElementsByClassName('item-count');
                                while (countElements.length > 0) {
                                    slot.removeChild(countElements[0]);
                                }
                                
                                // 添加新的计数显示
                                const count = inventory.items[index].count;
                                if (count > 0) {
                                    const countElement = document.createElement('div');
                                    countElement.className = 'item-count';
                                    countElement.textContent = `x${count}`;
                                    slot.appendChild(countElement);
                                }
                            });
                        }
                    }
                }
            }
        });
        
        // 从动物列表中移除被炸掉的羊驼
        explodedAnimals.forEach(index => {
            animals.llamas.splice(index, 1);
        });
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
                        // 检查是否为基岩或石头，这些方块不受爆炸影响
                        if (world[blockX][blockY][blockZ] === blockTypes.stone ||
                            world[blockX][blockY][blockZ] === blockTypes.bedrock) {
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
                                createBlockDebris(scene, blockX, blockY, blockZ, blockType, materials, blockTypes, explosionDebris);

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
                explodeTNT(scene, tntBlock.x, tntBlock.y, tntBlock.z, world, blockReferences, worldSize, blockTypes, explosionTextures, materials, explosionDebris, animals, inventory, updateInventoryUI, character, textures);
            }, delay);
        });
    }
}

// 导出所有模块
export {
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
};
