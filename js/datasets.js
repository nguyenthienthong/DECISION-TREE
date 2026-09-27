/**
 * Datasets for Decision Tree Explorer
 * Cung cấp các bộ dữ liệu kinh điển và công cụ đọc/chuyển đổi CSV
 */

const PRESET_DATASETS = {
  tennis: {
    id: "tennis",
    name: "Chơi Tennis (Play Tennis)",
    description: "Bộ dữ liệu thời tiết kinh điển của Tom Mitchell (1997) dùng để học ID3/C4.5.",
    targetCol: "Play",
    taskType: "classification",
    columns: ["Outlook", "Temperature", "Humidity", "Wind", "Play"],
    featureTypes: {
      Outlook: "categorical",
      Temperature: "categorical",
      Humidity: "categorical",
      Wind: "categorical"
    },
    data: [
      { Outlook: "Sunny", Temperature: "Hot", Humidity: "High", Wind: "Weak", Play: "No" },
      { Outlook: "Sunny", Temperature: "Hot", Humidity: "High", Wind: "Strong", Play: "No" },
      { Outlook: "Overcast", Temperature: "Hot", Humidity: "High", Wind: "Weak", Play: "Yes" },
      { Outlook: "Rain", Temperature: "Mild", Humidity: "High", Wind: "Weak", Play: "Yes" },
      { Outlook: "Rain", Temperature: "Cool", Humidity: "Normal", Wind: "Weak", Play: "Yes" },
      { Outlook: "Rain", Temperature: "Cool", Humidity: "Normal", Wind: "Strong", Play: "No" },
      { Outlook: "Overcast", Temperature: "Cool", Humidity: "Normal", Wind: "Strong", Play: "Yes" },
      { Outlook: "Sunny", Temperature: "Mild", Humidity: "High", Wind: "Weak", Play: "No" },
      { Outlook: "Sunny", Temperature: "Cool", Humidity: "Normal", Wind: "Weak", Play: "Yes" },
      { Outlook: "Rain", Temperature: "Mild", Humidity: "Normal", Wind: "Weak", Play: "Yes" },
      { Outlook: "Sunny", Temperature: "Mild", Humidity: "Normal", Wind: "Strong", Play: "Yes" },
      { Outlook: "Overcast", Temperature: "Mild", Humidity: "High", Wind: "Strong", Play: "Yes" },
      { Outlook: "Overcast", Temperature: "Hot", Humidity: "Normal", Wind: "Weak", Play: "Yes" },
      { Outlook: "Rain", Temperature: "Mild", Humidity: "High", Wind: "Strong", Play: "No" }
    ]
  },

  buy_computer: {
    id: "buy_computer",
    name: "Mua Máy Tính (Buy Computer)",
    description: "Dữ liệu khảo sát khách hàng mua máy tính kinh điển từ sách Data Mining của Han & Kamber.",
    targetCol: "BuysComputer",
    taskType: "classification",
    columns: ["Age", "Income", "Student", "CreditRating", "BuysComputer"],
    featureTypes: {
      Age: "categorical",
      Income: "categorical",
      Student: "categorical",
      CreditRating: "categorical"
    },
    data: [
      { Age: "<=30", Income: "High", Student: "No", CreditRating: "Fair", BuysComputer: "No" },
      { Age: "<=30", Income: "High", Student: "No", CreditRating: "Excellent", BuysComputer: "No" },
      { Age: "31...40", Income: "High", Student: "No", CreditRating: "Fair", BuysComputer: "Yes" },
      { Age: ">40", Income: "Medium", Student: "No", CreditRating: "Fair", BuysComputer: "Yes" },
      { Age: ">40", Income: "Low", Student: "Yes", CreditRating: "Fair", BuysComputer: "Yes" },
      { Age: ">40", Income: "Low", Student: "Yes", CreditRating: "Excellent", BuysComputer: "No" },
      { Age: "31...40", Income: "Low", Student: "Yes", CreditRating: "Excellent", BuysComputer: "Yes" },
      { Age: "<=30", Income: "Medium", Student: "No", CreditRating: "Fair", BuysComputer: "No" },
      { Age: "<=30", Income: "Low", Student: "Yes", CreditRating: "Fair", BuysComputer: "Yes" },
      { Age: ">40", Income: "Medium", Student: "Yes", CreditRating: "Fair", BuysComputer: "Yes" },
      { Age: "<=30", Income: "Medium", Student: "Yes", CreditRating: "Excellent", BuysComputer: "Yes" },
      { Age: "31...40", Income: "Medium", Student: "No", CreditRating: "Excellent", BuysComputer: "Yes" },
      { Age: "31...40", Income: "High", Student: "Yes", CreditRating: "Fair", BuysComputer: "Yes" },
      { Age: ">40", Income: "Medium", Student: "No", CreditRating: "Excellent", BuysComputer: "No" }
    ]
  },

  titanic: {
    id: "titanic",
    name: "Sống Sót Tàu Titanic (Titanic Survival)",
    description: "Bộ dữ liệu gồm cả biến phân loại (Hạng vé, Giới tính) và biến liên tục (Tuổi, Giá vé).",
    targetCol: "Survived",
    taskType: "classification",
    columns: ["Pclass", "Sex", "Age", "Fare", "Embarked", "Survived"],
    featureTypes: {
      Pclass: "categorical",
      Sex: "categorical",
      Age: "numerical",
      Fare: "numerical",
      Embarked: "categorical"
    },
    data: [
      { Pclass: "3", Sex: "male", Age: 22, Fare: 7.25, Embarked: "S", Survived: "No" },
      { Pclass: "1", Sex: "female", Age: 38, Fare: 71.28, Embarked: "C", Survived: "Yes" },
      { Pclass: "3", Sex: "female", Age: 26, Fare: 7.92, Embarked: "S", Survived: "Yes" },
      { Pclass: "1", Sex: "female", Age: 35, Fare: 53.10, Embarked: "S", Survived: "Yes" },
      { Pclass: "3", Sex: "male", Age: 35, Fare: 8.05, Embarked: "S", Survived: "No" },
      { Pclass: "3", Sex: "male", Age: 28, Fare: 8.45, Embarked: "Q", Survived: "No" },
      { Pclass: "1", Sex: "male", Age: 54, Fare: 51.86, Embarked: "S", Survived: "No" },
      { Pclass: "3", Sex: "male", Age: 2, Fare: 21.07, Embarked: "S", Survived: "No" },
      { Pclass: "3", Sex: "female", Age: 27, Fare: 11.13, Embarked: "S", Survived: "Yes" },
      { Pclass: "2", Sex: "female", Age: 14, Fare: 30.07, Embarked: "C", Survived: "Yes" },
      { Pclass: "3", Sex: "female", Age: 4, Fare: 16.70, Embarked: "S", Survived: "Yes" },
      { Pclass: "1", Sex: "female", Age: 58, Fare: 26.55, Embarked: "S", Survived: "Yes" },
      { Pclass: "3", Sex: "male", Age: 20, Fare: 8.05, Embarked: "S", Survived: "No" },
      { Pclass: "2", Sex: "male", Age: 34, Fare: 13.00, Embarked: "S", Survived: "No" },
      { Pclass: "3", Sex: "female", Age: 15, Fare: 8.02, Embarked: "Q", Survived: "Yes" },
      { Pclass: "1", Sex: "male", Age: 65, Fare: 61.97, Embarked: "C", Survived: "No" },
      { Pclass: "2", Sex: "male", Age: 25, Fare: 13.00, Embarked: "S", Survived: "No" },
      { Pclass: "2", Sex: "female", Age: 30, Fare: 13.00, Embarked: "S", Survived: "Yes" },
      { Pclass: "1", Sex: "female", Age: 49, Fare: 76.72, Embarked: "C", Survived: "Yes" },
      { Pclass: "3", Sex: "male", Age: 19, Fare: 7.89, Embarked: "S", Survived: "No" }
    ]
  },

  heart_disease: {
    id: "heart_disease",
    name: "Sàng Lọc Tim Mạch (Heart Disease)",
    description: "Dữ liệu y tế chẩn đoán nguy cơ bệnh tim dựa trên các chỉ số sinh hóa và triệu chứng.",
    targetCol: "Condition",
    taskType: "classification",
    columns: ["Age", "ChestPain", "BloodPressure", "Cholesterol", "MaxHeartRate", "Condition"],
    featureTypes: {
      Age: "numerical",
      ChestPain: "categorical",
      BloodPressure: "numerical",
      Cholesterol: "numerical",
      MaxHeartRate: "numerical"
    },
    data: [
      { Age: 63, ChestPain: "Typical", BloodPressure: 145, Cholesterol: 233, MaxHeartRate: 150, Condition: "Disease" },
      { Age: 67, ChestPain: "Asymptomatic", BloodPressure: 160, Cholesterol: 286, MaxHeartRate: 108, Condition: "Disease" },
      { Age: 67, ChestPain: "Asymptomatic", BloodPressure: 120, Cholesterol: 229, MaxHeartRate: 129, Condition: "Disease" },
      { Age: 37, ChestPain: "Non-anginal", BloodPressure: 130, Cholesterol: 250, MaxHeartRate: 187, Condition: "Normal" },
      { Age: 41, ChestPain: "Atypical", BloodPressure: 130, Cholesterol: 204, MaxHeartRate: 172, Condition: "Normal" },
      { Age: 56, ChestPain: "Atypical", BloodPressure: 120, Cholesterol: 236, MaxHeartRate: 178, Condition: "Normal" },
      { Age: 62, ChestPain: "Asymptomatic", BloodPressure: 140, Cholesterol: 268, MaxHeartRate: 160, Condition: "Disease" },
      { Age: 57, ChestPain: "Asymptomatic", BloodPressure: 120, Cholesterol: 354, MaxHeartRate: 123, Condition: "Disease" },
      { Age: 63, ChestPain: "Asymptomatic", BloodPressure: 130, Cholesterol: 254, MaxHeartRate: 147, Condition: "Disease" },
      { Age: 53, ChestPain: "Asymptomatic", BloodPressure: 140, Cholesterol: 203, MaxHeartRate: 155, Condition: "Disease" },
      { Age: 57, ChestPain: "Asymptomatic", BloodPressure: 140, Cholesterol: 192, MaxHeartRate: 148, Condition: "Normal" },
      { Age: 56, ChestPain: "Atypical", BloodPressure: 140, Cholesterol: 294, MaxHeartRate: 153, Condition: "Normal" },
      { Age: 44, ChestPain: "Atypical", BloodPressure: 120, Cholesterol: 263, MaxHeartRate: 173, Condition: "Normal" },
      { Age: 52, ChestPain: "Non-anginal", BloodPressure: 172, Cholesterol: 199, MaxHeartRate: 162, Condition: "Normal" },
      { Age: 57, ChestPain: "Non-anginal", BloodPressure: 150, Cholesterol: 168, MaxHeartRate: 174, Condition: "Normal" }
    ]
  },

  housing_regression: {
    id: "housing_regression",
    name: "Dự Đoán Giá Nhà (Housing Price - Regression Tree)",
    description: "Bộ dữ liệu số thực minh hoạ Cây hồi quy (CART Regression) với hàm mục tiêu Variance Reduction (MSE).",
    targetCol: "Price",
    taskType: "regression",
    columns: ["Area", "Rooms", "AgeOfHome", "DistanceToCenter", "Price"],
    featureTypes: {
      Area: "numerical",
      Rooms: "numerical",
      AgeOfHome: "numerical",
      DistanceToCenter: "numerical"
    },
    data: [
      { Area: 50, Rooms: 2, AgeOfHome: 15, DistanceToCenter: 8.5, Price: 1.8 },
      { Area: 65, Rooms: 2, AgeOfHome: 8, DistanceToCenter: 6.0, Price: 2.5 },
      { Area: 70, Rooms: 3, AgeOfHome: 12, DistanceToCenter: 7.2, Price: 2.8 },
      { Area: 85, Rooms: 3, AgeOfHome: 5, DistanceToCenter: 4.5, Price: 3.9 },
      { Area: 95, Rooms: 3, AgeOfHome: 3, DistanceToCenter: 3.2, Price: 4.6 },
      { Area: 110, Rooms: 4, AgeOfHome: 2, DistanceToCenter: 2.5, Price: 5.5 },
      { Area: 120, Rooms: 4, AgeOfHome: 10, DistanceToCenter: 5.0, Price: 5.0 },
      { Area: 45, Rooms: 1, AgeOfHome: 20, DistanceToCenter: 9.0, Price: 1.4 },
      { Area: 80, Rooms: 3, AgeOfHome: 18, DistanceToCenter: 6.5, Price: 3.1 },
      { Area: 100, Rooms: 4, AgeOfHome: 6, DistanceToCenter: 3.8, Price: 4.8 },
      { Area: 135, Rooms: 5, AgeOfHome: 1, DistanceToCenter: 1.8, Price: 6.8 },
      { Area: 60, Rooms: 2, AgeOfHome: 14, DistanceToCenter: 7.0, Price: 2.2 }
    ]
  },

  iris: {
    id: "iris",
    name: "Phân Loại Hoa Diên Vĩ (Iris Dataset)",
    description: "Bộ dữ liệu kinh điển nhất thế giới Machine Learning (Fisher, 1936) phân loại 3 loài hoa theo cánh hoa và đài hoa.",
    targetCol: "Species",
    taskType: "classification",
    columns: ["SepalLength", "SepalWidth", "PetalLength", "PetalWidth", "Species"],
    featureTypes: {
      SepalLength: "numerical",
      SepalWidth: "numerical",
      PetalLength: "numerical",
      PetalWidth: "numerical"
    },
    data: [
      { SepalLength: 5.1, SepalWidth: 3.5, PetalLength: 1.4, PetalWidth: 0.2, Species: "Setosa" },
      { SepalLength: 4.9, SepalWidth: 3.0, PetalLength: 1.4, PetalWidth: 0.2, Species: "Setosa" },
      { SepalLength: 4.7, SepalWidth: 3.2, PetalLength: 1.3, PetalWidth: 0.2, Species: "Setosa" },
      { SepalLength: 5.0, SepalWidth: 3.6, PetalLength: 1.4, PetalWidth: 0.2, Species: "Setosa" },
      { SepalLength: 5.4, SepalWidth: 3.9, PetalLength: 1.7, PetalWidth: 0.4, Species: "Setosa" },
      { SepalLength: 7.0, SepalWidth: 3.2, PetalLength: 4.7, PetalWidth: 1.4, Species: "Versicolor" },
      { SepalLength: 6.4, SepalWidth: 3.2, PetalLength: 4.5, PetalWidth: 1.5, Species: "Versicolor" },
      { SepalLength: 6.9, SepalWidth: 3.1, PetalLength: 4.9, PetalWidth: 1.5, Species: "Versicolor" },
      { SepalLength: 5.5, SepalWidth: 2.3, PetalLength: 4.0, PetalWidth: 1.3, Species: "Versicolor" },
      { SepalLength: 6.5, SepalWidth: 2.8, PetalLength: 4.6, PetalWidth: 1.5, Species: "Versicolor" },
      { SepalLength: 6.3, SepalWidth: 3.3, PetalLength: 6.0, PetalWidth: 2.5, Species: "Virginica" },
      { SepalLength: 5.8, SepalWidth: 2.7, PetalLength: 5.1, PetalWidth: 1.9, Species: "Virginica" },
      { SepalLength: 7.1, SepalWidth: 3.0, PetalLength: 5.9, PetalWidth: 2.1, Species: "Virginica" },
      { SepalLength: 6.3, SepalWidth: 2.9, PetalLength: 5.6, PetalWidth: 1.8, Species: "Virginica" },
      { SepalLength: 6.5, SepalWidth: 3.0, PetalLength: 5.8, PetalWidth: 2.2, Species: "Virginica" },
      { SepalLength: 5.7, SepalWidth: 2.8, PetalLength: 4.5, PetalWidth: 1.3, Species: "Versicolor" },
      { SepalLength: 5.1, SepalWidth: 3.8, PetalLength: 1.5, PetalWidth: 0.3, Species: "Setosa" },
      { SepalLength: 7.6, SepalWidth: 3.0, PetalLength: 6.6, PetalWidth: 2.1, Species: "Virginica" }
    ]
  },

  loan_approval: {
    id: "loan_approval",
    name: "Xét Duyệt Cho Vay Vốn (Loan Approval)",
    description: "Mô phỏng quyết định duyệt hồ sơ vay tín chấp/thế chấp của ngân hàng dựa trên điểm tín dụng và thu nhập.",
    targetCol: "LoanStatus",
    taskType: "classification",
    columns: ["IncomeLevel", "CreditScore", "EmploymentYears", "HasCollateral", "LoanStatus"],
    featureTypes: {
      IncomeLevel: "categorical",
      CreditScore: "numerical",
      EmploymentYears: "numerical",
      HasCollateral: "categorical"
    },
    data: [
      { IncomeLevel: "High", CreditScore: 750, EmploymentYears: 6, HasCollateral: "Yes", LoanStatus: "Approved" },
      { IncomeLevel: "High", CreditScore: 680, EmploymentYears: 2, HasCollateral: "No", LoanStatus: "Approved" },
      { IncomeLevel: "Medium", CreditScore: 720, EmploymentYears: 5, HasCollateral: "Yes", LoanStatus: "Approved" },
      { IncomeLevel: "Medium", CreditScore: 590, EmploymentYears: 1, HasCollateral: "No", LoanStatus: "Rejected" },
      { IncomeLevel: "Low", CreditScore: 620, EmploymentYears: 3, HasCollateral: "No", LoanStatus: "Rejected" },
      { IncomeLevel: "Low", CreditScore: 710, EmploymentYears: 4, HasCollateral: "Yes", LoanStatus: "Approved" },
      { IncomeLevel: "High", CreditScore: 580, EmploymentYears: 1, HasCollateral: "No", LoanStatus: "Rejected" },
      { IncomeLevel: "Medium", CreditScore: 660, EmploymentYears: 3, HasCollateral: "Yes", LoanStatus: "Approved" },
      { IncomeLevel: "Low", CreditScore: 540, EmploymentYears: 0, HasCollateral: "No", LoanStatus: "Rejected" },
      { IncomeLevel: "High", CreditScore: 800, EmploymentYears: 8, HasCollateral: "No", LoanStatus: "Approved" },
      { IncomeLevel: "Medium", CreditScore: 640, EmploymentYears: 2, HasCollateral: "No", LoanStatus: "Rejected" },
      { IncomeLevel: "Low", CreditScore: 680, EmploymentYears: 5, HasCollateral: "Yes", LoanStatus: "Approved" }
    ]
  },

  mushroom: {
    id: "mushroom",
    name: "Nhận Biết Nấm Ăn Được & Nấm Độc (Mushroom Safety)",
    description: "Bộ dữ liệu sinh học phân biệt nấm ăn được (Edible) và nấm kịch độc (Poisonous) dựa vào hình thái và mùi hương.",
    targetCol: "Safety",
    taskType: "classification",
    columns: ["CapShape", "CapColor", "Odor", "Habitat", "Safety"],
    featureTypes: {
      CapShape: "categorical",
      CapColor: "categorical",
      Odor: "categorical",
      Habitat: "categorical"
    },
    data: [
      { CapShape: "Convex", CapColor: "Brown", Odor: "Almond", Habitat: "Woods", Safety: "Edible" },
      { CapShape: "Convex", CapColor: "Yellow", Odor: "Foul", Habitat: "Grasses", Safety: "Poisonous" },
      { CapShape: "Bell", CapColor: "White", Odor: "Anise", Habitat: "Meadows", Safety: "Edible" },
      { CapShape: "Convex", CapColor: "White", Odor: "Foul", Habitat: "Paths", Safety: "Poisonous" },
      { CapShape: "Flat", CapColor: "Brown", Odor: "None", Habitat: "Woods", Safety: "Edible" },
      { CapShape: "Flat", CapColor: "Red", Odor: "Pungent", Habitat: "Urban", Safety: "Poisonous" },
      { CapShape: "Bell", CapColor: "Brown", Odor: "Almond", Habitat: "Meadows", Safety: "Edible" },
      { CapShape: "Convex", CapColor: "Red", Odor: "Foul", Habitat: "Woods", Safety: "Poisonous" },
      { CapShape: "Flat", CapColor: "White", Odor: "None", Habitat: "Grasses", Safety: "Edible" },
      { CapShape: "Bell", CapColor: "Yellow", Odor: "Fishy", Habitat: "Waste", Safety: "Poisonous" },
      { CapShape: "Convex", CapColor: "Brown", Odor: "None", Habitat: "Woods", Safety: "Edible" },
      { CapShape: "Flat", CapColor: "Yellow", Odor: "Foul", Habitat: "Paths", Safety: "Poisonous" }
    ]
  },

  overfitting_demo: {
    id: "overfitting_demo",
    name: "⚠️ Thử Nghiệm Học Vẹt (Overfitting Case)",
    description: "Bộ dữ liệu duyệt vay gồm 18 khách hàng, trong đó cố tình chèn 2 trường hợp ngoại lệ/nhiễu (outliers). Khi max_depth cao, cây sẽ đâm nhánh cực sâu để học vẹt 2 ngoại lệ này!",
    targetCol: "LoanApproved",
    taskType: "classification",
    columns: ["Age", "Income", "CreditScore", "HasCollateral", "LoanApproved"],
    featureTypes: {
      Age: "numerical",
      Income: "numerical",
      CreditScore: "numerical",
      HasCollateral: "categorical"
    },
    data: [
      // Nhóm người đủ tiêu chuẩn rõ ràng (Duyệt Yes)
      { Age: 35, Income: 45, CreditScore: 720, HasCollateral: "Yes", LoanApproved: "Yes" },
      { Age: 40, Income: 50, CreditScore: 750, HasCollateral: "Yes", LoanApproved: "Yes" },
      { Age: 42, Income: 60, CreditScore: 680, HasCollateral: "Yes", LoanApproved: "Yes" },
      { Age: 38, Income: 55, CreditScore: 710, HasCollateral: "No", LoanApproved: "Yes" },
      { Age: 50, Income: 65, CreditScore: 740, HasCollateral: "Yes", LoanApproved: "Yes" },
      { Age: 31, Income: 48, CreditScore: 690, HasCollateral: "No", LoanApproved: "Yes" },
      { Age: 45, Income: 52, CreditScore: 730, HasCollateral: "Yes", LoanApproved: "Yes" },
      { Age: 36, Income: 58, CreditScore: 760, HasCollateral: "Yes", LoanApproved: "Yes" },

      // Nhóm người dưới chuẩn rõ ràng (Từ chối No)
      { Age: 22, Income: 12, CreditScore: 510, HasCollateral: "No", LoanApproved: "No" },
      { Age: 24, Income: 15, CreditScore: 540, HasCollateral: "No", LoanApproved: "No" },
      { Age: 26, Income: 18, CreditScore: 560, HasCollateral: "No", LoanApproved: "No" },
      { Age: 23, Income: 14, CreditScore: 520, HasCollateral: "No", LoanApproved: "No" },
      { Age: 28, Income: 16, CreditScore: 580, HasCollateral: "No", LoanApproved: "No" },
      { Age: 25, Income: 19, CreditScore: 550, HasCollateral: "No", LoanApproved: "No" },
      { Age: 29, Income: 20, CreditScore: 570, HasCollateral: "No", LoanApproved: "No" },
      { Age: 27, Income: 17, CreditScore: 530, HasCollateral: "No", LoanApproved: "No" },

      // ⚠️ NGOẠI LỆ 1 (Nhiễu / Outlier): Hồ sơ rất xấu nhưng vẫn duyệt (do người quen gửi gắm)
      { Age: 23, Income: 13, CreditScore: 515, HasCollateral: "No", LoanApproved: "Yes" },

      // ⚠️ NGOẠI LỆ 2 (Nhiễu / Outlier): Hồ sơ cực kỳ đẹp nhưng bị trượt (do lỗi đánh máy/hồ sơ ảo)
      { Age: 48, Income: 62, CreditScore: 770, HasCollateral: "Yes", LoanApproved: "No" }
    ]
  }
};

