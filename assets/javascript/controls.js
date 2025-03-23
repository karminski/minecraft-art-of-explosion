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
        blockActionCooldown: 250,
        isPaused: false
    };
}

// 设置鼠标控制
function setupMouseControls(controlsState, document) {
    // 创建命名的事件处理函数，以便后续可以移除
    const handleMouseMove = (event) => {
        controlsState.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        controlsState.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleMouseDown = (event) => {
        if (event.button === 0) {
            controlsState.isMouseDown = true;
        } else if (event.button === 2) {
            controlsState.isRightMouseDown = true;
        }
    };

    const handleMouseUp = (event) => {
        if (event.button === 0) {
            controlsState.isMouseDown = false;
        } else if (event.button === 2) {
            controlsState.isRightMouseDown = false;
        }
    };

    // 添加事件监听器
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    // 返回监听器引用，以便后续可以解除
    return {
        handleMouseMove,
        handleMouseDown,
        handleMouseUp
    };
}

// 解除鼠标控制相关的监听器
function tearDownMouseControls(document, listeners) {
    // 检查是否有传入监听器引用
    if (!listeners) {
        console.warn("无法解除鼠标控制监听器：未提供监听器引用");
        return;
    }
    
    // 解除鼠标移动事件监听器
    if (listeners.handleMouseMove) {
        document.removeEventListener('mousemove', listeners.handleMouseMove);
    }
    
    // 解除鼠标按下事件监听器
    if (listeners.handleMouseDown) {
        document.removeEventListener('mousedown', listeners.handleMouseDown);
    }
    
    // 解除鼠标释放事件监听器
    if (listeners.handleMouseUp) {
        document.removeEventListener('mouseup', listeners.handleMouseUp);
    }
    
    console.log("已解除所有鼠标控制相关监听器");
}

// 设置键盘控制
function setupKeyboardControls(controlsState, document) {
    // 创建命名的事件处理函数
    const handleKeyDown = (event) => {
        controlsState.keys[event.key] = true;
    };
    
    const handleKeyUp = (event) => {
        controlsState.keys[event.key] = false;
    };
    
    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 返回监听器引用
    return {
        handleKeyDown,
        handleKeyUp
    };
}

// 解除键盘控制相关的监听器
function tearDownKeyboardControls(document, listeners) {
    // 检查是否有传入监听器引用
    if (!listeners) {
        console.warn("无法解除键盘控制监听器：未提供监听器引用");
        return;
    }
    
    // 解除键盘按下事件监听器
    if (listeners.handleKeyDown) {
        document.removeEventListener('keydown', listeners.handleKeyDown);
    }
    
    // 解除键盘释放事件监听器
    if (listeners.handleKeyUp) {
        document.removeEventListener('keyup', listeners.handleKeyUp);
    }
    
    console.log("已解除所有键盘控制相关监听器");
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
    
    // 键盘锁定处理函数
    const handleKeyLock = (event) => {
        if (event.key === 'm' && !controlsState.mouseLock) {
            requestLock();
        }
    };
    
    // 锁定状态变化处理函数
    const handleLockChange = () => {
        // 直接根据document.pointerLockElement更新状态
        controlsState.mouseLock = document.pointerLockElement !== null;
        
        // 如果锁定被解除，下次点击时重新锁定
        if (!controlsState.mouseLock) {
            console.log("指针锁定已解除");
        }
    };
    
    // 锁定错误处理函数
    const handleLockError = (event) => {
        console.error("指针锁定错误:", event);
        isRequestingLock = false;
        controlsState.mouseLock = false;
    };
    
    // 监听点击事件进行锁定
    document.addEventListener('click', requestLock);
    
    // 监听键盘事件 (M键) 进行锁定
    document.addEventListener('keydown', handleKeyLock);

    // 监听锁定状态变化
    document.addEventListener('pointerlockchange', handleLockChange);
    
    // 监听锁定错误
    document.addEventListener('pointerlockerror', handleLockError);
    
    // 返回监听器引用，以便后续可以解除
    return {
        requestLock,
        handleKeyLock,
        handleLockChange,
        handleLockError
    };
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
    // 创建命名的事件处理函数，以便后续可以移除
    const handleMouseMove = (event) => {
        handleFirstPersonMouseLook(controlsState, player, camera, event);
    };
    
    // 添加事件监听器
    document.addEventListener('mousemove', handleMouseMove);
    
    // 返回监听器引用，以便后续可以解除
    return {
        handleMouseMove
    };
}

// 解除高级鼠标控制相关的监听器
function tearDownAdvancedMouseControls(document, listeners) {
    // 检查是否有传入监听器引用
    if (!listeners) {
        console.warn("无法解除高级鼠标控制监听器：未提供监听器引用");
        return;
    }
    
    // 解除鼠标移动事件监听器
    if (listeners.handleMouseMove) {
        document.removeEventListener('mousemove', listeners.handleMouseMove);
    }
    
    console.log("已解除所有高级鼠标控制相关监听器");
}

// 设置物品快捷栏选择
function setupInventorySelection(inventory, character, blockTypes, textures, materials, document) {
    document.addEventListener('keydown', (event) => {
        if (event.key >= '1' && event.key <= '8' && !event.ctrlKey) {
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



// 创建暂停界面
function createPauseOverlay() {
    const pauseOverlay = document.createElement('div');
    pauseOverlay.id = 'pause-overlay';
    pauseOverlay.style.position = 'absolute';
    pauseOverlay.style.top = '0';
    pauseOverlay.style.left = '0';
    pauseOverlay.style.width = '100%';
    pauseOverlay.style.height = '100%';
    pauseOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    pauseOverlay.style.display = 'none';
    pauseOverlay.style.justifyContent = 'center';
    pauseOverlay.style.alignItems = 'center';
    pauseOverlay.style.zIndex = '1000';
    pauseOverlay.style.fontSize = '3rem';
    pauseOverlay.style.color = 'white';
    pauseOverlay.style.fontFamily = 'Arial, sans-serif';
    pauseOverlay.innerHTML = '<div>游戏已暂停<br><span style="font-size: 1.5rem">按 P 键恢复</span></div>';
    document.body.appendChild(pauseOverlay);
    return pauseOverlay;
}

// 暂停/恢复切换函数 - 修改为使用controlsState
function togglePause(controlsState, pauseOverlay, animalSystem) {
    // 切换暂停状态
    controlsState.isPaused = !controlsState.isPaused;
    
    // 更新暂停界面显示
    pauseOverlay.style.display = controlsState.isPaused ? 'flex' : 'none';
    
    // 如果暂停，则暂停所有动物的动画
    if (animalSystem && animalSystem.animals) {
        // 设置所有羊驼的暂停状态
        if (animalSystem.animals.llamas) {
            animalSystem.animals.llamas.forEach(llama => {
                llama.pauseAnimation = controlsState.isPaused;
            });
        }
        
        // 设置所有猪的暂停状态
        if (animalSystem.animals.pigs) {
            animalSystem.animals.pigs.forEach(pig => {
                pig.pauseAnimation = controlsState.isPaused;
            });
        }
    }
    
    console.log(`游戏${controlsState.isPaused ? '已暂停' : '已恢复'}`);
}

// 设置暂停控制
function setupPauseControl(controlsState, pauseOverlay, document, animalSystem) {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'p' || event.key === 'P') {
            togglePause(controlsState, pauseOverlay, animalSystem);
        }
    });
}

// 添加重启游戏功能
function restartGame() {
    console.log('重启游戏...');
    
    window.location.reload();
    
    console.log('游戏已重启');
}

// 设置重启游戏快捷键
function setupRestartControl(controlsState, document) {
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && (event.key === 'r' || event.key === 'R')) {
            // 阻止浏览器默认的刷新行为
            event.preventDefault();
            
            // 重启游戏
            restartGame();
        }
    });
}

// 解除鼠标锁定相关的监听器
function tearDownMouseLock(document, listeners) {
    // 检查是否有传入监听器引用
    if (!listeners) {
        console.warn("无法解除鼠标锁定监听器：未提供监听器引用");
        return;
    }
    
    // 解除点击事件监听器
    if (listeners.requestLock) {
        document.removeEventListener('click', listeners.requestLock);
    }
    
    // 解除键盘事件监听器
    if (listeners.handleKeyLock) {
        document.removeEventListener('keydown', listeners.handleKeyLock);
    }
    
    // 解除锁定状态变化监听器
    if (listeners.handleLockChange) {
        document.removeEventListener('pointerlockchange', listeners.handleLockChange);
    }
    
    // 解除锁定错误监听器
    if (listeners.handleLockError) {
        document.removeEventListener('pointerlockerror', listeners.handleLockError);
    }
    
    console.log("已解除所有鼠标锁定相关监听器");
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
    togglePause,
    createPauseOverlay,
    setupPauseControl,
    setupRestartControl,
    restartGame,
    tearDownMouseLock,
    tearDownMouseControls,
    tearDownAdvancedMouseControls,
    tearDownKeyboardControls
};
