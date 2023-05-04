#! /usr/bin/python
#encoding=utf8

# 执行这个文件，检查一些错误
# 1. 是否有文章没有添加到边栏中
# 2. 是否有未引用的图片

# 运行环境
#   python 2.x

import os,sys,re

reload(sys)
sys.setdefaultencoding("utf8")

# 要忽略检查的目录
IgnorePath = [
    ".git",
    "docsify",
    "project",
]
def should_ignore(path):
    for p in IgnorePath:
        if p in path: return True
    return False

# 检测filename这个文件是否应该出现在sidebar里但却没有出现
def check_sidebar_one(sidebar_content, path, filename):
    if filename.endswith(".md") and filename not in sidebar_content:
        return False
    return True

# 检测是否有文章写了但是没有放在侧边栏
def check_sidebar():
    sidebar_content = open('_sidebar.md').read()
    for p, ds, fs in os.walk('.'):
        if p==".": continue
        if should_ignore(p): continue
        for f in fs:
            if not check_sidebar_one(sidebar_content, p, f):
                print "忽略的文章:%s"%(os.path.join(p, f))

def main():
    # 先把当前路径调整为脚本所在路径，以便于可以双击直接运行
    scriptdir = os.path.split(sys.argv[0])[0]
    if scriptdir:
        os.chdir(scriptdir)

    # print "path" in "./path/xx"
    check_sidebar()

if __name__ == "__main__":
    main()

