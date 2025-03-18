// 摄像机相关函数和工具

// 创建主摄像机
function createMainCamera() {
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 10;
    camera.position.z = 20;
    return camera;
}

// 创建俯视摄像机
function createOverviewCamera(worldSize) {
    const overviewCamera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    // 设置摄像机位置 - 左上角45度俯视
    overviewCamera.position.set(-20, 30, -20);
    // 让摄像机指向世界中心
    overviewCamera.lookAt(new THREE.Vector3(worldSize / 2, 0, worldSize / 2));
    return overviewCamera;
}

// 创建视锥系统
function createFrustumSystem() {
    return {
        frustum: new THREE.Frustum(),
        tempMatrix: new THREE.Matrix4(),
        cameraViewMatrix: new THREE.Matrix4(),
        cameraProjectionMatrix: new THREE.Matrix4()
    };
}

// 更新视锥
function updateFrustum(camera, frustumSystem) {
    // 更新投影视图矩阵
    camera.updateMatrixWorld();
    frustumSystem.cameraViewMatrix.copy(camera.matrixWorldInverse);
    frustumSystem.cameraProjectionMatrix.copy(camera.projectionMatrix);

    // 计算视锥
    frustumSystem.tempMatrix.multiplyMatrices(
        frustumSystem.cameraProjectionMatrix, 
        frustumSystem.cameraViewMatrix
    );
    frustumSystem.frustum.setFromProjectionMatrix(frustumSystem.tempMatrix);
}

// 检查方块是否在视锥内
function isInViewFrustum(position, frustumSystem) {
    return frustumSystem.frustum.containsPoint(position);
}

// 创建渲染设置
function createRenderSettings() {
    return {
        normalRenderDistance: 25,
        reducedRenderDistance: 15,
        lookingDownThreshold: -0.3,
        currentRenderDistance: 35
    };
}

// 更新渲染距离
function updateRenderDistance(renderSettings, lookDirection) {
    if (lookDirection.y < renderSettings.lookingDownThreshold) {
        // 根据向下看的角度程度动态调整渲染距离
        const factor = Math.min(1, Math.abs(lookDirection.y / -1.0));
        renderSettings.currentRenderDistance = renderSettings.normalRenderDistance -
            (renderSettings.normalRenderDistance - renderSettings.reducedRenderDistance) * factor;
    } else {
        renderSettings.currentRenderDistance = renderSettings.normalRenderDistance;
    }
    
    return renderSettings.currentRenderDistance;
}

// 应用视锥剔除和距离裁剪
function applyFrustumCulling(camera, blockReferences, frustumSystem, renderSettings) {
    // 更新视锥
    updateFrustum(camera, frustumSystem);
    
    // 获取相机朝向向量
    const lookDirection = new THREE.Vector3();
    camera.getWorldDirection(lookDirection);
    
    // 动态调整渲染距离
    updateRenderDistance(renderSettings, lookDirection);
    
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

        block.visible = (isNearPlayer || isNearFrustum || isInViewFrustum(block.position, frustumSystem)) &&
            distanceToCamera <= renderSettings.currentRenderDistance;
    });
    
    return lookDirection;
}

// 摄像机切换
function setupCameraToggle(character, mainCamera, overviewCamera, keyEvent) {
    if (keyEvent.ctrlKey && keyEvent.key === '2') {
        // 切换到第一人称
        setCharacterPartsOpacity(character, true);
        return mainCamera;
    } else if (keyEvent.ctrlKey && keyEvent.key === '3') {
        // 切换到俯视
        setCharacterPartsOpacity(character, false);
        return overviewCamera;
    }
    return null;
}

// 窗口大小改变时更新摄像机
function handleWindowResize(mainCamera, overviewCamera, renderer) {
    const aspect = window.innerWidth / window.innerHeight;

    // 更新主摄像机
    mainCamera.aspect = aspect;
    mainCamera.updateProjectionMatrix();

    // 更新俯视摄像机
    overviewCamera.aspect = aspect;
    overviewCamera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 导出函数
export {
    createMainCamera,
    createOverviewCamera,
    createFrustumSystem,
    updateFrustum,
    isInViewFrustum,
    createRenderSettings,
    updateRenderDistance,
    applyFrustumCulling,
    setupCameraToggle,
    handleWindowResize
};
