

export function makeButton(obj, onClick) {
    obj.eventMode = 'static';
    obj.on('click', onClick);

    const handlePointerDown = () => {
        obj.scale.set(0.95);
    };
    
    const handlePointerUp = () => {
        obj.scale.set(1);
    };

    obj.on('pointerdown', handlePointerDown);
    obj.on('pointerup', handlePointerUp);
    obj.on('pointerupoutside', handlePointerUp);
    return obj;
}