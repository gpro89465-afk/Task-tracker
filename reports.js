// ==========================================
// PERFORMANCE REPORT
// FINAL VERSION
// ==========================================


// ==========================================
// STORAGE
// ==========================================

function loadStored(key, fallback) {

    try {

        const raw = localStorage.getItem(key);

        if (raw === null) {
            return fallback;
        }

        const parsed = JSON.parse(raw);

        return parsed === null ? fallback : parsed;

    } catch (error) {

        console.warn("Could not read '" + key + "' from storage.", error);

        return fallback;
    }
}


let recurringTasks = loadStored("recurringTasks", []);

let dailyRecords = loadStored("dailyRecords", {});

let settings = loadStored("taskSettings", { dailyGoal: 80 });

if (!Array.isArray(recurringTasks)) {
    recurringTasks = [];
}

if (typeof dailyRecords !== "object" || Array.isArray(dailyRecords)) {
    dailyRecords = {};
}

if (
    typeof settings !== "object" ||
    !Number.isFinite(Number(settings.dailyGoal)) ||
    Number(settings.dailyGoal) < 1
) {
    settings = { dailyGoal: 80 };
}

Object.keys(dailyRecords).forEach(date => {

    if (
        !dailyRecords[date] ||
        !Array.isArray(dailyRecords[date].completed)
    ) {
        dailyRecords[date] = { completed: [] };
    }
});


// ==========================================
// DATE
// ==========================================

