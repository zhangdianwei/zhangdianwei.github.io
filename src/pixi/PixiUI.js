

export function makeButton(obj, onClick) {
    obj.eventMode = 'static';
    obj.cursor = 'pointer';
    
    // 防止双击缩放（移动设备）
    obj.on('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
    
    // 使用pointertap替代click（移动设备兼容性更好）
    obj.on('pointertap', (event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick(event);
    });

    const handlePointerDown = (event) => {
        event.preventDefault();
        event.stopPropagation();
        obj.scale.set(0.95);
    };
    
    const handlePointerUp = (event) => {
        event.preventDefault();
        event.stopPropagation();
        obj.scale.set(1);
    };

    const handlePointerUpOutside = (event) => {
        event.preventDefault();
        event.stopPropagation();
        obj.scale.set(1);
    };

    // 支持鼠标和触摸事件
    obj.on('pointerdown', handlePointerDown);
    obj.on('pointerup', handlePointerUp);
    obj.on('pointerupoutside', handlePointerUpOutside);
    
    // 移动设备触摸事件支持（备用方案）
    obj.on('touchstart', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handlePointerDown(event);
    });
    
    obj.on('touchend', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handlePointerUp(event);
    });
    
    obj.on('touchcancel', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handlePointerUpOutside(event);
    });
    
    return obj;
}

// 移动设备检测
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 防止页面缩放（移动设备）
export function preventZoom() {
    if (isMobileDevice()) {
        // 防止双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // 防止双指缩放
        document.addEventListener('gesturestart', (event) => {
            event.preventDefault();
        });
        
        document.addEventListener('gesturechange', (event) => {
            event.preventDefault();
        });
        
        document.addEventListener('gestureend', (event) => {
            event.preventDefault();
        });
    }
}

// 设置移动设备视口
export function setupMobileViewport() {
    if (isMobileDevice()) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
        } else {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
    }
}