//= require jquery/jquery
//= require bootstrap/dist/js/bootstrap.min
//= require mustache/mustache

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second parm
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}

$(function(){
  var startTimer = 'glyphicon-time',
      stopTimer = 'glyphicon-pause';

  var tasks = {

    template: '',

    init: function() {
      tasks.template = $('.task-list').html();
      $('.task').remove();
      tasks.load();
    },

    add: function(name, seconds) {
      var name = name ? name : "Task Name",
          seconds = seconds ? ""+seconds : "0",
          view = {time: seconds, name: name, timeHHMMSS: seconds.toHHMMSS()};
      $('.task-list').append(Mustache.render(tasks.template, view));
      tasks.handlers($('.task').last());
    },

    handlers: function($elem) {
      $elem.find('.task-status').click(function(ev){
        var playing = $(this).find('.glyphicon').toggleClass(startTimer).toggleClass(stopTimer).hasClass(stopTimer);
        $(this).closest('.task-status').trigger('play', playing);
      });

      $elem.find('.task-status').on('play', function(ev, playing){
        var $elem = $(this);

        function updateTime(){
          var newTime = ""+(parseInt($elem.data('seconds'), 10) + 1);
          $elem.data('seconds', newTime);
          $elem.find('.time').text(newTime.toHHMMSS());
          tasks.sync();
        }

        if (playing) {
          $elem.data('timer', setInterval(updateTime, 1000));
        } else {
          var timer = $elem.data('timer');
          if (timer) {
            clearTimeout(timer);
          }
        }
      });

      $elem.find('.delete-task').click(function(){
        $(this).closest('.task').remove();
        tasks.sync();
        return false;
      });

      $elem.find('.reset-timer').click(function(){
        $(this).closest('.task').find('.task-status').data('seconds', 0);
        $(this).closest('.task').find('.time').text("0".toHHMMSS());
        return false;
      });

      $elem.find('.timer-name').on('change', function(){
        tasks.sync();
      });
    },

    toArray: function(){
      var tasklist = [], task;
      $('.task').each(function(id, elem){
        task = [$(elem).find('.timer-name').val(), $(elem).find('.task-status').data('seconds')];
        tasklist.push(task);
      });
      return tasklist;
    },

    toCSV: function(){
      var tasklist = tasks.toArray(), csv = "";
      $(tasklist).each(function(id, task){
        var taskname = task[0],
            taskSeconds = task[1]+"";
        csv += taskname + ', ' + taskSeconds.toHHMMSS() + "\n";
        console.log(task);
      });
      return csv;
    },

    defaultSet: function(){
      return [[false, 0], [false, 0]];
    },

    load: function(){
      chrome.storage.sync.get('tasks', function(storedTasks){
        var tasklist = (storedTasks && storedTasks['tasks']) ? storedTasks['tasks'] : tasks.defaultSet();
        console.log(storedTasks);
        $(tasklist).each(function(id, elem){
          console.log(elem);
          tasks.add(elem[0], elem[1]);
        });
      })
    },
    sync: function(){
      chrome.storage.sync.set({'tasks': tasks.toArray()});
    }
  }

  tasks.init();

  $('.new-task').click(function(){
    tasks.add();
  });

  $('.export-tasks').click(function(){
    $('#myModal .modal-body textarea').text(tasks.toCSV());
    $('#myModal').modal();
  });
});
