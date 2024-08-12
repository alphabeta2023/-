// 当页面关闭时，清除localStorage中用户登录信息并保存页面状态
window.addEventListener('beforeunload', function(event) {
    if (isUserLoggedIn()) {
        savePageState();
    }
    localStorage.removeItem('currentUser');
});

function savePageState() {
    const columns = document.querySelectorAll('.column');
    const pageState = [];

    columns.forEach(column => {
        const columnState = {
            id: column.id,
            title: column.querySelector('h2').textContent,
            cards: []
        };

        column.querySelectorAll('.card').forEach(card => {
            const cardState = {
                text: card.querySelector('.card-content').textContent.trim(),
                startDate: card.querySelector('.start-date').textContent.split(': ')[1],
                endDate: card.querySelector('.end-date').textContent.split(': ')[1],
                imageSrc: card.querySelector('.image-container img') ? card.querySelector('.image-container img').src : '',
                comments: []
            };

            card.querySelectorAll('.comment').forEach(comment => {
                cardState.comments.push({
                    content: comment.querySelector('span').textContent,
                    date: comment.querySelector('.submit-date').textContent
                });
            });

            columnState.cards.push(cardState);
        });

        pageState.push(columnState);
    });

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        localStorage.setItem(`pageState_${currentUser}`, JSON.stringify(pageState));
    }
}

function isUserLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}


// 当DOM内容完全加载后执行的函数
document.addEventListener('DOMContentLoaded', () => {
    if (isUserLoggedIn()) {
        const currentUser = localStorage.getItem('currentUser');
        if (localStorage.getItem(`pageState_${currentUser}`)) {
            let cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.remove();
            });
            let columns = document.querySelectorAll('.column');
            columns.forEach(column => {
                column.remove();
            });
            // 如果用户已登录，加载页面状态
            loadPageState();
        }else {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                // 为每个卡片添加拖拽事件监听器
                addDragListeners(card);
            });

            // 获取所有列元素
            const columns = document.querySelectorAll('.column');
            // 为每个列添加拖拽事件监听器
            columns.forEach(column => {
                addColumnDragListeners(column);
            });

            // 获取所有评论图标元素
            const commentIcons = document.querySelectorAll('.comment-icon');
            commentIcons.forEach(commentIcon => {
                addCommentIconListeners(commentIcon);
            });

            // 获取所有图片图标元素
            const imageIcons = document.querySelectorAll('.image-icon');
            imageIcons.forEach(imageIcon => {
                addImageIconListeners(imageIcon);
            });
        }
    } else {
        window.location.href = 'login.html';
    }

    // 获取所有卡片元素
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        // 检查每个卡片日期是否有效
        if (!checkDate(card) && !card.querySelector('.exclamation-mark')){
            // 如果日期无效，为卡片添加感叹号
            const exclamationMark = document.createElement('div');
            exclamationMark.className = 'exclamation-mark';
            exclamationMark.textContent = '!';
            card.appendChild(exclamationMark);
            const dropdownMenuContent = document.createElement('div');
            // 获取最近的 column 元素
            const column = card.closest('.column');
            // 获取 column 的 id
            const columnId = column ? column.id : null;
            switch (columnId) {
                case '待办':
                    dropdownMenuContent.textContent = '待办事项的起始日期不能晚于当前日期';
                    break;
                case '进行中':
                    dropdownMenuContent.textContent = '进行中的任务的起始日期和结束日期必须在当前日期之前和之后';
                    break;
                case '已完成':
                    dropdownMenuContent.textContent = '已完成事项的结束日期不能晚于当前日期';
                    break;
                        
                default:
                    break;
            }
            const dropdownMenu = document.createElement('div');
            dropdownMenu.id = 'dropdownMenu';
            dropdownMenu.className = 'dropdown-menu';
            dropdownMenu.appendChild(dropdownMenuContent);
            card.appendChild(dropdownMenu);
        }else if (!checkDate(card) && !card.querySelector('.exclamation-mark')){
            // 如果日期有效，去除感叹号
            card.querySelector('.exclamation-mark').remove();
            card.querySelector('.dropdown-menu').remove();
        }
    });

    // 获取所有感叹号元素
    const exclamationMarks = document.querySelectorAll('.exclamation-mark');
    exclamationMarks.forEach(exclamationMark => {
        addExclamationMarkListeners(exclamationMark);
    });
    
    // 获取所有输入框元素
    const inputs = document.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        addInputListeners(input);
    });

});

