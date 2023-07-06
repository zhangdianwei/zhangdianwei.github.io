# 把map1-src.json导入到blender中

import bpy
import json
import sys
import os


def get_std_filename():
    # 获取当前 Blender 文件的路径
    filepath = bpy.data.filepath
    # 提取文件名（包括扩展名）
    filename_with_extension = os.path.basename(filepath)
    # 提取文件名（不包括扩展名）
    filename = os.path.splitext(filename_with_extension)[0]
    return filename  # map1


def write_output():
    outfile = get_std_filename()+".json"
    with open(outfile, "w") as fout:
        json.dump(outdata, fout, indent=4, ensure_ascii=False)


def main():
    with open(get_std_filename()+"-src.json", "r") as fp:
        srcdata = json.load(fp)
    cells = srcdata['cells']

    for r in range(0, len(cells)):
        line = cells[r]
        for c in range(0, len(line)):
            cell = line[c]


main()