function getDate(daysAgo = 0) {

    const date = new Date();

    date.setDate(
        date.getDate() - daysAgo
    );

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==========================================
// DAILY SCORE
// ==========================================

function getDailyScore(date) {

    if (recurringTasks.length === 0) {
        return 0;
    }

    if (!dailyRecords[date]) {
        return 0;
    }

    const completed =
        dailyRecords[date]
            .completed.length;

    return Math.round(
        (completed / recurringTasks.length)
        * 100
    );
}


// ==========================================
// TODAY
// ==========================================

const today =
    getDate(0);

const todayScore =
    getDailyScore(today);

document.getElementById(
    "todayScore"
).innerText =
    todayScore + "%";

document.getElementById(
    "reportGoal"
).innerText =
    settings.dailyGoal + "%";


// ==========================================
// AVERAGES
// ==========================================

function getAverage(days) {

    let total = 0;

    for (let i = 0; i < days; i++) {

        const date =
            getDate(i);

        total +=
            getDailyScore(date);

    }

    return Math.round(
        total / days
    );
}


document.getElementById(
    "weekScore"
).innerText =
    getAverage(7) + "%";


document.getElementById(
    "monthScore"
).innerText =
    getAverage(30) + "%";


// ==========================================
// CURRENT STREAK
// ==========================================

function calculateCurrentStreak() {

    let streak = 0;

    for (let i = 0; i < 3650; i++) {

        const date =
            getDate(i);

        const score =
            getDailyScore(date);

        if (
            score >= settings.dailyGoal
        ) {

            streak++;

        } else {

            break;

        }
    }

    return streak;
}


// ==========================================
// BEST STREAK
// ==========================================

function calculateBestStreak() {

    let best = 0;

    let current = 0;

    const dates =
        Object.keys(dailyRecords)
            .sort();

    dates.forEach(date => {

        const score =
            getDailyScore(date);

        if (
            score >= settings.dailyGoal
        ) {

            current++;

            best =
                Math.max(
                    best,
                    current
                );

        } else {

            current = 0;

        }

    });

    return best;
}


const currentStreak =
    calculateCurrentStreak();

const bestStreak =
    calculateBestStreak();


document.getElementById(
    "currentStreak"
).innerText =
    currentStreak;


document.getElementById(
    "currentStreak2"
).innerText =
    currentStreak + " DAYS";


document.getElementById(
    "bestStreak2"
).innerText =
    bestStreak + " DAYS";


// ==========================================
// WEEKLY GRAPH
// ==========================================

function displayWeeklyChart() {

    const chart =
        document.getElementById(
            "weeklyChart"
        );

    chart.innerHTML = "";
    let weeklyTotal = 0;

    for (let i = 6; i >= 0; i--) {

        const date =
            getDate(i);

        const score =
            getDailyScore(date);
        weeklyTotal += score;

        const day =
            new Date(
                date + "T00:00:00"
            ).toLocaleDateString(
                "en-IN",
                {
                    weekday: "short"
                }
            );
        const dayNumber =
            new Date(date + "T00:00:00").getDate();
        const isToday =
            i === 0;

        const column =
            document.createElement("div");

        column.className = isToday
            ? "chart-column is-today"
            : "chart-column";
        column.setAttribute(
            "aria-label",
            `${date}: ${score}% productivity${isToday ? ", today" : ""}`
        );

        column.innerHTML = `

            <div class="bar-container">

                <div
                    class="bar"
                    style="height:${Math.max(score, 2)}%; --bar-score:${score}%"
                >

                    <span>
                        ${score}%
                    </span>

                </div>

            </div>
            </div>
            <div class="day${isToday ? " is-today-label" : ""}">
                <span>${day}</span>
                <small>${dayNumber}${isToday ? " · TODAY" : ""}</small>
            </div>

        `;

        chart.appendChild(column);

    }

    const weeklyAverage =
        Math.round(weeklyTotal / 7);

    document.getElementById("weeklyAverage").textContent =
        `${weeklyAverage}%`;
    document.getElementById("weeklyGoalLabel").textContent =
        `${settings.dailyGoal}%`;
    chart.style.setProperty(
        "--weekly-goal",
        `${settings.dailyGoal}%`
    );

}

displayWeeklyChart();


// ==========================================
// TASK CONSISTENCY
// ==========================================

function displayTaskConsistency() {

    const container =
        document.getElementById(
            "taskConsistency"
        );

    container.innerHTML = "";

    if (recurringTasks.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No tasks available.
            </div>
        `;

        return;
    }

    recurringTasks.forEach(task => {

        let completedDays = 0;

        for (let i = 0; i < 30; i++) {

            const date =
                getDate(i);

            if (
                dailyRecords[date] &&
                dailyRecords[date]
                    .completed
                    .includes(task.id)
            ) {

                completedDays++;

            }

        }

        const consistency =
            Math.round(
                (completedDays / 30) * 100
            );

        const row =
            document.createElement("div");

        row.className =
            "task";

        row.style.gridTemplateColumns =
            "1fr 120px";

        row.innerHTML = `

            <div>

                <strong>
                    ${escapeHTML(task.name)}
                </strong>

                <div class="mini-progress">

                    <div
                        style="width:${consistency}%"
                    ></div>

                </div>

            </div>

            <strong>
                ${consistency}%
            </strong>

        `;

        container.appendChild(row);

    });
}

displayTaskConsistency();


// ==========================================
// 30 DAY CALENDAR
// ==========================================

function displayActivityCalendar() {

    const calendar =
        document.getElementById(
            "activityCalendar"
        );

    calendar.innerHTML = "";

    for (let i = 29; i >= 0; i--) {

        const date =
            getDate(i);

        const score =
            getDailyScore(date);

        const day =
            new Date(
                date + "T00:00:00"
            ).getDate();

        const cell =
            document.createElement("div");

        cell.className =
            "activity-cell";
        cell.setAttribute("role", "button");
        cell.tabIndex = 0;

        if (score === 0) {

            cell.classList.add(
                "level-0"
            );

        } else if (score < 40) {

            cell.classList.add(
                "level-1"
            );

        } else if (score < 70) {

            cell.classList.add(
                "level-2"
            );

        } else if (score < 100) {

            cell.classList.add(
                "level-3"
            );

        } else {

            cell.classList.add(
                "level-4"
            );

        }

        cell.innerHTML = `
            <span>${day}</span>
        `;

        cell.title =
            `${date} — ${score}% completed`;

        const formattedDate =
            new Date(date + "T00:00:00").toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );

        cell.setAttribute(
            "aria-label",
            `${formattedDate}: ${score}% productivity. Select to view report.`
        );
        cell.addEventListener("click", function() {
            openDayReport(date, formattedDate);
        });
        cell.addEventListener("keydown", function(event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openDayReport(date, formattedDate);
            }
        });

        calendar.appendChild(cell);

    }
}

displayActivityCalendar();

function openDayReport(date, formattedDate) {

    const dialog =
        document.getElementById("dayReportDialog");

    document.getElementById("dayReportTitle").textContent =
        formattedDate;
    document.getElementById("dayReportPrompt").hidden = false;
    document.getElementById("dayReportDetails").hidden = true;
    document.getElementById("dayReportEyebrow").textContent =
        "DATE SELECTED";

    document.getElementById("seeDayReport").onclick = function() {

        const completedIds =
            dailyRecords[date]
                ? dailyRecords[date].completed
                : [];

        const completedCount =
            recurringTasks.filter(task => completedIds.includes(task.id)).length;

        const taskList =
            document.getElementById("dayReportTasks");

        taskList.replaceChildren();

        recurringTasks.forEach(task => {

            const isCompleted =
                completedIds.includes(task.id);
            const item =
                document.createElement("li");
            const name =
                document.createElement("span");
            const status =
                document.createElement("span");

            item.className = isCompleted ? "is-completed" : "";
            name.textContent = task.name;
            status.textContent = isCompleted ? "DONE" : "NOT DONE";
            status.className = "day-report-task-status";

            item.append(name, status);
            taskList.appendChild(item);

        });

        document.getElementById("dayReportScore").textContent =
            `${getDailyScore(date)}%`;
        document.getElementById("dayReportSummary").textContent =
            `${completedCount} of ${recurringTasks.length} tasks completed`;
        document.getElementById("dayReportEmpty").hidden =
            recurringTasks.length > 0;
        document.getElementById("dayReportDetails").hidden = false;
        document.getElementById("dayReportPrompt").hidden = true;
        document.getElementById("dayReportEyebrow").textContent =
            "DAILY REPORT";

    };

    dialog.showModal();
}

document.getElementById("closeDayReport").addEventListener("click", function() {
    document.getElementById("dayReportDialog").close();
});
document.getElementById("cancelDayReport").addEventListener("click", function() {
    document.getElementById("dayReportDialog").close();
});


// ==========================================
// ADVANCED ANALYTICS
// ==========================================

function calculateAdvancedAnalytics() {

    let productiveDays = 0;

    let totalCompletions = 0;

    let bestScore = -1;

    let bestDate = null;

    for (let i = 0; i < 30; i++) {

        const date =
            getDate(i);

        const score =
            getDailyScore(date);

        if (
            score >= settings.dailyGoal
        ) {

            productiveDays++;

        }

        if (dailyRecords[date]) {

            totalCompletions +=
                dailyRecords[date]
                    .completed.length;

        }

        if (score > bestScore) {

            bestScore = score;

            bestDate = date;

        }

    }


    let bestTask = "—";

    let bestTaskCount = -1;


    recurringTasks.forEach(task => {

        let count = 0;

        for (let i = 0; i < 30; i++) {

            const date =
                getDate(i);

            if (
                dailyRecords[date] &&
                dailyRecords[date]
                    .completed
                    .includes(task.id)
            ) {

                count++;

            }

        }

        if (count > bestTaskCount) {

            bestTaskCount = count;

            bestTask = task.name;

        }

    });


    return {
        productiveDays,
        totalCompletions,
        bestDate,
        bestTask
    };
}


const analytics =
    calculateAdvancedAnalytics();


document.getElementById(
    "productiveDays"
).innerText =
    analytics.productiveDays;


document.getElementById(
    "totalCompletions"
).innerText =
    analytics.totalCompletions;


document.getElementById(
    "bestDay"
).innerText =
    analytics.bestDate
        ? new Date(
            analytics.bestDate + "T00:00:00"
        ).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short"
            }
        )
        : "—";


document.getElementById(
    "bestTask"
).innerText =
    analytics.bestTask;


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// BROWSER LIFECYCLE
// ==========================================

// Back/forward cache or another tab changed the data: refresh.
window.addEventListener("pageshow", function(event) {

    if (event.persisted) {

        location.reload();

    }
});


window.addEventListener("storage", function(event) {

    if (
        event.key === "recurringTasks" ||
        event.key === "dailyRecords" ||
        event.key === "taskSettings"
    ) {

        location.reload();

    }
});


document.addEventListener("visibilitychange", function() {

    if (
        document.visibilityState === "visible" &&
        getDate(0) !== today
    ) {

        location.reload();

    }
});
