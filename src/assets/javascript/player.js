// 导入必要的模块
import { updateInventoryUI, updateHeldItem } from './inventory.js';
import { mapBlockUVs, updateFaceUVs, createAnimalTexture } from './utils.js';

// 玩家对象工厂函数
export function createPlayer(config, initialPosition) {
    return {
        position: initialPosition,
        rotation: new THREE.Vector2(0, 0),
        speed: config.gameConfig.defaultUserMoveSpeed,
        jumpSpeed: config.gameConfig.defaultUserJumpScale,
        isJumping: false,
        gravity: 0.005,
        velocity: new THREE.Vector3(0, 0, 0)
    };
}

// 角色动画参数
export const characterAnimation = {
    animationTime: 0,
    walkingSpeed: 0.15,
    maxSwingAngle: Math.PI / 4, // 最大摆动角度(45度)
    isWalking: false,
    lastPosition: new THREE.Vector3()
};

// 创建角色模型
export function createCharacter(characterGroup, textureLoader) {
    const character = {
        group: characterGroup,
        head: null,
        body: null,
        leftArm: null,
        rightArm: null,
        leftLeg: null,
        rightLeg: null
    };

    // 创建材质 - 使用标准64x64的Minecraft皮肤
    const skinTexture = textureLoader.load('assets/images/steve-classic.png');
    skinTexture.magFilter = THREE.NearestFilter; // 像素风格，防止模糊
    const skinMaterial = new THREE.MeshPhongMaterial({
        map: skinTexture,
        color: 0xffffff,
        transparent: true,
        alphaTest: 0.5 // 处理透明部分
    });

    // 创建头部 (1x1x1)
    const headGeometry = new THREE.BoxGeometry(1, 1, 1);
    // 设置头部的UV映射 - 修正V坐标顺序
    mapBlockUVs(headGeometry, {
        top: [8 / 64, 1 - 0 / 64, 16 / 64, 1 - 8 / 64],      // 头顶
        bottom: [16 / 64, 1 - 0 / 64, 24 / 64, 1 - 8 / 64],  // 头底
        front: [8 / 64, 1 - 8 / 64, 16 / 64, 1 - 16 / 64],   // 脸
        back: [24 / 64, 1 - 8 / 64, 32 / 64, 1 - 16 / 64],   // 后脑勺
        right: [0 / 64, 1 - 8 / 64, 8 / 64, 1 - 16 / 64],    // 右侧
        left: [16 / 64, 1 - 8 / 64, 24 / 64, 1 - 16 / 64]    // 左侧
    });
    const head = new THREE.Mesh(headGeometry, skinMaterial.clone());
    head.position.set(0, 2.5, 0); // 头顶位置
    character.head = head;
    character.group.add(head);

    // 创建躯干 (1x1.5x0.5)
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
    // 设置躯干的UV映射 - 修正V坐标顺序
    mapBlockUVs(bodyGeometry, {
        top: [20 / 64, 1 - 16 / 64, 28 / 64, 1 - 20 / 64],    // 上部
        bottom: [28 / 64, 1 - 16 / 64, 36 / 64, 1 - 20 / 64], // 下部
        front: [20 / 64, 1 - 20 / 64, 28 / 64, 1 - 32 / 64],  // 正面
        back: [32 / 64, 1 - 20 / 64, 40 / 64, 1 - 32 / 64],   // 背面
        right: [16 / 64, 1 - 20 / 64, 20 / 64, 1 - 32 / 64],  // 右侧
        left: [28 / 64, 1 - 20 / 64, 32 / 64, 1 - 32 / 64]    // 左侧
    });
    const body = new THREE.Mesh(bodyGeometry, skinMaterial.clone());
    body.position.set(0, 1.25, 0);
    character.body = body;
    character.group.add(body);

    // 创建左手臂 (0.5x1.5x0.5)
    const leftArmGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    leftArmGeometry.translate(0, -0.75, 0); // 将几何体原点移到顶部
    // 设置左手臂的UV映射 - 修正V坐标顺序
    mapBlockUVs(leftArmGeometry, {
        top: [44 / 64, 1 - 16 / 64, 48 / 64, 1 - 20 / 64],    // 上部
        bottom: [48 / 64, 1 - 16 / 64, 52 / 64, 1 - 20 / 64], // 下部
        front: [44 / 64, 1 - 20 / 64, 48 / 64, 1 - 32 / 64],  // 正面
        back: [52 / 64, 1 - 20 / 64, 56 / 64, 1 - 32 / 64],   // 背面
        right: [40 / 64, 1 - 20 / 64, 44 / 64, 1 - 32 / 64],  // 右侧
        left: [48 / 64, 1 - 20 / 64, 52 / 64, 1 - 32 / 64]    // 左侧
    });
    const leftArm = new THREE.Mesh(leftArmGeometry, skinMaterial.clone());
    leftArm.position.set(-0.75, 2, 0);
    character.leftArm = leftArm;
    character.group.add(leftArm);

    // 创建右手臂 (0.5x1.5x0.5)
    const rightArmGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    rightArmGeometry.translate(0, -0.75, 0); // 将几何体原点移到顶部
    // 设置右手臂的UV映射 - 修正V坐标顺序
    mapBlockUVs(rightArmGeometry, {
        top: [44 / 64, 1 - 16 / 64, 48 / 64, 1 - 20 / 64],    // 上部
        bottom: [48 / 64, 1 - 16 / 64, 52 / 64, 1 - 20 / 64], // 下部
        front: [44 / 64, 1 - 20 / 64, 48 / 64, 1 - 32 / 64],  // 正面
        back: [52 / 64, 1 - 20 / 64, 56 / 64, 1 - 32 / 64],   // 背面
        right: [40 / 64, 1 - 20 / 64, 44 / 64, 1 - 32 / 64],  // 右侧
        left: [48 / 64, 1 - 20 / 64, 52 / 64, 1 - 32 / 64]    // 左侧
    });
    const rightArm = new THREE.Mesh(rightArmGeometry, skinMaterial.clone());
    rightArm.position.set(0.75, 2, 0);
    character.rightArm = rightArm;
    character.group.add(rightArm);

    // 创建左腿 (0.5x1.5x0.5)
    const leftLegGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    leftLegGeometry.translate(0, -0.75, 0); // 将几何体原点移到顶部
    // 设置左腿的UV映射 - 修正V坐标顺序
    mapBlockUVs(leftLegGeometry, {
        top: [4 / 64, 1 - 16 / 64, 8 / 64, 1 - 20 / 64],     // 上部
        bottom: [8 / 64, 1 - 16 / 64, 12 / 64, 1 - 20 / 64],  // 下部
        front: [4 / 64, 1 - 20 / 64, 8 / 64, 1 - 32 / 64],    // 正面
        back: [12 / 64, 1 - 20 / 64, 16 / 64, 1 - 32 / 64],   // 背面
        right: [0 / 64, 1 - 20 / 64, 4 / 64, 1 - 32 / 64],    // 右侧
        left: [8 / 64, 1 - 20 / 64, 12 / 64, 1 - 32 / 64]     // 左侧
    });
    const leftLeg = new THREE.Mesh(leftLegGeometry, skinMaterial.clone());
    leftLeg.position.set(-0.25, 0.75, 0);
    character.leftLeg = leftLeg;
    character.group.add(leftLeg);

    // 创建右腿 (0.5x1.5x0.5)
    const rightLegGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    rightLegGeometry.translate(0, -0.75, 0); // 将几何体原点移到顶部
    // 设置右腿的UV映射 - 修正V坐标顺序
    mapBlockUVs(rightLegGeometry, {
        top: [4 / 64, 1 - 16 / 64, 8 / 64, 1 - 20 / 64],     // 上部
        bottom: [8 / 64, 1 - 16 / 64, 12 / 64, 1 - 20 / 64],  // 下部
        front: [4 / 64, 1 - 20 / 64, 8 / 64, 1 - 32 / 64],    // 正面
        back: [12 / 64, 1 - 20 / 64, 16 / 64, 1 - 32 / 64],   // 背面
        right: [0 / 64, 1 - 20 / 64, 4 / 64, 1 - 32 / 64],    // 右侧
        left: [8 / 64, 1 - 20 / 64, 12 / 64, 1 - 32 / 64]     // 左侧
    });
    const rightLeg = new THREE.Mesh(rightLegGeometry, skinMaterial.clone());
    rightLeg.position.set(0.25, 0.75, 0);
    character.rightLeg = rightLeg;
    character.group.add(rightLeg);

    return character;
}

