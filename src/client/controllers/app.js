var filesystem = require('../file-system');
var watcher = require('../file-system-watcher');
var sessionManager = require('../session-manager');
var Editor = require('../editor');
var Session = require('../editor/session');


// todo: sort out the session/editor/manager bindings.
// Not sure if sessions are getting destroyed correctly.


app.controller('AppCtrl', ['$scope', '$modal', 'dialog',
  function($scope, $modal, $dialog) {

    var codeEditor;

    /*
     * Set root scope properties
     */
    $scope.fsTree = watcher.tree;
    $scope.fsList = watcher.list;
    $scope.sessions = sessionManager.sessions;
    $scope.activeSession = null;

    watcher.on('change', function() {
      $scope.fsTree = watcher.tree;
      $scope.fsList = watcher.list;
      $scope.$apply();
    });

    watcher.on('unlink', function(fso) {
      var session = sessionManager.getSession(fso.path);
      if (session) {
        removeSession(session);
      }
    });

    sessionManager.on('change', function() {
      $scope.$apply();
    });

    function removeSession(session) {

      // check if it's the active session
      if ($scope.activeSession === session) {
        $scope.getEditor().clearSession();
        $scope.activeSession = null;
      }

      // todo: sort this out //
      // remove the session
      setTimeout(function() {
        // do this after a short delay to avoid
        // Error: $rootScope:inprog. Action Already In Progress
        sessionManager.remove(session.fso.path);
      }, 1);

    }

    function saveSession(session) {
      var path = session.fso.path;
      var contents = session.getValue();
      filesystem.writeFile(path, contents, function(response) {
        if (response.err) {
          $dialog.alert({
            title: 'File System Write Error',
            message: JSON.stringify(response.err)
          });
        } else {
          session.markClean();
        }
      });
    }

    function initializeCodeEditor() {
      codeEditor = new Editor(document.getElementById('code-editor'));

      codeEditor.on('save', function(session) {
        saveSession(session);
      });

      codeEditor.on('saveall', function() {
        var sessions = sessionManager.sessions;
        for (var path in sessions) {
          var session = sessions[path];
          if (session.isDirty()) {
            saveSession(session);
          }
        }
      });

      codeEditor.on('help', function() {
        $modal.open({
          templateUrl: 'keyboard-shortcuts.html',
          controller: function SimpleModalCtrl($scope, $modalInstance) {
            $scope.ok = function () {
              $modalInstance.close();
            };
          },
          size: 'lg'
        });
      });

      return codeEditor;
    }

    $scope.getEditor = function() {
      return codeEditor || initializeCodeEditor();
    };

    $scope.open = function(fso) {
      var existing = sessionManager.getSession(fso.path);
      if (!existing) {
        filesystem.readFile(fso.path, function(response) {
          var data = response.data;

          var session = new Session(data);
          sessionManager.add(data.path, session);
          openSession(session);
        });
      } else {
        openSession(existing);
      }
    };

    $scope.clickSession = function(e, session) {
      // activate or close
      if (e.target.className === 'close') {
        closeSession(session);
      } else  {
        openSession(session);
      }
    };

    function openSession(session) {
      $scope.activeSession = session;
      $scope.getEditor().setSession(session);
    }

    function closeSession(session) {
      removeSession(session);
    }
  }
]);
