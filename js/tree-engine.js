/**
 * Decision Tree Engine
 * Hỗ trợ ID3, C4.5, CART (Classification & Regression)
 * Kèm chi tiết tính toán từng bước (Math Trace) phục vụ giải thích sư phạm
 */

class DecisionTreeNode {
  constructor(options = {}) {
    this.id = options.id || "node_" + Math.random().toString(36).substr(2, 9);
    this.isLeaf = options.isLeaf || false;
    this.prediction = options.prediction ?? null; // Nhãn phân loại hoặc giá trị trung bình hồi quy
    this.distribution = options.distribution || {}; // Đếm số mẫu mỗi lớp { "Yes": 9, "No": 5 }
    this.samples = options.samples || 0; // Tổng số mẫu tại node
    this.impurity = options.impurity ?? 0; // Giá trị Entropy / Gini / Variance tại node
    this.impurityName = options.impurityName || "Impurity";
    this.depth = options.depth || 0;

    // Nếu không phải node lá:
    this.splitFeature = options.splitFeature || null; // Thuộc tính được chọn để phân nhánh
    this.splitType = options.splitType || "categorical"; // "categorical" hoặc "numerical"
    this.threshold = options.threshold ?? null; // Ngưỡng số nếu là continuous feature (e.g. Age <= 30)
    this.children = options.children || {}; // Ánh xạ: { "Sunny": Node, "Rain": Node } hoặc { "<= 30": Node, "> 30": Node }
    this.branchLabels = options.branchLabels || []; // Danh sách nhãn cạnh

    // Lưu lại toàn bộ nhật ký tính toán để phục vụ hiển thị sư phạm
    this.mathTrace = options.mathTrace || null;
  }
}

class DecisionTree {
  constructor(config = {}) {
    this.algorithm = config.algorithm || "CART"; // "ID3", "C4.5", "CART"
    this.splitMode = config.splitMode || (this.algorithm === "CART" ? "binary" : "multiway"); // "binary" hoặc "multiway"
    this.maxDepth = config.maxDepth ?? 5; // Độ sâu tối đa
    this.minSamplesSplit = config.minSamplesSplit ?? 2; // Số mẫu tối thiểu để phân nhánh
    this.minImpurityDecrease = config.minImpurityDecrease ?? 0.0; // Ngưỡng cải thiện tối thiểu
    this.taskType = config.taskType || "classification"; // "classification" hoặc "regression"
    this.root = null;
    this.allNodes = [];
    this.targetCol = "";
    this.featureCols = [];
    this.featureTypes = {};
  }

