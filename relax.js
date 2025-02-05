// 格式化热度数字
function formatHeat(heat) {
    const num = parseInt(heat);
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
}

// 格式化更新时间
function formatUpdateTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `更新时间：${hours}:${minutes}`;
}

// 渲染热搜列表
function renderHotSearchList(data, platform) {
    const container = document.getElementById(`${platform.toLowerCase()}List`);
    const updateTimeEl = document.getElementById(`${platform.toLowerCase()}UpdateTime`);
    
    if (!container || !updateTimeEl) return;
    
    // 清空现有内容
    container.innerHTML = '';
    
    // 创建一个文档片段来存储所有项目
    const fragment = document.createDocumentFragment();
    
    // 渲染所有热搜项
    data.hotSearchDTOList.forEach((item, index) => {
        const hotSearchItem = document.createElement('a');
        hotSearchItem.href = item.hotSearchUrl;
        hotSearchItem.target = '_blank';
        hotSearchItem.className = 'hot-search-item';
        hotSearchItem.dataset.index = index;
        
        // 初始设置为隐藏状态
        hotSearchItem.style.opacity = '0';
        hotSearchItem.style.transform = 'translateX(-10px)';
        
        const rankClass = index < 3 ? 'hot-search-rank top-3' : 'hot-search-rank';
        
        hotSearchItem.innerHTML = `
            <div class="${rankClass}">${index + 1}</div>
            <div class="hot-search-content">
                <div class="hot-search-title">${item.hotSearchTitle}</div>
                <div class="hot-search-heat">🔥 ${formatHeat(item.hotSearchHeat)}</div>
            </div>
        `;
        
        fragment.appendChild(hotSearchItem);
    });
    
    // 将所有项目一次性添加到容器中
    container.appendChild(fragment);
    
    // 创建子项观察者
    const itemObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const item = entry.target;
                // 使用 requestAnimationFrame 来优化动画性能
                requestAnimationFrame(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                });
                // 一旦显示就停止观察
                itemObserver.unobserve(item);
            }
        });
    }, {
        root: container,
        rootMargin: '10px',
        threshold: 0.1
    });
    
    // 观察所有热搜项
    container.querySelectorAll('.hot-search-item').forEach(item => {
        itemObserver.observe(item);
    });
    
    // 更新时间
    if (data.updateTime) {
        updateTimeEl.textContent = formatUpdateTime(data.updateTime);
    }
}

// 创建观察者实例
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const platform = entry.target.dataset.platform;
            if (platform) {
                fetchHotSearchData(platform);
                // 加载后取消观察
                observer.unobserve(entry.target);
            }
        }
    });
}, {
    root: null,
    rootMargin: '50px', // 提前50px开始加载
    threshold: 0.1
});

// 获取热搜数据
async function fetchHotSearchData(platform) {
    try {
        const container = document.getElementById(`${platform.toLowerCase()}List`);
        if (!container) return;
        
        // 显示加载状态
        container.innerHTML = '<div class="loading">加载中...</div>';
        
        const apiUrls = {
            'WEIBO': 'https://sbmy.fun/api/hotSearch/queryByType?type=weibo',
            'DOUYIN': 'https://sbmy.fun/api/hotSearch/queryByType?type=douyin',
            'BAIDU': 'https://sbmy.fun/api/hotSearch/queryByType?type=baidu',
            'TENCENT': 'https://sbmy.fun/api/hotSearch/queryByType?type=tencent',
            'BILIBILI': 'https://sbmy.fun/api/hotSearch/queryByType?type=bilibili',
            'ZHIHU': 'https://sbmy.fun/api/hotSearch/queryByType?type=zhihu',
            'TIEBA': 'https://sbmy.fun/api/hotSearch/queryByType?type=tieba',
            'SOUGOU': 'https://sbmy.fun/api/hotSearch/queryByType?type=sougou',
            'TOUTIAO': 'https://sbmy.fun/api/hotSearch/queryByType?type=toutiao'
        };
        
        const url = apiUrls[platform];
        if (!url) return;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data) {
            renderHotSearchList(result.data, platform);
        }
    } catch (error) {
        console.error(`获取${platform}热搜数据失败:`, error);
        const container = document.getElementById(`${platform.toLowerCase()}List`);
        if (container) {
            container.innerHTML = '<div class="error">加载失败，点击重试</div>';
            container.querySelector('.error').onclick = () => fetchHotSearchData(platform);
        }
    }
}

// 初始化懒加载
function initLazyLoad() {
    const platforms = ['WEIBO', 'BAIDU', 'DOUYIN', 'TENCENT', 'BILIBILI', 'ZHIHU', 'TIEBA', 'SOUGOU', 'TOUTIAO'];
    
    platforms.forEach(platform => {
        const container = document.getElementById(`${platform.toLowerCase()}List`);
        if (container) {
            container.dataset.platform = platform;
            observer.observe(container);
        }
    });
}

// 初始化
function init() {
    initLazyLoad();
    
    // 每5分钟刷新一次已加载的数据
    setInterval(() => {
        const platforms = ['WEIBO', 'BAIDU', 'DOUYIN', 'TENCENT', 'BILIBILI', 'ZHIHU', 'TIEBA', 'SOUGOU', 'TOUTIAO'];
        platforms.forEach(platform => {
            const container = document.getElementById(`${platform.toLowerCase()}List`);
            if (container && container.children.length > 0 && !container.querySelector('.loading')) {
                fetchHotSearchData(platform);
            }
        });
    }, 5 * 60 * 1000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init); 