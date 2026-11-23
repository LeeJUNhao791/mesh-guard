# Mesh Guard

[![STL tests](https://github.com/LeeJUNhao791/mesh-guard/actions/workflows/stl-tests.yml/badge.svg?branch=main)](https://github.com/LeeJUNhao791/mesh-guard/actions/workflows/stl-tests.yml)
[![Release](https://img.shields.io/github/v/release/LeeJUNhao791/mesh-guard)](https://github.com/LeeJUNhao791/mesh-guard/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README.md) · [在线试用](https://leejunhao791.github.io/mesh-guard/)

在浏览器中读取 ASCII 或二进制 STL 的 X、Y、Z 跨度，按毫米与参考尺寸逐轴比较，帮助发现导出单位或比例错误。默认容差为每轴 `0.1 mm`。

文件在本地浏览器中解析，不上传模型。STL 不带单位元数据，必须选择导出时使用的毫米（mm）或米（m）。

## 一键体验

在线页面和当前 `main` 已包含 **Try sample**；该按钮在 `v0.1.0` 之后加入。

1. 打开在线页面，点击 **Try sample**。页面载入长方体，选择毫米并填入 `120 × 80 × 40 mm` 和 `0.1 mm` 容差，显示 **PASS**。
2. 将单位改为 **Meters (m)**，点击 **Check dimensions**。三轴均失败，出现 **1000×** 单位提示。

也可下载 [示例 STL](samples/cuboid-120x80x40-mm.stl)，手动选择或拖入页面。

## 检查自己的 STL

1. 选择或拖入一个 `.stl` 文件，选择其导出坐标单位。
2. 只测量时，将三个预期尺寸全部留空。需要验收时，填写全部 X/Y/Z 预期尺寸，单位始终是毫米；数值与容差均须为非负数。
3. 点击 **Check dimensions**，查看原始跨度、换算后的毫米尺寸，以及比较时的预期值、偏差和逐轴结果。

偏差是“实测 − 预期”。每轴偏差绝对值均不超过容差时为 **PASS**，否则为 **FAIL**。修改输入后需要重新检查。

三轴相对预期都接近 `1000×` 或 `0.001×` 时，页面提示核对单位和导出设置；提示本身不修改模型。测量沿 STL 坐标轴进行，模型旋转会改变包围盒跨度。这是尺寸检查，不检查水密性、打印可行性或制造精度。

## 保存参考尺寸

填写全部 X/Y/Z 预期尺寸并完成检查后，点击 **Download expected.json**，保存表单中的参考尺寸和容差，数值单位均为毫米。PASS 和 FAIL 比较结果均可导出。修改输入后，重新检查即可生成更新的下载文件。

文件沿用 [GLB Dimension Check](https://github.com/LeeJUNhao791/glb-dimension-check#check-against-a-json-expectation-file) 的 `expected_mm` 和 `tolerance_mm` 字段，可复用于轴顺序相同的 GLB 导出。

## 本地运行

使用 Python 3，在仓库根目录提供静态文件服务：

```sh
python -m http.server 8000 --bind 127.0.0.1
```

打开 [本地页面](http://127.0.0.1:8000/)。页面不需要构建或额外运行时下载，保留仓库内文件后可在离线环境使用本地服务。

## 测试与反馈

使用 Node.js 22（与 CI 一致）运行现有测试：

```sh
node --test tests/test_stl.mjs
```

首次使用反馈请回复 [Issue #3](https://github.com/LeeJUNhao791/mesh-guard/issues/3)。可复现的问题请使用 [Bug 模板](https://github.com/LeeJUNhao791/mesh-guard/issues/new?template=bug_report.md)，注明导出单位、X/Y/Z 预期尺寸、容差与结果，并使用可公开的 STL。

## 许可证

项目沿用 [GLB Dimension Check v0.5.0](https://github.com/LeeJUNhao791/glb-dimension-check/tree/v0.5.0) 中的本地 STL 原型与基础样式，采用 [MIT 许可证](LICENSE)。