// 从输入框添加新卡片的函数
function addCardFromInput(input) {
    // 获取输入框的文本内容并去除空格
    const taskText = input.value.trim();
    if (taskText) {
        // 获取输入框的父元素（列）
        const column = input.parentNode;
        let i = 0;
        if (column.id === '待办') {
            i = 1;
        }else if (column.id === '已完成') {
            i = -1;
        }
        // 创建一个新的日期对象
        let date = new Date();
        // 修改日期（例如，设置为当前日期的下一天）
        date.setDate(date.getDate() + i);
        // 创建新的卡片元素
        const card = createCard(taskText, date.toISOString().split('T')[0], date.toISOString().split('T')[0]);
        // 将新卡片插入到输入框之前
        column.insertBefore(card, input);
        // 清空输入框内容
        input.value = '';
        // 为卡片添加拖拽事件监听器
        addDragListeners(card);
        // 找到新创建卡片中的日历图标元素
        const calendarIcon = card.querySelector('.calendar-icon');
        // 显示日历
        showCalendar(calendarIcon);
    } else {
        // 如果输入内容为空，提示用户
        window.alert('任务内容不能为空');
    }
}


// 删除卡片的函数
function deleteCard(button) {
    // 获取按钮的父元素（即卡片）
    const card = button.parentElement;
    // 移除卡片
    card.remove();
}

// 编辑卡片的函数
function editCard(card) {
    // 创建一个可编辑的输入框
    const input = document.createElement('input');
    input.type = 'text';
    // 获取卡片的文本内容并去除空格
    input.value = card.textContent.trim();
    if (input.value === '无内容') {
        input.value = '';    
    }
    input.className = 'edit-input';

    // 替换卡片内容为输入框
    card.replaceWith(input);

    // 聚焦输入框
    input.focus();

    // 当输入框失去焦点时，更新卡片内容并恢复
    input.addEventListener('blur', () => {
        let newText = input.value.trim();
        if (!newText) {
            newText = '无内容';
            window.alert('任务内容不能为空');
        }
        card.textContent = newText;
        input.replaceWith(card);
    });

    // 当按下回车键时，更新卡片内容并恢复
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
            input.replaceWith(card);
        }
    });
}

// 显示日历的函数
function showCalendar(element) {
    // 获取最近的 column 元素
    const column = element.closest('.column');
    // 获取 column 的 id
    const columnId = column ? column.id : null;

    // 获取起始日期和结束日期的HTML元素
    const startDateElement = element.parentElement.querySelector('.start-date');
    const endDateElement = element.parentElement.querySelector('.end-date');
    
    // 从HTML元素中提取当前的起始日期和结束日期
    const startDate = startDateElement.innerText.split(': ')[1];
    const endDate = endDateElement.innerText.split(': ')[1];

    // 初始化flatpickr日历组件，设置为范围选择模式，并设置默认日期
    const fp = flatpickr(element, {
        mode: "range", // 范围选择模式
        dateFormat: "Y-m-d", // 日期格式
        defaultDate: [startDate, endDate], // 默认显示的日期范围
        locale: "zh", // 设置语言为中文
        onChange: function(selectedDates, dateStr, instance) {
            // 当用户选择日期后，更新HTML元素中的日期显示
            const dates = dateStr.split(' 至 ');

            // 比较日期
            if (dates.length === 1 && selectedDates.length === 2) {
                dates.push(dates[0]);
            }
            if (dates.length === 2) {
                const startDate = new Date(dates[0]);
                const endDate = new Date(dates[1]);
                const currentDate = new Date();

                // 将时间部分设置为00:00:00
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
                currentDate.setHours(0, 0, 0, 0);

                switch (columnId) {
                    case '待办':
                        if (currentDate > startDate) {
                            // 待办事项的起始日期不能晚于当前日期
                            window.alert('待办事项的起始日期不能晚于当前日期');
                            showCalendar(element);
                            return;
                        }
                        break;
                    case '进行中':
                        if (currentDate < startDate || currentDate > endDate) {
                            // 进行中的任务的起始日期和结束日期必须在当前日期之前和之后
                            window.alert('进行中的任务的起始日期和结束日期必须在当前日期之前和之后');
                            showCalendar(element);
                            return;
                        }
                        break;
                    case '已完成':
                        if (currentDate < endDate) {
                            // 已完成事项的结束日期不能晚于当前日期
                            window.alert('已完成事项的结束日期不能晚于当前日期');
                            showCalendar(element);
                            return;
                        }
                        break;
                    default:
                        break;
                }
                startDateElement.innerText = '起始日期: ' + dates[0];
                endDateElement.innerText = '结束日期: ' + dates[1];
                    
            }
        }
    });

    // 打开日历组件
    fp.open();
}

