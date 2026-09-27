/**
 * Tree Visualizer - Dark Mode Edition
 * Vẽ cây quyết định SVG phân cấp tương tác trên nền tối với Neon Path Animation
 */

class TreeVisualizer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onNodeClick = options.onNodeClick || null;
    this.zoom = 1;
    this.panX = 40;
    this.panY = 30;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this.nodeWidth = 208;
    this.nodeHeight = 98;
    this.levelGap = 135;
    this.siblingGap = 36;

    this.treeData = null;
    this.highlightedPath = [];

    this._initEvents();
  }

  _initEvents() {
    if (!this.container) return;

    this.container.addEventListener("mousedown", (e) => {
      if (e.target.closest(".tree-node-group")) return;
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.container.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this._updateTransform();
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
      if (this.container) this.container.style.cursor = "grab";
    });

    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.setZoom(this.zoom * zoomFactor);
    }, { passive: false });
  }

  setZoom(newZoom) {
    this.zoom = Math.max(0.35, Math.min(2.5, newZoom));
    this._updateTransform();
  }

  resetView() {
    this.autoFitView();
  }

  /**
   * Tự động căn giữa cây và chọn tỷ lệ zoom vừa vặn với kích thước màn hình
   */
  autoFitView() {
    if (!this.container || !this.treeData || !this.treeData.root) return;

    const bounds = this._computeLayout(this.treeData.root);
    const cWidth = this.container.clientWidth || 800;
    const cHeight = this.container.clientHeight || 520;

    let fitZoom = 1.0;
    if (bounds.width > cWidth - 60) {
      fitZoom = Math.max(0.38, Math.min(1.0, (cWidth - 60) / bounds.width));
    }
    this.zoom = fitZoom;
    this.panX = Math.max(30, (cWidth - bounds.width * this.zoom) / 2);
    this.panY = 30;
    this._updateTransform();
  }

  _updateTransform() {
    const g = this.container.querySelector("#tree-viewport-group");
    if (g) {
      g.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }
  }

  /**
   * Tính toán toạ độ vị trí cho từng node
   */
  _computeLayout(root) {
    let nextX = 40; // Lề trái 40px tránh bị cắt chữ

    const postOrder = (node, depth) => {
      node.y = depth * this.levelGap + 40;
      const childKeys = Object.keys(node.children || {});

      if (childKeys.length === 0) {
        node.x = nextX;
        nextX += this.nodeWidth + this.siblingGap;
      } else {
        childKeys.forEach(key => postOrder(node.children[key], depth + 1));
        const firstChild = node.children[childKeys[0]];
        const lastChild = node.children[childKeys[childKeys.length - 1]];
        node.x = (firstChild.x + lastChild.x) / 2;
      }
    };

    postOrder(root, 0);

    let maxX = 0;
    let maxY = 0;
    const findBounds = (node) => {
      if (node.x > maxX) maxX = node.x;
      if (node.y > maxY) maxY = node.y;
      for (const k in node.children) {
        findBounds(node.children[k]);
      }
    };
    findBounds(root);

    return {
      width: maxX + this.nodeWidth + 80,
      height: maxY + this.nodeHeight + 80
    };
  }

  /**
   * Vẽ toàn bộ cây
   */
  render(decisionTree, highlightedPath = []) {
    this.treeData = decisionTree;
    this.highlightedPath = highlightedPath;

    if (!decisionTree || !decisionTree.root) {
      this.container.innerHTML = `<div class="flex items-center justify-center h-full text-slate-500">Chưa có cây quyết định nào được huấn luyện.</div>`;
      return;
    }

    const root = decisionTree.root;
    this._computeLayout(root);

    // Khởi tạo SVG với bảng màu Dark Mode
    let svgHtml = `
      <svg id="decision-tree-svg" class="w-full h-full select-none cursor-grab" style="min-height: 520px;">
        <defs>
          <filter id="node-shadow-dark" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.5"/>
          </filter>
          <filter id="node-glow-neon" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#38bdf8" flood-opacity="0.8"/>
          </filter>
          
          <linearGradient id="darkLeafGradYes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#059669"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
          <linearGradient id="darkLeafGradNo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e11d48"/>
            <stop offset="100%" stop-color="#be123c"/>
          </linearGradient>
          <linearGradient id="darkLeafGradDefault" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4f46e5"/>
            <stop offset="100%" stop-color="#3730a3"/>
          </linearGradient>
        </defs>
        <g id="tree-viewport-group" transform="translate(${this.panX}, ${this.panY}) scale(${this.zoom})">
          <g id="tree-edges"></g>
          <g id="tree-nodes"></g>
        </g>
      </svg>
    `;

    this.container.innerHTML = svgHtml;

    const edgesGroup = this.container.querySelector("#tree-edges");
    const nodesGroup = this.container.querySelector("#tree-nodes");

    // Vẽ các cạnh nối
    const renderEdges = (node) => {
      for (const branchLabel in node.children) {
        const child = node.children[branchLabel];

        const x1 = node.x + this.nodeWidth / 2;
        const y1 = node.y + this.nodeHeight;
        const x2 = child.x + this.nodeWidth / 2;
        const y2 = child.y;

        const isHighlighted = this.highlightedPath.includes(node.id) && this.highlightedPath.includes(child.id);
        const strokeColor = isHighlighted ? "#38bdf8" : "#334155";
        const strokeWidth = isHighlighted ? 3.5 : 2;

        const midY = (y1 + y2) / 2;
        const edgePath = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

        // Cạnh
        const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathEl.setAttribute("d", edgePath);
        pathEl.setAttribute("fill", "none");
        pathEl.setAttribute("stroke", strokeColor);
        pathEl.setAttribute("stroke-width", strokeWidth);
        if (isHighlighted) {
          pathEl.setAttribute("stroke-dasharray", "8,5");
          pathEl.classList.add("edge-animated");
        }
        edgesGroup.appendChild(pathEl);

        // Nhãn trên cạnh
        const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        textGroup.setAttribute("transform", `translate(${(x1 + x2) / 2}, ${midY})`);

        const rectBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rectBg.setAttribute("x", -branchLabel.length * 4.5 - 8);
        rectBg.setAttribute("y", -12);
        rectBg.setAttribute("width", branchLabel.length * 9 + 16);
        rectBg.setAttribute("height", 24);
        rectBg.setAttribute("rx", 6);
        rectBg.setAttribute("fill", isHighlighted ? "#0f172a" : "#131b2e");
        rectBg.setAttribute("stroke", isHighlighted ? "#38bdf8" : "#334155");
        rectBg.setAttribute("stroke-width", "1.2");

        const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textEl.setAttribute("text-anchor", "middle");
        textEl.setAttribute("dy", 4.5);
        textEl.setAttribute("font-size", "11");
        textEl.setAttribute("font-weight", "600");
        textEl.setAttribute("fill", isHighlighted ? "#38bdf8" : "#94a3b8");
        textEl.textContent = branchLabel;

        textGroup.appendChild(rectBg);
        textGroup.appendChild(textEl);
        edgesGroup.appendChild(textGroup);

        renderEdges(child);
      }
    };

    // Vẽ các nút (Nodes)
    const renderNodes = (node) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "tree-node-group cursor-pointer transition-transform duration-200");
      g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
      g.dataset.nodeId = node.id;

      const isPathNode = this.highlightedPath.includes(node.id);

      if (node.isLeaf) {
        // Nút lá (Terminal Node)
        let grad = "url(#darkLeafGradDefault)";
        let strokeColor = "#3b82f6";
        const predStr = String(node.prediction).toLowerCase();

        if (decisionTree.taskType === "regression") {
          grad = "url(#darkLeafGradRegression)";
          strokeColor = "#818cf8";
        } else if (predStr === "yes" || predStr === "survived" || predStr === "normal" || predStr === "approved" || predStr === "edible" || predStr === "setosa") {
          grad = "url(#darkLeafGradYes)";
          strokeColor = "#10b981";
        } else if (predStr === "no" || predStr === "perished" || predStr === "disease" || predStr === "rejected" || predStr === "poisonous") {
          grad = "url(#darkLeafGradNo)";
          strokeColor = "#f43f5e";
        }

        const displayPred = typeof node.prediction === "number" ? Number(node.prediction.toFixed(2)) : node.prediction;

        g.innerHTML = `
          <rect class="node-card" width="${this.nodeWidth}" height="${this.nodeHeight}" rx="14" fill="${grad}" filter="${isPathNode ? 'url(#node-glow-neon)' : 'url(#node-shadow-dark)'}" stroke="${isPathNode ? '#ffffff' : strokeColor}" stroke-width="${isPathNode ? 2.5 : 1.2}" />
          
          <!-- Pill Header Nút Lá -->
          <rect x="14" y="8" width="${this.nodeWidth - 28}" height="20" rx="10" fill="rgba(0,0,0,0.35)" />
          <text x="${this.nodeWidth / 2}" y="22" text-anchor="middle" fill="#ffffff" font-size="9.5" font-weight="800" letter-spacing="0.5">LÁ ${node.id} &bull; KẾT QUẢ</text>
          
          <!-- Giá trị dự đoán to, nổi bật -->
          <text x="${this.nodeWidth / 2}" y="55" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="900">${displayPred}</text>
          
          <line x1="20" y1="67" x2="${this.nodeWidth - 20}" y2="67" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
          
          <!-- Thông số mẫu và độ bất định -->
          <text x="${this.nodeWidth / 2}" y="84" text-anchor="middle" fill="#ffffff" font-size="11" opacity="0.95">${node.samples} mẫu | ${node.impurityName}: ${node.impurity.toFixed(2)}</text>
        `;
      } else {
        // Nút phân nhánh (Decision Split Node)
        let headerTitle = node.splitFeature;
        if (node.splitType === "binary_categorical") {
          headerTitle = `${node.splitFeature} == "${node.threshold}"?`;
        } else if (node.splitType === "numerical") {
          headerTitle = `${node.splitFeature} <= ${node.threshold}`;
        }

        const isRoot = node.depth === 0;
        const badgeWidth = isRoot ? 58 : 30;
        const badgeText = isRoot ? `${node.id} GỐC` : node.id;
        const badgeBg = isRoot ? "#059669" : "#334155";

        // Tự động căn chỉnh font size nếu tên thuộc tính dài
        const titleFontSize = headerTitle.length > 18 ? 10.5 : (headerTitle.length > 13 ? 11.5 : 12.5);
        const titleCenterX = 10 + badgeWidth + (this.nodeWidth - 20 - badgeWidth) / 2;

        g.innerHTML = `
          <rect class="node-card" width="${this.nodeWidth}" height="${this.nodeHeight}" rx="14" fill="#0f172a" filter="${isPathNode ? 'url(#node-glow-neon)' : 'url(#node-shadow-dark)'}" stroke="${isPathNode ? '#38bdf8' : '#24324f'}" stroke-width="${isPathNode ? 2.5 : 1.2}" />
          
          <!-- Thanh tiêu đề phía trên -->
          <rect width="${this.nodeWidth}" height="34" rx="14" fill="#1e293b" />
          <rect y="18" width="${this.nodeWidth}" height="16" fill="#1e293b" />
          
          <!-- Huy hiệu định danh nút (N1 GỐC, N2,...) -->
          <rect x="10" y="7" width="${badgeWidth}" height="20" rx="6" fill="${badgeBg}" />
          <text x="${10 + badgeWidth / 2}" y="21" text-anchor="middle" fill="#ffffff" font-size="9.5" font-weight="800">${badgeText}</text>
          
          <!-- Tên câu hỏi phân nhánh (Rõ ràng, không bị đè) -->
          <text x="${titleCenterX}" y="21.5" text-anchor="middle" fill="#38bdf8" font-size="${titleFontSize}" font-weight="800">${headerTitle}</text>
          <line x1="0" y1="34" x2="${this.nodeWidth}" y2="34" stroke="#24324f" stroke-width="1" />
          
          <!-- Nội dung số liệu bên dưới -->
          <text x="14" y="55" fill="#94a3b8" font-size="11">Số mẫu (N):</text>
          <text x="${this.nodeWidth - 14}" y="55" text-anchor="end" fill="#f8fafc" font-size="12" font-weight="700">${node.samples}</text>

          <text x="14" y="75" fill="#94a3b8" font-size="11">${node.impurityName}:</text>
          <text x="${this.nodeWidth - 14}" y="75" text-anchor="end" fill="#38bdf8" font-size="12" font-weight="700">${node.impurity.toFixed(3)}</text>

          <!-- Gợi ý click -->
          <text x="${this.nodeWidth / 2}" y="91" text-anchor="middle" fill="#64748b" font-size="8.5" font-weight="500">👆 Click xem phép tính</text>
        `;
      }

      g.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.onNodeClick) {
          this.onNodeClick(node);
        }
      });

      nodesGroup.appendChild(g);

      for (const k in node.children) {
        renderNodes(node.children[k]);
      }
    };

    renderEdges(root);
    renderNodes(root);
  }
}
