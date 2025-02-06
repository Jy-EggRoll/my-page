// 壁纸列表 - 这里使用了一些示例图片，你可以替换成自己的图片
const wallpapers = ['./images/橙黄山脉.png', './images/雪.png', './images/树和夕阳.png', './images/街道.png', './images/水墨山水.jpeg', './images/紫色天空.png'];

let currentWallpaperIndex = 0;
let isChangingWallpaper = false;

// 更新时间的函数
function updateTime() {
    const now = new Date();
    
    // 更新北京时间
    const beijingTime = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
    document.querySelector('#beijing-time .time').textContent = 
        beijingTime.toLocaleTimeString('en-US', { 
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    
    // 更新美东时间
    const estTime = new Date(now.getTime());
    document.querySelector('#est-time .time').textContent = 
        estTime.toLocaleTimeString('en-US', { 
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'America/New_York'
        });
}

// 获取月份的天数
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// 获取月份第一天是星期几
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

// 更新日历的函数
function updateCalendar() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    
    // 更新当前日期显示
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long' 
    };
    document.getElementById('current-date').textContent = 
        now.toLocaleDateString('zh-CN', options);

    // 生成月历
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    
    // 获取月份名称
    const monthName = now.toLocaleDateString('zh-CN', { month: 'long' });
    document.getElementById('month-name').textContent = monthName;
    
    let calendarHTML = `
        <div class="calendar-header">
            <div>日</div><div>一</div><div>二</div><div>三</div>
            <div>四</div><div>五</div><div>六</div>
        </div>
        <div class="calendar-grid">
    `;
    
    // 添加空白天数
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // 添加月份天数
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === currentDate;
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}">
                ${day}
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    document.getElementById('calendar-grid').innerHTML = calendarHTML;
}

// 更换壁纸的函数
function changeWallpaper() {
    if (isChangingWallpaper) return;
    isChangingWallpaper = true;
    
    currentWallpaperIndex = (currentWallpaperIndex + 1) % wallpapers.length;
    
    const backgroundImg = document.getElementById('background');
    const newImage = new Image();
    newImage.src = wallpapers[currentWallpaperIndex];
    
    newImage.onload = () => {
        backgroundImg.style.opacity = '0';
        
        setTimeout(() => {
            backgroundImg.src = wallpapers[currentWallpaperIndex];
            backgroundImg.style.opacity = '1';
            
            setTimeout(() => {
                isChangingWallpaper = false;
            }, 300);
        }, 300);
    };
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    const backgroundImg = document.getElementById('background');
    const loadingScreen = document.querySelector('.loading-screen');
    
    backgroundImg.style.transition = 'opacity 0.3s ease';
    
    // 预加载第一张背景图片
    const firstImage = new Image();
    firstImage.src = wallpapers[0];
    
    firstImage.onload = () => {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }, 500);
    };

    // 初始化时间和日历显示
    updateTime();
    updateCalendar();
    
    // 每秒更新时间
    setInterval(updateTime, 1000);
    // 每天更新日历
    setInterval(updateCalendar, 86400000);
});