// 给卡片添加拖拽事件监听器的函数
function addDragListeners(card) {
    card.addEventListener('dragstart', (e) => {
        // 设置拖拽数据为卡片的文本内容，去除“删除”以及空格
        let cleanedText = card.querySelector('.card-content').textContent.trim();
        e.dataTransfer.setData('text/plain', cleanedText);
        // 设置拖拽时的透明度
        e.target.style.opacity = '0.4';
        
        // 获取卡片的起始日期和结束日期
        const startDateElement = card.querySelector('.start-date');
        const endDateElement = card.querySelector('.end-date');
        const startDate = startDateElement.innerText.split(': ')[1];
        const endDate = endDateElement.innerText.split(': ')[1];

        // 获取图片的src属性
        const imageElement = card.querySelector('.image-container img');
        const imageSrc = imageElement ? imageElement.src : '';

        // 获取评论内容
        const commentList = card.querySelector('.comment-list');
        const comments = [];
        if (commentList) {
            commentList.querySelectorAll('.comment').forEach(comment => {
                const commentContent = comment.querySelector('span').textContent;
                const submitDate = comment.querySelector('.submit-date').textContent;
                comments.push({ content: commentContent, date: submitDate });
            });
        }

        // 将日期信息、图片信息和评论信息添加到dataTransfer对象中
        e.dataTransfer.setData('text/start-date', startDate);
        e.dataTransfer.setData('text/end-date', endDate);
        e.dataTransfer.setData('text/image-src', imageSrc);
        e.dataTransfer.setData('text/comments', JSON.stringify(comments));
    });

    card.addEventListener('dragend', (e) => {
        // 拖拽结束时恢复透明度
        e.target.style.opacity = '1';
        card.remove();
    });
}