  /**
   * Tính Entropy của tập dữ liệu S: H(S) = - sum(p_i * log2(p_i))
   */
  static calculateEntropy(rows, targetCol) {
    if (!rows || rows.length === 0) return 0;
    const counts = {};
    for (const r of rows) {
      const val = r[targetCol];
      counts[val] = (counts[val] || 0) + 1;
    }

    let entropy = 0;
    const n = rows.length;
    for (const val in counts) {
      const p = counts[val] / n;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }

  /**
   * Tính Gini Impurity của tập dữ liệu S: Gini(S) = 1 - sum(p_i^2)
   */
  static calculateGini(rows, targetCol) {
    if (!rows || rows.length === 0) return 0;
    const counts = {};
    for (const r of rows) {
      const val = r[targetCol];
      counts[val] = (counts[val] || 0) + 1;
    }

    let sumSq = 0;
    const n = rows.length;
    for (const val in counts) {
      const p = counts[val] / n;
      sumSq += p * p;
    }
    return 1 - sumSq;
  }

  /**
   * Tính Variance (MSE) cho bài toán hồi quy: Var(S) = (1/N) * sum((y_i - y_mean)^2)
   */
  static calculateVariance(rows, targetCol) {
    if (!rows || rows.length === 0) return 0;
    const values = rows.map(r => Number(r[targetCol]));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * Tính phân phối nhãn của tập mẫu
   */
  static getDistribution(rows, targetCol, taskType = "classification") {
    if (taskType === "regression") {
      const vals = rows.map(r => Number(r[targetCol]));
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { mean: Number(mean.toFixed(2)), count: rows.length };
    }
    const dist = {};
    for (const r of rows) {
      const val = r[targetCol];
      dist[val] = (dist[val] || 0) + 1;
    }
    return dist;
  }

  /**
   * Xác định dự đoán của node lá (majority vote cho phân loại, mean cho hồi quy)
   */
  static getMajorityPrediction(rows, targetCol, taskType = "classification") {
    if (rows.length === 0) return null;
    if (taskType === "regression") {
      const vals = rows.map(r => Number(r[targetCol]));
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      return Number(mean.toFixed(2));
    }

    const dist = this.getDistribution(rows, targetCol, taskType);
    let bestClass = null;
    let maxCount = -1;
    for (const cls in dist) {
      if (dist[cls] > maxCount) {
        maxCount = dist[cls];
        bestClass = cls;
      }
    }
    return bestClass;
  }

  /**
   * Huấn luyện cây quyết định
   */
  train(dataset) {
    this.targetCol = dataset.targetCol;
    this.taskType = dataset.taskType || "classification";
    this.featureTypes = dataset.featureTypes || {};
    this.featureCols = dataset.columns.filter(c => c !== this.targetCol);
    this.allNodes = [];

    let nodeCounter = 0;
    const makeNodeId = () => `N${++nodeCounter}`;

    const buildTree = (rows, depth, availableFeatures) => {
      const nodeId = makeNodeId();
      const numSamples = rows.length;

      // Tính impurity của tập dữ liệu tại node hiện tại
      let currentImpurity = 0;
      let impurityName = "Entropy";

      if (this.taskType === "regression") {
        currentImpurity = DecisionTree.calculateVariance(rows, this.targetCol);
        impurityName = "Variance (MSE)";
      } else if (this.algorithm === "CART") {
        currentImpurity = DecisionTree.calculateGini(rows, this.targetCol);
        impurityName = "Gini";
      } else {
        currentImpurity = DecisionTree.calculateEntropy(rows, this.targetCol);
        impurityName = "Entropy";
      }

      const dist = DecisionTree.getDistribution(rows, this.targetCol, this.taskType);
      const prediction = DecisionTree.getMajorityPrediction(rows, this.targetCol, this.taskType);

      // Điều kiện dừng (Stopping criteria / Leaf condition):
      // 1. Tập mẫu thuần nhất (Impurity gần 0)
      // 2. Đạt độ sâu tối đa
      // 3. Số mẫu < minSamplesSplit
      // 4. Không còn thuộc tính để phân chia (cho ID3 categorical)
      const isPure = this.taskType === "classification" 
        ? Object.keys(dist).length <= 1 
        : currentImpurity < 1e-6;

      if (
        isPure ||
        depth >= this.maxDepth ||
        numSamples < this.minSamplesSplit ||
        (availableFeatures.length === 0 && this.algorithm === "ID3")
      ) {
        const leafNode = new DecisionTreeNode({
          id: nodeId,
          isLeaf: true,
          prediction: prediction,
          distribution: dist,
          samples: numSamples,
          impurity: currentImpurity,
          impurityName: impurityName,
          depth: depth
        });
        this.allNodes.push(leafNode);
        return leafNode;
      }

      // Đánh giá tất cả các thuộc tính để tìm ra split tốt nhất
      const evaluation = this._evaluateBestSplit(rows, availableFeatures, currentImpurity);

      // Nếu không tìm được split hợp lệ hoặc độ giảm Impurity quá nhỏ
      if (!evaluation || !evaluation.bestFeature || evaluation.bestScore <= this.minImpurityDecrease) {
        const leafNode = new DecisionTreeNode({
          id: nodeId,
          isLeaf: true,
          prediction: prediction,
          distribution: dist,
          samples: numSamples,
          impurity: currentImpurity,
          impurityName: impurityName,
          depth: depth,
          mathTrace: evaluation ? evaluation.trace : null
        });
        this.allNodes.push(leafNode);
        return leafNode;
      }

      // Tạo nút rẽ nhánh
      const { bestFeature, rawFeature, splitType, bestThreshold: threshold, splits, trace } = evaluation;
      const children = {};
      const branchLabels = [];

      // Cập nhật danh sách thuộc tính cho các nút con (ID3 không dùng lại biến categorical đã chia)
      let nextFeatures = availableFeatures;
      if (this.algorithm === "ID3" && splitType === "categorical") {
        nextFeatures = availableFeatures.filter(f => f !== (rawFeature || bestFeature));
      }

      const currentNode = new DecisionTreeNode({
        id: nodeId,
        isLeaf: false,
        splitFeature: rawFeature || bestFeature,
        splitType: splitType,
        threshold: threshold,
        distribution: dist,
        samples: numSamples,
        impurity: currentImpurity,
        impurityName: impurityName,
        depth: depth,
        mathTrace: trace,
        prediction: prediction
      });
      this.allNodes.push(currentNode);

      for (const branchKey in splits) {
        const subset = splits[branchKey];
        branchLabels.push(branchKey);
        if (subset.length === 0) {
          // Tập con rỗng => tạo lá với đa số từ nút cha
          const emptyLeaf = new DecisionTreeNode({
            id: makeNodeId(),
            isLeaf: true,
            prediction: prediction,
            distribution: dist,
            samples: 0,
            impurity: 0,
            impurityName: impurityName,
            depth: depth + 1
          });
          children[branchKey] = emptyLeaf;
          this.allNodes.push(emptyLeaf);
        } else {
          children[branchKey] = buildTree(subset, depth + 1, nextFeatures);
        }
      }

      currentNode.children = children;
      currentNode.branchLabels = branchLabels;
      return currentNode;
    };

    this.root = buildTree(dataset.data, 0, [...this.featureCols]);
    return this.root;
  }

  /**
   * Đánh giá và tìm thuộc tính phân chia tối ưu kèm log nhật ký toán học
   */
  _evaluateBestSplit(rows, features, currentImpurity) {
    let bestFeature = null;
    let bestRawFeature = null;
    let bestScore = -Infinity;
    let bestThreshold = null;
    let bestSplitType = "categorical";
    let bestSplits = null;

    const featureScores = [];
    const n = rows.length;

    for (const feat of features) {
      const type = this.featureTypes[feat] || "categorical";

      if (type === "categorical") {
        const uniqueValues = [...new Set(rows.map(r => r[feat]))];
        if (uniqueValues.length <= 1) continue;

        if (this.splitMode === "binary") {
          // PHÂN CHIA NHỊ PHÂN CHO BIẾN PHÂN LOẠI (CHUẨN CART / SCIKIT-LEARN: 2 NHÁNH YES/NO)
          const candidateVals = uniqueValues.length === 2 ? [uniqueValues[0]] : uniqueValues;

          for (const val of candidateVals) {
            const leftSub = rows.filter(r => r[feat] === val);
            const rightSub = rows.filter(r => r[feat] !== val);

            if (leftSub.length === 0 || rightSub.length === 0) continue;

            const pLeft = leftSub.length / n;
            const pRight = rightSub.length / n;

            let leftImp = 0, rightImp = 0;
            if (this.taskType === "regression") {
              leftImp = DecisionTree.calculateVariance(leftSub, this.targetCol);
              rightImp = DecisionTree.calculateVariance(rightSub, this.targetCol);
            } else if (this.algorithm === "CART") {
              leftImp = DecisionTree.calculateGini(leftSub, this.targetCol);
              rightImp = DecisionTree.calculateGini(rightSub, this.targetCol);
            } else {
              leftImp = DecisionTree.calculateEntropy(leftSub, this.targetCol);
              rightImp = DecisionTree.calculateEntropy(rightSub, this.targetCol);
            }

            const weightedImp = pLeft * leftImp + pRight * rightImp;
            const infoGain = currentImpurity - weightedImp;

            let splitInfo = 0;
            if (pLeft > 0) splitInfo -= pLeft * Math.log2(pLeft);
            if (pRight > 0) splitInfo -= pRight * Math.log2(pRight);

            let score = infoGain;
            let metricName = "Information Gain";
            if (this.algorithm === "C4.5") {
              metricName = "Gain Ratio";
              score = splitInfo > 0 ? infoGain / splitInfo : 0;
            } else if (this.algorithm === "CART") {
              metricName = this.taskType === "regression" ? "Variance Reduction" : "Gini Gain";
              score = infoGain;
            }

            const questionLabel = `${feat} == "${val}"?`;
            const branchBreakdowns = [
              {
                value: `Đúng (${feat} = "${val}")`,
                count: leftSub.length,
                ratio: pLeft,
                impurity: leftImp,
                distribution: DecisionTree.getDistribution(leftSub, this.targetCol, this.taskType)
              },
              {
                value: `Sai (${feat} ≠ "${val}")`,
                count: rightSub.length,
                ratio: pRight,
                impurity: rightImp,
                distribution: DecisionTree.getDistribution(rightSub, this.targetCol, this.taskType)
              }
            ];

            const splitSubsets = {
              "Đúng (Yes)": leftSub,
              "Sai (No)": rightSub
            };

            featureScores.push({
              feature: questionLabel,
              rawFeature: feat,
              type: "binary_categorical",
              threshold: val,
              weightedImpurity: weightedImp,
              gain: infoGain,
              splitInfo: splitInfo,
              score: score,
              metricName: metricName,
              branchBreakdowns: branchBreakdowns,
              splits: splitSubsets
            });

            if (score > bestScore) {
              bestScore = score;
              bestFeature = questionLabel;
              bestRawFeature = feat;
              bestThreshold = val;
              bestSplitType = "binary_categorical";
              bestSplits = splitSubsets;
            }
          }
        } else {
          // PHÂN CHIA ĐA PHÂN (MULTI-WAY TREE - CHUẨN ID3 / QUINLAN)
          const subsets = {};
          uniqueValues.forEach(val => {
            subsets[val] = rows.filter(r => r[feat] === val);
          });

          let weightedImpurity = 0;
          let splitInfo = 0;
          const branchBreakdowns = [];

          for (const val of uniqueValues) {
            const sub = subsets[val];
            const p = sub.length / n;
            let subImpurity = 0;

            if (this.taskType === "regression") {
              subImpurity = DecisionTree.calculateVariance(sub, this.targetCol);
            } else if (this.algorithm === "CART") {
              subImpurity = DecisionTree.calculateGini(sub, this.targetCol);
            } else {
              subImpurity = DecisionTree.calculateEntropy(sub, this.targetCol);
            }

            weightedImpurity += p * subImpurity;
            if (p > 0) splitInfo -= p * Math.log2(p);

            branchBreakdowns.push({
              value: val,
              count: sub.length,
              ratio: p,
              impurity: subImpurity,
              distribution: DecisionTree.getDistribution(sub, this.targetCol, this.taskType)
            });
          }

          const infoGain = currentImpurity - weightedImpurity;
          let score = infoGain;
          let metricName = "Information Gain";

          if (this.algorithm === "C4.5") {
            metricName = "Gain Ratio";
            score = splitInfo > 0 ? infoGain / splitInfo : 0;
          } else if (this.algorithm === "CART") {
            metricName = this.taskType === "regression" ? "Variance Reduction" : "Gini Gain";
            score = infoGain;
          }

          featureScores.push({
            feature: feat,
            rawFeature: feat,
            type: "categorical",
            threshold: null,
            weightedImpurity: weightedImpurity,
            gain: infoGain,
            splitInfo: splitInfo,
            score: score,
            metricName: metricName,
            branchBreakdowns: branchBreakdowns,
            splits: subsets
          });

          if (score > bestScore) {
            bestScore = score;
            bestFeature = feat;
            bestRawFeature = feat;
            bestThreshold = null;
            bestSplitType = "categorical";
            bestSplits = subsets;
          }
        }
      } else {
        // PHÂN CHIA SỐ LIÊN TỤC (NUMERICAL THRESHOLD <= T vs > T - LUÔN LUÔN LÀ NHỊ PHÂN)
        const sortedVals = [...new Set(rows.map(r => Number(r[feat])))].sort((a, b) => a - b);
        if (sortedVals.length <= 1) continue;

        let bestFeatScore = -Infinity;
        let bestFeatThresh = null;
        let bestFeatSubsets = null;
        let bestFeatBreakdown = null;
        let bestFeatSplitInfo = 0;
        let bestFeatWeightedImp = 0;

        for (let i = 0; i < sortedVals.length - 1; i++) {
          const t = Number(((sortedVals[i] + sortedVals[i + 1]) / 2).toFixed(2));
          const leftSub = rows.filter(r => Number(r[feat]) <= t);
          const rightSub = rows.filter(r => Number(r[feat]) > t);

          if (leftSub.length === 0 || rightSub.length === 0) continue;

          let leftImp = 0, rightImp = 0;
          if (this.taskType === "regression") {
            leftImp = DecisionTree.calculateVariance(leftSub, this.targetCol);
            rightImp = DecisionTree.calculateVariance(rightSub, this.targetCol);
          } else if (this.algorithm === "CART") {
            leftImp = DecisionTree.calculateGini(leftSub, this.targetCol);
            rightImp = DecisionTree.calculateGini(rightSub, this.targetCol);
          } else {
            leftImp = DecisionTree.calculateEntropy(leftSub, this.targetCol);
            rightImp = DecisionTree.calculateEntropy(rightSub, this.targetCol);
          }

          const pLeft = leftSub.length / n;
          const pRight = rightSub.length / n;
          const weightedImp = pLeft * leftImp + pRight * rightImp;
          const infoGain = currentImpurity - weightedImp;

          let splitInfo = 0;
          if (pLeft > 0) splitInfo -= pLeft * Math.log2(pLeft);
          if (pRight > 0) splitInfo -= pRight * Math.log2(pRight);

          let score = infoGain;
          let metricName = "Information Gain";
          if (this.algorithm === "C4.5") {
            metricName = "Gain Ratio";
            score = splitInfo > 0 ? infoGain / splitInfo : 0;
          } else if (this.algorithm === "CART") {
            metricName = this.taskType === "regression" ? "Variance Reduction" : "Gini Gain";
            score = infoGain;
          }

          if (score > bestFeatScore) {
            bestFeatScore = score;
            bestFeatThresh = t;
            bestFeatWeightedImp = weightedImp;
            bestFeatSplitInfo = splitInfo;
            bestFeatSubsets = {
              [`<= ${t}`]: leftSub,
              [`> ${t}`]: rightSub
            };
            bestFeatBreakdown = [
              { value: `<= ${t}`, count: leftSub.length, ratio: pLeft, impurity: leftImp, distribution: DecisionTree.getDistribution(leftSub, this.targetCol, this.taskType) },
              { value: `> ${t}`, count: rightSub.length, ratio: pRight, impurity: rightImp, distribution: DecisionTree.getDistribution(rightSub, this.targetCol, this.taskType) }
            ];
          }
        }

        if (bestFeatThresh !== null) {
          const questionLabel = `${feat} <= ${bestFeatThresh}`;
          featureScores.push({
            feature: questionLabel,
            rawFeature: feat,
            type: "numerical",
            threshold: bestFeatThresh,
            weightedImpurity: bestFeatWeightedImp,
            gain: bestFeatScore,
            splitInfo: bestFeatSplitInfo,
            score: bestFeatScore,
            metricName: this.algorithm === "C4.5" ? "Gain Ratio" : (this.algorithm === "CART" ? (this.taskType === "regression" ? "Variance Reduction" : "Gini Gain") : "Information Gain"),
            branchBreakdowns: bestFeatBreakdown
          });

          if (bestFeatScore > bestScore) {
            bestScore = bestFeatScore;
            bestFeature = questionLabel;
            bestRawFeature = feat;
            bestThreshold = bestFeatThresh;
            bestSplitType = "numerical";
            bestSplits = bestFeatSubsets;
          }
        }
      }
    }

    // Sắp xếp các feature theo điểm số giảm dần để dễ so sánh
    featureScores.sort((a, b) => b.score - a.score);

    const trace = {
      parentImpurity: currentImpurity,
      metricUsed: this.algorithm === "C4.5" ? "Gain Ratio" : (this.algorithm === "CART" ? (this.taskType === "regression" ? "Variance Reduction" : "Gini Gain") : "Information Gain"),
      winnerFeature: bestFeature,
      winnerScore: bestScore,
      winnerThreshold: bestThreshold,
      featureScores: featureScores
    };

    return {
      bestFeature,
      rawFeature: bestRawFeature,
      bestScore,
      bestThreshold,
      splitType: bestSplitType,
      splits: bestSplits,
      trace
    };
  }

  /**
   * Dự đoán một mẫu mới và ghi lại đường đi (path) qua các node
   */
  predict(instance) {
    if (!this.root) return null;

    const path = [];
    let current = this.root;

    while (current) {
      path.push(current.id);
      if (current.isLeaf) {
        return {
          prediction: current.prediction,
          confidence: current.distribution,
          path: path,
          leafNode: current
        };
      }

      const feat = current.splitFeature;
      const featVal = instance[feat];

      if (current.splitType === "binary_categorical") {
        const isMatch = String(featVal) === String(current.threshold);
        current = current.children[isMatch ? "Đúng (Yes)" : "Sai (No)"]
               || current.children[isMatch ? "Yes" : "No"]
               || Object.values(current.children)[0];
      } else if (current.splitType === "numerical") {
        const branchKey = Number(featVal) <= current.threshold ? `<= ${current.threshold}` : `> ${current.threshold}`;
        current = current.children[branchKey] || Object.values(current.children)[0];
      } else {
        const branchKey = String(featVal);
        current = current.children[branchKey] || Object.values(current.children)[0];
      }
    }

    return null;
  }

  /**
   * Chuyển cây thành danh sách luật IF-THEN
   */
  extractRules() {
    const rules = [];

    const traverse = (node, currentConditions) => {
      if (node.isLeaf) {
        rules.push({
          conditions: [...currentConditions],
          prediction: node.prediction,
          samples: node.samples,
          impurity: node.impurity
        });
        return;
      }

      for (const branch in node.children) {
        const child = node.children[branch];
        let cond = "";
        if (node.splitType === "binary_categorical") {
          cond = branch.includes("Đúng") || branch.includes("Yes")
            ? `${node.splitFeature} = "${node.threshold}"`
            : `${node.splitFeature} ≠ "${node.threshold}"`;
        } else if (node.splitType === "numerical") {
          cond = `${node.splitFeature} ${branch}`;
        } else {
          cond = `${node.splitFeature} = ${branch}`;
        }
        traverse(child, [...currentConditions, cond]);
      }
    };

    if (this.root) {
      traverse(this.root, []);
    }
    return rules;
  }
}
