// ==========================================
// TASK COMMAND CENTER
// FINAL VERSION
// ==========================================


// ==========================================
// DATE
// ==========================================

function getToday() {

    const date = new Date();

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getDate(daysAgo = 0) {

    const date = new Date();

    date.setDate(
        date.getDate() - daysAgo
    );

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==========================================
// STORAGE
// ==========================================

// Browser-safe storage helpers. localStorage can throw (private mode,
// blocked cookies, full quota) or hold corrupt JSON; never let that
// crash the whole page.

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


let storageWarningShown = false;

function saveStored(key, value) {

    try {

        localStorage.setItem(key, JSON.stringify(value));

    } catch (error) {

        console.warn("Could not save '" + key + "'.", error);

        if (!storageWarningShown) {

            storageWarningShown = true;

            alert(
                "Your browser is blocking storage, so changes " +
                "will not be saved. Disable private browsing or " +
                "allow site data for this site."
            );
        }
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
// MIGRATE OLD TASKS
// ==========================================

const oldTasks = loadStored("tasks", null);

if (
    recurringTasks.length === 0 &&
    Array.isArray(oldTasks) &&
    oldTasks.length > 0
) {

    recurringTasks =
        oldTasks.map(task => {

            return {
                id: task.id,
                name: task.name,
                category: "PERSONAL",
                priority: "MEDIUM"
            };

        });

    saveRecurringTasks();
}


// ==========================================
// MIGRATE EXISTING TASK FORMAT
// ==========================================

recurringTasks =
    recurringTasks.map(task => {

        return {
            id: task.id,
            name: task.name,
            category: task.category || "PERSONAL",
            priority: task.priority || "MEDIUM",
            estimatedHours:
                Number.isFinite(Number(task.estimatedHours)) &&
                Number(task.estimatedHours) > 0
                    ? Number(task.estimatedHours)
                    : 0
        };

    });

saveRecurringTasks();


// ==========================================
// TODAY
// ==========================================

const today = getToday();

if (!dailyRecords[today]) {

    dailyRecords[today] = {
        completed: []
    };

    saveDailyRecords();
}


// ==========================================
// DATE DISPLAY
// ==========================================

document.getElementById("date").innerText =
    new Date().toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );


// ==========================================
// ADD TASK
// ==========================================

function addTask() {

    const input =
        document.getElementById("taskInput");

    const categoryInput =
        document.getElementById("categoryInput");

    const priorityInput =
        document.getElementById("priorityInput");

    const estimatedHoursInput =
        document.getElementById("taskHoursInput");

    const name =
        input.value.trim();

    if (name === "") {

        input.focus();

        return;
    }

    if (!estimatedHoursInput.reportValidity()) {
        estimatedHoursInput.focus();
        return;
    }

    const task = {

        id: Date.now(),

        name: name,

        category:
            categoryInput.value,

        priority:
            priorityInput.value,

        estimatedHours:
            estimatedHoursInput.valueAsNumber

    };

    recurringTasks.push(task);

    saveRecurringTasks();

    input.value = "";
    estimatedHoursInput.value = "1";

    displayTasks();

    input.focus();
}


// ==========================================
// ENTER KEY
// ==========================================

document
    .getElementById("taskInput")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                addTask();

            }

        }
    );


// ==========================================
// DISPLAY TASKS
// ==========================================

function displayTasks() {

    const taskList =
        document.getElementById("taskList");

    taskList.innerHTML = "";

    const completedToday =
        dailyRecords[today].completed;

    updateTaskOverview(completedToday);

    if (recurringTasks.length === 0) {

        taskList.innerHTML = `
            <div class="empty-state">
                No tasks yet. Add your first task above.
            </div>
        `;

        updateStats();

        return;
    }

    recurringTasks.forEach(task => {

        const isCompleted =
            completedToday.includes(task.id);
        const estimatedHours =
            Number.isFinite(Number(task.estimatedHours))
                ? Number(task.estimatedHours)
                : 0;

        const div =
            document.createElement("div");

        div.className = "task";

        if (isCompleted) {

            div.classList.add("completed");

        }

        const priorityClass =
            task.priority.toLowerCase();

        div.innerHTML = `

            <input
                class="task-checkbox"
                type="checkbox"
                aria-label="Mark ${escapeHTML(task.name)} as complete"
                ${isCompleted ? "checked" : ""}
                onchange="toggleTask(${task.id})"
            >

            <div class="task-content">
                <span class="task-name">
                    ${escapeHTML(task.name)}
                </span>
                <span class="task-meta">
                    <span class="category-badge">
                        ${escapeHTML(task.category)}
                    </span>
                    <span class="priority-badge priority-${priorityClass}">
                        ${escapeHTML(task.priority)}
                    </span>
                    <span class="task-estimate ${estimatedHours > 0 ? "" : "estimate-missing"}">
                        ${estimatedHours > 0
                            ? `${formatEstimatedHours(estimatedHours)} EST.`
                            : "ADD ESTIMATE"}
                    </span>
                </span>
            </div>

            <button
                class="delete-btn"
                onclick="deleteTask(${task.id})">
                DELETE
            </button>
        `;

        taskList.appendChild(div);

    });

    updateStats();
}