// 给列添加拖拽事件监听器的函数
function addColumnDragListeners(column) {
    column.addEventListener('dragover', (e) => {
        // 阻止默认行为以允许放置
        e.preventDefault();
    });
    column.addEventListener('dragenter', (e) => {
        // 进入列时改变背景颜色
        e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    });
    column.addEventListener('dragleave', (e) => {
        // 离开列时恢复背景颜色
        e.target.style.backgroundColor = '';
    });
    column.addEventListener('drop', (e) => {
        // 阻止默认行为
        e.preventDefault();
        // 恢复背景颜色
        e.target.style.backgroundColor = '';
        // 获取拖拽数据
        const data = e.dataTransfer.getData('text/plain');
        const startDate = e.dataTransfer.getData('text/start-date');
        const endDate = e.dataTransfer.getData('text/end-date');
        const imageSrc = e.dataTransfer.getData('text/image-src');
        const comments = JSON.parse(e.dataTransfer.getData('text/comments')) || [];
        // 创建新的卡片元素
        const card = createCard(data, startDate, endDate, imageSrc, comments);
        // 获取最近的列元素
        const column = e.target.closest('.column');
        if (column) {
            // 获取列中的输入框和添加按钮
            const input = column.querySelector('input');
            if (input) {
                // 确保输入框和按钮始终在最下面
                column.appendChild(input);
            }
            // 检查是否拖放到到h2标题或另一个卡片内部
            if (e.target.matches('h2') || e.target.classList.contains('card')) {
                // 将新卡片插入到目标卡片的后面
                e.target.parentNode.insertBefore(card, e.target.nextSibling);
            } else {
                // 将新卡片添加到列中
                column.insertBefore(card, input || null);
            }
        }
        // 为卡片添加拖拽事件监听器
        addDragListeners(card);
        // 检查卡片日期是否有效
        if (!checkDate(card) && !card.querySelector('.exclamation-mark')){
            // 如果日期无效，为卡片添加感叹号
            const exclamationMark = document.createElement('div');
            exclamationMark.className = 'exclamation-mark';
            exclamationMark.textContent = '!';
            card.appendChild(exclamationMark);
            const dropdownMenuContent = document.createElement('div');
            switch (column.id) {
                case '待办':
                    dropdownMenuContent.textContent = '待办事项的起始日期不能晚于当前日期';
                    break;
                case '进行中':
                    dropdownMenuContent.textContent = '进行中的任务的起始日期和结束日期必须在当前日期之前和之后';
                    break;
                case '已完成':
                    dropdownMenuContent.textContent = '已完成事项的结束日期不能晚于当前日期';
                    break;
                            
                default:
                    break;
            }
            const dropdownMenu = document.createElement('div');
            dropdownMenu.id = 'dropdownMenu';
            dropdownMenu.className = 'dropdown-menu';
            dropdownMenu.appendChild(dropdownMenuContent);
            card.appendChild(dropdownMenu);
            addExclamationMarkListeners(exclamationMark);
        }else if (!checkDate(card) && !card.querySelector('.exclamation-mark')){
            // 如果日期有效，去除感叹号
            card.querySelector('.exclamation-mark').remove();
            card.querySelector('.dropdown-menu').remove();
        }
    });
}

// 创建新卡片的函数
function createCard(text, startDate = '2024-01-01', endDate = '2024-01-01', imageSrc = '', comments = []) {
    // 创建新的卡片元素
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    
    // 创建 card-content 元素
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    cardContent.textContent = text;
    
    // 创建 card-dates 元素
    const cardDates = document.createElement('div');
    cardDates.className = 'card-dates';
    
    // 创建calendar-icon 元素
    const calendarIcon = document.createElement('span');
    calendarIcon.className = 'calendar-icon';
    calendarIcon.textContent = '📅';

    // 创建 start-date 元素
    const startDateElement = document.createElement('span');
    startDateElement.className = 'start-date';
    startDateElement.textContent = '起始日期: ' + startDate;
    
    // 创建 end-date 元素
    const endDateElement = document.createElement('span');
    endDateElement.className = 'end-date';
    endDateElement.textContent = '结束日期: ' + endDate;
    
    // 将 start-date 和 end-date 添加到 card-dates
    cardDates.appendChild(startDateElement);
    cardDates.appendChild(endDateElement);
    
    // 将 card-content calendar-icon 和 card-dates 添加到 card
    card.appendChild(cardContent);
    card.appendChild(calendarIcon);
    card.appendChild(cardDates);
    
    // 添加删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '×';
    deleteButton.onclick = (e) => {
        deleteCard(e.target);
    };
    card.appendChild(deleteButton);
    
    // 为 card-content 和 card-dates 添加事件监听器
    cardContent.addEventListener('click', (e) => {
        editCard(cardContent);
    });
    calendarIcon.addEventListener('click', (e) => {
        showCalendar(calendarIcon);
    });
    
    // 添加评论图标
    const commentIcon = document.createElement('span');
    commentIcon.className = 'comment-icon';
    commentIcon.textContent = '💬';
    card.appendChild(commentIcon);

    // 添加图片图标
    const imageIcon = document.createElement('span');
    imageIcon.className = 'image-icon';
    imageIcon.textContent = '🖼️';
    card.appendChild(imageIcon);

    // 创建图片容器
    const newImageContainer = document.createElement('div');
    newImageContainer.className = 'image-container';
    card.appendChild(newImageContainer);

    // 如果图片src不为空，则创建图片元素并设置其src属性
    if (imageSrc) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.marginTop = '20px';
        img.style.minWidth = '80%'
        img.style.maxWidth = '90%';
        img.style.maxHeight = '500px'; // 限制图片大小
        img.draggable = false; // 设置图片不可拖拽
        // 添加删除按钮
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = '×';
        deleteButton.onclick = () => {
            newImageContainer.removeChild(img);
            newImageContainer.removeChild(deleteButton);
        };
        
        newImageContainer.appendChild(img);
        newImageContainer.appendChild(deleteButton);
    }

    // 创建评论下拉菜单
    const commentDropdown = document.createElement('div');
    commentDropdown.className = 'comment-dropdown';
    commentDropdown.style.display = 'none'; // 初始状态隐藏

    // 创建评论列表
    const commentList = document.createElement('div');
    commentList.className = 'comment-list';
    commentDropdown.appendChild(commentList);

    // 添加评论内容
    comments.forEach(comment => {
        const newComment = document.createElement('div');
        newComment.className = 'comment';
        newComment.style.display = 'block'; // 设置为块级元素
        newComment.style.border = '1px solid #ccc'; // 添加边框
        newComment.style.padding = '5px'; // 添加内边距
        newComment.style.position = 'relative'; // 设置相对定位

        const commentContent = document.createElement('span');
        commentContent.textContent = comment.content;
        commentContent.style.marginBottom = '1em';
        newComment.appendChild(commentContent);

        const submitDate = document.createElement('span');
        submitDate.className = 'submit-date';
        submitDate.style.position = 'absolute'; // 设置绝对定位
        submitDate.style.bottom = 0; // 设置底部距离
        submitDate.style.right = 0; // 设置右侧距离
        submitDate.style.fontSize = '0.5em'; // 设置字体大小
        submitDate.textContent = comment.date;
        newComment.appendChild(submitDate);

        commentList.appendChild(newComment);
    });

    // 将评论下拉菜单添加到卡片中
    card.appendChild(commentDropdown);

    addCommentIconListeners(commentIcon);

    addImageIconListeners(imageIcon);

    return card;
}

