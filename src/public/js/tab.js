(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
app.controller('TabCtrl', ['$scope', '$location', '$window', '$sce', '$modal', 'dialog',
  function($scope, $location, $window, $sce, $modal, $dialog) {

    var address = $location.search().address;

    $scope.address = address;
    $scope.model = {
      address: address
    };

    $scope.submit = function(e) {
      e.preventDefault();
      $scope.address = $sce.trustAsResourceUrl($scope.model.address);
    };

  }
]);

},{}],2:[function(require,module,exports){
app.directive('selectOnFocus', function() {
  return {
    restrict: 'A',
    link: function(scope, element) {
      var focusedElement;
      element.on('click', function() {
        if (focusedElement !== this) {
          this.select();
          focusedElement = this;
        }
      });
      element.on('blur', function() {
        focusedElement = null;
      });
    }
  };
})

},{}],3:[function(require,module,exports){
app.service('dialog', ['$modal', function($modal) {

  var service = {};

  service.alert = function(data) {

    return $modal.open({
      templateUrl: 'alert.html',
      controller: 'AlertCtrl',
      resolve: {
        data: function() {
          return {
            title: data.title,
            message: data.message
          };
        }
      }
    }).result;

  };

  service.confirm = function(data) {

    return $modal.open({
      templateUrl: 'confirm.html',
      controller: 'ConfirmCtrl',
      resolve: {
        data: function() {
          return {
            title: data.title,
            message: data.message
          };
        }
      }
    }).result;

  };

  service.prompt = function(data) {

    return $modal.open({
      templateUrl: 'prompt.html',
      controller: 'PromptCtrl',
      resolve: {
        data: function() {
          return {
            title: data.title,
            message: data.message,
            defaultValue: data.defaultValue,
            placeholder: data.placeholder
          };
        }
      }
    }).result;

  };

  return service;

}]);

app.controller('AlertCtrl', ['$scope', '$modalInstance', 'data',
  function($scope, $modalInstance, data) {

    $scope.title = data.title;
    $scope.message = data.message;

    $scope.ok = function () {
      $modalInstance.close();
    };
  }
]);

app.controller('ConfirmCtrl', ['$scope', '$modalInstance', 'data',
  function($scope, $modalInstance, data) {

    $scope.title = data.title;
    $scope.message = data.message;

    $scope.ok = function () {
      $modalInstance.close();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }
]);

app.controller('PromptCtrl', ['$scope', '$modalInstance', 'data',
  function($scope, $modalInstance, data) {

    $scope.title = data.title;
    $scope.message = data.message;
    $scope.placeholder = data.placeholder;
    $scope.input = { value: data.defaultValue };

    $scope.ok = function () {
      $modalInstance.close($scope.input.value);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }
]);

},{}],4:[function(require,module,exports){
window.app = angular.module('app', ['ui.bootstrap'], function($locationProvider) {
  $locationProvider.html5Mode(true);
});

/*
 * Register Controllers
 */
require('./controllers/tab');

/*
 * Register Directives
 */
require('./directives/select-on-focus');

/*
 * Register Common Services
 */
require('./services/dialog');

},{"./controllers/tab":1,"./directives/select-on-focus":2,"./services/dialog":3}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZ3Vlc3QvRG9jdW1lbnRzL25vaWRlL3NyYy9jbGllbnQvY29udHJvbGxlcnMvdGFiLmpzIiwiL1VzZXJzL2d1ZXN0L0RvY3VtZW50cy9ub2lkZS9zcmMvY2xpZW50L2RpcmVjdGl2ZXMvc2VsZWN0LW9uLWZvY3VzLmpzIiwiL1VzZXJzL2d1ZXN0L0RvY3VtZW50cy9ub2lkZS9zcmMvY2xpZW50L3NlcnZpY2VzL2RpYWxvZy5qcyIsIi9Vc2Vycy9ndWVzdC9Eb2N1bWVudHMvbm9pZGUvc3JjL2NsaWVudC90YWIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiYXBwLmNvbnRyb2xsZXIoJ1RhYkN0cmwnLCBbJyRzY29wZScsICckbG9jYXRpb24nLCAnJHdpbmRvdycsICckc2NlJywgJyRtb2RhbCcsICdkaWFsb2cnLFxuICBmdW5jdGlvbigkc2NvcGUsICRsb2NhdGlvbiwgJHdpbmRvdywgJHNjZSwgJG1vZGFsLCAkZGlhbG9nKSB7XG5cbiAgICB2YXIgYWRkcmVzcyA9ICRsb2NhdGlvbi5zZWFyY2goKS5hZGRyZXNzO1xuXG4gICAgJHNjb3BlLmFkZHJlc3MgPSBhZGRyZXNzO1xuICAgICRzY29wZS5tb2RlbCA9IHtcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3NcbiAgICB9O1xuXG4gICAgJHNjb3BlLnN1Ym1pdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICRzY29wZS5hZGRyZXNzID0gJHNjZS50cnVzdEFzUmVzb3VyY2VVcmwoJHNjb3BlLm1vZGVsLmFkZHJlc3MpO1xuICAgIH07XG5cbiAgfVxuXSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdzZWxlY3RPbkZvY3VzJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCkge1xuICAgICAgdmFyIGZvY3VzZWRFbGVtZW50O1xuICAgICAgZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGZvY3VzZWRFbGVtZW50ICE9PSB0aGlzKSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3QoKTtcbiAgICAgICAgICBmb2N1c2VkRWxlbWVudCA9IHRoaXM7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZWxlbWVudC5vbignYmx1cicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBmb2N1c2VkRWxlbWVudCA9IG51bGw7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59KVxuIiwiYXBwLnNlcnZpY2UoJ2RpYWxvZycsIFsnJG1vZGFsJywgZnVuY3Rpb24oJG1vZGFsKSB7XG5cbiAgdmFyIHNlcnZpY2UgPSB7fTtcblxuICBzZXJ2aWNlLmFsZXJ0ID0gZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgcmV0dXJuICRtb2RhbC5vcGVuKHtcbiAgICAgIHRlbXBsYXRlVXJsOiAnYWxlcnQuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnQWxlcnRDdHJsJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRpdGxlOiBkYXRhLnRpdGxlLFxuICAgICAgICAgICAgbWVzc2FnZTogZGF0YS5tZXNzYWdlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLnJlc3VsdDtcblxuICB9O1xuXG4gIHNlcnZpY2UuY29uZmlybSA9IGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgIHJldHVybiAkbW9kYWwub3Blbih7XG4gICAgICB0ZW1wbGF0ZVVybDogJ2NvbmZpcm0uaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnQ29uZmlybUN0cmwnLFxuICAgICAgcmVzb2x2ZToge1xuICAgICAgICBkYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGl0bGU6IGRhdGEudGl0bGUsXG4gICAgICAgICAgICBtZXNzYWdlOiBkYXRhLm1lc3NhZ2VcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkucmVzdWx0O1xuXG4gIH07XG5cbiAgc2VydmljZS5wcm9tcHQgPSBmdW5jdGlvbihkYXRhKSB7XG5cbiAgICByZXR1cm4gJG1vZGFsLm9wZW4oe1xuICAgICAgdGVtcGxhdGVVcmw6ICdwcm9tcHQuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnUHJvbXB0Q3RybCcsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIGRhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0aXRsZTogZGF0YS50aXRsZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEubWVzc2FnZSxcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogZGF0YS5kZWZhdWx0VmFsdWUsXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogZGF0YS5wbGFjZWhvbGRlclxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS5yZXN1bHQ7XG5cbiAgfTtcblxuICByZXR1cm4gc2VydmljZTtcblxufV0pO1xuXG5hcHAuY29udHJvbGxlcignQWxlcnRDdHJsJywgWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAnZGF0YScsXG4gIGZ1bmN0aW9uKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UsIGRhdGEpIHtcblxuICAgICRzY29wZS50aXRsZSA9IGRhdGEudGl0bGU7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2U7XG5cbiAgICAkc2NvcGUub2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkbW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgIH07XG4gIH1cbl0pO1xuXG5hcHAuY29udHJvbGxlcignQ29uZmlybUN0cmwnLCBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICdkYXRhJyxcbiAgZnVuY3Rpb24oJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSwgZGF0YSkge1xuXG4gICAgJHNjb3BlLnRpdGxlID0gZGF0YS50aXRsZTtcbiAgICAkc2NvcGUubWVzc2FnZSA9IGRhdGEubWVzc2FnZTtcblxuICAgICRzY29wZS5vayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRtb2RhbEluc3RhbmNlLmNsb3NlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkbW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICB9O1xuICB9XG5dKTtcblxuYXBwLmNvbnRyb2xsZXIoJ1Byb21wdEN0cmwnLCBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICdkYXRhJyxcbiAgZnVuY3Rpb24oJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSwgZGF0YSkge1xuXG4gICAgJHNjb3BlLnRpdGxlID0gZGF0YS50aXRsZTtcbiAgICAkc2NvcGUubWVzc2FnZSA9IGRhdGEubWVzc2FnZTtcbiAgICAkc2NvcGUucGxhY2Vob2xkZXIgPSBkYXRhLnBsYWNlaG9sZGVyO1xuICAgICRzY29wZS5pbnB1dCA9IHsgdmFsdWU6IGRhdGEuZGVmYXVsdFZhbHVlIH07XG5cbiAgICAkc2NvcGUub2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkbW9kYWxJbnN0YW5jZS5jbG9zZSgkc2NvcGUuaW5wdXQudmFsdWUpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgJG1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgfTtcbiAgfVxuXSk7XG4iLCJ3aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsndWkuYm9vdHN0cmFwJ10sIGZ1bmN0aW9uKCRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbn0pO1xuXG4vKlxuICogUmVnaXN0ZXIgQ29udHJvbGxlcnNcbiAqL1xucmVxdWlyZSgnLi9jb250cm9sbGVycy90YWInKTtcblxuLypcbiAqIFJlZ2lzdGVyIERpcmVjdGl2ZXNcbiAqL1xucmVxdWlyZSgnLi9kaXJlY3RpdmVzL3NlbGVjdC1vbi1mb2N1cycpO1xuXG4vKlxuICogUmVnaXN0ZXIgQ29tbW9uIFNlcnZpY2VzXG4gKi9cbnJlcXVpcmUoJy4vc2VydmljZXMvZGlhbG9nJyk7XG4iXX0=
