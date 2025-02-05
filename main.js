document.addEventListener('DOMContentLoaded', function() {
    // 获取所有tab和内容区域
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 为每个tab添加点击事件
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 获取目标内容的ID
            const targetContent = this.dataset.tab;
            
            // 移除所有活动状态
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加新的活动状态
            this.classList.add('active');
            document.getElementById(targetContent).classList.add('active');
        });
    });
}); 