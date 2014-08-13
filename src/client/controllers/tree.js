var p = require('path');
var filesystem = require('../file-system');
var utils = require('../utils');
var handler = utils.ui.responseHandler;


app.controller('TreeCtrl', ['$scope', '$modal', '$log', 'dialog',
  function($scope, $modal, $log, $dialog) {

    var expanded = Object.create(null);

    $scope.showMenu = false;
    $scope.active = null;
    $scope.pasteBuffer = null;

    function genericFileSystemCallback(response) {
      // notify of any errors, otherwise silent.
      // The File System Watcher will handle the state changes in the file system
      if (response.err) {
        $dialog.alert({
          title: 'File System Error',
          message: JSON.stringify(response.err)
        });
      }
    }

    $scope.getClassName = function(fso) {
      var classes = ['fso'];
      classes.push(fso.isDirectory ? 'dir' : 'file');

      if (fso === $scope.active) {
        classes.push('active');
      }

      return classes.join(' ');
    };

    $scope.getIconClassName = function(fso) {
      var classes = ['fa'];

      if (fso.isDirectory) {
        classes.push($scope.isExpanded(fso) ? 'fa-folder-open' : 'fa-folder');
      } else {
        classes.push('fa-file-o');
      }

      return classes.join(' ');
    };

    $scope.isExpanded = function(fso) {
      return !!expanded[fso.path];
    };

    $scope.rightClickNode = function(e, fso) {
      console.log('RClicked ' + fso.name);
      $scope.menuX = e.pageX;
      $scope.menuY = e.pageY;
      $scope.active = fso;
      $scope.showMenu = true;
    };

    $scope.clickNode = function(e, fso) {
      e.preventDefault();
      e.stopPropagation();

      $scope.active = fso;

      if (fso.isDirectory) {
        var isExpanded = $scope.isExpanded(fso);
        if (isExpanded) {
          delete expanded[fso.path];
        } else {
          expanded[fso.path] = true;
        }
      } else {
        $scope.open(fso);
      }

      return false;
    };

    $scope.delete = function(e, fso) {

      e.preventDefault();

      $dialog.confirm({
        title: 'Delete ' + (fso.isDirectory ? 'folder' : 'file'),
        message: 'Delete [' + fso.name + ']. Are you sure?'
      }).then(function() {
        filesystem.remove(fso.path, genericFileSystemCallback);
      }, function() {
        $log.info('Delete modal dismissed');
      });

    };

    $scope.rename = function(e, fso) {

      e.preventDefault();

      $dialog.prompt({
        title: 'Rename ' + (fso.isDirectory ? 'folder' : 'file'),
        message: 'Please enter a new name',
        defaultValue: fso.name,
        placeholder: fso.isDirectory ? 'Folder name' : 'File name'
      }).then(function(value) {
        var oldPath = fso.path;
        var newPath = p.resolve(fso.dir, value);
        filesystem.rename(oldPath, newPath, genericFileSystemCallback);
      }, function() {
        $log.info('Rename modal dismissed');
      });

    };

    $scope.mkfile = function(e, fso) {

      e.preventDefault();

      $dialog.prompt({
        title: 'Add new file',
        placeholder: 'File name',
        message: 'Please enter the new file name'
      }).then(function(value) {
        filesystem.mkfile(p.resolve(fso.path, value), genericFileSystemCallback);
      }, function() {
        $log.info('Make file modal dismissed');
      });

    };

    $scope.mkdir = function(e, fso) {

      e.preventDefault();

      $dialog.prompt({
        title: 'Add new folder',
        placeholder: 'Folder name',
        message: 'Please enter the new folder name'
      }).then(function(value) {
        filesystem.mkdir(p.resolve(fso.path, value), genericFileSystemCallback);
      }, function() {
        $log.info('Make directory modal dismissed');
      });

    };

    $scope.paste = function(e, fso) {

      e.preventDefault();

      var pasteBuffer = $scope.pasteBuffer;

      if (pasteBuffer.op === 'copy') {
        filesystem.copy(pasteBuffer.fso.path, p.resolve(fso.path, pasteBuffer.fso.name), genericFileSystemCallback);
      } else if (pasteBuffer.op === 'cut') {
        filesystem.rename(pasteBuffer.fso.path, p.resolve(fso.path, pasteBuffer.fso.name), genericFileSystemCallback);
      }

      $scope.pasteBuffer = null;

    };

    $scope.showPaste = function(e, active) {
      var pasteBuffer = $scope.pasteBuffer;

      if (pasteBuffer && active.isDirectory) {
        if (!pasteBuffer.fso.isDirectory) {
          return true;
        } else if (active.path.toLowerCase().indexOf(pasteBuffer.fso.path.toLowerCase()) !== 0) { // disallow pasting into self or a decendent
          return true;
        }
      }
      return false;
    };

    $scope.setPasteBuffer = function(e, fso, op) {

      e.preventDefault();

      $scope.pasteBuffer = {
        fso: fso,
        op: op
      };

    };

  }
]);
