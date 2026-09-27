/**
 * Math Explainer Module - Step-by-step Mathematical Derivation Edition
 * Tự động tạo bài giải chi tiết từng bước, thay số cụ thể vào công thức KaTeX
 * Giải thích rõ ràng nguyên lý chọn Nút Gốc (Root) và các nút con
 */

class MathExplainer {
  /**
   * Sinh bài giải chi tiết từng bước cho Node đang chọn
   */
  static renderNodeMathBreakdown(node, dataset, algorithm) {
    if (!node) return `<p class="text-slate-400">Chưa chọn nút nào.</p>`;

    const trace = node.mathTrace;
    const isLeaf = node.isLeaf;

    if (isLeaf) {
      return `
        <div class="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h4 class="font-bold text-white text-base">Nút Lá (Terminal Leaf Node) - ${node.id}</h4>
          </div>
          <p class="text-sm text-slate-300 mb-4">
            Nút này đã đạt điều kiện dừng (tinh khiết, vượt độ sâu tối đa hoặc không đủ mẫu tối thiểu để phân chia tiếp).
          </p>
          <div class="grid grid-cols-2 gap-3 text-sm bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div><span class="text-slate-400">Kết quả dự đoán:</span> <strong class="text-emerald-400 text-lg ml-2 font-mono">${node.prediction}</strong></div>
            <div><span class="text-slate-400">Số lượng mẫu:</span> <strong class="text-white ml-2">${node.samples}</strong></div>
            <div><span class="text-slate-400">${node.impurityName}:</span> <strong class="text-cyan-400 ml-2 font-mono">${node.impurity.toFixed(4)}</strong></div>
            <div><span class="text-slate-400">Phân bố:</span> <span class="text-slate-300 ml-2 font-mono text-xs">${JSON.stringify(node.distribution)}</span></div>
          </div>
        </div>
      `;
    }

    if (!trace) {
      return `
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-slate-400 text-sm">
          Không có dữ liệu nhật ký phân nhánh chi tiết cho nút này.
        </div>
      `;
    }

    const taskType = dataset.taskType || "classification";
    const totalSamples = node.samples;
    const isRoot = node.depth === 0;
    const nodeRoleName = isRoot ? "NÚT GỐC (ROOT)" : `Nút con (${node.id}, Tầng ${node.depth})`;

    // 1. TÍNH TOÁN BƯỚC 1: ĐỘ BẤT ĐỊNH CỦA TẬP HIỆN TẠI H(S) / Gini(S)
    let step1FormulaHtml = "";
    if (taskType === "classification") {
      const dist = node.distribution;
      const terms = [];
      const giniTerms = [];

      for (const cls in dist) {
        const cnt = dist[cls];
        const p = cnt / totalSamples;
        if (p > 0) {
          terms.push(`\\frac{${cnt}}{${totalSamples}} \\log_2\\left(\\frac{${cnt}}{${totalSamples}}\\right)`);
          giniTerms.push(`\\left(\\frac{${cnt}}{${totalSamples}}\\right)^2`);
        }
      }

      if (algorithm === "CART") {
        step1FormulaHtml = `
          <div class="space-y-2">
            <p class="text-xs text-slate-300">Công thức Gini tại tập mẫu hiện tại $S$ gồm <strong>${totalSamples} mẫu</strong>:</p>
            <div class="katex-render text-sm" data-formula="Gini(S) = 1 - \\sum_{i=1}^{c} p_i^2"></div>
            <p class="text-xs text-slate-300 mt-2">Thay số phân phối nhãn ${JSON.stringify(dist)}:</p>
            <div class="katex-render text-sm font-mono text-cyan-300" data-formula="Gini(S) = 1 - \\left[ ${giniTerms.join(" + ")} \\right] = ${node.impurity.toFixed(4)}"></div>
          </div>
        `;
      } else {
        step1FormulaHtml = `
          <div class="space-y-2">
            <p class="text-xs text-slate-300">Công thức Entropy tại tập mẫu hiện tại $S$ gồm <strong>${totalSamples} mẫu</strong>:</p>
            <div class="katex-render text-sm" data-formula="H(S) = -\\sum_{i=1}^{c} p_i \\log_2(p_i)"></div>
            <p class="text-xs text-slate-300 mt-2">Thay số phân phối nhãn ${JSON.stringify(dist)}:</p>
            <div class="katex-render text-sm font-mono text-cyan-300" data-formula="H(S) = -\\left[ ${terms.join(" + ")} \\right] = ${node.impurity.toFixed(4)}"></div>
          </div>
        `;
      }
    } else {
      step1FormulaHtml = `
        <div class="space-y-2">
          <p class="text-xs text-slate-300">Phương sai (Variance/MSE) tại tập mẫu hiện tại $S$ gồm <strong>${totalSamples} mẫu</strong>:</p>
          <div class="katex-render text-sm" data-formula="Var(S) = \\frac{1}{|S|} \\sum_{i=1}^{|S|} (y_i - \\bar{y})^2 = ${node.impurity.toFixed(4)}"></div>
        </div>
      `;
    }

    const winnerScoreObj = trace.featureScores.find(f => f.feature === trace.winnerFeature) || trace.featureScores[0];

    // 2. BẢNG XẾP HẠNG SO SÁNH TẤT CẢ CÂU HỎI ỨNG CỬ VIÊN (LEADERBOARD)
    const leaderboardRowsHtml = trace.featureScores.map((fs, idx) => {
      const isWinner = fs.feature === trace.winnerFeature || idx === 0;
      const rankBadge = isWinner
        ? `<span class="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold font-mono">🏆 #1 CHIẾN THẮNG</span>`
        : `<span class="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full text-xs font-mono">#${idx + 1}</span>`;

      return `
        <tr class="border-b border-slate-800 ${isWinner ? 'bg-emerald-950/20 font-bold' : 'hover:bg-slate-800/40'}">
          <td class="py-3 px-3">
            <div class="flex items-center gap-2">
              ${rankBadge}
              <span class="text-white text-xs sm:text-sm font-semibold">${fs.feature}</span>
            </div>
          </td>
          <td class="py-3 px-3 text-right font-mono text-xs ${isWinner ? 'text-emerald-400 font-bold' : 'text-slate-300'}">
            ${fs.weightedImpurity.toFixed(4)} ${isWinner ? '<span class="text-[10px] text-emerald-500 block">(Nhỏ nhất)</span>' : ''}
          </td>
          <td class="py-3 px-3 text-right font-mono text-xs ${isWinner ? 'text-cyan-400 font-bold' : 'text-slate-400'}">
            ${fs.score.toFixed(4)} ${isWinner ? '<span class="text-[10px] text-cyan-400 block">(Lớn nhất)</span>' : ''}
          </td>
          <td class="py-3 px-3 text-xs">
            ${isWinner ? '<span class="text-emerald-400 font-bold">🏆 Tốt nhất &rarr; Chọn làm ' + (isRoot ? 'Nút Gốc (Root)' : 'Nút phân nhánh') + '</span>' : '<span class="text-slate-500">Kém hơn</span>'}
          </td>
        </tr>
      `;
    }).join("");

    // 3. DANH SÁCH CHI TIẾT TỪNG BƯỚC CHO TẤT CẢ THUỘC TÍNH (ACCORDIONS)
    const otherFeaturesAccordions = trace.featureScores.map((fs, idx) => {
      const isWinner = fs.feature === trace.winnerFeature;
      const breakdownHtml = this._generateFeatureCalculationBreakdown(fs, node, totalSamples, algorithm, taskType);
      
      return `
        <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 mb-3">
          <button type="button" class="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-900/60 transition-all cursor-pointer font-medium" onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.arrow-icon').classList.toggle('rotate-180'); if(window.renderKaTeXInContainer) window.renderKaTeXInContainer(this.nextElementSibling);">
            <div class="flex items-center gap-3">
              <span class="px-2 py-0.5 rounded-full text-xs font-bold ${isWinner ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}">
                #${idx + 1}
              </span>
              <span class="font-bold text-white text-sm">${fs.feature}</span>
              <span class="text-xs font-mono text-cyan-400 font-semibold ml-2">Gini sau chia: ${fs.weightedImpurity.toFixed(4)} | Gain: ${fs.score.toFixed(4)}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400 hidden sm:inline">Xem phép tính thay số</span>
              <svg class="w-4 h-4 text-slate-400 transform transition-transform arrow-icon ${isWinner ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </button>
          <div class="p-4 border-t border-slate-800/80 bg-slate-900/40 text-xs space-y-4 ${isWinner ? '' : 'hidden'}">
            ${breakdownHtml}
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="space-y-6">
        
        <!-- BẢNG GIẢI THÍCH TỔNG QUAN TẠI SAO CHỌN NÚT GỐC (ROOT) -->
        <div class="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-3">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm">🏆</span>
            <div>
              <h3 class="text-base font-extrabold text-white">
                TẠI SAO CÂY LẠI CHỌN <span class="text-emerald-400 font-mono underline decoration-emerald-400/50">${trace.winnerFeature}</span> LÀM ${nodeRoleName}?
              </h3>
              <p class="text-xs text-slate-300 mt-0.5">
                Cơ chế lựa chọn câu hỏi tối ưu của thuật toán ${algorithm}:
              </p>
            </div>
          </div>

          <div class="p-4 bg-slate-950/80 rounded-xl border border-emerald-500/30 text-xs text-slate-200 leading-relaxed space-y-2">
            <p>
              1. Thuật toán đã thử nghiệm <strong>tất cả các câu hỏi Đúng/Sai khả dĩ</strong> trên tập ${totalSamples} mẫu dữ liệu.
            </p>
            <p>
              2. Tiêu chuẩn vàng để chọn: Thuộc tính/câu hỏi nào làm cho <strong>${algorithm === 'CART' ? 'Gini sau khi chia NHỎ NHẤT' : 'Độ tăng thông tin LỚN NHẤT'}</strong> sẽ được chọn!
            </p>
            <p class="text-emerald-300 font-semibold bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-500/20">
              👉 Kết quả đối đầu: Câu hỏi <span class="text-white font-bold font-mono">${trace.winnerFeature}</span> đạt 
              ${algorithm === 'CART' 
                ? `Gini sau chia <strong>nhỏ nhất = ${winnerScoreObj.weightedImpurity.toFixed(4)}</strong> (tương đương Gini Gain lớn nhất = <strong>${trace.winnerScore.toFixed(4)}</strong>)` 
                : `Điểm số cao nhất = <strong>${trace.winnerScore.toFixed(4)}</strong>`
              }! Nó tạo ra nhánh thuần khiết nhất, loại bỏ sự mù mờ tốt nhất, do đó <strong>chiến thắng tất cả các ứng cử viên còn lại để làm ${nodeRoleName}</strong>.
            </p>
          </div>
        </div>

        <!-- BƯỚC 1: TÍNH ĐỘ BẤT ĐỊNH CỦA TẬP CHA -->
        <div class="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-xs">1</span>
              <div>
                <h4 class="font-bold text-white text-sm uppercase tracking-wide">
                  Bước 1: Tính ${node.impurityName} trước khi chia (${isRoot ? 'TẠI NÚT GỐC - ROOT (N1)' : 'TẠI NÚT CON ' + node.id})
                </h4>
                <p class="text-[11px] text-slate-400 font-normal">
                  ${isRoot 
                    ? `(Ký hiệu <strong>N1</strong> = Nút số 1 / Nút Gốc, chứa toàn bộ <strong>${totalSamples} mẫu dữ liệu</strong> ban đầu)` 
                    : `(Ký hiệu <strong>${node.id}</strong> = Nút con ở Tầng ${node.depth}, chứa <strong>${totalSamples} mẫu dữ liệu</strong> lọc qua nhánh trước)`}
                </p>
              </div>
            </div>
            <span class="text-xs text-cyan-400 font-mono font-bold">${node.impurityName} = ${node.impurity.toFixed(4)}</span>
          </div>
          ${step1FormulaHtml}
        </div>

        <!-- BƯỚC 2: BẢNG SO SÁNH TẤT CẢ ỨNG CỬ VIÊN (LEADERBOARD) -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-indigo-500 text-slate-950 flex items-center justify-center font-black text-xs">2</span>
              <h4 class="font-bold text-white text-sm uppercase tracking-wide">
                Bước 2: Bảng đối đầu điểm số giữa tất cả các câu hỏi ứng cử viên
              </h4>
            </div>
            <span class="text-xs text-slate-400 font-mono">Xếp hạng theo ${trace.metricUsed}</span>
          </div>

          <div class="overflow-x-auto border border-slate-800 rounded-xl">
            <table class="w-full text-left">
              <thead class="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">Câu hỏi phân nhánh</th>
                  <th class="py-2.5 px-3 text-right">${node.impurityName} sau khi chia</th>
                  <th class="py-2.5 px-3 text-right">${trace.metricUsed} (Độ cải thiện)</th>
                  <th class="py-2.5 px-3">Đánh giá</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${leaderboardRowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <!-- BƯỚC 3: CHI TIẾT TÍNH TOÁN THAY SỐ TỪNG NHÁNH YES/NO -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-purple-500 text-slate-950 flex items-center justify-center font-black text-xs">3</span>
              <h4 class="font-bold text-white text-sm uppercase tracking-wide">
                Bước 3: Chi tiết các phép tính thay số của từng câu hỏi
              </h4>
            </div>
            <span class="text-xs text-slate-400">Bấm để mở rộng bài giải</span>
          </div>

          <div class="space-y-2">
            ${otherFeaturesAccordions}
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Sinh các bước tính thay số chi tiết cho một thuộc tính cụ thể
   */
  static _generateFeatureCalculationBreakdown(fs, parentNode, totalN, algorithm, taskType) {
    const branches = fs.branchBreakdowns;
    const parentImp = parentNode.impurity;

    // Chi tiết từng nhánh rẽ:
    const branchCalculations = branches.map(b => {
      const bCount = b.count;
      const bRatio = bCount / totalN;
      let branchMathStr = "";

      if (taskType === "classification") {
        const dist = b.distribution;
        const terms = [];
        for (const cls in dist) {
          const cnt = dist[cls];
          const p = cnt / bCount;
          if (p > 0) {
            if (algorithm === "CART") {
              terms.push(`\\left(\\frac{${cnt}}{${bCount}}\\right)^2`);
            } else {
              terms.push(`\\frac{${cnt}}{${bCount}} \\log_2\\left(\\frac{${cnt}}{${bCount}}\\right)`);
            }
          }
        }

        if (algorithm === "CART") {
          branchMathStr = `Gini = 1 - \\left[ ${terms.join(" + ")} \\right] = ${b.impurity.toFixed(4)}`;
        } else {
          branchMathStr = `H = -\\left[ ${terms.join(" + ")} \\right] = ${b.impurity.toFixed(4)}`;
        }
      } else {
        branchMathStr = `Var = ${b.impurity.toFixed(4)}`;
      }

      const isYesBranch = String(b.value).toLowerCase().startsWith("yes") || String(b.value).toLowerCase().startsWith("đúng");
      const badgeColor = isYesBranch ? "text-emerald-400" : "text-rose-400";

      return `
        <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold ${badgeColor}">Nhánh [${b.value}]:</span>
            <span class="text-slate-400 font-mono">${bCount} mẫu (${(bRatio * 100).toFixed(1)}%)</span>
          </div>
          <div class="text-[11px] text-slate-400 font-mono">Phân bố nhãn: ${JSON.stringify(b.distribution)}</div>
          <div class="katex-render text-xs text-slate-200 mt-1" data-formula="${branchMathStr}"></div>
        </div>
      `;
    }).join("");

    // Tính kỳ vọng có trọng số:
    const weightedTerms = branches.map(b => `\\frac{${b.count}}{${totalN}} \\times ${b.impurity.toFixed(4)}`);
    const impSymbol = algorithm === "CART" ? "Gini_{split}" : "H_{split}";
    const weightedMathStr = `${impSymbol} = ${weightedTerms.join(" + ")} = ${fs.weightedImpurity.toFixed(4)}`;

    // Tính Information Gain / Gini Gain:
    const gainSymbol = algorithm === "CART" ? "\\Delta Gini" : "Gain";
    const gainMathStr = `${gainSymbol} = ${parentImp.toFixed(4)} - ${fs.weightedImpurity.toFixed(4)} = ${fs.gain.toFixed(4)}`;

    let c45ExtraHtml = "";
    if (algorithm === "C4.5") {
      const splitTerms = branches.map(b => `\\frac{${b.count}}{${totalN}} \\log_2\\left(\\frac{${b.count}}{${totalN}}\\right)`);
      const splitMathStr = `SplitInfo = -\\left[ ${splitTerms.join(" + ")} \\right] = ${fs.splitInfo.toFixed(4)}`;
      const ratioMathStr = `GainRatio = \\frac{${fs.gain.toFixed(4)}}{${fs.splitInfo.toFixed(4)}} = ${fs.score.toFixed(4)}`;

      c45ExtraHtml = `
        <div class="space-y-1 pt-2 border-t border-slate-800">
          <p class="text-xs font-semibold text-purple-400">Tính Split Information & Gain Ratio (cho C4.5):</p>
          <div class="katex-render text-xs text-slate-200" data-formula="${splitMathStr}"></div>
          <div class="katex-render text-xs text-purple-300 font-bold" data-formula="${ratioMathStr}"></div>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        <div>
          <p class="text-xs font-semibold text-slate-300 mb-2">1. Tính ${parentNode.impurityName} cho từng nhánh con:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${branchCalculations}
          </div>
        </div>

        <div class="space-y-1.5 pt-2 border-t border-slate-800">
          <p class="text-xs font-semibold text-slate-300">2. Tính ${parentNode.impurityName} có trọng số sau khi chia (${impSymbol}):</p>
          <div class="katex-render text-xs text-cyan-300 font-mono" data-formula="${weightedMathStr}"></div>
        </div>

        <div class="space-y-1.5 pt-2 border-t border-slate-800">
          <p class="text-xs font-semibold text-slate-300">3. Tính độ cải thiện (${gainSymbol}):</p>
          <div class="katex-render text-xs text-emerald-400 font-bold font-mono" data-formula="${gainMathStr}"></div>
          ${c45ExtraHtml}
        </div>
      </div>
    `;
  }

  /**
   * Sinh HTML lý thuyết các công thức cơ bản kèm KaTeX trên nền Dark
   */
  static getTheoryOverviewHtml() {
    return `
      <div class="space-y-6">
        <!-- 1. Entropy & Information Gain (ID3) -->
        <div class="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-lg">
          <div class="flex items-center gap-3 mb-3">
            <span class="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-full">Thuật toán ID3</span>
            <h3 class="text-lg font-bold text-white">Entropy & Độ Tăng Thông Tin (Information Gain)</h3>
          </div>
          <p class="text-slate-300 text-sm mb-4 leading-relaxed">
            <strong class="text-blue-400">Entropy</strong> đo lường mức độ hỗn loạn (độ bất định) của một tập dữ liệu. Khi tất cả các mẫu đều cùng một nhãn, Entropy = 0 (tinh khiết tuyệt đối). Khi các nhãn phân bổ đều, Entropy đạt giá trị cực đại.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-2">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Công thức Entropy</p>
              <div class="katex-render text-base text-white" data-formula="H(S) = -\\sum_{i=1}^{c} p_i \\log_2(p_i)"></div>
              <p class="text-xs text-slate-400 mt-2">Trong đó $p_i$ là tỷ lệ xuất hiện của lớp $i$ trong tập $S$.</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Độ tăng thông tin (Gain)</p>
              <div class="katex-render text-base text-white" data-formula="Gain(S, A) = H(S) - \\sum_{v \\in Values(A)} \\frac{|S_v|}{|S|} H(S_v)"></div>
              <p class="text-xs text-slate-400 mt-2">Đo lường lượng bất định giảm đi khi chia tập $S$ theo thuộc tính $A$. Thuộc tính có Gain cao nhất sẽ được chọn.</p>
            </div>
          </div>
        </div>

        <!-- 2. Gini Impurity (CART Classification) -->
        <div class="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-lg">
          <div class="flex items-center gap-3 mb-3">
            <span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full">Thuật toán CART</span>
            <h3 class="text-lg font-bold text-white">Độ Bất Thuần Gini & Cây Nhị Phân 2 Nhánh (YES/NO)</h3>
          </div>
          <p class="text-slate-300 text-sm mb-4 leading-relaxed">
            CART (Classification and Regression Trees) sử dụng <strong class="text-emerald-400">Gini Impurity</strong> làm tiêu chí phân nhánh. Gini tính toán xác suất một phần tử bị gán nhãn sai nếu được gán nhãn ngẫu nhiên theo phân phối của tập dữ liệu.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-2">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Công thức Gini tại một tập</p>
              <div class="katex-render text-base text-white" data-formula="Gini(S) = 1 - \\sum_{i=1}^{c} p_i^2"></div>
              <p class="text-xs text-slate-400 mt-2">Gini = 0 khi tập hoàn toàn thuần khiết (chỉ chứa 1 lớp duy nhất).</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gini sau khi chia nhị phân (Yes/No)</p>
              <div class="katex-render text-base text-white" data-formula="Gini_{split}(S) = \\frac{|S_{Yes}|}{|S|} Gini(S_{Yes}) + \\frac{|S_{No}|}{|S|} Gini(S_{No})"></div>
              <p class="text-xs text-slate-400 mt-2">CART luôn chọn câu hỏi có Gini sau chia <strong>NHỎ NHẤT</strong> (tức độ giảm $\\Delta Gini$ lớn nhất).</p>
            </div>
          </div>
          <div class="mt-3 p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/20 text-xs text-slate-300 leading-relaxed">
            <strong class="text-emerald-400">💡 Cơ chế Cây Nhị Phân (Strict Binary Tree) của CART:</strong> Khác với ID3 (xòe nhiều nhánh cùng lúc), CART luôn chia bài toán thành 2 nhánh: <strong>YES (Thỏa điều kiện)</strong> và <strong>NO (Không thỏa điều kiện)</strong>. Ví dụ: <em>"Outlook == Overcast?"</em> $\\rightarrow$ Nhánh YES đi tiếp, Nhánh NO lại hỏi tiếp câu nhị phân thứ hai!
          </div>
        </div>

        <!-- 3. Gain Ratio (C4.5) -->
        <div class="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-lg">
          <div class="flex items-center gap-3 mb-3">
            <span class="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold rounded-full">Thuật toán C4.5</span>
            <h3 class="text-lg font-bold text-white">Tỷ Lệ Tăng Thông Tin (Gain Ratio) & Split Info</h3>
          </div>
          <p class="text-slate-300 text-sm mb-4 leading-relaxed">
            Nhược điểm lớn của ID3 là thiên vị các thuộc tính có quá nhiều giá trị riêng biệt (như số ID, ngày tháng, mã bưu chính). C4.5 khắc phục bằng cách chuẩn hóa Gain thông qua <strong class="text-purple-400">Split Information</strong>.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-2">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Split Information</p>
              <div class="katex-render text-base text-white" data-formula="SplitInfo_A(S) = -\\sum_{v} \\frac{|S_v|}{|S|} \\log_2 \\left( \\frac{|S_v|}{|S|} \\right)"></div>
              <p class="text-xs text-slate-400 mt-2">Đo lường lượng thông tin tiềm năng sinh ra do việc chia nhỏ tập dữ liệu.</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gain Ratio</p>
              <div class="katex-render text-base text-white" data-formula="GainRatio(S, A) = \\frac{Gain(S, A)}{SplitInfo_A(S)}"></div>
              <p class="text-xs text-slate-400 mt-2">Phạt các thuộc tính có quá nhiều nhánh rẽ vụn vặt.</p>
            </div>
          </div>
        </div>

        <!-- 4. Variance Reduction (Regression Tree) -->
        <div class="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-lg">
          <div class="flex items-center gap-3 mb-3">
            <span class="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-full">CART Hồi Quy</span>
            <h3 class="text-lg font-bold text-white">Giảm Phương Sai (Variance Reduction / MSE)</h3>
          </div>
          <p class="text-slate-300 text-sm mb-4 leading-relaxed">
            Khi biến mục tiêu là số thực liên tục, ta xây dựng Cây hồi quy (Regression Tree). Dự đoán tại mỗi lá là giá trị trung bình (mean) của các mẫu trong lá đó. Tiêu chí phân nhánh là giảm thiểu sai số bình phương trung bình (MSE/Variance).
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-2">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phương sai (Variance/MSE)</p>
              <div class="katex-render text-base text-white" data-formula="Var(S) = \\frac{1}{|S|} \\sum_{i=1}^{|S|} (y_i - \\bar{y})^2"></div>
              <p class="text-xs text-slate-400 mt-2">Với $\\bar{y}$ là trung bình cộng của các giá trị mục tiêu trong nút.</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Variance Reduction</p>
              <div class="katex-render text-base text-white" data-formula="\\Delta Var(S, A) = Var(S) - \\left( \\frac{|S_L|}{|S|} Var(S_L) + \\frac{|S_R|}{|S|} Var(S_R) \\right)"></div>
              <p class="text-xs text-slate-400 mt-2">Chọn điểm cắt sao cho tổng phương sai của các nhánh con là nhỏ nhất.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