// 检查日期是否有效的函数
function checkDate(element) {
    // 获取最近的 column 元素
    const column = element.closest('.column');
    // 获取 column 的 id
    const columnId = column ? column.id : null;

    // 获取起始日期和结束日期的HTML元素
    const startDateElement = element.querySelector('.start-date');
    const endDateElement = element.querySelector('.end-date');
    
    // 从HTML元素中提取当前的起始日期和结束日期
    const startDate = startDateElement.innerText.split(': ')[1];
    const endDate = endDateElement.innerText.split(': ')[1];

    // 比较日期
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const currentDate = new Date();

    // 将时间部分设置为00:00:00
    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    switch (columnId) {
        case '待办':
            if (currentDate > startDateObj) {
                // 待办事项的起始日期不能晚于当前日期
                return false;
            }
            break;
        case '进行中':
            if (currentDate < startDateObj || currentDate > endDateObj) {
                // 进行中的任务的起始日期和结束日期必须在当前日期之前和之后
                return false;
            }
            break;
        case '已完成':
            if (currentDate < endDateObj) {
                // 已完成事项的结束日期不能晚于当前日期
                return false;
            }
            break;
        default:
            break;
    }
    
    return true;
}

// 为感叹号添加事件监听器的函数
function addExclamationMarkListeners(exclamationMark) {
     // 获取感叹号后面的下拉菜单元素
    const dropdownMenu = exclamationMark.nextElementSibling;

    // 为每个感叹号添加鼠标事件监听器
    exclamationMark.addEventListener('mouseenter', function() {
        dropdownMenu.classList.add('show');
    });
    exclamationMark.addEventListener('mouseleave', function() {
        dropdownMenu.classList.remove('show');
    });
}

