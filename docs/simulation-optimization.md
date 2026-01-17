# Simulation 模式优化总结

## ✅ 已完成的优化

### 1. **渲染性能优化**
- **问题**: 每 3 秒更新 850 辆车导致页面跳动
- **方案**:
  - 节流机制: 最多每 5 秒更新一次渲染 (`updateThrottleMs = 5000`)
  - 用户交互检测: 用户拖动/缩放地图时暂停更新
  - **文件**: `useSimulationScooters.ts`

### 2. **组件渲染优化 (React.memo)**
- **问题**: 850 个 Marker 每次都重新渲染
- **方案**:
  - 创建 `ScooterMarker` 组件，使用自定义 `arePropsEqual` 比较函数
  - 只在关键属性变化时重新渲染：
    - 坐标变化 > 0.11 米 (精度 6 位小数)
    - 电量变化
    - 选中状态变化
  - **文件**: `ScooterMarker.tsx`

### 3. **数据规范化**
- **问题**: 后端 Socket 数据的 ID 字段为 `_id` 或 `scooterId`，前端直接访问 `scooter.id` 导致所有车 ID 为 `undefined`，Map 中互相覆盖
- **方案**: 添加 `normalizeScooter` 函数统一处理 ID 字段
- **文件**: `useSimulationScooters.ts`

---

## ⚠️ 待优化：网络流量 (Data Usage)

### 当前状况
- **网络开销**: 每 3 秒接收 **200-300KB JSON** (1000 辆车完整数据)
- **移动流量消耗**: 约 **6-10 MB/分钟** (室外场景不友好)
- **问题**: 即使渲染优化了，后台依然在消耗流量

### 优化方案

#### **方案 A: 视口同步 (Viewport Sync)** ⭐ 推荐
前端向后端发送当前可见区域，后端只推送该区域的车辆。

**前端实现**:
\`\`\`typescript
// useSimulationScooters.ts
useEffect(() => {
  if (viewport && simulationSocket.isConnected()) {
    simulationSocket.emit('subscribe:viewport', {
      bounds: calculateBounds(viewport),
      city: cityFilter,
    });
  }
}, [viewport, cityFilter]);
\`\`\`

**后端实现** (需修改 `simulation.js`):
\`\`\`javascript
socket.on('subscribe:viewport', ({ bounds, city }) => {
  // 过滤车辆并只推送符合条件的
  const filtered = scooters.filter(s => 
    s.city === city && 
    isInBounds(s.coordinates, bounds)
  );
  socket.emit('scooters:init', filtered);
});
\`\`\`

**效果**:
- 流量减少 **70-90%** (斯德哥尔摩市中心约 50-150 辆车)
- 渲染性能进一步提升

---

#### **方案 B: 增量更新 (Delta Updates)**
只推送变化的车辆，而不是全量数据。

**后端实现**:
\`\`\`javascript
// 每 3 秒计算差异
const changes = calculateDelta(previousScooters, currentScooters);
io.emit('scooters:delta', {
  updated: changes.updated,  // 位置/状态变化的车
  removed: changes.removed,  // 不再可见的车 ID
});
\`\`\`

**前端实现**:
\`\`\`typescript
socket.on('scooters:delta', ({ updated, removed }) => {
  // 增量更新 Map
  updated.forEach(s => map.set(s.id, s));
  removed.forEach(id => map.delete(id));
});
\`\`\`

**效果**:
- 流量减少 **50-80%**
- 需要后端支持差异计算

---

#### **方案 C: 降低推送频率**
最简单的方案：将后端推送间隔从 3 秒改为 10-15 秒。

**后端实现** (`simulation.js`):
\`\`\`javascript
// 从 setInterval(updateScooters, 3000)
setInterval(updateScooters, 10000); // 改为 10 秒
\`\`\`

**效果**:
- 流量减少 **70%** (10 秒间隔)
- 实时性下降（适合非高实时场景）

---

## 📊 优化效果对比

| 优化项 | 当前状态 | 优化后 | 提升 |
|--------|---------|--------|------|
| **渲染频率** | 每 3 秒 | 每 5 秒 + 用户交互检测 | ✅ 40% |
| **Marker 重渲染** | 850 个/次 | ~20-50 个/次 (memo) | ✅ 90%+ |
| **网络流量** | 6-10 MB/分钟 | 待优化 | ⚠️ 待实现 |

---

## 🚀 下一步建议

1. **短期**: 保持当前优化，合并到主分支
2. **中期**: 实现**视口同步**（需后端配合）
3. **长期**: 考虑**增量更新** + **WebSocket 压缩**

---

## 📝 相关文件

- `/src/features/scooters/useSimulationScooters.ts` - Socket 数据管理
- `/src/features/map/ScooterMarker.tsx` - 优化的 Marker 组件
- `/src/features/map/MapScreen.tsx` - 地图主页面
- `/.env` - 配置文件 (`USE_SIMULATION=true/false`)

---

**总结**: 当前优化已解决 "渲染性能" 和 "交互体验" 问题，可以合并。网络流量优化可作为下一个迭代的目标。