function formatEstimatedHours(hours) {
    return `${Number.isInteger(hours) ? hours : Number(hours.toFixed(2))}h`;
}

function updateTaskOverview(completedToday) {

    const totalHours =
        recurringTasks.reduce(
            (total, task) => total + (
                Number.isFinite(Number(task.estimatedHours))
                    ? Number(task.estimatedHours)
                    : 0
            ),
            0
        );
    const completedTasks =
        recurringTasks.filter(task => completedToday.includes(task.id));
    const completedHours =
        completedTasks.reduce(
            (total, task) => total + (
                Number.isFinite(Number(task.estimatedHours))
                    ? Number(task.estimatedHours)
                    : 0
            ),
            0
        );
    const missingEstimates =
        recurringTasks.filter(task => !(Number(task.estimatedHours) > 0)).length;
    const completionRate =
        recurringTasks.length === 0
            ? 0
            : Math.round((completedTasks.length / recurringTasks.length) * 100);

    document.getElementById("taskSummary").textContent =
        `${completedTasks.length} of ${recurringTasks.length} ${
            recurringTasks.length === 1 ? "task" : "tasks"
        } complete`;
    document.getElementById("taskTimeSummary").textContent =
        `${formatEstimatedHours(completedHours)} complete · ${
            formatEstimatedHours(totalHours)
        } planned${missingEstimates > 0
            ? ` · ${missingEstimates} ${
                missingEstimates === 1 ? "task needs" : "tasks need"
            } an estimate`
            : ""}`;
    document.getElementById("taskCompletionBar").style.width =
        `${completionRate}%`;

    const completionMeter =
        document.querySelector(".task-overview-track");
    completionMeter.setAttribute("aria-valuemax", String(recurringTasks.length));
    completionMeter.setAttribute("aria-valuenow", String(completedTasks.length));
}


// ==========================================
// HTML SAFETY
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
// TOGGLE TASK
// ==========================================

function toggleTask(id) {

    const completed =
        dailyRecords[today].completed;

    const index =
        completed.indexOf(id);

    if (index === -1) {

        completed.push(id);

    } else {

        completed.splice(index, 1);

    }

    saveDailyRecords();

    displayTasks();
}


// ==========================================
// DELETE TASK
// ==========================================

function deleteTask(id) {

    const task =
        recurringTasks.find(
            item => item.id === id
        );

    if (!task) {
        return;
    }

    const confirmDelete =
        confirm(
            `Delete "${task.name}" permanently?`
        );

    if (!confirmDelete) {
        return;
    }

    recurringTasks =
        recurringTasks.filter(
            item => item.id !== id
        );

    saveRecurringTasks();

    Object.keys(dailyRecords)
        .forEach(date => {

            dailyRecords[date].completed =
                dailyRecords[date]
                    .completed
                    .filter(
                        taskId => taskId !== id
                    );

        });

    saveDailyRecords();

    displayTasks();
}


// ==========================================
// SAVE
// ==========================================

function saveRecurringTasks() {

    saveStored("recurringTasks", recurringTasks);
}


function saveDailyRecords() {

    saveStored("dailyRecords", dailyRecords);
}


function saveSettings() {

    saveStored("taskSettings", settings);
}


// ==========================================
// DAILY GOAL
// ==========================================

function saveGoal() {

    const input =
        document.getElementById("goalInput");

    let goal =
        parseInt(input.value);

    if (isNaN(goal)) {
        goal = 80;
    }

    goal =
        Math.max(
            1,
            Math.min(100, goal)
        );

    settings.dailyGoal = goal;

    input.value = goal;

    saveSettings();

    updateStats();
}


// ==========================================
// SCORE
// ==========================================

function getDailyScore(date) {

    if (recurringTasks.length === 0) {
        return 0;
    }

    if (!dailyRecords[date]) {
        return 0;
    }

    const completed =
        dailyRecords[date].completed.length;

    return Math.round(
        (completed / recurringTasks.length) * 100
    );
}


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
// ADVANCED ANALYTICS
// ==========================================