// 为输入框添加事件监听器的函数
function addInputListeners(input) {
    input.addEventListener('blur', (e) => {
        // 当输入框失去焦点时，从输入框添加新卡片
        if (e.target.value) {
            if (input.id === 'addColumnInput'){
                // 调用 addNewColumn 函数
                addNewColumn();
            }else if(input.className === 'longer-input'){
                // 调用 addCardFromInput 函数
                addCardFromInput(e.target);
            }
        }
    });
    input.addEventListener('keydown', (e) => {
        // 当按下回车键时，模拟失去焦点事件
        if (e.key === 'Enter') {
            input.blur();
        }
    });
}

// 新增列的函数
function addNewColumn() {
    // 获取 id 为 'board' 的元素，该元素用于包含所有的列
    const board = document.getElementById('board');
    // 获取输入框中的列名，并去除前后空格
    const columnName = addColumnInput.value.trim();
    // 如果列名不为空
    if (columnName) {
        // 创建一个新的列元素
        const newColumn = createColumn(columnName.toLowerCase(), columnName);
        // 将新列元素添加到 board 元素中
        board.appendChild(newColumn);
        // 为新列元素添加拖拽事件监听器
        addColumnDragListeners(newColumn);
        // 为输入框添加事件监听器
        addInputListeners(input);
        // 清空输入框的内容
        addColumnInput.value = '';
    }else {
        // 如果列名为空，提示用户
        window.alert('列名不能为空');
    }
}

// 切换评论下拉菜单的显示状态
function toggleCommentDropdown(commentIcon) {
    // 获取评论图标的下一个兄弟元素，即评论下拉菜单
    const dropdown = commentIcon.nextElementSibling;
    
    // 检查评论下拉菜单的显示状态
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        // 如果当前是隐藏状态，则显示评论下拉菜单
        dropdown.style.display = 'block';
    } else {
        // 如果当前是显示状态，则隐藏评论下拉菜单
        dropdown.style.display = 'none';
    }
}

// 为评论图标添加事件监听器的函数
function addCommentIconListeners(commentIcon) {
    const card = commentIcon.closest('.card');
    const commentDropdown = card.querySelector('.comment-dropdown');
    const commentList = commentDropdown.querySelector('.comment-list');
    let commentInput = commentDropdown.querySelector('.comment-input');
    let submitCommentButton = commentDropdown.querySelector('.submit-comment-button');

    commentIcon.addEventListener('click', (e) => {
        // 如果评论输入框和提交按钮不存在，则创建它们
        if (!commentInput) {
            commentInput = document.createElement('input');
            commentInput.type = 'text';
            commentInput.className = 'comment-input';
            commentInput.placeholder = '输入评论';
            commentDropdown.appendChild(commentInput);
        }

        if (!submitCommentButton) {
            submitCommentButton = document.createElement('button');
            submitCommentButton.className = 'submit-comment-button';
            submitCommentButton.textContent = '提交评论';
            commentDropdown.appendChild(submitCommentButton);
        }
        // 将评论输入框和提交按钮添加到卡片中
        commentDropdown.appendChild(commentInput);
        commentDropdown.appendChild(submitCommentButton);

        // 切换评论下拉菜单的显示状态
        if (commentDropdown.style.display === 'none') {
            commentDropdown.style.display = 'block';
            card.draggable = false;
            commentInput.focus();
        } else {
            commentDropdown.style.display = 'none';
            card.draggable = true;
        }
        
        commentInput.addEventListener('keydown', (e) => {
            // 当按下回车键时，提交评论
            if (e.key === 'Enter') {
                submitCommentButton.click();
            }
        });


        // 提交评论的函数
        submitCommentButton.onclick = (e) => {
            
            const commentText = commentInput.value.trim();
            if (commentText) {
                // 清空输入框
                commentInput.value = '';

                // 创建新的评论元素
                const newComment = document.createElement('div');
                newComment.className = 'comment';
                newComment.style.display = 'block'; // 设置为块级元素
                newComment.style.border = '1px solid #ccc'; // 添加边框
                newComment.style.padding = '5px'; // 添加内边距
                newComment.style.position = 'relative'; // 设置相对定位

                // 添加删除按钮
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-button';
                deleteButton.textContent = '×';
                deleteButton.onclick = (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    deleteCard(e.target);
                };
                newComment.appendChild(deleteButton);

                // 创建评论内容元素
                const commentContent = document.createElement('span');
                commentContent.textContent = commentText;
                commentContent.style.display = 'block';
                commentContent.style.marginBottom = '20px';
                commentContent.style.marginTop = '20px';
                commentContent.style.paddingRight = '10px';
                commentContent.style.paddingLeft = '10px';
                newComment.appendChild(commentContent);

                // 创建提交日期元素
                const submitDate = document.createElement('span');
                submitDate.className = 'submit-date';
                submitDate.style.position = 'absolute'; // 设置绝对定位
                submitDate.style.bottom = 0; // 设置底部距离
                submitDate.style.right = 0; // 设置右侧距离
                submitDate.style.fontSize = '0.5em'; // 设置字体大小
                const currentDate = new Date();
                submitDate.textContent = currentDate.toISOString().split('T')[0]; // 格式为 Y-M-D
                newComment.appendChild(submitDate);

                // 将新的评论添加到评论列表
                commentList.appendChild(newComment);
            } else {
                window.alert('评论不能为空');
            }
        };
        
        // 为文档添加点击事件监听器，点击其他地方时隐藏评论输入框和按钮
        document.addEventListener('click', (e) => {
            if (!commentDropdown.contains(e.target) && !commentIcon.contains(e.target) && commentDropdown.style.display === 'block') {
                commentDropdown.removeChild(commentInput);
                commentDropdown.removeChild(submitCommentButton);
                commentInput = null;
                submitCommentButton = null;
                commentDropdown.style.display = 'none';
                card.draggable = true;
            }
        });

    });

}

