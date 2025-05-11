// html 요소 만들고 스타일링
function createValueWrapper() {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "baseline";
  container.style.marginLeft = "1em";

  const label = document.createElement("small");
  label.innerText = "Label";

  const value = document.createElement("span");
  value.style.fontWeight = "bold";
  value.innerText = "0.00";

  container.append(label, value);

  return container;
}
const performanceWrapper = createValueWrapper();
const performanceLabel = performanceWrapper.children[0] as HTMLElement;
const lang = window.location.pathname.split("/");

if (lang.includes("en")) {
  performanceLabel.innerText = "Performance";
} else if (lang.includes("ja")) {
  performanceLabel.innerText = "パフォーマンス";
} else {
  performanceLabel.innerText = "퍼포먼스";
}

interface Problem {
  difficulty: number;
  solved: boolean;
}

const problems: Problem[] = [];
const solvedTexts = new Set(["받음", "Redeemed", "クリア"]);

/**
 * 퍼포먼스 계산하고 띄우는 함수
 */
function updatePerformance() {
  const solvedProblems = problems.filter((problem) => problem.solved);
  const performance =
    solvedProblems.length > 0
      ? Math.log(
          solvedProblems.reduce(
            (sum, problem) => sum + Math.pow(2.4, problem.difficulty),
            0
          )
        ) / Math.log(2.4)
      : 0;
  const performanceSpan = performanceWrapper.children[1] as HTMLSpanElement;
  performanceSpan.innerText = `${performance.toFixed(2)}`;

  const roundedValue = Math.round(performance);
  if (roundedValue >= 26) {
    // ruby
    performanceSpan.style.color = "#ff0062";
  } else if (roundedValue >= 21) {
    // diamond
    performanceSpan.style.color = "#00b4fc";
  } else if (roundedValue >= 16) {
    // platinum
    performanceSpan.style.color = "#27e2a4";
  } else if (roundedValue >= 11) {
    // gold
    performanceSpan.style.color = "#ec9a00";
  } else if (roundedValue >= 6) {
    // silver
    performanceSpan.style.color = "#435f7a";
  } else if (roundedValue >= 1) {
    // bronze
    performanceSpan.style.color = "#ad5600";
  } else {
    // unrated
    performanceSpan.style.color = "#000000";
  }
}

// 옵저버 설정
const problemImageObserver = new MutationObserver((records) => {
  for (const record of records) {
    if (record.type === "attributes") {
      const problem = record.target as HTMLImageElement;
      const diffculty = Number(problem.src.split("/").pop()!.split(".")[0]);
      const index = Array.from(problem.parentElement!.children).indexOf(
        problem
      );
      problems[index].difficulty = diffculty;
      updatePerformance();
    }
  }
});
const buttonObserver = new MutationObserver((records) => {
  for (const record of records) {
    if (solvedTexts.has(record.target.textContent!)) {
      const button = record.target as HTMLButtonElement;
      const buttonContainer = button.parentElement!;
      const index = Array.from(buttonContainer.parentElement!.children).indexOf(
        buttonContainer
      );
      problems[index].solved = true;
      updatePerformance();
    }
  }
});

/**
 * 요소 추가하고 감시하는 함수
 * @param table
 */
function initialize(table: HTMLTableElement) {
  // 요소 추가
  const marathonInfo = table.parentElement!.parentElement!
    .children[0] as HTMLDivElement;
  marathonInfo.insertBefore(performanceWrapper, marathonInfo.children[1]);

  // Problem 추가, 이미지 감시하기
  for (const problemContainer of table.tBodies[0].children[0].children) {
    const problem = problemContainer.children[0].children[0].children[0];
    const difficultyImage = problem.children[0] as HTMLImageElement;
    problemImageObserver.observe(difficultyImage, {
      attributes: true,
      attributeFilter: ["src"],
    });
    const diffculty = Number(
      difficultyImage.src.split("/").pop()!.split(".")[0]
    );

    problems.push({ difficulty: diffculty, solved: false });
  }

  // 버튼 감시하기
  const buttonContainers = table.tBodies[0].children[2].children;
  for (let i = 0; i < buttonContainers.length; i++) {
    const button = buttonContainers[i].children[0] as HTMLButtonElement;
    buttonObserver.observe(button, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    if (solvedTexts.has(button.innerText)) {
      problems[i].solved = true;
    }
  }

  updatePerformance();
}

// 루트 감시하고 테이블 추가되면 초기화
const rootObserver = new MutationObserver((records, observer) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node.nodeName === "DIV" && node instanceof HTMLDivElement) {
        const table = node.querySelector("table");
        if (table) {
          initialize(table);
          observer.disconnect(); // 초기화 후 옵저버 중지
        }
      }
    }
  }
});

const root = document.querySelector("#__next")!;
rootObserver.observe(root, {
  childList: true,
  subtree: true,
});