/**
 * Phân tích chuỗi CSV thành mảng đối tượng
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("Tệp CSV cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu.");
  }

  // Tách dòng tiêu đề
  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(",");
    if (rawCols.length !== headers.length) continue;

    const row = {};
    for (let j = 0; j < headers.length; j++) {
      let val = rawCols[j].trim().replace(/^["']|["']$/g, "");
      // Tự động nhận diện số
      if (!isNaN(val) && val !== "") {
        val = Number(val);
      }
      row[headers[j]] = val;
    }
    data.push(row);
  }

  // Nhận diện kiểu dữ liệu các cột
  const featureTypes = {};
  headers.forEach(h => {
    const isNum = data.every(row => typeof row[h] === "number" || isNaN(row[h]));
    featureTypes[h] = isNum ? "numerical" : "categorical";
  });

  const lastCol = headers[headers.length - 1];
  const isRegression = featureTypes[lastCol] === "numerical" && new Set(data.map(d => d[lastCol])).size > 5;

  return {
    id: "custom_" + Date.now(),
    name: "Dữ liệu người dùng tải lên",
    description: `Dữ liệu tuỳ chỉnh gồm ${data.length} mẫu và ${headers.length} cột.`,
    targetCol: lastCol,
    taskType: isRegression ? "regression" : "classification",
    columns: headers,
    featureTypes: featureTypes,
    data: data
  };
}

/**
 * Chuyển bộ dữ liệu thành CSV để xuất (Export)
 */
function exportToCSV(dataset) {
  const headers = dataset.columns.join(",");
  const rows = dataset.data.map(row => dataset.columns.map(c => JSON.stringify(row[c] ?? "")).join(","));
  return [headers, ...rows].join("\n");
}