// 实现角色动画
export function updateCharacterAnimation(character, characterAnimation) {
    if (!character) return;

    if (characterAnimation.isWalking) {
        // 角色移动时更新动画计时器
        characterAnimation.animationTime += characterAnimation.walkingSpeed;

        // 计算四肢摆动角度(使用正弦函数创建摆动效果)
        const swingAngle = Math.sin(characterAnimation.animationTime) * characterAnimation.maxSwingAngle;

        // 更新手臂摆动
        if (character.leftArm && character.rightArm) {
            // 左右手臂相反方向摆动
            character.leftArm.rotation.x = swingAngle;
            character.rightArm.rotation.x = -swingAngle;
        }

        // 更新腿部摆动
        if (character.leftLeg && character.rightLeg) {
            // 左右腿相反方向摆动，与手臂也相反
            character.leftLeg.rotation.x = -swingAngle;
            character.rightLeg.rotation.x = swingAngle;
        }
    } else {
        // 角色静止时慢慢恢复到默认姿势
        characterAnimation.animationTime = 0;

        // 重置所有四肢旋转
        if (character.leftArm) character.leftArm.rotation.x = 0;
        if (character.rightArm) character.rightArm.rotation.x = 0;
        if (character.leftLeg) character.leftLeg.rotation.x = 0;
        if (character.rightLeg) character.rightLeg.rotation.x = 0;
    }
}

