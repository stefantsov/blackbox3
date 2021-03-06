var global_tasks = [];
var $task_panel = null;
var task_submit_url = null;

var getTaskByPk = function (pk) {
    global_tasks.forEach(function (task) {
        console.log('pk='+pk);
        console.log('task.pk='+task.pk);
        if (task.pk == pk) {
            return task;
        }
    });
    return null;
};

var refreshTaskList = function ($root, solvedTasks) {
    var $list = $('<ul>').addClass('list-unstyled');
    var solvedTaskPks = [];
    solvedTasks.forEach(function (solvedTask) {
        solvedTaskPks.push(solvedTask.pk);
    });

    var $prevItem = null;
    var prevCat = null;
    global_tasks.forEach(function (task) {
        var text = '('+task.category+' '+task.cost+') '+task.title;
        var $item = $('<li>');
        var $link = $('<a>')
            .addClass('task-link')
            .attr('href', '')
            .text(text);
        if ($.inArray(task.pk, solvedTaskPks) != -1) {
            $item.addClass('bg-success');
        }
        if (task.category != prevCat) {
            if ($prevItem && !$prevItem.hasClass('bg-success')) {
                $prevItem.addClass('bg-info');
            }
        }
        $link.click(function (e) {
            e.preventDefault();
            if ($task_panel === null) {
                return;
            }

            var $taskLink = null;
            var $writeupLink = null;
            var $task = $('<div>')
                .attr('role', 'tabpanel')
                .append($('<ul>')
                        .addClass('nav')
                        .addClass('nav-tabs')
                        .attr('role', 'tablist')
                        .append($('<li>')
                                .attr('role', 'presentation')
                                .addClass('active')
                                .append($taskLink = $('<a>')
                                        .attr('href', '#task-text')
                                        .attr('aria-controls', 'task-text')
                                        .attr('role', 'tab')
                                        .data('toggle', 'tab')
                                        .text('Text')))
                        .append($('<li>')
                                .attr('role', 'presentation')
                                .append($writeupLink = $('<a>')
                                        .attr('href', '#task-writeup')
                                        .attr('aria-controls', 'task-writeup')
                                        .attr('role', 'tab')
                                        .data('toggle', 'tab')
                                        .text('Writeup'))));

            [$taskLink, $writeupLink].forEach(function ($link) {
                if ($link) {
                    $link.click(function (e) {
                        e.preventDefault();
                        $(this).tab('show');
                    });
                }
            });

            var $taskTab = $('<div>');
            var $title = $('<h3>').text(task.title);
            var $body = $(task.desc);
            $taskTab.append($title).append($body);

            var $submitBtn = null;
            $submitForm = $('<form>')

                .attr('id', 'flag-submit-form')
                //.addClass('form-inline')

                .append($('<input>')
                            .attr('type', 'hidden')
                            .attr('name', 'task')
                            .attr('value', task.pk))

                .append($('<div>').addClass('form-group').append($('<input>')
                            .addClass('form-control')
                            .attr('type', 'text')
                            .attr('name', 'flag')
                            .attr('placeholder', 'Flag')))

                .append($submitBtn = $('<input>')
                            .attr('id', 'flag-submit-btn')
                            .attr('type', 'submit')
                            .attr('value', 'Submit Flag')
                            .addClass('btn')
                            .addClass('btn-primary'))

                .append($('<div>')
                            .attr('id', 'results'));

            var $writeupTab = $('<div>')
                                .append($title.clone())
                                .append($(task.writeup));

            $task.append($('<div>')
                            .addClass('tab-content')
                            .append($('<div>')
                                    .attr('role', 'tabpanel')
                                    .addClass('tab-pane')
                                    .addClass('active')
                                    .attr('id', 'task-text')
                                    .append($taskTab))
                            .append($('<div>')
                                    .attr('role', 'tabpanel')
                                    .addClass('tab-pane')
                                    .attr('id', 'task-writeup')
                                    .append($writeupTab)));

            $task_panel.children().remove();
            $task_panel.append($task);
            if ($.inArray(task.pk, solvedTaskPks) == -1) {
                $taskTab.append($submitForm);
            } else {
                var lang = 'en';
                if (navigator.languages.length > 1 && navigator.languages[0].toLowerCase().startsWith('ru')) {
                    lang = 'ru';
                }

                if (lang === 'ru') {
                    $taskTab.append($('<h1>').text('Ваша команда уже решила это задание.'));
                } else {
                    $taskTab.append($('<h1>').text('You have already solved this task.'));
                }
            }

            var submitForm = new Form($submitForm);

            $submitBtn.click(function (e) {
                e.preventDefault();
                $.ajax({
                    method: 'POST',
                    url: task_submit_url,
                    data: submitForm.getJson(),
                    success: function (data, stat, xhr) {
                        var resp = JSON.parse(xhr.responseText);
                        if ('error' in resp) {
                            $('#results').append($('<h1>').text('Error: '+resp['error']));
                        } else {
                            $('#results').append($('<h1>').text(resp['result']));
                        }
                    },
                    error: function (xhr) {
                        var resp = JSON.parse(xhr.responseText);
                        $('#results').append($('<h1>').text('Error: '+resp['error']));
                    }
                });
            });
        });
        $item.append($link);
        $list.append($item);

        $prevItem = $item;
        prevCat = task.category;
    });
    if ($prevItem && !$prevItem.hasClass('bg-success')) {
        $prevItem.addClass('bg-info');
    }

    $root.children().remove();
    $root.append($list);
};

var updateTaskList = function (tasksUrl, tasksSolvedUrl, $root) {
    $.ajax({
        method: 'GET',
        url: tasksUrl,
        dataType: 'json',
        success: function (data, stat, xhr1) {
            $.ajax({
                method: 'GET',
                url: tasksSolvedUrl,
                dataType: 'json',
                success: function (data, stat, xhr2) {
                    global_tasks = JSON.parse(xhr1.responseText);
                    global_tasks.sort(function (a, b) {
                        if (a.category < b.category) {
                            return -1;
                        }
                        if (a.category > b.category) {
                            return 1;
                        }
                        return a.cost - b.cost;
                    });
                    var solvedTasks = JSON.parse(xhr2.responseText);
                    refreshTaskList($root, solvedTasks);
                },
                error: function (xhr2) {
                    global_tasks = JSON.parse(xhr1.responseText);
                    global_tasks.sort(function (a, b) {
                        if (a.category < b.category) {
                            return -1;
                        }
                        if (a.category > b.category) {
                            return 1;
                        }
                        return a.cost - b.cost;
                    });
                    refreshTaskList($root, []);
                }
            });
        }
    });
};

var setTaskPanel = function ($obj) {
    $task_panel = $obj;
}