// 为图片图标添加事件监听器的函数
function addImageIconListeners(imageIcon) {
    imageIcon.addEventListener('click', (e) => {
        const card = imageIcon.closest('.card');
        const imageContainer = card.querySelector('.image-container');

        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        imageContainer.appendChild(fileInput);

        // 触发文件输入
        fileInput.click();

        // 处理文件选择
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.marginTop = '20px';
                    img.style.minWidth = '80%'
                    img.style.maxWidth = '90%';
                    img.style.maxHeight = '500px'; // 限制图片大小
                    img.draggable = false; // 设置图片不可拖拽

                    // 如果图片容器中已存在图片，则替换原来的图片
                    const existingImg = imageContainer.querySelector('img');
                    if (existingImg) {
                        imageContainer.removeChild(existingImg);
                    }

                    // 添加删除按钮
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'delete-button';
                    deleteButton.textContent = '×';
                    deleteButton.onclick = () => {
                        imageContainer.removeChild(img);
                        imageContainer.removeChild(deleteButton);
                    };

                    imageContainer.appendChild(img);
                    imageContainer.appendChild(deleteButton);

                    // 移除文件输入元素
                    imageContainer.removeChild(fileInput);

                    // 重新绑定卡片的拖动事件监听器
                    addDragListeners(card);
                };
                reader.readAsDataURL(file);
            } else {
                // 如果没有选择文件，移除文件输入元素
                imageContainer.removeChild(fileInput);
            }
        });
    });
}

function loadPageState() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const pageState = JSON.parse(localStorage.getItem(`pageState_${currentUser}`));
        if (pageState) {
            const board = document.getElementById('board');
            pageState.forEach(columnState => {
                const column = createColumn(columnState.id, columnState.title);
                board.appendChild(column);

                columnState.cards.forEach(cardState => {
                    const card = createCard(cardState.text, cardState.startDate, cardState.endDate, cardState.imageSrc, cardState.comments);
                    column.insertBefore(card, column.querySelector('input'));
                    addDragListeners(card);
                });

                addColumnDragListeners(column);
            });
        }
    }
}

function createColumn(id, title) {
    const column = document.createElement('div');
    column.className = 'column';
    column.id = id;

    const h2 = document.createElement('h2');
    h2.textContent = title;
    column.appendChild(h2);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'longer-input';
    input.placeholder = '添加新任务';
    column.appendChild(input);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '×';
    deleteButton.onclick = () => deleteCard(deleteButton);
    column.appendChild(deleteButton);

    return column;
}