// 设置角色部件透明度
export function setCharacterPartsOpacity(character, isFirstPerson) {
    if (!character) return;

    // 在第一人称视角下
    if (isFirstPerson) {
        // 将躯干和腿部完全隐藏
        if (character.body) {
            character.body.visible = false;
        }
        if (character.leftLeg) {
            character.leftLeg.visible = false;
        }
        if (character.rightLeg) {
            character.rightLeg.visible = false;
        }
        // 头部也完全隐藏
        if (character.head) {
            character.head.visible = false;
        }
    } else {
        // 在俯视视角下恢复所有部件的可见性
        if (character.body) {
            character.body.visible = true;
        }
        if (character.leftLeg) {
            character.leftLeg.visible = true;
        }
        if (character.rightLeg) {
            character.rightLeg.visible = true;
        }
        // 恢复头部的可见性
        if (character.head) {
            character.head.visible = true;
        }
    }
}

// 寻找安全的生成位置
export function findSafeSpawnPosition(world, worldSize) {
    const spawnX = 5;
    const spawnZ = 5;

    // 找到该坐标上最高的非空气方块
    let highestY = 0;
    for (let y = worldSize - 1; y >= 0; y--) {
        if (world[spawnX][y][spawnZ] !== 0) { // 假设0是空气方块
            highestY = y + 1; // 站在方块上方
            break;
        }
    }

    // 确保至少有1格高度安全位置
    highestY = Math.max(highestY, 1);

    console.log(`安全生成点: (${spawnX}, ${highestY}, ${spawnZ})`);
    return new THREE.Vector3(spawnX + 0.5, highestY + 0.5, spawnZ + 0.5);
}

// 碰撞检测
export function checkCollision(world, worldSize, position, direction, checkClimb = false) {
    const x = Math.floor(position.x + direction.x * 0.5);
    const y = Math.floor(position.y + direction.y * 0.5);
    const z = Math.floor(position.z + direction.z * 0.5);

    if (x >= 0 && x < worldSize && y >= 0 && y < worldSize && z >= 0 && z < worldSize) {
        // 如果不需要攀爬检测，直接返回是否有碰撞
        if (!checkClimb) {
            return world[x][y][z] !== 0; // 假设0是空气方块
        }

        // 攀爬检测: 检查前方是否有一格高度的障碍物
        if (world[x][y][z] !== 0) {
            // 检查障碍物上方是否为空气
            if (y + 1 < worldSize && world[x][y + 1][z] === 0) {
                // 检查障碍物上方再上一格也是空气(确保有足够头部空间)
                if (y + 2 < worldSize && world[x][y + 2][z] === 0) {
                    // 检查障碍物上方是否有空间可站立
                    return { canClimb: true, climbHeight: y + 1 };
                }
            }

            // 检查是否超过2格高度
            if (y + 1 < worldSize && world[x][y + 1][z] !== 0 &&
                y + 2 < worldSize && world[x][y + 2][z] !== 0) {
                return { canClimb: false, tooHigh: true };
            }

            // 普通碰撞
            return { canClimb: false, tooHigh: false };
        }

        return false; // 没有碰撞
    }
    return { canClimb: false, tooHigh: false }; // 边界碰撞
}

