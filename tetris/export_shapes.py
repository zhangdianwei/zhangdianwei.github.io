# 把blender中的所有对象导出到ShapeDefine.json中

import bpy
import os, json

outputs = dict()

# 获取当前激活的场景
scene = bpy.context.scene

all_collections = []
for coll in scene.collection.children:
    if coll.name.startswith("type."):
        all_collections.append(coll)

#print(all_collections)

for shapedefine in all_collections:
    [_, shape_name, shape_rows, shape_cols] = shapedefine.name.split(".")

    out_shapedefine = dict()
    outputs[shape_name] = out_shapedefine

    out_shapedefine["rows"] = shape_rows
    out_shapedefine["cols"] = shape_cols
    out_shapedefine["deps"] = 1
    out_shapedefine["shapes"] = []
    out_shapedefine["cube_count"] = 0

    for shape_shape in shapedefine.children:
        
        out_shapedefine_oneshape = []
        out_shapedefine["shapes"].append(out_shapedefine_oneshape)

        if out_shapedefine["cube_count"]==0:
            out_shapedefine["cube_count"] = len(shape_shape.objects)

        for shape_shape_cube in shape_shape.objects:
            out_shapedefine_oneshape.append({
                "row": int(shape_shape_cube.location.z),
                "col": int(shape_shape_cube.location.x),
                "dep": int(shape_shape_cube.location.y),
            })


# print(json.dumps(outputs, indent=4))

with open("./ShapeDefine.js", "w") as fout:
    s = '''
const ShapeDefine = %s;
export {ShapeDefine}
   '''%(json.dumps(outputs, indent=4));
    fout.write(s)