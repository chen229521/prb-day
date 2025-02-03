// 获取节假日数据
async function getHolidays() {
    try {
        const response = await fetch('day.json');
        const data = await response.json();
        
        console.log('Received data:', data);
        
        if (!data || !data.dates || !Array.isArray(data.dates)) {
            console.error('Invalid data format:', data);
            return null;
        }
        
        // 只获取今年的节假日，并按名称分组
        const tempHolidays = {};
        
        // 过滤和分组节假日
        data.dates.forEach(holiday => {
            // 跳过补班
            if (holiday.type === 'transfer_workday') return;
            
            const name = holiday.name_cn;
            if (!tempHolidays[name]) {
                tempHolidays[name] = [];
            }
            tempHolidays[name].push({
                date: new Date(holiday.date),
                info: holiday
            });
        });
        
        // 处理节假日期间
        const holidayPeriods = {};
        
        // 对每个节假日只保留开始和结束日期
        Object.entries(tempHolidays).forEach(([name, dates]) => {
            // 按日期排序
            dates.sort((a, b) => a.date - b.date);
            
            // 只保留开始和结束日期
            const startDate = dates[0].date;
            const endDate = dates[dates.length - 1].date;
            
            // 使用开始日期作为键
            const dateKey = startDate.toISOString().split('T')[0];
            holidayPeriods[dateKey] = {
                name: name,
                startDate: startDate,
                endDate: endDate,
                info: dates[0].info
            };
        });
        
        return holidayPeriods;
    } catch (error) {
        console.error('获取节假日数据失败:', error);
        return null;
    }
}

// 计算下一个周末
function getNextWeekend() {
    const now = new Date();
    const currentDay = now.getDay(); // 0是周日，6是周六
    let daysUntilWeekend;
    
    if (currentDay === 0 || currentDay === 6) {
        if (currentDay === 0) {
            daysUntilWeekend = 6; // 如果今天是周日，距离下个周六还有6天
        } else {
            daysUntilWeekend = 1; // 如果今天是周六，距离下个周日还有1天
        }
    } else {
        daysUntilWeekend = 6 - currentDay; // 距离周六的天数
    }
    
    const nextWeekend = new Date(now);
    nextWeekend.setDate(now.getDate() + daysUntilWeekend);
    nextWeekend.setHours(0, 0, 0, 0);
    return nextWeekend;
}

// 计算下一个节假日
function getNextHoliday(holidays) {
    if (!holidays) return null;
    
    const now = new Date();
    const currentDate = now.getTime();
    
    // 过滤出未来的节假日
    const futureHolidays = Object.entries(holidays).filter(([date]) => {
        const holidayDate = new Date(date);
        return holidayDate.getTime() > currentDate;
    });
    
    if (futureHolidays.length === 0) return null;
    
    // 获取最近的节假日
    const nextHoliday = futureHolidays.reduce((nearest, current) => {
        if (!nearest) return current;
        const nearestDate = new Date(nearest[0]);
        const currentDate = new Date(current[0]);
        return currentDate < nearestDate ? current : nearest;
    });
    
    // 解析节假日信息
    const [holidayName, chineseName] = nextHoliday[1].split(',');
    
    return {
        date: new Date(nextHoliday[0]),
        name: chineseName || holidayName // 优先使用中文名称
    };
}

// 计算时间差
function getTimeRemaining(endDate) {
    const total = endDate - new Date();
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    
    return {
        total,
        days,
        hours,
        minutes,
        seconds
    };
}

// 更新倒计时显示
function updateCountdown(id, endDate) {
    const timeRemaining = getTimeRemaining(endDate);
    
    document.getElementById(`${id}-days`).textContent = String(timeRemaining.days).padStart(2, '0');
    document.getElementById(`${id}-hours`).textContent = String(timeRemaining.hours).padStart(2, '0');
    document.getElementById(`${id}-minutes`).textContent = String(timeRemaining.minutes).padStart(2, '0');
    document.getElementById(`${id}-seconds`).textContent = String(timeRemaining.seconds).padStart(2, '0');
    
    return timeRemaining.total > 0;
}

// 创建节假日倒计时元素
function createHolidayElement(date, holidayInfo) {
    const { name, startDate, endDate } = holidayInfo;
    const now = new Date();
    const isPast = endDate < now;
    const isOngoing = now >= startDate && now <= endDate;
    
    const element = document.createElement('div');
    element.className = `countdown-item${isPast ? ' holiday-past' : ''}${isOngoing ? ' holiday-ongoing' : ''}`;
    
    const startDateStr = startDate.toLocaleDateString('zh-CN', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    });
    
    const endDateStr = endDate.toLocaleDateString('zh-CN', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    });
    
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    element.innerHTML = `
        <h2>${name}</h2>
        <div class="holiday-date">${startDateStr} 至 ${endDateStr}</div>
        <div class="holiday-duration">假期长度：${duration}天</div>
        ${isPast ? 
            '<div class="holiday-status past">该节假日已过</div>' :
            isOngoing ?
            '<div class="holiday-status ongoing">假期进行中</div>' :
            `<div class="countdown" id="holiday-${date}">
                <div class="time-block">
                    <span id="holiday-${date}-days">--</span>
                    <label>天</label>
                </div>
                <div class="time-block">
                    <span id="holiday-${date}-hours">--</span>
                    <label>时</label>
                </div>
                <div class="time-block">
                    <span id="holiday-${date}-minutes">--</span>
                    <label>分</label>
                </div>
                <div class="time-block">
                    <span id="holiday-${date}-seconds">--</span>
                    <label>秒</label>
                </div>
            </div>`
        }
    `;
    
    return {
        element,
        isPast,
        isOngoing,
        date: startDate
    };
}

// 初始化应用
async function initApp() {
    const holidays = await getHolidays();
    let nextWeekend = getNextWeekend();
    
    if (holidays) {
        const holidaysContainer = document.getElementById('all-holidays');
        const holidayElements = [];
        
        // 创建所有节假日元素
        Object.entries(holidays).forEach(([date, info]) => {
            const { element, isPast, isOngoing, date: holidayDate } = createHolidayElement(date, info);
            holidayElements.push({ element, isPast, isOngoing, date: holidayDate });
        });
        
        // 按日期排序
        holidayElements.sort((a, b) => a.date - b.date);
        
        // 添加到容器
        holidayElements.forEach(({ element }) => {
            holidaysContainer.appendChild(element);
        });
    }
    
    // 更新倒计时
    function updateAllCountdowns() {
        // 更新周末倒计时
        const weekendValid = updateCountdown('weekend', nextWeekend);
        if (!weekendValid) {
            nextWeekend = getNextWeekend();
        }
        
        // 更新所有未过期节假日的倒计时
        if (holidays) {
            Object.entries(holidays).forEach(([date, info]) => {
                const holidayDate = new Date(date);
                if (holidayDate > new Date()) {
                    updateCountdown(`holiday-${date}`, info.startDate);
                }
            });
        }
    }
    
    // 每秒更新一次倒计时
    setInterval(updateAllCountdowns, 1000);
    updateAllCountdowns(); // 立即更新一次
}

// 启动应用
initApp(); 