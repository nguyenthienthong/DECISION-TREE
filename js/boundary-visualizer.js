/**
 * Boundary Visualizer - Dark Mode Edition
 * Trực quan hóa ranh giới quyết định 2D trên nền Canvas tối sang trọng
 */

class BoundaryVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.dataset = null;
    this.tree = null;
    this.featureX = null;
    this.featureY = null;
  }

  render(dataset, tree, featX, featY) {
    if (!this.canvas || !this.ctx || !dataset || !tree) return;

    this.dataset = dataset;
    this.tree = tree;
    this.featureX = featX;
    this.featureY = featY;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    // Nền Canvas tối sang trọng
    ctx.fillStyle = "#0d1322";
    ctx.fillRect(0, 0, width, height);

    const data = dataset.data;
    if (data.length === 0) return;

    // Kiểm tra tính chất của 2 trục: Số (Numerical) hay Chữ (Categorical)
    const isNumericX = data.every(d => !isNaN(Number(d[featX])) && typeof d[featX] !== "boolean" && d[featX] !== "" && d[featX] !== null);
    const isNumericY = data.every(d => !isNaN(Number(d[featY])) && typeof d[featY] !== "boolean" && d[featY] !== "" && d[featY] !== null);

    const xCats = !isNumericX ? [...new Set(data.map(d => String(d[featX])))] : null;
    const yCats = !isNumericY ? [...new Set(data.map(d => String(d[featY])))] : null;

    // Tính tọa độ miền giá trị
    let minX, maxX, minY, maxY;

    if (isNumericX) {
      const xVals = data.map(d => Number(d[featX]));
      minX = Math.min(...xVals);
      maxX = Math.max(...xVals);
    } else {
      minX = -0.5;
      maxX = xCats.length - 0.5;
    }

    if (isNumericY) {
      const yVals = data.map(d => Number(d[featY]));
      minY = Math.min(...yVals);
      maxY = Math.max(...yVals);
    } else {
      minY = -0.5;
      maxY = yCats.length - 0.5;
    }

    const spanX = maxX - minX === 0 ? 1 : (maxX - minX);
    const spanY = maxY - minY === 0 ? 1 : (maxY - minY);

    const padX = isNumericX ? spanX * 0.08 : 0;
    const padY = isNumericY ? spanY * 0.08 : 0;

    const domainX = [minX - padX, maxX + padX];
    const domainY = [minY - padY, maxY + padY];

    const plotLeft = 70;
    const plotRight = width - 40;
    const plotTop = 35;
    const plotBottom = height - 50;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const toCanvasX = (val) => plotLeft + ((val - domainX[0]) / (domainX[1] - domainX[0])) * plotWidth;
    const toCanvasY = (val) => plotBottom - ((val - domainY[0]) / (domainY[1] - domainY[0])) * plotHeight;

    const fromCanvasX = (cx) => domainX[0] + ((cx - plotLeft) / plotWidth) * (domainX[1] - domainX[0]);
    const fromCanvasY = (cy) => domainY[0] + ((plotBottom - cy) / plotHeight) * (domainY[1] - domainY[0]);

    const baselineInstance = { ...data[0] };

    // 1. Quét vùng quyết định (Decision Regions Grid)
    const gridRes = 50;
    const stepX = plotWidth / gridRes;
    const stepY = plotHeight / gridRes;

    for (let cx = plotLeft; cx < plotRight; cx += stepX) {
      for (let cy = plotTop; cy < plotBottom; cy += stepY) {
        const valX = fromCanvasX(cx + stepX / 2);
        const valY = fromCanvasY(cy + stepY / 2);

        const testInst = { ...baselineInstance };

        if (isNumericX) {
          testInst[featX] = valX;
        } else {
          const idx = Math.max(0, Math.min(xCats.length - 1, Math.round(valX)));
          testInst[featX] = xCats[idx];
        }

        if (isNumericY) {
          testInst[featY] = valY;
        } else {
          const idx = Math.max(0, Math.min(yCats.length - 1, Math.round(valY)));
          testInst[featY] = yCats[idx];
        }

        const predResult = tree.predict(testInst);
        let color = "rgba(15, 23, 42, 0.4)";

        if (predResult) {
          const p = String(predResult.prediction).toLowerCase();
          if (p === "yes" || p === "survived" || p === "normal" || p === "approved" || p === "edible" || p === "setosa") {
            color = "rgba(16, 185, 129, 0.22)"; // Xanh ngọc
          } else if (p === "no" || p === "perished" || p === "disease" || p === "rejected" || p === "poisonous") {
            color = "rgba(244, 63, 94, 0.22)"; // Đỏ hồng
          } else if (tree.taskType === "regression") {
            const norm = Math.min(1, Math.max(0, (predResult.prediction - 1.5) / 5.5));
            color = `rgba(56, 189, 248, ${0.1 + norm * 0.45})`;
          } else {
            color = "rgba(99, 102, 241, 0.22)"; // Tím
          }
        }

        ctx.fillStyle = color;
        ctx.fillRect(cx, cy, stepX + 0.6, stepY + 0.6);
      }
    }

    // 2. Vẽ lưới toạ độ (Grid lines & Axes)
    ctx.strokeStyle = "rgba(51, 65, 85, 0.5)";
    ctx.lineWidth = 1;

    // Vạch & nhãn trục X
    if (isNumericX) {
      const numTicks = 5;
      for (let i = 0; i <= numTicks; i++) {
        const tVal = minX + (i / numTicks) * spanX;
        const tx = toCanvasX(tVal);
        ctx.beginPath();
        ctx.moveTo(tx, plotTop);
        ctx.lineTo(tx, plotBottom);
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "10px font-mono, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(tVal.toFixed(1), tx, plotBottom + 16);
      }
    } else {
      xCats.forEach((cat, idx) => {
        const tx = toCanvasX(idx);
        ctx.beginPath();
        ctx.moveTo(tx, plotTop);
        ctx.lineTo(tx, plotBottom);
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(cat, tx, plotBottom + 18);
      });
    }

    // Vạch & nhãn trục Y
    if (isNumericY) {
      const numTicks = 5;
      for (let i = 0; i <= numTicks; i++) {
        const tVal = minY + (i / numTicks) * spanY;
        const ty = toCanvasY(tVal);
        ctx.beginPath();
        ctx.moveTo(plotLeft, ty);
        ctx.lineTo(plotRight, ty);
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "10px font-mono, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(tVal.toFixed(1), plotLeft - 10, ty + 3.5);
      }
    } else {
      yCats.forEach((cat, idx) => {
        const ty = toCanvasY(idx);
        ctx.beginPath();
        ctx.moveTo(plotLeft, ty);
        ctx.lineTo(plotRight, ty);
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(cat, plotLeft - 10, ty + 4);
      });
    }

    // Khung viền đồ thị
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plotLeft, plotTop, plotWidth, plotHeight);

    // Tiêu đề trục X
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${featX} ${!isNumericX ? '(Danh mục)' : ''}`, (plotLeft + plotRight) / 2, height - 12);

    // Tiêu đề trục Y
    ctx.save();
    ctx.translate(18, (plotTop + plotBottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${featY} ${!isNumericY ? '(Danh mục)' : ''}`, 0, 0);
    ctx.restore();

    // 3. Gom nhóm mẫu trùng tọa độ và rải điểm (Scatter Jitter)
    const pointGroups = {};
    data.forEach((row, rowIdx) => {
      const coordX = isNumericX ? Number(row[featX]) : xCats.indexOf(String(row[featX]));
      const coordY = isNumericY ? Number(row[featY]) : yCats.indexOf(String(row[featY]));
      const key = `${coordX}_${coordY}`;
      if (!pointGroups[key]) pointGroups[key] = [];
      pointGroups[key].push({ row, rowIdx, coordX, coordY });
    });

    // 4. Vẽ tất cả các điểm mẫu dữ liệu
    for (const key in pointGroups) {
      const group = pointGroups[key];
      const count = group.length;

      group.forEach((pt, idxInGroup) => {
        let offsetX = 0;
        let offsetY = 0;

        // Nếu nhiều điểm trùng nhau (đặc biệt khi trục là danh mục), rải nhẹ ra xung quanh
        if (count > 1) {
          const angle = (idxInGroup / count) * Math.PI * 2;
          const radius = Math.min(14, 6 + count * 2);
          offsetX = Math.cos(angle) * radius;
          offsetY = Math.sin(angle) * radius;
        }

        const px = toCanvasX(pt.coordX) + offsetX;
        const py = toCanvasY(pt.coordY) + offsetY;
        const targetVal = String(pt.row[dataset.targetCol]).toLowerCase();

        ctx.beginPath();
        ctx.arc(px, py, 6.5, 0, Math.PI * 2);

        if (targetVal === "yes" || targetVal === "survived" || targetVal === "normal" || targetVal === "approved" || targetVal === "edible" || targetVal === "setosa") {
          ctx.fillStyle = "#10b981"; // Xanh ngọc
        } else if (targetVal === "no" || targetVal === "perished" || targetVal === "disease" || targetVal === "rejected" || targetVal === "poisonous") {
          ctx.fillStyle = "#f43f5e"; // Đỏ hồng
        } else {
          ctx.fillStyle = "#38bdf8"; // Xanh dương
        }

        ctx.fill();
        ctx.strokeStyle = "#0b0f19";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Viền phát sáng nhẹ
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
    }

    // 5. Chú thích mẫu (Legend) ở góc trên bên phải
    ctx.fillStyle = "rgba(11, 15, 25, 0.85)";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(width - 150, 10, 138, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(width - 138, 21, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Yes/Tích cực", width - 130, 24);

    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(width - 68, 21, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("No/Tiêu cực", width - 60, 24);
  }
}
