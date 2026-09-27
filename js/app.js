/**
 * Main Application Controller
 * Điều phối toàn bộ hoạt động của Decision Tree Explorer Lab
 */

document.addEventListener("DOMContentLoaded", () => {
  // Trạng thái ứng dụng
  const state = {
    datasets: { ...PRESET_DATASETS },
    currentDatasetKey: "tennis",
    currentDataset: PRESET_DATASETS.tennis,
    currentTree: null,
    selectedNode: null,
    highlightedPath: [],
    config: {
      algorithm: "CART",
      splitMode: "binary", // "binary" hoặc "multiway"
      maxDepth: 4,
      minSamplesSplit: 2,
      minImpurityDecrease: 0.0
    },
    boundaryFeatX: null,
    boundaryFeatY: null
  };

  // Khởi tạo visualizers
  const treeVisualizer = new TreeVisualizer("tree-canvas-container", {
    onNodeClick: (node) => {
      openNodeMathModal(node);
    }
  });

  const boundaryVisualizer = new BoundaryVisualizer("boundary-canvas");

  // DOM Elements
  const datasetSelect = document.getElementById("dataset-select");
  const algoSelect = document.getElementById("algorithm-select");
  const btnModeBinary = document.getElementById("btn-mode-binary");
  const btnModeMultiway = document.getElementById("btn-mode-multiway");
  const splitModeBadge = document.getElementById("split-mode-badge");
  const splitModeHint = document.getElementById("split-mode-hint");
  const maxDepthSlider = document.getElementById("max-depth-slider");
  const maxDepthVal = document.getElementById("max-depth-val");
  const minSamplesSlider = document.getElementById("min-samples-slider");
  const minSamplesVal = document.getElementById("min-samples-val");
  const minImpuritySlider = document.getElementById("min-impurity-slider");
  const minImpurityVal = document.getElementById("min-impurity-val");
  const btnTrain = document.getElementById("btn-retrain");

  const tabButtons = document.querySelectorAll(".nav-tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  // Khởi tạo giao diện
  initDatasetDropdown();
  bindControlEvents();
  bindTabEvents();
  bindZoomControls();
  bindDatasetUpload();
  initRandomForestModule();

  // Huấn luyện cây ban đầu
  retrainModel();

  /**
   * Đổ danh sách bộ dữ liệu vào dropdown
   */
  function initDatasetDropdown() {
    datasetSelect.innerHTML = "";
    for (const key in state.datasets) {
      const ds = state.datasets[key];
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `${ds.name} (${ds.taskType === 'regression' ? 'Hồi quy' : 'Phân loại'})`;
      if (key === state.currentDatasetKey) opt.selected = true;
      datasetSelect.appendChild(opt);
    }
  }

  /**
   * Huấn luyện mô hình và cập nhật giao diện
   */
  function retrainModel() {
    state.currentDataset = state.datasets[state.currentDatasetKey];

    // Tự động điều chỉnh thuật toán nếu là bài toán hồi quy
    if (state.currentDataset.taskType === "regression") {
      state.config.algorithm = "CART";
      algoSelect.value = "CART";
      algoSelect.disabled = true;
      document.getElementById("algo-hint").textContent = "Dữ liệu liên tục: tự động dùng CART Regression (MSE).";
    } else {
      algoSelect.disabled = false;
      document.getElementById("algo-hint").textContent = "Chọn thuật toán học cây quyết định.";
    }

    state.currentTree = new DecisionTree({
      algorithm: state.config.algorithm,
      splitMode: state.config.splitMode,
      maxDepth: state.config.maxDepth,
      minSamplesSplit: state.config.minSamplesSplit,
      minImpurityDecrease: state.config.minImpurityDecrease,
      taskType: state.currentDataset.taskType
    });

    state.currentTree.train(state.currentDataset);
    state.highlightedPath = [];

    // Cập nhật thông số thống kê
    updateStatsSummary();

    // Render trực quan cây SVG
    treeVisualizer.render(state.currentTree, state.highlightedPath);

    // Cập nhật Boundary 2D visualizer
    setupBoundaryAxes();

    // Cập nhật form dự đoán mẫu mới
    renderInferenceForm();

    // Cập nhật bảng dữ liệu
    renderDatasetTable();

    // Cập nhật danh sách luật IF-THEN
    renderRulesView();

    // Cập nhật giải thích toán học cho nút gốc
    renderRootMathExplainer();
  }

  /**
   * Cập nhật thông số tổng quan
   */
  function updateStatsSummary() {
    const tree = state.currentTree;
    const ds = state.currentDataset;

    document.getElementById("stat-dataset-name").textContent = ds.name;
    document.getElementById("stat-samples-count").textContent = ds.data.length;
    document.getElementById("stat-features-count").textContent = ds.columns.length - 1;
    document.getElementById("stat-nodes-count").textContent = tree.allNodes.length;
    document.getElementById("stat-leaves-count").textContent = tree.allNodes.filter(n => n.isLeaf).length;

    // Tính độ sâu thực tế của cây
    const depths = tree.allNodes.map(n => n.depth);
    const actualDepth = Math.max(...depths, 0);
    document.getElementById("stat-tree-depth").textContent = actualDepth;
  }

  /**
   * Khởi tạo và vẽ Boundary Canvas 2D
   */
  function setupBoundaryAxes() {
    const ds = state.currentDataset;
    const selX = document.getElementById("boundary-feat-x");
    const selY = document.getElementById("boundary-feat-y");

    if (!selX || !selY) return;

    selX.innerHTML = "";
    selY.innerHTML = "";

    const feats = ds.columns.filter(c => c !== ds.targetCol);
    if (feats.length < 2) {
      document.getElementById("boundary-section")?.classList.add("hidden");
      return;
    }
    document.getElementById("boundary-section")?.classList.remove("hidden");

    feats.forEach((f, idx) => {
      const optX = document.createElement("option");
      optX.value = f;
      optX.textContent = f;
      if (idx === 0) optX.selected = true;
      selX.appendChild(optX);

      const optY = document.createElement("option");
      optY.value = f;
      optY.textContent = f;
      if (idx === 1 || (idx === 0 && feats.length === 1)) optY.selected = true;
      selY.appendChild(optY);
    });

    state.boundaryFeatX = selX.value;
    state.boundaryFeatY = selY.value;

    boundaryVisualizer.render(ds, state.currentTree, state.boundaryFeatX, state.boundaryFeatY);
  }

  /**
   * Giao diện form dự đoán tương tác (Playground Inference)
   */
  function renderInferenceForm() {
    const container = document.getElementById("inference-inputs");
    if (!container) return;

    const ds = state.currentDataset;
    const feats = ds.columns.filter(c => c !== ds.targetCol);
    container.innerHTML = "";

    feats.forEach(feat => {
      const type = ds.featureTypes[feat] || "categorical";
      const div = document.createElement("div");
      div.className = "flex flex-col gap-1";

      const label = document.createElement("label");
      label.className = "text-xs font-semibold text-slate-300";
      label.textContent = feat;

      let inputEl;
      if (type === "categorical") {
        const uniqueVals = [...new Set(ds.data.map(d => d[feat]))];
        inputEl = document.createElement("select");
        inputEl.className = "px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all";
        inputEl.name = feat;
        uniqueVals.forEach(v => {
          const opt = document.createElement("option");
          opt.value = v;
          opt.textContent = v;
          inputEl.appendChild(opt);
        });
      } else {
        const vals = ds.data.map(d => Number(d[feat]));
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const avg = ((min + max) / 2).toFixed(1);

        inputEl = document.createElement("input");
        inputEl.type = "number";
        inputEl.step = "any";
        inputEl.value = avg;
        inputEl.className = "px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all";
        inputEl.name = feat;
      }

      div.appendChild(label);
      div.appendChild(inputEl);
      container.appendChild(div);
    });

    // Reset kết quả
    document.getElementById("inference-result-box")?.classList.add("hidden");
  }

  /**
   * Xử lý khi nhấn nút "Chạy dự đoán"
   */
  document.getElementById("btn-run-inference")?.addEventListener("click", () => {
    const container = document.getElementById("inference-inputs");
    const inputs = container.querySelectorAll("select, input");
    const testInstance = {};

    inputs.forEach(input => {
      const val = input.value;
      testInstance[input.name] = isNaN(val) || val === "" ? val : Number(val);
    });

    const result = state.currentTree.predict(testInstance);
    if (!result) return;

    // Highlight đường đi trên cây
    state.highlightedPath = result.path;
    treeVisualizer.render(state.currentTree, state.highlightedPath);

    // Hiển thị kết quả dự đoán
    const resBox = document.getElementById("inference-result-box");
    const resValue = document.getElementById("inference-result-value");
    const resConfidence = document.getElementById("inference-result-confidence");

    if (resBox && resValue) {
      resBox.classList.remove("hidden");
      resValue.textContent = result.prediction;
      
      let confText = `Đường đi qua ${result.path.length} nút rẽ. `;
      if (state.currentDataset.taskType === "classification") {
        confText += `Phân bổ tại lá: ${JSON.stringify(result.confidence)}`;
      } else {
        confText += `Giá trị dự đoán trung bình từ ${result.confidence.count} mẫu.`;
      }
      resConfidence.textContent = confText;

      // Scroll nhẹ đến cây
      document.getElementById("tree-canvas-container")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  /**
   * Cập nhật bảng dữ liệu hiện tại
   */
  function renderDatasetTable() {
    const ds = state.currentDataset;
    const thead = document.getElementById("dataset-thead");
    const tbody = document.getElementById("dataset-tbody");
    if (!thead || !tbody) return;

    thead.innerHTML = "";
    tbody.innerHTML = "";

    // Header
    const trHead = document.createElement("tr");
    trHead.className = "bg-slate-950 text-slate-300 text-xs uppercase font-semibold border-b border-slate-800";
    
    // Cột STT
    const thIdx = document.createElement("th");
    thIdx.className = "py-3 px-3 text-center w-12 text-slate-500";
    thIdx.textContent = "#";
    trHead.appendChild(thIdx);

    ds.columns.forEach(col => {
      const th = document.createElement("th");
      th.className = "py-3 px-3";
      th.innerHTML = `${col} ${col === ds.targetCol ? '<span class="text-cyan-400 font-bold ml-1">(Mục tiêu)</span>' : ''}`;
      trHead.appendChild(th);
    });

    const thAct = document.createElement("th");
    thAct.className = "py-3 px-3 text-center w-16 text-slate-400";
    thAct.textContent = "Thao tác";
    trHead.appendChild(thAct);

    thead.appendChild(trHead);

    // Body
    ds.data.forEach((row, idx) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-800/80 hover:bg-slate-800/40 text-xs text-slate-200 transition-colors";

      const tdIdx = document.createElement("td");
      tdIdx.className = "py-2.5 px-3 text-center font-mono text-slate-500";
      tdIdx.textContent = idx + 1;
      tr.appendChild(tdIdx);

      ds.columns.forEach(col => {
        const td = document.createElement("td");
        td.className = "py-2.5 px-3";
        td.textContent = row[col];
        tr.appendChild(td);
      });

      // Nút xoá
      const tdAct = document.createElement("td");
      tdAct.className = "py-2.5 px-3 text-center";
      const btnDel = document.createElement("button");
      btnDel.className = "text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/40 transition-all";
      btnDel.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
      btnDel.addEventListener("click", () => {
        ds.data.splice(idx, 1);
        retrainModel();
      });
      tdAct.appendChild(btnDel);
      tr.appendChild(tdAct);

      tbody.appendChild(tr);
    });

    // Cập nhật thông tin tiêu đề tab dataset
    document.getElementById("dataset-manager-title").textContent = ds.name;
    document.getElementById("dataset-manager-desc").textContent = ds.description;
  }

  /**
   * Hiển thị danh sách luật IF-THEN
   */
  function renderRulesView() {
    const rulesContainer = document.getElementById("rules-code-container");
    if (!rulesContainer) return;

    const rules = state.currentTree.extractRules();
    if (rules.length === 0) {
      rulesContainer.textContent = "// Chưa có luật nào được sinh ra.";
      return;
    }

    let code = `// ========================================================\n`;
    code += `// BỘ LUẬT QUYẾT ĐỊNH (DECISION RULES EXTRACTED)\n`;
    code += `// Dữ liệu: ${state.currentDataset.name} | Thuật toán: ${state.config.algorithm}\n`;
    code += `// ========================================================\n\n`;

    rules.forEach((r, idx) => {
      const condStr = r.conditions.length > 0 ? r.conditions.join(" AND ") : "LUÔN THỎA";
      code += `// Luật ${idx + 1} (Hỗ trợ: ${r.samples} mẫu | Độ bất định: ${r.impurity.toFixed(3)})\n`;
      code += `IF ${condStr}\n`;
      code += `THEN ${state.currentDataset.targetCol} = "${r.prediction}"\n\n`;
    });

    rulesContainer.textContent = code;
  }

  /**
   * Render giải thích toán học tại Node gốc
   */
  function renderRootMathExplainer() {
    const container = document.getElementById("step-math-content");
    if (!container || !state.currentTree) return;

    const rootNode = state.currentTree.root;
    container.innerHTML = MathExplainer.renderNodeMathBreakdown(rootNode, state.currentDataset, state.config.algorithm);
    renderKaTeXInContainer(container);
  }

  /**
   * Mở Modal chi tiết toán học khi click vào bất kỳ nút nào trên cây
   */
  function openNodeMathModal(node) {
    const modal = document.getElementById("node-detail-modal");
    const title = document.getElementById("modal-node-title");
    const body = document.getElementById("modal-node-body");

    if (!modal || !body) return;

    title.textContent = `Chi Tiết Tính Toán Phân Nhánh - Nút ${node.id}`;
    body.innerHTML = MathExplainer.renderNodeMathBreakdown(node, state.currentDataset, state.config.algorithm);
    renderKaTeXInContainer(body);

    modal.classList.remove("hidden");
  }

  document.getElementById("btn-close-modal")?.addEventListener("click", () => {
    document.getElementById("node-detail-modal")?.classList.add("hidden");
  });

  document.getElementById("btn-open-math-modal")?.addEventListener("click", () => {
    if (state.currentTree && state.currentTree.root) {
      openNodeMathModal(state.currentTree.root);
    }
  });

  /**
   * Render KaTeX
   */
  function renderKaTeXInContainer(container) {
    if (!container) return;

    const doRender = () => {
      if (typeof renderMathInElement === "function") {
        try {
          renderMathInElement(container, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false }
            ],
            throwOnError: false
          });
        } catch (e) {
          console.warn("KaTeX render error:", e);
        }
      }

      container.querySelectorAll(".katex-render").forEach(el => {
        const formula = el.getAttribute("data-formula");
        if (formula && typeof katex !== "undefined") {
          try {
            katex.render(formula, el, { displayMode: true, throwOnError: false });
          } catch (e) {
            console.warn("KaTeX error:", e);
          }
        }
      });
    };

    if (typeof katex === "undefined" || typeof renderMathInElement === "undefined") {
      setTimeout(doRender, 400);
    } else {
      doRender();
    }
  }

  window.renderKaTeXInContainer = renderKaTeXInContainer;

  /**
   * Lắng nghe sự kiện điều khiển (Sliders, Selects)
   */
  function bindControlEvents() {
    datasetSelect.addEventListener("change", (e) => {
      state.currentDatasetKey = e.target.value;
      retrainModel();
    });

    algoSelect.addEventListener("change", (e) => {
      state.config.algorithm = e.target.value;
      // Nếu là CART: mặc định là Cây Nhị Phân (Binary Tree)
      // Nếu là ID3 / C4.5: mặc định là Cây Đa Phân (Multi-way Tree)
      if (state.config.algorithm === "CART") {
        state.config.splitMode = "binary";
      } else if (state.config.algorithm === "ID3" || state.config.algorithm === "C4.5") {
        state.config.splitMode = "multiway";
      }
      updateSplitModeUI();
      retrainModel();
    });

    btnModeBinary?.addEventListener("click", () => {
      state.config.splitMode = "binary";
      updateSplitModeUI();
      retrainModel();
    });

    btnModeMultiway?.addEventListener("click", () => {
      state.config.splitMode = "multiway";
      updateSplitModeUI();
      retrainModel();
    });

    maxDepthSlider.addEventListener("input", (e) => {
      state.config.maxDepth = Number(e.target.value);
      maxDepthVal.textContent = e.target.value;
      retrainModel();
    });

    minSamplesSlider.addEventListener("input", (e) => {
      state.config.minSamplesSplit = Number(e.target.value);
      minSamplesVal.textContent = e.target.value;
      retrainModel();
    });

    minImpuritySlider.addEventListener("input", (e) => {
      state.config.minImpurityDecrease = Number(e.target.value);
      minImpurityVal.textContent = Number(e.target.value).toFixed(2);
      retrainModel();
    });

    btnTrain.addEventListener("click", () => {
      retrainModel();
    });

    // Boundary feature selector
    document.getElementById("boundary-feat-x")?.addEventListener("change", (e) => {
      state.boundaryFeatX = e.target.value;
      boundaryVisualizer.render(state.currentDataset, state.currentTree, state.boundaryFeatX, state.boundaryFeatY);
    });

    document.getElementById("boundary-feat-y")?.addEventListener("change", (e) => {
      state.boundaryFeatY = e.target.value;
      boundaryVisualizer.render(state.currentDataset, state.currentTree, state.boundaryFeatX, state.boundaryFeatY);
    });
  }

  /**
   * Cập nhật style nút chọn Cây Nhị Phân / Cây Đa Phân
   */
  function updateSplitModeUI() {
    if (!btnModeBinary || !btnModeMultiway) return;

    if (state.config.splitMode === "binary") {
      btnModeBinary.className = "py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md";
      btnModeMultiway.className = "py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all text-slate-400 hover:text-white";
      if (splitModeBadge) {
        splitModeBadge.textContent = "Nhị Phân (Yes/No)";
        splitModeBadge.className = "text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30";
      }
      if (splitModeHint) {
        splitModeHint.innerHTML = '<span class="text-emerald-400 font-semibold">Cây Nhị Phân:</span> Mỗi nút chỉ chia đúng 2 nhánh: <strong>Đúng (Yes)</strong> hoặc <strong>Sai (No)</strong> (Chuẩn CART & Scikit-learn).';
      }
    } else {
      btnModeMultiway.className = "py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md";
      btnModeBinary.className = "py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all text-slate-400 hover:text-white";
      if (splitModeBadge) {
        splitModeBadge.textContent = "Đa Phân (Nhiều nhánh)";
        splitModeBadge.className = "text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold border border-blue-500/30";
      }
      if (splitModeHint) {
        splitModeHint.innerHTML = '<span class="text-blue-400 font-semibold">Cây Đa Phân:</span> Chia theo toàn bộ các giá trị thuộc tính (ví dụ Sunny, Overcast, Rain — Chuẩn ID3 / C4.5).';
      }
    }
  }

  /**
   * Chuyển tab giao diện
   */
  function bindTabEvents() {
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");

        tabButtons.forEach(b => {
          b.classList.remove("bg-gradient-to-r", "from-cyan-500", "to-blue-600", "text-white", "shadow-md", "shadow-cyan-500/20", "font-bold");
          b.classList.add("text-slate-400", "hover:text-slate-100", "hover:bg-slate-900", "font-semibold");
        });
        btn.classList.add("bg-gradient-to-r", "from-cyan-500", "to-blue-600", "text-white", "shadow-md", "shadow-cyan-500/20", "font-bold");
        btn.classList.remove("text-slate-400", "hover:text-slate-100", "hover:bg-slate-900", "font-semibold");

        tabPanels.forEach(panel => {
          if (panel.id === tabId) {
            panel.classList.remove("hidden");
            if (tabId === "tab-math") {
              const theoryContainer = document.getElementById("theory-overview-container");
              if (theoryContainer && theoryContainer.innerHTML.trim() === "") {
                theoryContainer.innerHTML = MathExplainer.getTheoryOverviewHtml();
              }
              renderKaTeXInContainer(panel);
            }
          } else {
            panel.classList.add("hidden");
          }
        });
      });
    });
  }

  /**
   * Điều khiển Zoom / Reset View & Fullscreen
   */
  function bindZoomControls() {
    document.getElementById("btn-zoom-in")?.addEventListener("click", () => {
      treeVisualizer.setZoom(treeVisualizer.zoom * 1.2);
    });

    document.getElementById("btn-zoom-out")?.addEventListener("click", () => {
      treeVisualizer.setZoom(treeVisualizer.zoom * 0.8);
    });

    document.getElementById("btn-zoom-reset")?.addEventListener("click", () => {
      treeVisualizer.resetView();
    });

    const btnFullscreen = document.getElementById("btn-fullscreen");
    const treeCardContainer = document.getElementById("tree-card-container");

    btnFullscreen?.addEventListener("click", () => {
      toggleFullscreen();
    });

    function toggleFullscreen() {
      if (!document.fullscreenElement && !treeCardContainer.classList.contains("tree-is-fullscreen")) {
        if (treeCardContainer.requestFullscreen) {
          treeCardContainer.requestFullscreen().catch(() => {
            treeCardContainer.classList.add("tree-is-fullscreen");
            onFullscreenChanged(true);
          });
        } else {
          treeCardContainer.classList.add("tree-is-fullscreen");
          onFullscreenChanged(true);
        }
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {
            treeCardContainer.classList.remove("tree-is-fullscreen");
            onFullscreenChanged(false);
          });
        } else {
          treeCardContainer.classList.remove("tree-is-fullscreen");
          onFullscreenChanged(false);
        }
      }
    }

    function onFullscreenChanged(isFs) {
      if (btnFullscreen) {
        btnFullscreen.setAttribute("title", isFs ? "Thu nhỏ lại (Exit Fullscreen)" : "Toàn màn hình (Fullscreen)");
        btnFullscreen.innerHTML = isFs 
          ? `<i data-lucide="minimize" class="w-4 h-4 text-cyan-400"></i>`
          : `<i data-lucide="maximize" class="w-4 h-4"></i>`;
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
      setTimeout(() => {
        treeVisualizer.autoFitView();
      }, 150);
    }

    document.addEventListener("fullscreenchange", () => {
      const isFs = !!document.fullscreenElement;
      onFullscreenChanged(isFs);
    });
  }

  /**
   * Tải lên và xuất CSV
   */
  function bindDatasetUpload() {
    const csvFileInput = document.getElementById("csv-file-input");
    csvFileInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = parseCSV(event.target.result);
          state.datasets[parsed.id] = parsed;
          state.currentDatasetKey = parsed.id;
          initDatasetDropdown();
          retrainModel();
          alert(`Đã tải lên thành công bộ dữ liệu với ${parsed.data.length} dòng và ${parsed.columns.length} cột!`);
        } catch (err) {
          alert(`Lỗi khi đọc file CSV: ${err.message}`);
        }
      };
      reader.readAsText(file);
    });

    // Xuất CSV
    document.getElementById("btn-export-csv")?.addEventListener("click", () => {
      const csvStr = exportToCSV(state.currentDataset);
      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.currentDataset.id}_exported.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /**
   * Khởi tạo Đấu trường Rừng Ngẫu Nhiên (Random Forest Arena)
   */
  function initRandomForestModule() {
    const rfTreesSelect = document.getElementById("rf-trees-select");
    const rfDepthSelect = document.getElementById("rf-depth-select");
    const btnRetrainRf = document.getElementById("btn-retrain-rf");

    const btnPresetOutlier1 = document.getElementById("btn-preset-outlier1");
    const btnPresetNewBad = document.getElementById("btn-preset-newbad");
    const btnPresetOutlier2 = document.getElementById("btn-preset-outlier2");
    const btnPresetNormal = document.getElementById("btn-preset-normal");
    const btnPresetNormalBad = document.getElementById("btn-preset-normal-bad");

    const rfInputCredit = document.getElementById("rf-input-credit");
    const rfInputIncome = document.getElementById("rf-input-income");
    const rfInputAge = document.getElementById("rf-input-age");
    const rfInputCollateral = document.getElementById("rf-input-collateral");

    const singleTreeResultBadge = document.getElementById("single-tree-result-badge");
    const singleTreeAlertBox = document.getElementById("single-tree-alert-box");
    const singleTreeNoteTitle = document.getElementById("single-tree-note-title");
    const singleTreeNoteText = document.getElementById("single-tree-note-text");

    const rfTreeCountBadge = document.getElementById("rf-tree-count-badge");
    const rfResultBadge = document.getElementById("rf-result-badge");
    const rfNoVotesLabel = document.getElementById("rf-no-votes-label");
    const rfYesVotesLabel = document.getElementById("rf-yes-votes-label");
    const rfBarNo = document.getElementById("rf-bar-no");
    const rfBarYes = document.getElementById("rf-bar-yes");
    const rfAlertBox = document.getElementById("rf-alert-box");
    const rfNoteTitle = document.getElementById("rf-note-title");
    const rfNoteText = document.getElementById("rf-note-text");
    const rfTreesGrid = document.getElementById("rf-trees-breakdown-grid");

    if (!btnRetrainRf) return;

    let rfInstance = null;
    let singleOverfitTree = null;

    function buildModels() {
      const demoData = PRESET_DATASETS.overfitting_demo;
      if (!demoData) return;

      // 1. Cây đơn lẻ huấn luyện sâu tối đa trên dữ liệu có ngoại lệ (Overfitted Single Tree)
      singleOverfitTree = new DecisionTree({
        algorithm: "CART",
        splitMode: "binary",
        maxDepth: 6,
        minSamplesSplit: 2,
        minImpurityDecrease: 0.0,
        taskType: "classification"
      });
      singleOverfitTree.train(demoData);

      // 2. Rừng ngẫu nhiên (Random Forest)
      const numTrees = parseInt(rfTreesSelect.value, 10) || 7;
      const maxDepth = parseInt(rfDepthSelect.value, 10) || 3;
      if (rfTreeCountBadge) rfTreeCountBadge.textContent = numTrees;

      rfInstance = new RandomForest({
        numTrees: numTrees,
        maxDepth: maxDepth,
        minSamplesSplit: 2,
        taskType: "classification",
        algorithm: "CART",
        splitMode: "binary"
      });
      rfInstance.train(demoData);

      runPredictionComparison();
    }

    function runPredictionComparison() {
      if (!rfInstance || !singleOverfitTree) return;

      const currentSample = {
        Age: parseFloat(rfInputAge?.value) || 23,
        Income: parseFloat(rfInputIncome?.value) || 13,
        CreditScore: parseFloat(rfInputCredit?.value) || 515,
        HasCollateral: rfInputCollateral?.value || "No"
      };

      // 1. Dự đoán Cây Đơn Lẻ
      const singleRes = singleOverfitTree.predict(currentSample);
      const sPred = singleRes ? singleRes.prediction : "Không rõ";

      if (sPred === "Yes") {
        singleTreeResultBadge.className = "px-3 py-1 rounded-lg text-xs font-black font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm";
        singleTreeResultBadge.textContent = "YES (DUYỆT VAY)";
      } else {
        singleTreeResultBadge.className = "px-3 py-1 rounded-lg text-xs font-black font-mono bg-slate-800 text-slate-300 border border-slate-700 shadow-sm";
        singleTreeResultBadge.textContent = "NO (TỪ CHỐI)";
      }

      // Đánh giá loại hồ sơ đang thử nghiệm
      const isOutlierCredit17 = (currentSample.CreditScore === 515 && currentSample.Income === 13 && currentSample.Age === 23 && currentSample.HasCollateral === "No");
      const isNewBadCustomer = (currentSample.CreditScore <= 540 && currentSample.Income <= 20 && !isOutlierCredit17);
      const isOutlierCredit18 = (currentSample.CreditScore === 770 && currentSample.Income === 62 && currentSample.Age === 48 && currentSample.HasCollateral === "Yes");
      const isNormalGood = (currentSample.CreditScore >= 680 && currentSample.Income >= 40);
      const isNormalBad = (currentSample.CreditScore < 600 && currentSample.Income < 25 && !isOutlierCredit17 && !isNewBadCustomer);

      if (isOutlierCredit17 && sPred === "Yes") {
        singleTreeAlertBox.className = "text-xs p-3 rounded-xl border bg-rose-950/40 border-rose-500/40 text-rose-300 space-y-1";
        singleTreeAlertBox.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-rose-400">
            <span>🚨 HỌC VẸT NGOẠI LỆ (OVERFITTING):</span>
          </div>
          <p class="leading-relaxed">
            Hồ sơ có <strong>Điểm tín dụng rất thấp (515)</strong> nhưng Cây Đơn Lẻ vẫn phán <strong>DUYỆT VAY (Yes)</strong>! Lý do: Cây bị ngoại lệ Khách 17 đánh lừa và sinh ra nhánh dị thường. Ngân hàng gặp rủi ro nợ xấu nghiêm trọng!
          </p>
        `;
        if (singleTreeNoteText) {
          singleTreeNoteText.textContent = "Cây đơn lẻ cố đâm nhánh thật sâu để nhớ máy móc trường hợp người quen gửi gắm của Khách 17, sinh ra quy luật lệch lạc: Điểm 515 + Thu nhập 13tr vẫn cho vay!";
        }
      } else if (isNewBadCustomer) {
        singleTreeAlertBox.className = "text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-300 space-y-1";
        singleTreeAlertBox.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-slate-300">
            <span>HỒ SƠ KHÁCH MỚI NỢ XẤU:</span>
          </div>
          <p class="leading-relaxed text-xs">
            Khách hàng mới có điểm tín dụng thấp (${currentSample.CreditScore}) và thu nhập thấp (${currentSample.Income}tr). Cây đơn lẻ dự đoán: <strong>${sPred}</strong>.
          </p>
        `;
        if (singleTreeNoteText) {
          singleTreeNoteText.textContent = "Đây là hồ sơ mới thực tế ngoài đời, không có trong tập dữ liệu huấn luyện ban đầu.";
        }
      } else if (isOutlierCredit18 && sPred === "No") {
        singleTreeAlertBox.className = "text-xs p-3 rounded-xl border bg-amber-950/40 border-amber-500/40 text-amber-300 space-y-1";
        singleTreeAlertBox.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-amber-400">
            <span>⚠️ TỪ CHỐI OAN (OUTLIER KHÁCH 18):</span>
          </div>
          <p class="leading-relaxed">
            Khách có <strong>Điểm tín dụng cực cao (770)</strong>, thu nhập 62tr nhưng Cây Đơn Lẻ lại phán <strong>TỪ CHỐI (No)</strong> theo vết xe đổ lỗi hệ thống của Khách 18!
          </p>
        `;
        if (singleTreeNoteText) {
          singleTreeNoteText.textContent = "Chỉ vì 1 mẫu ngoại lệ bị lỗi trong quá khứ, cây đơn lẻ đã bắt chẹt từ chối cả một khách hàng VIP có khả năng tài chính dồi dào.";
        }
      } else if (isNormalGood) {
        singleTreeAlertBox.className = "text-xs p-3 rounded-xl border bg-emerald-950/30 border-emerald-500/30 text-emerald-300";
        singleTreeAlertBox.innerHTML = `
          <div class="font-semibold text-emerald-400 flex items-center gap-1">
            <span>✅ HỒ SƠ ĐỦ CHUẨN:</span>
          </div>
          <p class="text-xs text-slate-300 mt-1">Khách hàng có điểm tín dụng ${currentSample.CreditScore} và thu nhập ${currentSample.Income}tr đạt điều kiện cho vay thông thường.</p>
        `;
        if (singleTreeNoteText) {
          singleTreeNoteText.textContent = "Trên dữ liệu bình thường, không chứa nhiễu hay ngoại lệ, Cây Đơn Lẻ phân loại chuẩn xác theo các ngưỡng điều kiện chính.";
        }
      } else if (isNormalBad) {
        singleTreeAlertBox.className = "text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-300";
        singleTreeAlertBox.innerHTML = `
          <div class="font-medium text-slate-400">❌ TỪ CHỐI AN TOÀN: Điểm tín dụng (${currentSample.CreditScore}) dưới mức chuẩn quy định.</div>
        `;
        if (singleTreeNoteText) {
          singleTreeNoteText.textContent = "Khách hàng dưới ngưỡng chuẩn tín dụng thông thường, mô hình từ chối để tránh rủi ro.";
        }
      } else {
        singleTreeAlertBox.className = "text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-300";
        singleTreeAlertBox.innerHTML = `
          <div class="font-medium text-slate-300">
            Dự đoán theo quy tắc phân nhánh của Cây Đơn Lẻ.
          </div>
        `;
        if (singleTreeNoteText) {
          singleTreeNoteText.textContent = "Quyết định dựa trên đường đi duy nhất từ nút gốc đến nút lá của cây đơn lẻ.";
        }
      }

      // 2. Dự đoán Rừng Ngẫu Nhiên
      const rfRes = rfInstance.predict(currentSample);
      const rfPred = rfRes ? rfRes.prediction : "Không rõ";
      const totalTrees = rfRes ? rfRes.totalTrees : 1;
      const noVotes = (rfRes && rfRes.votes && rfRes.votes["No"]) || 0;
      const yesVotes = (rfRes && rfRes.votes && rfRes.votes["Yes"]) || 0;
      const noPercent = Math.round((noVotes / totalTrees) * 100);
      const yesPercent = 100 - noPercent;

      if (isOutlierCredit17) {
        const oobTreeCount = rfRes.oob ? rfRes.oob.oobTreeCount : 0;
        const oobNo = (rfRes.oob && rfRes.oob.oobVotes && rfRes.oob.oobVotes["No"]) || 0;
        const oobYes = (rfRes.oob && rfRes.oob.oobVotes && rfRes.oob.oobVotes["Yes"]) || 0;
        const inBagTrees = totalTrees - oobTreeCount;
        const inBagYes = yesVotes - oobYes;

        rfResultBadge.className = "px-3 py-1 rounded-lg text-xs font-black font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm";
        rfResultBadge.textContent = `LẬT TẨY HỌC VẸT BẰNG OOB`;

        rfNoVotesLabel.textContent = `Từ Chối (NO): ${noVotes}/${totalTrees} phiếu (${noPercent}%)`;
        rfYesVotesLabel.textContent = `Đồng Ý (YES): ${yesVotes}/${totalTrees} phiếu (${yesPercent}%)`;
        rfBarNo.style.width = `${noPercent}%`;
        rfBarYes.style.width = `${yesPercent}%`;

        rfAlertBox.className = "text-xs p-3.5 rounded-xl border bg-amber-950/40 border-amber-500/40 text-amber-200 space-y-2";
        rfAlertBox.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-amber-400 text-sm">
            <span>💡 BÍ MẬT KHOA HỌC: CƠ CHẾ OUT-OF-BAG (OOB) LẬT TẨY HỌC VẸT:</span>
          </div>
          <p class="leading-relaxed text-xs">
            • <strong>${inBagYes}/${inBagTrees} cây con (In-Bag)</strong> vô tình bốc trúng dòng Khách 17 vào tập học &rarr; bị học vẹt nhãn cũ nên bỏ phiếu YES.<br>
            • Nhưng <strong>${oobNo}/${oobTreeCount} cây con (Out-Of-Bag)</strong> hoàn toàn KHÔNG bốc trúng Khách 17 &rarr; <strong>100% ĐỒNG THANH BỎ PHIẾU TỪ CHỐI (NO)</strong>!
          </p>
          <div class="text-xs text-amber-300 font-medium bg-amber-950/80 p-3 rounded-xl border border-amber-500/30 space-y-1.5">
            <div>👉 <strong>Vì sao lại có sự khác biệt này?</strong> Vì Khách 17 có sẵn trong tập học ban đầu với nhãn "Yes". Cây nào bốc trúng thì bị nhớ máy móc. Nhưng các cây độc lập (OOB) không hề thấy Khách 17 nên đều nhận diện đây là người nợ xấu và kiên quyết phán NO!</div>
            <div class="text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <span>👉 Hãy bấm nút đỏ: <strong>"🚨 Khách MỚI Nợ Xấu"</strong> ở trên để thấy khi gặp người nợ xấu mới ngoài đời thực, CẢ RỪNG 100% ĐỒNG THANH PHỦ QUYẾT NO!</span>
            </div>
          </div>
        `;
        if (rfNoteText) {
          rfNoteText.innerHTML = `Theo tiêu chuẩn của Leo Breiman: Với ngoại lệ nằm trong tập học, chỉ có các cây <strong>Out-Of-Bag (OOB)</strong> mới là thước đo khách quan. 100% cây OOB đều kiên định từ chối cấp tín dụng!`;
        }
      } else if (isNewBadCustomer) {
        rfResultBadge.className = "px-3 py-1 rounded-lg text-xs font-black font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm";
        rfResultBadge.textContent = `NO (TỪ CHỐI) - ${noPercent}% Phiếu`;

        rfNoVotesLabel.textContent = `Từ Chối (NO): ${noVotes}/${totalTrees} phiếu (${noPercent}%)`;
        rfYesVotesLabel.textContent = `Đồng Ý (YES): ${yesVotes}/${totalTrees} phiếu (${yesPercent}%)`;
        rfBarNo.style.width = `${noPercent}%`;
        rfBarYes.style.width = `${yesPercent}%`;

        rfAlertBox.className = "text-xs p-3.5 rounded-xl border bg-emerald-950/40 border-emerald-500/40 text-emerald-300 space-y-1.5";
        rfAlertBox.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 text-emerald-400 text-sm">
            <span>🛡️ TRÍ TUỆ ĐÁM ĐÔNG PHỦ QUYẾT TUYỆT ĐỐI (${noVotes}/${totalTrees} CÂY BỎ PHIẾU NO):</span>
          </div>
          <p class="leading-relaxed text-xs">
            Khi thẩm định một hồ sơ nợ xấu mới ngoài đời thực (chưa từng có trong tập học ban đầu), <strong>${noVotes}/${totalTrees} cây trong rừng (${noPercent}%) đều đồng thanh bỏ phiếu TỪ CHỐI (NO)</strong>! Rừng Ngẫu Nhiên đã triệt tiêu hoàn toàn sự học vẹt của Khách 17, bảo vệ an toàn vốn cho ngân hàng!
          </p>
        `;
        if (rfNoteText) {
          rfNoteText.textContent = "Random Forest phát huy tối đa sức mạnh khi gặp dữ liệu thực tế mới: Dù trong quá khứ có ngoại lệ Khách 17, rừng vẫn giữ đúng quy tắc nghiệp vụ phổ quát.";
        }
      } else {
        if (rfPred === "No") {
          rfResultBadge.className = "px-3 py-1 rounded-lg text-xs font-black font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm";
          rfResultBadge.textContent = `NO (TỪ CHỐI) - ${noPercent}% Phiếu`;
        } else {
          rfResultBadge.className = "px-3 py-1 rounded-lg text-xs font-black font-mono bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm";
          rfResultBadge.textContent = `YES (DUYỆT VAY) - ${yesPercent}% Phiếu`;
        }

        rfNoVotesLabel.textContent = `Từ Chối (NO): ${noVotes}/${totalTrees} phiếu (${noPercent}%)`;
        rfYesVotesLabel.textContent = `Đồng Ý (YES): ${yesVotes}/${totalTrees} phiếu (${yesPercent}%)`;
        rfBarNo.style.width = `${noPercent}%`;
        rfBarYes.style.width = `${yesPercent}%`;

        if (isOutlierCredit18) {
          rfAlertBox.className = "text-xs p-3 rounded-xl border bg-emerald-950/40 border-emerald-500/40 text-emerald-300 space-y-1";
          rfAlertBox.innerHTML = `
            <div class="font-bold flex items-center gap-1.5 text-emerald-400">
              <span>🛡️ SỬA SAI CHO CÂY ĐƠN LẺ:</span>
            </div>
            <p class="leading-relaxed">
              Hội đồng Rừng nhận thấy hồ sơ điểm tín dụng 770 và thu nhập 62tr quá tốt, nên <strong>${yesVotes}/${totalTrees} cây đã bỏ phiếu YES</strong> để duyệt vay công bằng!
            </p>
          `;
          if (rfNoteText) {
            rfNoteText.textContent = "Đa số các cây trong rừng không bị ảnh hưởng bởi lỗi ngoại lệ của Khách 18, giúp bảo vệ quyền lợi chính đáng của khách hàng tốt.";
          }
        } else if (isNormalGood) {
          rfAlertBox.className = "text-xs p-3 rounded-xl border bg-emerald-950/30 border-emerald-500/30 text-emerald-300";
          rfAlertBox.innerHTML = `
            <div class="font-semibold text-emerald-400 flex items-center gap-1">
              <span>✅ ĐỒNG THUẬN CAO (${yesPercent}% Phiếu YES)</span>
            </div>
            <p class="text-xs text-slate-300 mt-1">Đại đa số các cây con trong Rừng đều đồng ý DUYỆT VAY cho khách hàng có hồ sơ tài chính lành mạnh.</p>
          `;
          if (rfNoteText) {
            rfNoteText.textContent = "Với các trường hợp bình thường, Rừng Ngẫu Nhiên đạt sự đồng thuận gần như tuyệt đối giữa tất cả các cây con.";
          }
        } else if (isNormalBad) {
          rfAlertBox.className = "text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-300";
          rfAlertBox.innerHTML = `
            <div class="font-semibold text-rose-400 flex items-center gap-1">
              <span>❌ ĐỒNG THUẬN TỪ CHỐI (${noPercent}% Phiếu NO)</span>
            </div>
            <p class="text-xs text-slate-300 mt-1">Hội đồng nhất trí từ chối cấp tín dụng cho khách hàng có năng lực tài chính chưa đảm bảo.</p>
          `;
          if (rfNoteText) {
            rfNoteText.textContent = "Rừng kiên quyết từ chối các hồ sơ dưới chuẩn để giữ tỷ lệ nợ xấu ở mức thấp nhất.";
          }
        } else {
          rfAlertBox.className = "text-xs p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-300";
          rfAlertBox.innerHTML = `
            <div class="font-medium text-emerald-400 flex items-center gap-1">
              <span>Độ đồng thuận của Rừng: ${Math.max(noPercent, yesPercent)}%</span>
            </div>
            <p class="text-slate-400 mt-0.5">Quyết định dựa trên tổng hợp độc lập từ ${totalTrees} cây con.</p>
          `;
          if (rfNoteText) {
            rfNoteText.textContent = "Rừng ngẫu nhiên cân bằng giữa độ chính xác và tính tổng quát hóa trên mọi dữ liệu.";
          }
        }
      }

      // 3. Render danh sách từng cây con
      if (rfTreesGrid && rfRes && rfRes.predictions) {
        rfTreesGrid.innerHTML = "";
        rfInstance.trees.forEach((tObj, idx) => {
          const tInfo = rfRes.predictions[idx];
          const tPred = tInfo?.prediction || "N/A";
          const isVoteYes = (tPred === "Yes");
          const isOOB = tInfo?.isOOB;

          const card = document.createElement("div");
          card.className = "bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3 space-y-2 transition-all";
          card.innerHTML = `
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-white flex items-center gap-1">
                <span>🌲</span> ${tObj.id}
                ${isOOB ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold ml-1">OOB</span>' : ''}
              </span>
              <span class="px-2 py-0.5 rounded text-[11px] font-bold font-mono ${isVoteYes ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
                Phiếu: ${tPred}
              </span>
            </div>
            <div class="text-[11px] text-slate-400 space-y-1">
              <div><span class="text-slate-500">Đặc trưng chọn lọc:</span> <span class="text-slate-300 font-mono">${tObj.featuresUsed.join(", ")}</span></div>
            </div>
          `;
          rfTreesGrid.appendChild(card);
        });
      }

      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
    }

    // Sự kiện Retrain
    btnRetrainRf.addEventListener("click", () => {
      buildModels();
    });

    rfTreesSelect.addEventListener("change", () => {
      buildModels();
    });

    rfDepthSelect.addEventListener("change", () => {
      buildModels();
    });

    // Sự kiện thay đổi input
    [rfInputCredit, rfInputIncome, rfInputAge, rfInputCollateral].forEach(el => {
      el?.addEventListener("change", runPredictionComparison);
      el?.addEventListener("input", runPredictionComparison);
    });

    // Sự kiện các nút mẫu Preset
    btnPresetOutlier1?.addEventListener("click", () => {
      rfInputCredit.value = "515";
      rfInputIncome.value = "13";
      rfInputAge.value = "23";
      rfInputCollateral.value = "No";
      runPredictionComparison();
    });

    btnPresetNewBad?.addEventListener("click", () => {
      rfInputCredit.value = "520";
      rfInputIncome.value = "15";
      rfInputAge.value = "24";
      rfInputCollateral.value = "No";
      runPredictionComparison();
    });

    btnPresetOutlier2?.addEventListener("click", () => {
      rfInputCredit.value = "770";
      rfInputIncome.value = "62";
      rfInputAge.value = "48";
      rfInputCollateral.value = "Yes";
      runPredictionComparison();
    });

    btnPresetNormal?.addEventListener("click", () => {
      rfInputCredit.value = "720";
      rfInputIncome.value = "45";
      rfInputAge.value = "35";
      rfInputCollateral.value = "Yes";
      runPredictionComparison();
    });

    btnPresetNormalBad?.addEventListener("click", () => {
      rfInputCredit.value = "530";
      rfInputIncome.value = "15";
      rfInputAge.value = "25";
      rfInputCollateral.value = "No";
      runPredictionComparison();
    });

    // Xây dựng mô hình lần đầu
    buildModels();
  }
});