function getAnalytics() {

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
            dailyRecords[date] &&
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

    let bestTaskScore = -1;

    recurringTasks.forEach(task => {

        let completed = 0;

        for (let i = 0; i < 30; i++) {

            const date =
                getDate(i);

            if (
                dailyRecords[date] &&
                dailyRecords[date]
                    .completed
                    .includes(task.id)
            ) {

                completed++;

            }

        }

        if (completed > bestTaskScore) {

            bestTaskScore = completed;

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


// ==========================================
// UPDATE ANALYTICS
// ==========================================

function updateAnalytics() {

    const data =
        getAnalytics();

    document.getElementById(
        "productiveDays"
    ).innerText =
        data.productiveDays;

    document.getElementById(
        "totalCompletions"
    ).innerText =
        data.totalCompletions;

    if (data.bestDate) {

        document.getElementById(
            "bestDay"
        ).innerText =
            new Date(
                data.bestDate + "T00:00:00"
            ).toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "short"
                }
            );

    } else {

        document.getElementById(
            "bestDay"
        ).innerText = "—";

    }

    document.getElementById(
        "bestTask"
    ).innerText =
        data.bestTask;
}


// ==========================================
// STATISTICS
// ==========================================

function updateStats() {

    const total =
        recurringTasks.length;

    const completed =
        dailyRecords[today]
            .completed.length;

    let score = 0;

    if (total > 0) {

        score =
            Math.round(
                (completed / total) * 100
            );

    }

    document.getElementById("total")
        .innerText = total;

    document.getElementById("completed")
        .innerText = completed;

    document.getElementById("score")
        .innerText = score + "%";

    document.getElementById("progressBar")
        .style.width =
        Math.min(score, 100) + "%";


    // GOAL

    const goal =
        settings.dailyGoal;

    document.getElementById("goalText")
        .innerText =
        goal + "%";

    document.getElementById("goalInput")
        .value =
        goal;

    document.getElementById("goalProgressBar")
        .style.width =
        Math.min(
            (score / goal) * 100,
            100
        ) + "%";


    // STREAK

    const currentStreak =
        calculateCurrentStreak();

    document.getElementById("streak")
        .innerText =
        currentStreak + " DAYS";


    // TASK COUNT

    document.getElementById("taskCount")
        .innerText =
        total + (total === 1 ? " TASK" : " TASKS");


    // PERFORMANCE

    const status =
        document.getElementById(
            "performanceStatus"
        );

    const reportText =
        document.getElementById(
            "reportText"
        );

    if (total === 0) {

        status.innerText =
            "NO DATA";

        reportText.innerText =
            "Add your first recurring task.";

    } else if (score === 100) {

        status.innerText =
            "🔥 PERFECT DAY";

        reportText.innerText =
            "Excellent! You completed every task today.";

    } else if (score >= goal) {

        status.innerText =
            "✅ GOAL ACHIEVED";

        reportText.innerText =
            `You completed ${completed} of ${total} tasks. Your daily goal is complete.`;

    } else if (score >= 40) {

        status.innerText =
            "⚠️ PARTIAL DAY";

        reportText.innerText =
            `You completed ${completed} of ${total} tasks. Reach ${goal}% to maintain your streak.`;

    } else {

        status.innerText =
            "❌ LOW ACTIVITY";

        reportText.innerText =
            `You completed ${completed} of ${total} tasks. Aim for at least ${goal}% today.`;

    }

    updateAnalytics();
}


// ==========================================
// INITIAL LOAD
// ==========================================

displayTasks();


// ==========================================
// BROWSER LIFECYCLE
// ==========================================

// A tab left open past midnight must switch to the new day.
document.addEventListener("visibilitychange", function() {

    if (
        document.visibilityState === "visible" &&
        getToday() !== today
    ) {

        location.reload();

    }
});


// Restored from the back/forward cache: refresh stale state.
window.addEventListener("pageshow", function(event) {

    if (event.persisted) {

        location.reload();

    }
});


// Another tab changed the data: reload so this tab does not
// overwrite it with an out-of-date copy.
window.addEventListener("storage", function(event) {

    const watched = [
        "recurringTasks",
        "dailyRecords",
        "taskSettings"
    ];

    if (
        watched.indexOf(event.key) !== -1 &&
        document.getElementById("taskInput").value === ""
    ) {

        location.reload();

    }
});


// ==========================================
// BACKUP / RESTORE
// ==========================================

function exportData() {

    const backup = {
        app: "task-command-center",
        version: 1,
        exportedAt: new Date().toISOString(),
        recurringTasks: recurringTasks,
        dailyRecords: dailyRecords,
        taskSettings: settings
    };

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "task-command-center-backup-" + getToday() + ".json";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
}


function importData(event) {

    const file = event.target.files[0];

    event.target.value = "";

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {

        let data;

        try {

            data = JSON.parse(reader.result);

        } catch (error) {

            alert("That file is not a valid backup.");

            return;
        }

        if (
            !data ||
            !Array.isArray(data.recurringTasks) ||
            typeof data.dailyRecords !== "object" ||
            data.dailyRecords === null
        ) {

            alert("That file is not a Task Command Center backup.");

            return;
        }

        if (
            !confirm(
                "Replace all current tasks and history with this backup?"
            )
        ) {
            return;
        }

        saveStored("recurringTasks", data.recurringTasks);

        saveStored("dailyRecords", data.dailyRecords);

        if (
            data.taskSettings &&
            Number.isFinite(Number(data.taskSettings.dailyGoal))
        ) {

            saveStored("taskSettings", data.taskSettings);

        }

        location.reload();
    };

    reader.onerror = function() {

        alert("Could not read that file.");

    };

    reader.readAsText(file);
}
