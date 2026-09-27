/**
 * Random Forest Ensemble Module
 * Huấn luyện tập hợp cây (Ensemble) với cơ chế Bootstrap Aggregation (Bagging)
 * Minh họa cơ chế bỏ phiếu số đông (Majority Voting) triệt tiêu Overfitting
 */

class RandomForest {
  constructor(config = {}) {
    this.numTrees = config.numTrees || 7;
    this.maxDepth = config.maxDepth ?? 3;
    this.minSamplesSplit = config.minSamplesSplit ?? 2;
    this.taskType = config.taskType || "classification";
    this.algorithm = config.algorithm || "CART";
    this.splitMode = config.splitMode || "binary";
    this.trees = [];
  }

  /**
   * Tạo mẫu Bootstrap (Lấy mẫu ngẫu nhiên có lặp lại từ tập dữ liệu)
   */
  static bootstrapSample(data) {
    const n = data.length;
    const sample = [];
    for (let i = 0; i < n; i++) {
      const randIdx = Math.floor(Math.random() * n);
      sample.push(data[randIdx]);
    }
    return sample;
  }

  /**
   * Huấn luyện toàn bộ rừng cây
   */
  train(dataset) {
    this.trees = [];
    this.dataset = dataset;
    this.taskType = dataset.taskType || "classification";

    const allFeatures = dataset.columns.filter(c => c !== dataset.targetCol);
    // Khi có ít đặc trưng (<= 4), dùng 3 đặc trưng để đảm bảo các cây không bị mù thuộc tính cốt lõi
    const numSubFeatures = allFeatures.length <= 4 
      ? Math.max(2, allFeatures.length - 1) 
      : Math.max(2, Math.ceil(Math.sqrt(allFeatures.length)));

    const n = dataset.data.length;

    for (let i = 0; i < this.numTrees; i++) {
      const bootIndices = [];
      const bootData = [];
      for (let j = 0; j < n; j++) {
        const randIdx = Math.floor(Math.random() * n);
        bootIndices.push(randIdx);
        bootData.push(dataset.data[randIdx]);
      }

      // Chọn ngẫu nhiên tập con thuộc tính (Feature Bagging)
      const shuffledFeatures = [...allFeatures].sort(() => 0.5 - Math.random());
      const selectedFeatures = shuffledFeatures.slice(0, numSubFeatures);

      const subDataset = {
        ...dataset,
        data: bootData,
        columns: [...selectedFeatures, dataset.targetCol]
      };

      const tree = new DecisionTree({
        algorithm: this.algorithm,
        splitMode: this.splitMode,
        maxDepth: this.maxDepth,
        minSamplesSplit: this.minSamplesSplit,
        taskType: this.taskType
      });

      tree.train(subDataset);

      this.trees.push({
        id: `Cây #${i + 1}`,
        tree: tree,
        featuresUsed: selectedFeatures,
        sampleCount: bootData.length,
        bootIndices: bootIndices
      });
    }

    return this.trees;
  }

  /**
   * Dự đoán một mẫu mới và ghi nhận tỷ lệ bỏ phiếu của từng cây (hỗ trợ cả OOB Evaluation)
   */
  predict(instance) {
    if (this.trees.length === 0) return null;

    // Kiểm tra xem mẫu này có trùng với dòng nào trong dữ liệu huấn luyện không
    let matchedTrainingIdx = -1;
    if (this.dataset && this.dataset.data) {
      matchedTrainingIdx = this.dataset.data.findIndex(row => {
        return Object.keys(instance).every(k => {
          if (row[k] === undefined || instance[k] === undefined) return true;
          return String(row[k]) === String(instance[k]);
        });
      });
    }

    const votes = {};
    const oobVotes = {};
    let oobTreeCount = 0;
    const predictions = [];
    let sumReg = 0;

    this.trees.forEach(tObj => {
      const res = tObj.tree.predict(instance);
      const pred = res ? res.prediction : null;
      
      const isOOB = (matchedTrainingIdx !== -1) ? !tObj.bootIndices.includes(matchedTrainingIdx) : true;
      if (isOOB) {
        oobTreeCount++;
        oobVotes[pred] = (oobVotes[pred] || 0) + 1;
      }

      predictions.push({
        treeId: tObj.id,
        prediction: pred,
        path: res ? res.path : [],
        isOOB: isOOB
      });

      if (this.taskType === "regression") {
        sumReg += Number(pred) || 0;
      } else {
        votes[pred] = (votes[pred] || 0) + 1;
      }
    });

    if (this.taskType === "regression") {
      const avg = sumReg / this.trees.length;
      return {
        prediction: Number(avg.toFixed(2)),
        predictions: predictions,
        totalTrees: this.trees.length
      };
    }

    // Tìm nhãn có số phiếu bầu cao nhất trong toàn bộ cây
    let bestClass = null;
    let maxVotes = -1;
    for (const cls in votes) {
      if (votes[cls] > maxVotes) {
        maxVotes = votes[cls];
        bestClass = cls;
      }
    }

    // Tìm nhãn có số phiếu bầu cao nhất trong các cây Out-Of-Bag (OOB)
    let oobBestClass = null;
    let oobMaxVotes = -1;
    for (const cls in oobVotes) {
      if (oobVotes[cls] > oobMaxVotes) {
        oobMaxVotes = oobVotes[cls];
        oobBestClass = cls;
      }
    }

    return {
      prediction: bestClass,
      votes: votes,
      maxVotes: maxVotes,
      totalTrees: this.trees.length,
      confidence: Math.round((maxVotes / this.trees.length) * 100),
      predictions: predictions,
      matchedTrainingIdx: matchedTrainingIdx,
      oob: {
        hasOOB: oobTreeCount > 0,
        oobTreeCount: oobTreeCount,
        oobVotes: oobVotes,
        oobPrediction: oobBestClass,
        oobConfidence: oobTreeCount > 0 ? Math.round((oobMaxVotes / oobTreeCount) * 100) : 0
      }
    };
  }
}

