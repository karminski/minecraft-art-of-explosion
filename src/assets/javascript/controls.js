// 添加从player.js导入所需函数
import { setCharacterPartsOpacity } from './player.js';
import { updateInventoryUI } from './inventory.js';
import { breakBlock, placeBlock } from './blocks.js';

// 初始化控制状态对象
function initControlsState() {
    return {
        mouseX: 0,
        mouseY: 0,
        isMouseDown: false,
        isRightMouseDown: false,
        keys: {},
        mouseLock: false,
        isBreakingBlock: false,
        isPlacingBlock: false,
        lastRaycastTime: 0,
        raycastInterval: 100,
        blockActionCooldown: 250
    };
}

// 设置鼠标控制
function setupMouseControls(controlsState, document) {
    document.addEventListener('mousemove', (event) => {
        controlsState.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        controlsState.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    document.addEventListener('mousedown', (event) => {
        if (event.button === 0) {
            controlsState.isMouseDown = true;
        } else if (event.button === 2) {
            controlsState.isRightMouseDown = true;
        }
    });

    document.addEventListener('mouseup', (event) => {
        if (event.button === 0) {
            controlsState.isMouseDown = false;
        } else if (event.button === 2) {
            controlsState.isRightMouseDown = false;
        }
    });
}

// 设置键盘控制
function setupKeyboardControls(controlsState, document) {
    document.addEventListener('keydown', (event) => {
        controlsState.keys[event.key] = true;
    });
    
    document.addEventListener('keyup', (event) => {
        controlsState.keys[event.key] = false;
    });
}

// 设置鼠标锁定
function setupMouseLock(controlsState, document) {
    // 创建一个变量追踪是否正在请求锁定，防止重复请求
    let isRequestingLock = false;
    
    // 请求指针锁定的函数
    const requestLock = () => {
        if (!controlsState.mouseLock && !isRequestingLock) {
            isRequestingLock = true;
            
            document.documentElement.requestPointerLock()
                .then(() => {
                    // 锁定成功
                    controlsState.mouseLock = true;
                    console.log("指针锁定成功");
                })
                .catch(error => {
                    // 锁定失败，记录错误但不阻止游戏
                    console.warn("指针锁定失败:", error);
                })
                .finally(() => {
                    isRequestingLock = false;
                });
        }
    };
    
    // 监听点击事件进行锁定
    document.addEventListener('click', requestLock);
    
    // 监听键盘事件 (M键) 进行锁定
    document.addEventListener('keydown', (event) => {
        if (event.key === 'm' && !controlsState.mouseLock) {
            requestLock();
        }
    });

    // 监听锁定状态变化
    document.addEventListener('pointerlockchange', () => {
        // 直接根据document.pointerLockElement更新状态
        controlsState.mouseLock = document.pointerLockElement !== null;
        
        // 如果锁定被解除，下次点击时重新锁定
        if (!controlsState.mouseLock) {
            console.log("指针锁定已解除");
        }
    });
    
    // 监听锁定错误
    document.addEventListener('pointerlockerror', (event) => {
        console.error("指针锁定错误:", event);
        isRequestingLock = false;
        controlsState.mouseLock = false;
    });
}

// 处理第一人称视角的鼠标旋转
function handleFirstPersonMouseLook(controlsState, player, camera, event) {
    if (controlsState.mouseLock) {
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
}

// 设置高级鼠标控制
function setupAdvancedMouseControls(controlsState, player, camera, document) {
    document.addEventListener('mousemove', (event) => {
        handleFirstPersonMouseLook(controlsState, player, camera, event);
    });
}

// 设置物品快捷栏选择
function setupInventorySelection(inventory, character, blockTypes, textures, materials, document) {
    document.addEventListener('keydown', (event) => {
        if (event.key >= '1' && event.key <= '8') {
            const index = parseInt(event.key) - 1;
            if (index >= 0 && index < inventory.items.length) {
                inventory.selectedIndex = index;
                updateInventoryUI(character, blockTypes, textures, materials);
            }
        }
    });
}

// 设置视角切换控制
function setupCameraToggle(character, camera, overviewCamera, event) {
    if (event.ctrlKey) {
        if (event.key === '2') {
            // 切换到第一人称视角（角色头部摄像机）
            console.log('切换到第一人称视角');

            // 设置角色部件透明度
            setCharacterPartsOpacity(character, true);
            
            return camera;

        } else if (event.key === '3') {
            // 切换到俯视摄像机
            console.log('切换到俯视视角');

            // 恢复角色部件可见性
            setCharacterPartsOpacity(character, false);
            
            return overviewCamera;
        }
    }
    
    // 如果没有进行切换，返回null表示保持当前状态
    return null;
}

// 处理方块破坏
function breakBlockWithDebounce(controlsState, scene, world, blockReferences, camera, inventory, blockTypes, updateInventoryUI, character) {
    if (!controlsState.isBreakingBlock) {
        controlsState.isBreakingBlock = true;
        breakBlock(scene, world, blockReferences, camera, inventory, blockTypes, updateInventoryUI, character);
        setTimeout(() => {
            controlsState.isBreakingBlock = false;
        }, controlsState.blockActionCooldown);
    }
}

// 处理方块放置
function placeBlockWithDebounce(controlsState, scene, world, blockReferences, camera, inventory, blockTypes, worldSize, player, createBlock, updateInventoryUI, character, textures, materials) {
    if (!controlsState.isPlacingBlock) {
        controlsState.isPlacingBlock = true;
        placeBlock(scene, world, blockReferences, camera, inventory, blockTypes, worldSize, player, 
                  (scene, x, y, z, type, materials, textures, blockReferences, inventory) => 
                      createBlock(scene, x, y, z, type, materials, textures, blockReferences, inventory), 
                  updateInventoryUI, character, textures, materials);
        setTimeout(() => {
            controlsState.isPlacingBlock = false;
        }, controlsState.blockActionCooldown);
    }
}

// 处理鼠标操作（破坏/放置方块）
function handleMouseActions(controlsState, scene, world, blockReferences, camera, inventory, blockTypes, worldSize, player, createBlock, updateInventoryUI, character, textures, materials) {
    if (controlsState.isMouseDown) {
        // 根据当前选择的道具决定左键行为
        if (inventory.selectedIndex === 0) {
            // 当选择矿镐时，左键执行挖掘方块功能
            breakBlockWithDebounce(controlsState, scene, world, blockReferences, camera, inventory, blockTypes, updateInventoryUI, character);
        } else {
            // 选择其他道具时，左键执行放置方块功能
            placeBlockWithDebounce(controlsState, scene, world, blockReferences, camera, inventory, blockTypes, worldSize, player, createBlock, updateInventoryUI, character, textures, materials);
        }
    }
}

// 初始化页面加载时的鼠标锁定 - 简化此函数，避免与上面的setupMouseLock冲突
function initPageLoadMouseLock(window) {
    // 不再自动尝试锁定鼠标，仅添加提示信息
    console.log("游戏已加载，点击屏幕以锁定鼠标并开始游戏");
    
    // 移除这部分代码，因为已经在setupMouseLock中处理了点击锁定
    // const canvas = document.querySelector('canvas');
    // if (canvas) {
    //     canvas.addEventListener('click', () => {
    //         document.documentElement.requestPointerLock();
    //     });
    // }
}

// 导出所有控制函数
export {
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
};