// 更新相机和角色位置
export function updateCamera(player, character, characterGroup, characterAnimation, camera, world, worldSize, keys, animals = null) {
    // 重力
    if (!checkCollision(world, worldSize, player.position, new THREE.Vector3(0, -1, 0))) {
        player.velocity.y -= player.gravity;
    } else {
        player.velocity.y = 0;
        player.isJumping = false;
    }

    // 跳跃
    if (keys[' '] && !player.isJumping && !checkCollision(world, worldSize, player.position, new THREE.Vector3(0, -0.1, 0))) {
        player.velocity.y = player.jumpSpeed;
        player.isJumping = true;
    }

    // 移动
    const moveSpeed = player.speed;
    let moveX = 0;
    let moveZ = 0;

    if (keys['w']) moveZ -= 1;
    if (keys['s']) moveZ += 1;
    if (keys['a']) moveX -= 1;
    if (keys['d']) moveX += 1;

    const direction = new THREE.Vector3(moveX, 0, moveZ).normalize();
    const rotateMatrix = new THREE.Matrix4().makeRotationY(player.rotation.y);
    direction.applyMatrix4(rotateMatrix);

    // 检测前方碰撞并支持攀爬
    const collisionResult = checkCollision(world, worldSize, player.position, direction, true);
    
    // 计算期望移动的新位置
    const newPosX = player.position.x + direction.x * moveSpeed;
    const newPosZ = player.position.z + direction.z * moveSpeed;
    
    // 检查与羊驼的碰撞
    let llamaCollision = false;
    if (animals && animals.llamas) {
        for (const llama of animals.llamas) {
            // 计算玩家与羊驼之间的水平距离
            const horizontalDistance = Math.sqrt(
                Math.pow(newPosX - llama.position.x, 2) + 
                Math.pow(newPosZ - llama.position.z, 2)
            );
            
            // 计算玩家与羊驼之间的垂直距离
            const verticalDistance = player.position.y - llama.position.y;
            
            // 羊驼的估计高度 (通常为1.8个方块)
            const llamaHeight = 1.8;
            
            // 如果水平距离小于1.5个方块，且玩家底部低于羊驼顶部，才认为碰撞
            if (horizontalDistance < 1.5 && verticalDistance < llamaHeight) {
                llamaCollision = true;
                break;
            }
        }
    }

    if (collisionResult === false && !llamaCollision) {
        // 没有碰撞，正常移动
        player.velocity.x = direction.x * moveSpeed;
        player.velocity.z = direction.z * moveSpeed;
    } else if (collisionResult && collisionResult.canClimb === true && !llamaCollision) {
        // 可以攀爬，调整Y轴位置并继续移动
        console.log("自动攀爬到方块上方");
        player.position.y = collisionResult.climbHeight + 0.5; // 站在方块上面
        player.velocity.x = direction.x * moveSpeed;
        player.velocity.z = direction.z * moveSpeed;
    } else {
        // 无法攀爬或碰到羊驼，停止水平移动但仍允许跳跃
        if (collisionResult && collisionResult.tooHigh) {
            console.log("障碍物太高，无法攀爬");
        } else if (llamaCollision) {
            console.log("与羊驼发生碰撞，无法通过，但可以跳跃");
        }
        player.velocity.x = 0;
        player.velocity.z = 0;
        // 注意：这里不影响player.velocity.y，保持跳跃能力
    }

    // 更新位置
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;
    player.position.z += player.velocity.z;

    // 更新角色组位置
    characterGroup.position.copy(player.position);

    // 旋转角色与相机相同的方向
    characterGroup.rotation.y = player.rotation.y;

    // 使用四元数更新相机方向
    const quaternion = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(
            player.rotation.x,
            player.rotation.y,
            0,
            'YXZ' // 保持旋转顺序一致
        ));
    camera.quaternion.copy(quaternion);

    // 相机位置放在角色头部
    const headWorldPosition = new THREE.Vector3();
    if (character && character.head) {
        // 获取头部在世界坐标系中的位置
        character.head.getWorldPosition(headWorldPosition);
        // 将相机放在头部位置
        camera.position.copy(headWorldPosition);
    } else {
        // 如果角色未创建，保持原有逻辑
        camera.position.copy(player.position);
    }

    // 检测角色是否在移动
    const currentPosition = new THREE.Vector3().copy(player.position);
    const moveDistance = currentPosition.distanceTo(characterAnimation.lastPosition);
    characterAnimation.isWalking = moveDistance > 0.01;

    // 更新角色动画
    updateCharacterAnimation(character, characterAnimation);

    // 保存当前位置用于下一帧检测
    characterAnimation.lastPosition.copy(currentPosition);
}
